import * as React from "react";
import { Upload, FileText, X, CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiClientError } from "@/lib/api-client";
import { documentsService } from "@/services/documents.service";
import { toast } from "sonner";

type UploadStatus = "uploading" | "done" | "failed";

type Pending = {
  id: string;
  name: string;
  size: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

type UploadDialogProps = {
  children: React.ReactNode;
  onUploaded?: () => void;
};

export function UploadDialog({ children, onUploaded }: Readonly<UploadDialogProps>) {
  const [open, setOpen] = React.useState(false);
  const [files, setFiles] = React.useState<Pending[]>([]);
  const [dragOver, setDragOver] = React.useState(false);

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: Pending[] = Array.from(list).map((f, i) => ({
      id: `${Date.now()}-${i}`,
      name: f.name,
      size: formatBytes(f.size),
      progress: 12,
      status: "uploading",
    }));
    setFiles((prev) => [...prev, ...next]);
    Array.from(list).forEach((file, index) => uploadFile(file, next[index]?.id));
  };

  const uploadFile = async (file: File, id: string | undefined) => {
    if (!id) return;

    try {
      setFiles((prev) => prev.map((item) => (item.id === id ? { ...item, progress: 45 } : item)));
      const response = await documentsService.upload(file);
      setFiles((prev) =>
        prev.map((item) => (item.id === id ? { ...item, progress: 100, status: "done" } : item)),
      );
      toast.success("Document indexed", { description: response.data.document.fileName });
      onUploaded?.();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Document upload failed";
      setFiles((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, progress: 100, status: "failed", error: message } : item,
        ),
      );
      toast.error("Upload failed", { description: message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>PDF, DOCX, TXT, CSV, MD — up to 50 MB each.</DialogDescription>
        </DialogHeader>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-primary bg-accent/40"
              : "border-border hover:border-primary/60 hover:bg-muted/40"
          }`}
        >
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-foreground">
            Drag & drop files, or <span className="text-primary">browse</span>
          </span>
          <span className="mt-1 text-xs text-muted-foreground">PDF, DOCX, TXT, CSV, MD</span>
          <input
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.docx,.txt,.csv,.md"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>

        {files.length > 0 && (
          <div className="mt-2 max-h-56 space-y-2 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{f.size}</span>
                  {f.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : f.status === "failed" ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <Progress value={f.progress} className="mt-2 h-1.5" />
                {f.error && <p className="mt-2 text-xs text-destructive">{f.error}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          {files.length > 0 && (
            <Button variant="ghost" onClick={() => setFiles([])}>
              <X className="mr-1.5 h-4 w-4" /> Clear
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
