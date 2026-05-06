ALTER TABLE "items"
ADD COLUMN "is_special_today" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "special_price" INTEGER;
