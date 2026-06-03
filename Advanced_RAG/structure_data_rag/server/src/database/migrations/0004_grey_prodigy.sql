CREATE TABLE "document_structured_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"column_key" varchar(120) NOT NULL,
	"name" varchar(255) NOT NULL,
	"column_index" integer NOT NULL,
	"value_type" varchar(40) NOT NULL,
	"non_null_count" integer NOT NULL,
	"sample_values" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_structured_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"values" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_structured_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"table_key" varchar(160) NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_type" varchar(40) NOT NULL,
	"source_label" varchar(255) NOT NULL,
	"page_number" integer,
	"row_count" integer NOT NULL,
	"column_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "content_kind" varchar(40) DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "structured_table_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "structured_row_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "document_structured_columns" ADD CONSTRAINT "document_structured_columns_table_id_document_structured_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."document_structured_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_structured_rows" ADD CONSTRAINT "document_structured_rows_table_id_document_structured_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."document_structured_tables"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_structured_tables" ADD CONSTRAINT "document_structured_tables_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_structured_columns_table_id_idx" ON "document_structured_columns" USING btree ("table_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_structured_columns_table_column_key_unique_idx" ON "document_structured_columns" USING btree ("table_id","column_key");--> statement-breakpoint
CREATE INDEX "document_structured_rows_table_id_idx" ON "document_structured_rows" USING btree ("table_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_structured_rows_table_row_index_unique_idx" ON "document_structured_rows" USING btree ("table_id","row_index");--> statement-breakpoint
CREATE INDEX "document_structured_tables_document_id_idx" ON "document_structured_tables" USING btree ("document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_structured_tables_document_table_key_unique_idx" ON "document_structured_tables" USING btree ("document_id","table_key");