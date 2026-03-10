-- Add last_weigh_in_date to users for the Sunday Weekly Review trigger
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "last_weigh_in_date" date;
