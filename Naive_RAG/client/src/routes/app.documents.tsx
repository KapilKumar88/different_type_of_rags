import * as React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Search,
  Upload,
  MoreHorizontal,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadDialog } from "@/components/app/upload-dialog";
import { usePageMeta } from "@/hooks/use-page-meta";
import { ApiClientError } from "@/lib/api-client";
import { documentsService } from "@/services/documents.service";
import type { RagDocument } from "@/types/document.types";
import { toast } from "sonner";

type DocStatus = "Indexed";
type DocType = "pdf" | "docx" | "txt" | "csv" | "md" | "other";

const documentsQueryKey = ["documents"] as const;

export function DocumentsPage() {
  usePageMeta("Documents - RAG Assistant");
  const queryClient = useQueryClient();
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | DocStatus>("all");
  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: documentsService.list,
  });
  const deleteMutation = useMutation({
    mutationFn: documentsService.delete,
    onSuccess: (response) => {
      toast.success("Document deleted", { description: response.data.document.fileName });
      queryClient.invalidateQueries({ queryKey: documentsQueryKey });
    },
    onError: (error) => {
      const message = error instanceof ApiClientError ? error.message : "Unable to delete document";
      toast.error("Delete failed", { description: message });
    },
  });
  const documents = documentsQuery.data?.data.documents ?? [];
  const filtered = documents.filter((document) => {
    const matchesQuery = document.fileName.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "all" || getStatus(document) === status;

    return matchesQuery && matchesStatus;
  });
  const totalChunks = documents.reduce((total, document) => total + document.chunkCount, 0);

  const refreshDocuments = () => {
    queryClient.invalidateQueries({ queryKey: documentsQueryKey });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Your documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {documents.length} files · {totalChunks.toLocaleString()} chunks indexed
          </p>
        </div>
        <UploadDialog onUploaded={refreshDocuments}>
          <Button className="gap-1.5">
            <Upload className="h-4 w-4" /> Upload documents
          </Button>
        </UploadDialog>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents..."
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as "all" | DocStatus)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Indexed">Indexed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {documentsQuery.isPending ? (
        <LoadingDocs />
      ) : documentsQuery.isError ? (
        <ErrorDocs onRetry={() => documentsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyDocs onUploaded={refreshDocuments} hasDocuments={documents.length > 0} />
      ) : (
        <DocumentsTable
          documents={filtered}
          deletingId={deleteMutation.variables}
          deleting={deleteMutation.isPending}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}
    </div>
  );
}

function DocumentsTable({
  documents,
  deleting,
  deletingId,
  onDelete,
}: Readonly<{
  documents: RagDocument[];
  deleting: boolean;
  deletingId: string | undefined;
  onDelete: (id: string) => void;
}>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Chunks</TableHead>
            <TableHead className="hidden lg:table-cell">Size</TableHead>
            <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <FileIcon type={getDocType(document)} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {document.fileName}
                    </div>
                    <div className="text-xs text-muted-foreground sm:hidden">
                      <StatusBadge /> · {formatBytes(document.sizeBytes)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusBadge />
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {document.chunkCount}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatBytes(document.sizeBytes)}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {formatDate(document.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      disabled={deleting && deletingId === document.id}
                      onClick={() => onDelete(document.id)}
                    >
                      {deleting && deletingId === document.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FileIcon({ type }: Readonly<{ type: DocType }>) {
  const Cmp = type === "csv" ? FileSpreadsheet : type === "md" ? FileCode : FileText;
  let tone = "bg-muted text-muted-foreground";

  if (type === "pdf") {
    tone = "bg-red-500/10 text-red-600 dark:text-red-400";
  } else if (type === "docx") {
    tone = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
  } else if (type === "csv") {
    tone = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  }

  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
      <Cmp className="h-4 w-4" />
    </span>
  );
}

function StatusBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
      <CheckCircle2 className="h-3 w-3" /> Indexed
    </Badge>
  );
}

function LoadingDocs() {
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center">
      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">Loading documents...</p>
    </div>
  );
}

function ErrorDocs({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center">
      <AlertCircle className="mx-auto h-5 w-5 text-destructive" />
      <h3 className="mt-3 text-base font-semibold text-foreground">Unable to load documents</h3>
      <p className="mt-1 text-sm text-muted-foreground">Check that the backend is running.</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyDocs({
  onUploaded,
  hasDocuments,
}: Readonly<{
  onUploaded: () => void;
  hasDocuments: boolean;
}>) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        {hasDocuments ? "No documents match your search" : "No documents yet"}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {hasDocuments
          ? "Adjust the search or status filter to find an indexed document."
          : "Upload PDFs, Word docs, spreadsheets or markdown to index them for RAG."}
      </p>
      {!hasDocuments && (
        <UploadDialog onUploaded={onUploaded}>
          <Button className="mt-5 gap-1.5">
            <Upload className="h-4 w-4" /> Upload your first document
          </Button>
        </UploadDialog>
      )}
    </div>
  );
}

function getStatus(_document: RagDocument): DocStatus {
  return "Indexed";
}

function getDocType(document: RagDocument): DocType {
  const extension = document.fileName.split(".").pop()?.toLowerCase();

  if (
    extension === "pdf" ||
    extension === "docx" ||
    extension === "txt" ||
    extension === "csv" ||
    extension === "md"
  ) {
    return extension;
  }

  return "other";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}
