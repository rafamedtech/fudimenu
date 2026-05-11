-- Stub Supabase's `auth` schema and `auth.uid()` for non-Supabase
-- environments (CI/local plain Postgres). 007's RLS policies reference
-- `auth.uid()`; on Supabase the schema/function are provided by GoTrue.
-- The pg_proc check ensures we never overwrite Supabase's real function.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        CREATE SCHEMA "auth";
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'auth' AND p.proname = 'uid'
    ) THEN
        EXECUTE 'CREATE FUNCTION "auth"."uid"() RETURNS UUID LANGUAGE SQL STABLE AS $f$ SELECT NULL::UUID $f$';
    END IF;
END $$;

-- Create menu_sections table and link categories.section_id.
--
-- The MenuSection Prisma model existed since early development but was never
-- materialized via a migration; the table was patched directly into Supabase
-- (see commit e288c7c "Fix Prisma schema drift in Supabase"). Migration 007
-- then assumed the table existed and added updated_at/deleted_at + RLS, which
-- breaks `prisma migrate deploy` on a fresh database.
--
-- This migration backfills the missing CREATE TABLE so fresh environments
-- (CI, local resets) match production. Every statement is guarded with
-- IF NOT EXISTS so re-applying against the already-patched prod database is
-- a no-op.

CREATE TABLE IF NOT EXISTS "menu_sections" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "accent_color" TEXT NOT NULL DEFAULT '#FFF8E7',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "menu_sections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "menu_sections_tenant_id_sort_order_idx" ON "menu_sections"("tenant_id", "sort_order");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'menu_sections_tenant_id_fkey'
    ) THEN
        ALTER TABLE "menu_sections"
            ADD CONSTRAINT "menu_sections_tenant_id_fkey"
            FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Categories were created in 001_init without section_id; the FK to
-- menu_sections is part of the Prisma schema and must exist on fresh DBs.

ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "section_id" UUID;

CREATE INDEX IF NOT EXISTS "categories_tenant_id_section_id_idx" ON "categories"("tenant_id", "section_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'categories_section_id_fkey'
    ) THEN
        ALTER TABLE "categories"
            ADD CONSTRAINT "categories_section_id_fkey"
            FOREIGN KEY ("section_id") REFERENCES "menu_sections"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
