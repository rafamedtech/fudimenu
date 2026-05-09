# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into FudiMenu. Both `posthog-js` and `posthog-node` were already installed. The integration supplemented the existing custom analytics module (`src/lib/analytics/events.ts`) — adding 11 new events across client-side and server-side code — without modifying the existing initialization flow or consent management logic.

A new server-side PostHog client (`src/lib/posthog-server.ts`) was created using `posthog-node`. Server-side events fire from the Stripe webhook handler and the auth callback route, ensuring critical business actions are captured even when the user has no client-side session.

## New events added

| Event | Description | File |
|---|---|---|
| `login_magic_link_sent` | User submitted the magic link form (email domain captured) | `src/app/(auth)/login/page.tsx` |
| `login_google_started` | User clicked "Continue with Google" | `src/app/(auth)/login/page.tsx` |
| `user_signed_in` | **Server-side** — OAuth code exchanged for session; user identified | `src/app/auth/callback/route.ts` |
| `plan_upgrade_started` | Upgrade button clicked (plan, method `card`/`cash`, cycle captured) | `src/app/(admin)/settings/billing/billing-plans.tsx` |
| `plan_upgraded` | **Server-side** — Stripe webhook confirmed successful checkout | `src/app/api/webhooks/stripe/route.ts` |
| `plan_downgraded` | **Server-side** — Stripe webhook confirmed subscription ended → free | `src/app/api/webhooks/stripe/route.ts` |
| `payment_failed` | **Server-side** — Stripe `invoice.payment_failed` event | `src/app/api/webhooks/stripe/route.ts` |
| `account_deleted` | User completed account deletion flow | `src/app/(admin)/account/account-client.tsx` |
| `data_exported` | User downloaded their account data export | `src/app/(admin)/account/account-client.tsx` |
| `qr_menu_link_copied` | User copied public menu URL from QR page | `src/app/(admin)/qr/qr-share-actions.tsx` |
| `qr_menu_link_shared` | User shared public menu URL via native share sheet | `src/app/(admin)/qr/qr-share-actions.tsx` |

## Next steps

We've built a dashboard and five insights to monitor key user behaviour:

- **Dashboard**: [Analytics basics](https://us.posthog.com/project/415795/dashboard/1561875)
- [Login funnel: magic link → signed in](https://us.posthog.com/project/415795/insights/amkpAule)
- [Plan upgrade funnel: started → completed](https://us.posthog.com/project/415795/insights/wUTP4cpg)
- [Payment failures and plan downgrades over time](https://us.posthog.com/project/415795/insights/xR2Y0I9N)
- [Plan upgrades over time](https://us.posthog.com/project/415795/insights/j6EditS1)
- [Public menu engagement: views, items, WhatsApp clicks](https://us.posthog.com/project/415795/insights/5XTaa6lJ)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
