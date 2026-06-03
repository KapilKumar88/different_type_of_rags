CREATE TABLE "document_parents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"parent_index" integer NOT NULL,
	"text" text NOT NULL,
	"page_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_parents" ADD CONSTRAINT "document_parents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_parents_document_id_idx" ON "document_parents" USING btree ("document_id");