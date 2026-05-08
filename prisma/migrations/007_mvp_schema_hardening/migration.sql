ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS "stripe_subscription_id" TEXT;

CREATE INDEX IF NOT EXISTS "tenants_stripe_customer_id_idx" ON "tenants"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "tenants_stripe_subscription_id_idx" ON "tenants"("stripe_subscription_id");

ALTER TABLE "menu_sections"
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "menu_sections_tenant_id_deleted_at_idx" ON "menu_sections"("tenant_id", "deleted_at");
CREATE INDEX IF NOT EXISTS "menu_sections_deleted_at_idx" ON "menu_sections"("deleted_at");

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "item_translations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "slug_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "item_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "webhook_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account_delete_requests" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_read_tenants" ON "tenants"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "tenants"."id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_admins_update_tenants" ON "tenants"
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "tenants"."id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "tenants"."id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin')
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "users_read_own_memberships" ON "memberships"
FOR SELECT
USING ("user_id" = auth.uid());

CREATE POLICY "tenant_members_read_sections" ON "menu_sections"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_sections"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_team_write_sections" ON "menu_sections"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_sections"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_sections"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_members_read_categories" ON "categories"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "categories"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_team_write_categories" ON "categories"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "categories"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "categories"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_members_read_items" ON "menu_items"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_items"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_team_write_items" ON "menu_items"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_items"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "menu_items"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
);
