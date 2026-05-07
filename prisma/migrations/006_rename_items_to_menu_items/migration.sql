-- Rename items table to menu_items to match Prisma schema @@map.
ALTER TABLE "items" RENAME TO "menu_items";

ALTER TABLE "menu_items" RENAME CONSTRAINT "items_pkey" TO "menu_items_pkey";
ALTER TABLE "menu_items" RENAME CONSTRAINT "items_tenant_id_fkey" TO "menu_items_tenant_id_fkey";
ALTER TABLE "menu_items" RENAME CONSTRAINT "items_category_id_fkey" TO "menu_items_category_id_fkey";

ALTER INDEX "items_tenant_id_sort_order_created_at_idx" RENAME TO "menu_items_tenant_id_sort_order_created_at_idx";
ALTER INDEX "items_tenant_id_category_id_idx" RENAME TO "menu_items_tenant_id_category_id_idx";
ALTER INDEX "items_tenant_id_is_available_idx" RENAME TO "menu_items_tenant_id_is_available_idx";
ALTER INDEX "items_category_id_idx" RENAME TO "menu_items_category_id_idx";
ALTER INDEX "items_deleted_at_idx" RENAME TO "menu_items_deleted_at_idx";
