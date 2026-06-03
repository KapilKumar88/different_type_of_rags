-- Existing document rows have no reliable owner to backfill. Clear RAG
-- conversations/documents before enforcing non-null document ownership.
DELETE FROM "conversations";--> statement-breakpoint
DELETE FROM "documents";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "user_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");
