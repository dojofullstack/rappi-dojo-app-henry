ALTER TABLE "pedidos" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "payment_status" text DEFAULT 'pending';