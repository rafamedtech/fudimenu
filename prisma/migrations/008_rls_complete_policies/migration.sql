-- Migration 008: Complete RLS policies for tables left policy-less in 007.
--
-- Context: 007 enabled RLS on 12 tables but only wrote policies for 5.
-- The remaining 7 tables defaulted to deny-all, which is safe but incomplete:
--   - item_translations, slug_history, menu_views, item_views,
--     audit_log, webhook_events, account_delete_requests
--
-- Prisma server-side uses service_role (bypasses RLS entirely); these policies
-- are defense-in-depth for direct DB access (Supabase dashboard, pgAdmin, anon key).
-- Do NOT use service_role bypass in application code to paper over isolation gaps.

-- ─────────────────────────────────────────────────────────────────────────────
-- item_translations
-- No tenant_id column — isolation must join through menu_items.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "tenant_members_read_item_translations" ON "item_translations"
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM "menu_items"
    JOIN "memberships" ON "memberships"."tenant_id" = "menu_items"."tenant_id"
    WHERE "menu_items"."id" = "item_translations"."item_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_team_write_item_translations" ON "item_translations"
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM "menu_items"
    JOIN "memberships" ON "memberships"."tenant_id" = "menu_items"."tenant_id"
    WHERE "menu_items"."id" = "item_translations"."item_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "menu_items"
    JOIN "memberships" ON "memberships"."tenant_id" = "menu_items"."tenant_id"
    WHERE "menu_items"."id" = "item_translations"."item_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- slug_history
-- Slugs are public URL tokens — no secret data, globally unique constraint
-- prevents cross-tenant slug collision. SELECT open; writes admin/owner only.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "public_read_slug_history" ON "slug_history"
FOR SELECT
USING (true);

CREATE POLICY "tenant_admins_write_slug_history" ON "slug_history"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "slug_history"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "slug_history"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin')
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- menu_views
-- Analytics data: tenant members read, service_role writes (tracking endpoint).
-- No INSERT policy needed — service_role bypasses RLS; anon writes blocked by default.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "tenant_members_read_menu_views" ON "menu_views"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_views"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- item_views
-- Same pattern as menu_views.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "tenant_members_read_item_views" ON "item_views"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "item_views"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- audit_log
-- tenant_id is nullable (NULL = system/cron events, not user-visible).
-- Members read their own tenant's logs; system events hidden from all JWT roles.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "tenant_members_read_audit_log" ON "audit_log"
FOR SELECT
USING (
  "tenant_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "audit_log"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- webhook_events
-- Stripe events carry billing data — restricted to admin/owner roles.
-- tenant_id is nullable (provider events without tenant context hidden from all).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "tenant_admins_read_webhook_events" ON "webhook_events"
FOR SELECT
USING (
  "tenant_id" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "webhook_events"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin')
      AND "memberships"."deleted_at" IS NULL
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- account_delete_requests
-- user_id stores Supabase auth UID as text; cast auth.uid() UUID for comparison.
-- Users see only their own pending delete requests; service_role writes.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE POLICY "users_read_own_account_delete_requests" ON "account_delete_requests"
FOR SELECT
USING ("user_id" = auth.uid()::text);
