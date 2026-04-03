<script setup lang="ts">
import { extractErrorMessage } from '~~/lib/errors'

type AuthMode = 'signin' | 'signup'

definePageMeta({
  middleware: ['guest']
})

const route = useRoute()
const supabase = useSupabaseClient()
const { refreshAppUser } = useAuthUser()
const { appIcons } = useSiteTheme()

const redirectTo = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
)

const mode = ref<AuthMode>('signin')
const fullName = ref('')
const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const highlights = [
  {
    title: 'Publica rápido',
    copy: 'Crea un perfil limpio con portada, tipo de comida y datos esenciales para empezar.'
  },
  {
    title: 'Ordena el menú',
    copy: 'Agrupa categorías y platillos para que el menú se lea perfecto desde el celular.'
  },
  {
    title: 'Actualiza sin fricción',
    copy: 'Marca borrador, publicado o disponibilidad sin tocar nada más del flujo del MVP.'
  }
]
const authModes = [
  { label: 'Iniciar sesión', value: 'signin' },
  { label: 'Crear cuenta', value: 'signup' }
] satisfies Array<{ label: string, value: AuthMode }>

useSeoMeta({
  title: 'Accede a tu dashboard',
  description: 'Inicia sesión o crea tu cuenta para administrar restaurantes y menús en FudiMenu.'
})

watch(mode, () => {
  errorMessage.value = null
  successMessage.value = null
})

async function handleSubmit() {
  pending.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    if (mode.value === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value
      })

      if (error) {
        throw error
      }

      await refreshAppUser(true)
      await navigateTo(redirectTo.value)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.value.trim(),
      password: password.value,
      options: {
        data: {
          full_name: fullName.value.trim() || undefined
        }
      }
    })

    if (error) {
      throw error
    }

    if (data.session) {
      await refreshAppUser(true)
      await navigateTo(redirectTo.value)
      return
    }

    successMessage.value =
      'Cuenta creada. Revisa tu correo si tu proyecto Supabase tiene confirmación de email activa.'
  } catch (error) {
    errorMessage.value = extractErrorMessage(error, 'No pudimos completar la autenticación.')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="auth-shell">
    <div class="container">
      <article class="auth-card surface-card">
        <div class="auth-card__grid">
          <section class="auth-card__intro">
            <div class="section-stack">
              <div class="button-row">
                <UiBadge tone="secondary">
                  Dashboard privado
                </UiBadge>
                <UiBadge tone="primary">
                  Setup simple
                </UiBadge>
              </div>

              <div class="section-stack">
                <p class="eyebrow">Acceso privado</p>
                <h1 class="section-heading">Entra a tu dashboard de restaurante</h1>
                <p class="section-copy">
                  Usa email y contraseña para publicar tu restaurante y administrar categorías y
                  platillos con una interfaz clara, rápida y enfocada en móvil.
                </p>
              </div>
            </div>

            <div class="auth-card__highlights">
              <article
                v-for="highlight in highlights"
                :key="highlight.title"
                class="auth-highlight"
              >
                <h2 class="auth-highlight__title">{{ highlight.title }}</h2>
                <p class="auth-highlight__copy">{{ highlight.copy }}</p>
              </article>
            </div>
          </section>

          <section class="auth-card__panel">
            <div class="section-stack">
              <p class="eyebrow">Cuenta</p>
              <h2 class="panel-title">
                {{ mode === 'signin' ? 'Inicia sesión' : 'Crea tu cuenta' }}
              </h2>
              <p class="section-copy">
                El acceso queda conectado a Supabase Auth y sincroniza tu usuario de la app al entrar.
              </p>
            </div>

            <UiSegmentedControl v-model="mode" :options="authModes" />

            <div v-if="errorMessage" class="feedback feedback--error">
              {{ errorMessage }}
            </div>

            <div v-if="successMessage" class="feedback feedback--success">
              {{ successMessage }}
            </div>

            <form class="form-stack" @submit.prevent="handleSubmit">
              <UiInput
                v-if="mode === 'signup'"
                v-model="fullName"
                autocomplete="name"
                label="Nombre completo"
                placeholder="Ej. Andrea López"
              />

              <UiInput
                v-model="email"
                autocomplete="email"
                label="Email"
                placeholder="tu@restaurante.com"
                required
                type="email"
              />

              <UiInput
                v-model="password"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                label="Contraseña"
                placeholder="••••••••"
                required
                type="password"
              />

              <div class="button-row">
                <UiButton :disabled="pending" :icon="appIcons.forward" trailing type="submit">
                  {{
                    pending
                      ? 'Procesando...'
                      : mode === 'signin'
                        ? 'Entrar al dashboard'
                        : 'Crear cuenta'
                  }}
                </UiButton>
              </div>
            </form>
          </section>
        </div>
      </article>
    </div>
  </div>
</template>
