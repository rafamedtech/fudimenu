DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LogoShape') THEN
    CREATE TYPE "LogoShape" AS ENUM ('rectangular', 'square', 'round');
  END IF;
END $$;

ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT,
ADD COLUMN IF NOT EXISTS "logo_shape" "LogoShape" NOT NULL DEFAULT 'round';

ALTER TABLE "categories"
ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;
