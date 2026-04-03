# Prisma rules

- No cambies nombres de modelos existentes sin avisar.
- Evita romper relaciones ya usadas por páginas o endpoints.
- Si agregas campos requeridos, revisa impacto en seed y migraciones.
- Mantén nombres claros y consistentes.
- Explica siempre si un cambio requiere `prisma migrate dev` o reset local.
- Prioriza compatibilidad con el flujo del MVP.
- Evita modelos fuera del MVP.
