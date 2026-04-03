# Server rules

- Centralizar validación de entrada cuando sea razonable.
- No duplicar lógica de permisos en múltiples endpoints.
- Prisma es la capa principal de acceso a datos del dominio.
- Mantener respuestas claras y predecibles.
- En errores esperados, devolver mensajes útiles para el dashboard.
- No meter lógica de negocio compleja directamente en handlers si puede aislarse en utils.
