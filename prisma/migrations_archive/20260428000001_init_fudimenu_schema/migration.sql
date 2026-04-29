CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  "created_by" uuid,
  "slug" text NOT NULL UNIQUE,
  "name" text NOT NULL,
  "logo_url" text,
  "primary_color" text NOT NULL DEFAULT '#F4B400',
  "cuisine_type" text,
  "default_locale" text NOT NULL DEFAULT 'es',
  "currency" char(3) NOT NULL DEFAULT 'MXN',
  "plan" text NOT NULL DEFAULT 'free',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "tenants_slug_format" CHECK ("slug" ~ '^[a-z0-9-]+$'),
  CONSTRAINT "tenants_primary_color_hex" CHECK ("primary_color" ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT "tenants_default_locale_check" CHECK ("default_locale" IN ('es', 'en')),
  CONSTRAINT "tenants_plan_check" CHECK ("plan" IN ('free', 'pro', 'business'))
);

CREATE TABLE "memberships" (
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL,
  "role" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("tenant_id", "user_id"),
  CONSTRAINT "memberships_role_check" CHECK ("role" IN ('owner', 'admin', 'staff'))
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_visible" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "menu_items" (
  "id" uuid PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "category_id" uuid REFERENCES "categories"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "description" text,
  "price_cents" integer NOT NULL DEFAULT 0,
  "currency" char(3) NOT NULL DEFAULT 'MXN',
  "image_url" text,
  "is_available" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 999,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "menu_items_price_cents_check" CHECK ("price_cents" >= 0)
);

CREATE TABLE "item_translations" (
  "item_id" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
  "locale" text NOT NULL,
  "name" text,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("item_id", "locale"),
  CONSTRAINT "item_translations_locale_check" CHECK ("locale" IN ('es', 'en'))
);

CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");
CREATE INDEX "categories_tenant_id_sort_order_idx" ON "categories"("tenant_id", "sort_order");
CREATE INDEX "menu_items_tenant_id_sort_order_created_at_idx" ON "menu_items"("tenant_id", "sort_order", "created_at");
CREATE INDEX "menu_items_category_id_idx" ON "menu_items"("category_id");

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "set_tenants_updated_at"
BEFORE UPDATE ON "tenants"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER "set_categories_updated_at"
BEFORE UPDATE ON "categories"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER "set_menu_items_updated_at"
BEFORE UPDATE ON "menu_items"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER "set_item_translations_updated_at"
BEFORE UPDATE ON "item_translations"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "menu_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "item_translations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can create their tenant"
ON "tenants"
FOR INSERT
TO authenticated
WITH CHECK ("created_by" = auth.uid());

CREATE POLICY "Tenant members can read tenants"
ON "tenants"
FOR SELECT
TO authenticated
USING (
  "created_by" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "tenants"."id"
      AND m."user_id" = auth.uid()
  )
);

CREATE POLICY "Tenant owners and admins can update tenants"
ON "tenants"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "tenants"."id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "tenants"."id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can read their memberships"
ON "memberships"
FOR SELECT
TO authenticated
USING ("user_id" = auth.uid());

CREATE POLICY "Creators can become owner of their tenant"
ON "memberships"
FOR INSERT
TO authenticated
WITH CHECK (
  "user_id" = auth.uid()
  AND "role" = 'owner'
  AND EXISTS (
    SELECT 1 FROM "tenants" t
    WHERE t."id" = "memberships"."tenant_id"
      AND t."created_by" = auth.uid()
  )
);

CREATE POLICY "Tenant members can read categories"
ON "categories"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "categories"."tenant_id"
      AND m."user_id" = auth.uid()
  )
);

CREATE POLICY "Tenant team can insert categories"
ON "categories"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "categories"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Tenant team can update categories"
ON "categories"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "categories"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "categories"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Tenant members can read menu items"
ON "menu_items"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "menu_items"."tenant_id"
      AND m."user_id" = auth.uid()
  )
);

CREATE POLICY "Tenant team can insert menu items"
ON "menu_items"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "menu_items"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Tenant team can update menu items"
ON "menu_items"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "menu_items"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "memberships" m
    WHERE m."tenant_id" = "menu_items"."tenant_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Tenant members can read item translations"
ON "item_translations"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "menu_items" i
    JOIN "memberships" m ON m."tenant_id" = i."tenant_id"
    WHERE i."id" = "item_translations"."item_id"
      AND m."user_id" = auth.uid()
  )
);

CREATE POLICY "Tenant team can insert item translations"
ON "item_translations"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "menu_items" i
    JOIN "memberships" m ON m."tenant_id" = i."tenant_id"
    WHERE i."id" = "item_translations"."item_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

CREATE POLICY "Tenant team can update item translations"
ON "item_translations"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM "menu_items" i
    JOIN "memberships" m ON m."tenant_id" = i."tenant_id"
    WHERE i."id" = "item_translations"."item_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM "menu_items" i
    JOIN "memberships" m ON m."tenant_id" = i."tenant_id"
    WHERE i."id" = "item_translations"."item_id"
      AND m."user_id" = auth.uid()
      AND m."role" IN ('owner', 'admin', 'staff')
  )
);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "tenants" TO authenticated;
GRANT SELECT, INSERT ON "memberships" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "categories" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "menu_items" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "item_translations" TO authenticated;
