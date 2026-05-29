import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UploadDialog } from "@/components/app/upload-dialog";

const TITLES: Record<string, string> = {
  "/app/chat": "Chat",
  "/app/documents": "Documents",
};

export function AppHeader() {
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const title = TITLES[pathname] ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <h1 className="text-sm font-semibold text-foreground sm:text-base">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <UploadDialog
          onUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
          }}
        >
          <Button size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </UploadDialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
