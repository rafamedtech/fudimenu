import { createError, type H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

import { GlobalRole, RestaurantMembershipRole } from '~~/generated/prisma/client'
import { demoRestaurantSlugs } from '~~/lib/demo-data'
import { prisma } from '~~/lib/prisma'
import type { AppUser, RestaurantMembershipSummary } from '~~/types/domain'

interface SupabaseAuthUser {
  sub?: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() ?? ''
}

function readFullName(user: SupabaseAuthUser) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const fullName =
    (typeof metadata?.full_name === 'string' && metadata.full_name.trim()) ||
    (typeof metadata?.fullName === 'string' && metadata.fullName.trim()) ||
    null

  return fullName || null
}

function toMembershipSummary(
  memberships: Array<{
    role: RestaurantMembershipRole
    restaurant: {
      id: string
      name: string
      slug: string
    }
  }>
): RestaurantMembershipSummary[] {
  return memberships.map((membership) => ({
    restaurantId: membership.restaurant.id,
    restaurantName: membership.restaurant.name,
    restaurantSlug: membership.restaurant.slug,
    role: membership.role
  }))
}

async function claimDemoRestaurantsIfNeeded(event: H3Event, userId: string, email: string) {
  const config = useRuntimeConfig(event)

  if (normalizeEmail(email) !== normalizeEmail(config.demoOwnerEmail)) {
    return
  }

  const demoRestaurants = await prisma.restaurant.findMany({
    where: {
      slug: {
        in: [...demoRestaurantSlugs]
      }
    },
    select: {
      id: true
    }
  })

  if (!demoRestaurants.length) {
    return
  }

  await prisma.restaurantMember.createMany({
    data: demoRestaurants.map((restaurant) => ({
      userId,
      restaurantId: restaurant.id,
      role: RestaurantMembershipRole.OWNER
    })),
    skipDuplicates: true
  })
}

export async function syncAppUserFromSession(event: H3Event): Promise<AppUser> {
  const sessionUser = await serverSupabaseUser(event)
  const userId = sessionUser?.sub

  if (!sessionUser || !userId || !sessionUser.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      data: {
        message: 'Necesitas iniciar sesión para continuar.'
      }
    })
  }

  const email = normalizeEmail(sessionUser.email)
  const fullName = readFullName(sessionUser)

  const existingUser = await prisma.user.upsert({
    where: {
      id: userId
    },
    update: {
      email,
      fullName
    },
    create: {
      id: userId,
      email,
      fullName
    }
  })

  await claimDemoRestaurantsIfNeeded(event, userId, email)

  const memberships = await prisma.restaurantMember.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: {
      role: true,
      restaurant: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })

  const nextRole =
    existingUser.role === GlobalRole.ADMIN
      ? GlobalRole.ADMIN
      : existingUser.role === GlobalRole.RESTAURANT_OWNER || memberships.length > 0
        ? GlobalRole.RESTAURANT_OWNER
        : GlobalRole.USER

  const syncedUser =
    nextRole === existingUser.role
      ? existingUser
      : await prisma.user.update({
          where: {
            id: existingUser.id
          },
          data: {
            role: nextRole
          }
        })

  return {
    id: syncedUser.id,
    email: syncedUser.email,
    fullName: syncedUser.fullName,
    role: syncedUser.role,
    memberships: toMembershipSummary(memberships)
  }
}

export async function requireAppUser(event: H3Event) {
  return syncAppUserFromSession(event)
}

export async function promoteUserToRestaurantOwner(userId: string) {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      role: true
    }
  })

  if (!currentUser || currentUser.role === GlobalRole.ADMIN || currentUser.role === GlobalRole.RESTAURANT_OWNER) {
    return
  }

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      role: GlobalRole.RESTAURANT_OWNER
    }
  })
}
