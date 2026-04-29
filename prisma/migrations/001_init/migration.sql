-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "extensions";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('es', 'en');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'admin', 'staff');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'pro', 'business');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('pending', 'processed', 'failed', 'ignored');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "created_by" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#F4B400',
    "cuisine_type" TEXT,
    "default_locale" "Locale" NOT NULL DEFAULT 'es',
    "currency" CHAR(3) NOT NULL DEFAULT 'MXN',
    "plan" "TenantPlan" NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("tenant_id","user_id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'MXN',
    "image_url" TEXT,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 999,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_translations" (
    "item_id" UUID NOT NULL,
    "locale" "Locale" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "item_translations_pkey" PRIMARY KEY ("item_id","locale")
);

-- CreateTable
CREATE TABLE "slug_history" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "slug_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_views" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "session_id" TEXT,
    "locale" "Locale",
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "menu_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_views" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "menu_view_id" UUID,
    "session_id" TEXT,
    "locale" "Locale",
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "item_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "tenant_id" UUID,
    "provider" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'pending',
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenants_created_by_idx" ON "tenants"("created_by");

-- CreateIndex
CREATE INDEX "tenants_deleted_at_idx" ON "tenants"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "memberships_user_id_idx" ON "memberships"("user_id");

-- CreateIndex
CREATE INDEX "memberships_tenant_id_role_idx" ON "memberships"("tenant_id", "role");

-- CreateIndex
CREATE INDEX "memberships_deleted_at_idx" ON "memberships"("deleted_at");

-- CreateIndex
CREATE INDEX "categories_tenant_id_sort_order_idx" ON "categories"("tenant_id", "sort_order");

-- CreateIndex
CREATE INDEX "categories_tenant_id_is_visible_idx" ON "categories"("tenant_id", "is_visible");

-- CreateIndex
CREATE INDEX "categories_deleted_at_idx" ON "categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_tenant_id_name_key" ON "categories"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "items_tenant_id_sort_order_created_at_idx" ON "items"("tenant_id", "sort_order", "created_at");

-- CreateIndex
CREATE INDEX "items_tenant_id_category_id_idx" ON "items"("tenant_id", "category_id");

-- CreateIndex
CREATE INDEX "items_tenant_id_is_available_idx" ON "items"("tenant_id", "is_available");

-- CreateIndex
CREATE INDEX "items_category_id_idx" ON "items"("category_id");

-- CreateIndex
CREATE INDEX "items_deleted_at_idx" ON "items"("deleted_at");

-- CreateIndex
CREATE INDEX "item_translations_locale_idx" ON "item_translations"("locale");

-- CreateIndex
CREATE INDEX "item_translations_deleted_at_idx" ON "item_translations"("deleted_at");

-- CreateIndex
CREATE INDEX "slug_history_tenant_id_created_at_idx" ON "slug_history"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "slug_history_deleted_at_idx" ON "slug_history"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "slug_history_slug_key" ON "slug_history"("slug");

-- CreateIndex
CREATE INDEX "menu_views_tenant_id_viewed_at_idx" ON "menu_views"("tenant_id", "viewed_at");

-- CreateIndex
CREATE INDEX "menu_views_session_id_idx" ON "menu_views"("session_id");

-- CreateIndex
CREATE INDEX "menu_views_deleted_at_idx" ON "menu_views"("deleted_at");

-- CreateIndex
CREATE INDEX "item_views_tenant_id_viewed_at_idx" ON "item_views"("tenant_id", "viewed_at");

-- CreateIndex
CREATE INDEX "item_views_item_id_viewed_at_idx" ON "item_views"("item_id", "viewed_at");

-- CreateIndex
CREATE INDEX "item_views_menu_view_id_idx" ON "item_views"("menu_view_id");

-- CreateIndex
CREATE INDEX "item_views_session_id_idx" ON "item_views"("session_id");

-- CreateIndex
CREATE INDEX "item_views_deleted_at_idx" ON "item_views"("deleted_at");

-- CreateIndex
CREATE INDEX "audit_log_tenant_id_created_at_idx" ON "audit_log"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_actor_user_id_created_at_idx" ON "audit_log"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_deleted_at_idx" ON "audit_log"("deleted_at");

-- CreateIndex
CREATE INDEX "webhook_events_tenant_id_received_at_idx" ON "webhook_events"("tenant_id", "received_at");

-- CreateIndex
CREATE INDEX "webhook_events_provider_event_type_idx" ON "webhook_events"("provider", "event_type");

-- CreateIndex
CREATE INDEX "webhook_events_status_received_at_idx" ON "webhook_events"("status", "received_at");

-- CreateIndex
CREATE INDEX "webhook_events_deleted_at_idx" ON "webhook_events"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_translations" ADD CONSTRAINT "item_translations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slug_history" ADD CONSTRAINT "slug_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_views" ADD CONSTRAINT "menu_views_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_views" ADD CONSTRAINT "item_views_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_views" ADD CONSTRAINT "item_views_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_views" ADD CONSTRAINT "item_views_menu_view_id_fkey" FOREIGN KEY ("menu_view_id") REFERENCES "menu_views"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
