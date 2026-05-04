CREATE TYPE "ReferralStatus" AS ENUM ('pending', 'credited', 'cancelled');

CREATE TABLE "referrals" (
    "id" UUID NOT NULL DEFAULT extensions.gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "referred_tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'pending',
    "credited_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_referred_tenant_id_key" ON "referrals"("referred_tenant_id");

CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

CREATE INDEX "referrals_code_idx" ON "referrals"("code");

CREATE INDEX "referrals_status_created_at_idx" ON "referrals"("status", "created_at");

CREATE INDEX "referrals_credited_at_idx" ON "referrals"("credited_at");

CREATE INDEX "referrals_deleted_at_idx" ON "referrals"("deleted_at");

ALTER TABLE "referrals"
ADD CONSTRAINT "referrals_referred_tenant_id_fkey"
FOREIGN KEY ("referred_tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
