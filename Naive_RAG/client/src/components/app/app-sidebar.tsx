import { useMutation } from "@tanstack/react-query";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { MessageSquare, FileText, LogOut, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiClientError } from "@/lib/api-client";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth.store";
import { toast } from "sonner";

const items = [
  { title: "Chat", url: "/app/chat", icon: MessageSquare },
  { title: "Documents", url: "/app/documents", icon: FileText },
];

function getInitials(name?: string) {
  if (!name) {
    return "U";
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
}

export function AppSidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setUnauthenticated();
      toast.success("Signed out");
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to sign out. Please try again.";

      toast.error("Sign out failed", { description: message });
    },
  });

  function handleSignOut() {
    logoutMutation.mutate();
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/app/chat" className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            RAG Assistant
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : undefined
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <div className="truncate text-sm font-medium text-sidebar-foreground">
                  {user?.name ?? "Account"}
                </div>
                <div className="truncate text-xs text-sidebar-foreground/60">
                  {user?.email ?? "Signed in"}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem onSelect={handleSignOut} disabled={logoutMutation.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
