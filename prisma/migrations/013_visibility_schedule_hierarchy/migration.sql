-- Migration 013: Extend publishing visibility scheduling to the full hierarchy
-- (sections + categories, not just items) and add an optional inclusive date
-- range plus a per-tenant timezone.
--
-- Publishing visibility only — controls WHEN content appears on the public
-- menu. Not inventory, ordering, kitchen, or stock availability.
--   schedule_days:         weekdays 0=Sun…6=Sat; empty = every day.
--   schedule_start_minute: local minute-of-day window opens (inclusive). NULL = 00:00.
--   schedule_end_minute:   local minute-of-day window closes (exclusive). NULL = 24:00.
--   schedule_start_date:   first local date visible (inclusive). NULL = no lower bound.
--   schedule_end_date:     last local date visible (inclusive). NULL = no upper bound.
-- tenants.timezone: IANA zone for evaluating all of the above. NULL = code default.

ALTER TABLE "tenants"
ADD COLUMN IF NOT EXISTS "timezone" TEXT;

-- Items already have schedule_days / start_minute / end_minute (migration 012);
-- add the date range here.
ALTER TABLE "menu_items"
ADD COLUMN IF NOT EXISTS "schedule_start_date" DATE,
ADD COLUMN IF NOT EXISTS "schedule_end_date" DATE;

ALTER TABLE "categories"
ADD COLUMN IF NOT EXISTS "schedule_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "schedule_start_minute" INTEGER,
ADD COLUMN IF NOT EXISTS "schedule_end_minute" INTEGER,
ADD COLUMN IF NOT EXISTS "schedule_start_date" DATE,
ADD COLUMN IF NOT EXISTS "schedule_end_date" DATE;

ALTER TABLE "menu_sections"
ADD COLUMN IF NOT EXISTS "schedule_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "schedule_start_minute" INTEGER,
ADD COLUMN IF NOT EXISTS "schedule_end_minute" INTEGER,
ADD COLUMN IF NOT EXISTS "schedule_start_date" DATE,
ADD COLUMN IF NOT EXISTS "schedule_end_date" DATE;
