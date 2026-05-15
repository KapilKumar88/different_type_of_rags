import { useLocation } from "react-router-dom";
import { Search, Upload } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { UploadDialog } from "@/components/app/upload-dialog";

const TITLES: Record<string, string> = {
  "/app/chat": "Chat",
  "/app/documents": "Documents",
  "/app/usage": "Usage Stats",
  "/app/settings": "Settings",
};

export function AppHeader() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur sm:px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <h1 className="text-sm font-semibold text-foreground sm:text-base">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="h-9 w-64 pl-8 pr-12" />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
        </div>
        <UploadDialog>
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
