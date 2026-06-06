ALTER TABLE "menu_items"
ADD COLUMN IF NOT EXISTS "image_alt_text" TEXT,
ADD COLUMN IF NOT EXISTS "image_crop" TEXT;
