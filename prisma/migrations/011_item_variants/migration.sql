-- Migration 011: Simple visual variants per menu item (name + price + order).
-- Display-only options (e.g. "Chico" / "Grande"). No POS modifiers, no required
-- rules, no cart. Fully owned by the parent item: upserting an item replaces its
-- variant set, so no soft-delete column is needed.

CREATE TABLE IF NOT EXISTS "item_variants" (
  "id"          UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
  "tenant_id"   UUID NOT NULL,
  "item_id"     UUID NOT NULL,
  "name"        TEXT NOT NULL,
  "price_cents" INTEGER NOT NULL DEFAULT 0,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updated_at"  TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT "item_variants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "item_variants"
  ADD CONSTRAINT "item_variants_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "item_variants"
  ADD CONSTRAINT "item_variants_item_id_fkey"
  FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "item_variants_item_id_sort_order_idx"
  ON "item_variants" ("item_id", "sort_order");
CREATE INDEX IF NOT EXISTS "item_variants_tenant_id_idx"
  ON "item_variants" ("tenant_id");

-- RLS: defense-in-depth for direct DB access. Prisma server-side uses
-- service_role and bypasses these. Mirrors the menu_items policies (tenant_id
-- column present, so isolate directly via memberships).
ALTER TABLE "item_variants" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_members_read_item_variants" ON "item_variants"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "item_variants"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."deleted_at" IS NULL
  )
);

CREATE POLICY "tenant_team_write_item_variants" ON "item_variants"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "item_variants"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships"
    WHERE "memberships"."tenant_id" = "item_variants"."tenant_id"
      AND "memberships"."user_id" = auth.uid()
      AND "memberships"."role" IN ('owner', 'admin', 'staff')
      AND "memberships"."deleted_at" IS NULL
  )
);
