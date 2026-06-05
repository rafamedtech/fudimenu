-- Repair migration for databases where 011_item_variants was applied manually
-- or partially before all FK constraints / RLS policies existed. Every block is
-- guarded so it is safe on fresh databases where 011 already completed.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_variants_tenant_id_fkey'
  ) THEN
    ALTER TABLE "item_variants"
      ADD CONSTRAINT "item_variants_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'item_variants_item_id_fkey'
  ) THEN
    ALTER TABLE "item_variants"
      ADD CONSTRAINT "item_variants_item_id_fkey"
      FOREIGN KEY ("item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "item_variants" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'item_variants'
      AND policyname = 'tenant_members_read_item_variants'
  ) THEN
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
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'item_variants'
      AND policyname = 'tenant_team_write_item_variants'
  ) THEN
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
  END IF;
END $$;
