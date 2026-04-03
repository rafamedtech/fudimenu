# FudiMenu — AGENTS.md

## Producto

FudiMenu es una aplicación web para centralizar menús de restaurantes de la ciudad y ayudar a las personas a decidir rápidamente dónde comer con amigos, pareja o familia.

La prioridad del producto es:

1. descubrir restaurantes rápido
2. ver menús con claridad, especialmente en móvil
3. permitir que cada restaurante administre su perfil y su menú fácilmente
4. mantener una base técnica simple, sólida y escalable

## Stack oficial del proyecto

- Nuxt 4
- TypeScript
- Nuxt UI v4
- PostgreSQL
- Prisma ORM
- Supabase
- @nuxtjs/supabase

## Política de versiones

Usar la versión estable más reciente compatible del stack principal.
Preferir instalar con:

- `nuxt@latest`
- `@nuxt/ui@latest`
- `prisma@latest`
- `@prisma/client@latest`
- `@nuxtjs/supabase@latest`

## Alcance actual: MVP

### Sí entra

- home pública con listado de restaurantes
- página pública de restaurante por slug
- menú organizado por categorías
- login y registro
- dashboard básico para restaurant_owner
- CRUD de restaurante
- CRUD de categorías
- CRUD de platillos
- protección de rutas privadas
- SEO básico por restaurante

### No entra

- reseñas
- favoritos
- pedidos en línea
- pagos
- promociones
- chat
- geolocalización avanzada
- analytics complejos
- múltiples sucursales complejas
- panel enterprise

## Principios de implementación

- Priorizar simplicidad sobre complejidad.
- No agregar abstracciones prematuras.
- No introducir nuevas dependencias si Nuxt, Nuxt UI o el stack actual ya resuelven el problema.
- Mantener el código legible y fácil de iterar.
- Pensar mobile-first.
- Optimizar para velocidad de lectura de menús.
- No romper consistencia entre frontend, server routes y Prisma schema.

## Convenciones de arquitectura Nuxt 4

Usar la estructura moderna de Nuxt 4.

- `app/` para la aplicación
- `app/pages/` para rutas
- `app/components/` para UI reutilizable
- `app/layouts/` para shells públicos y privados
- `app/composables/` para lógica reutilizable de frontend
- `app/middleware/` para guards de navegación
- `server/api/` para endpoints
- `server/utils/` para utilidades de servidor
- `shared/` para tipos y utilidades compartidas entre app y server
- `lib/` para helpers del proyecto
- `prisma/` para schema, migrations y seed

## Reglas de UI

- Usar Nuxt UI v4 como biblioteca principal de interfaz.
- No mezclar varias librerías de UI si no es necesario.
- Mantener componentes simples, accesibles y consistentes.
- Los menús deben ser fáciles de escanear visualmente.
- Los precios deben verse claramente.
- Formularios de dashboard simples y directos.

## Reglas de datos

- `Restaurant.slug` debe ser único.
- Solo restaurantes publicados aparecen en páginas públicas.
- Solo categorías activas deben renderizarse públicamente.
- Solo platillos disponibles deben renderizarse públicamente.
- Los dueños solo pueden editar restaurantes donde tienen permisos.
- Evitar duplicar lógica de permisos; centralizar cuando sea razonable.

## Supabase

- Usar Supabase principalmente para autenticación y manejo de sesión.
- La fuente de verdad del dominio del negocio vive en PostgreSQL con Prisma.
- Mantener separado el modelo de auth del modelo de negocio.
- Cuando haga falta vincular usuarios autenticados con usuarios de negocio, documentar claramente la estrategia.

## Prisma

- Mantener el schema simple y extensible.
- Evitar relaciones innecesarias en el MVP.
- Si se agrega un campo requerido, revisar impacto en migraciones y seed.
- Explicar siempre si un cambio requiere migración o reset local.

## Qué significa “done”

Una tarea está terminada cuando:

- cumple exactamente el objetivo pedido
- respeta el alcance MVP
- mantiene coherencia con Nuxt 4, Nuxt UI, Prisma y Supabase
- no introduce features no solicitados
- deja instrucciones claras de prueba si aplica

## Cómo responder en tasks grandes

Para tareas medianas o grandes:

- primero resumir el plan
- luego implementar
- al final enumerar archivos tocados
- explicar brevemente cómo probar
- mencionar riesgos o pendientes si existen

## Qué evitar

- sobreingeniería
- dependencias innecesarias
- cambios masivos no pedidos
- mover archivos sin necesidad
- romper el schema o contratos existentes sin avisar
- inventar funcionalidad fuera del MVP

## Contexto de negocio importante

El éxito del producto depende de que el usuario pueda hacer esto en segundos:
entrar → ver restaurantes → abrir uno → entender el menú rápido → decidir dónde comer

Y del lado del restaurante:
entrar → editar menú fácil → publicar cambios rápido
