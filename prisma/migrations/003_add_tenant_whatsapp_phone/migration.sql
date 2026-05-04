ALTER TABLE "tenants"
ADD COLUMN "whatsapp_phone" VARCHAR(13);

ALTER TABLE "tenants"
ADD CONSTRAINT "tenants_whatsapp_phone_format"
CHECK ("whatsapp_phone" IS NULL OR "whatsapp_phone" ~ '^\+52[0-9]{10}$');
