-- Migration 012: Weekly publishing visibility per menu item.
-- Controls WHEN an item appears on the public menu (e.g. breakfast Mon–Fri
-- 07:00–11:00). Not inventory, not ordering, not operational availability —
-- an off-schedule item is simply absent from the public menu.
--   schedule_days:         weekdays 0=Sun…6=Sat; empty = every day.
--   schedule_start_minute: local minute-of-day window opens (inclusive). NULL = 00:00.
--   schedule_end_minute:   local minute-of-day window closes (exclusive). NULL = 24:00.
-- Evaluated in a single fixed timezone (America/Tijuana), matching specials logic.

ALTER TABLE "menu_items"
ADD COLUMN IF NOT EXISTS "schedule_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN IF NOT EXISTS "schedule_start_minute" INTEGER,
ADD COLUMN IF NOT EXISTS "schedule_end_minute" INTEGER;
