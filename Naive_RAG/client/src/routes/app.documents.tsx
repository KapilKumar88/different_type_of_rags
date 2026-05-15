import * as React from "react";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Search,
  Upload,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UploadDialog } from "@/components/app/upload-dialog";
import { mockDocuments, type DocStatus, type DocType } from "@/lib/mock/data";
import { usePageMeta } from "@/hooks/use-page-meta";
import { toast } from "sonner";

export function DocumentsPage() {
  usePageMeta("Documents - RAG Assistant");
  const [docs, setDocs] = React.useState(mockDocuments);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<"all" | DocStatus>("all");

  const filtered = docs.filter(
    (d) =>
      (status === "all" || d.status === status) &&
      d.name.toLowerCase().includes(query.toLowerCase()),
  );

  const remove = (id: string) => {
    setDocs((d) => d.filter((x) => x.id !== id));
    toast.success("Document deleted");
  };
  const reindex = (id: string) => {
    setDocs((d) => d.map((x) => (x.id === id ? { ...x, status: "Processing" } : x)));
    toast.success("Re-indexing started");
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">Your documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {docs.length} files · {docs.reduce((a, d) => a + d.tokens, 0).toLocaleString()} tokens
            indexed
          </p>
        </div>
        <UploadDialog>
          <Button className="gap-1.5">
            <Upload className="h-4 w-4" /> Upload documents
          </Button>
        </UploadDialog>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as never)}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Indexed">Indexed</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyDocs />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="hidden md:table-cell">Chunks</TableHead>
                <TableHead className="hidden md:table-cell">Tokens</TableHead>
                <TableHead className="hidden lg:table-cell">Size</TableHead>
                <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <FileIcon type={d.type} />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{d.name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">
                          <StatusBadge status={d.status} /> · {d.size}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusBadge status={d.status} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {d.chunks || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {d.tokens ? d.tokens.toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {d.size}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {d.uploadedAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info(`Viewing ${d.name}`)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => reindex(d.id)}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Re-index
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => remove(d.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function FileIcon({ type }: { type: DocType }) {
  const Cmp = type === "csv" ? FileSpreadsheet : type === "md" ? FileCode : FileText;
  const tone =
    type === "pdf"
      ? "bg-red-500/10 text-red-600 dark:text-red-400"
      : type === "docx"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : type === "csv"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}>
      <Cmp className="h-4 w-4" />
    </span>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === "Indexed")
    return (
      <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success">
        <CheckCircle2 className="h-3 w-3" /> Indexed
      </Badge>
    );
  if (status === "Processing")
    return (
      <Badge
        variant="outline"
        className="gap-1 border-warning/30 bg-warning/10 text-warning-foreground"
      >
        <Loader2 className="h-3 w-3 animate-spin" /> Processing
      </Badge>
    );
  return (
    <Badge
      variant="outline"
      className="gap-1 border-destructive/30 bg-destructive/10 text-destructive"
    >
      <XCircle className="h-3 w-3" /> Failed
    </Badge>
  );
}

function EmptyDocs() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
        <FileText className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold text-foreground">No documents yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Upload PDFs, Word docs, spreadsheets or markdown — your assistant will index them
        automatically.
      </p>
      <UploadDialog>
        <Button className="mt-5 gap-1.5">
          <Upload className="h-4 w-4" /> Upload your first document
        </Button>
      </UploadDialog>
    </div>
  );
}
