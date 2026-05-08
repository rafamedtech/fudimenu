'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE } from '@/server/services/referral.service';

export async function startReferralSignupAction(formData: FormData) {
  const code = formData.get('code');
  const referrerId = formData.get('referrerId');
  const restaurantSlug = formData.get('restaurantSlug');
  const signupUrl = formData.get('signupUrl');

  if (
    typeof code !== 'string' ||
    typeof referrerId !== 'string' ||
    typeof restaurantSlug !== 'string' ||
    typeof signupUrl !== 'string'
  ) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(
    REFERRAL_COOKIE,
    encodeURIComponent(JSON.stringify({ code, referrerId, restaurantSlug })),
    {
      httpOnly: true,
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  );

  redirect(signupUrl);
}
