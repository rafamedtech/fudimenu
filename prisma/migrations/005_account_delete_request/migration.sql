CREATE TABLE "account_delete_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "ip_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_delete_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_delete_requests_tenant_id_user_id_idx" ON "account_delete_requests"("tenant_id", "user_id");
CREATE INDEX "account_delete_requests_expires_at_idx" ON "account_delete_requests"("expires_at");
