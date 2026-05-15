import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";

export function SettingsPage() {
  usePageMeta("Settings - RAG Assistant");
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account and assistant preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground">Profile</h3>
            <p className="mt-1 text-sm text-muted-foreground">Update your personal information.</p>
            <div className="mt-5 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary text-primary-foreground">AL</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change avatar
              </Button>
            </div>
            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Profile updated");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" defaultValue="Ada Lovelace" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="ada@company.com" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" defaultValue="Analytical Engines Inc." />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground">Change password</h3>
            <p className="mt-1 text-sm text-muted-foreground">Use a strong, unique password.</p>
            <form
              className="mt-5 grid gap-4 sm:max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Password updated");
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type="password" />
              </div>
              <div>
                <Button type="submit">Update password</Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <ModelSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModelSettings() {
  const [maxLen, setMaxLen] = React.useState([1024]);
  const [topK, setTopK] = React.useState([5]);
  const [temp, setTemp] = React.useState([0.3]);
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground">Model & retrieval</h3>
      <p className="mt-1 text-sm text-muted-foreground">Tune how your assistant responds.</p>
      <form
        className="mt-5 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Preferences saved");
        }}
      >
        <div className="grid gap-2 sm:max-w-sm">
          <Label>Default model</Label>
          <Select defaultValue="gpt-4o-mini">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">gpt-4o-mini · fast & cheap</SelectItem>
              <SelectItem value="gpt-4o">gpt-4o · balanced</SelectItem>
              <SelectItem value="claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
              <SelectItem value="llama-3.1-70b">llama-3.1-70b</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Max response length</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{maxLen[0]} tokens</span>
          </div>
          <Slider value={maxLen} onValueChange={setMaxLen} min={128} max={4096} step={128} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Retrieval top-k</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{topK[0]}</span>
          </div>
          <Slider value={topK} onValueChange={setTopK} min={1} max={20} step={1} />
          <p className="text-xs text-muted-foreground">
            Number of document chunks retrieved per query.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Temperature</Label>
            <span className="text-sm tabular-nums text-muted-foreground">{temp[0].toFixed(2)}</span>
          </div>
          <Slider value={temp} onValueChange={setTemp} min={0} max={1} step={0.05} />
        </div>

        <Button type="submit">Save preferences</Button>
      </form>
    </Card>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const opts = [
    { value: "light" as const, label: "Light", icon: Sun },
    { value: "dark" as const, label: "Dark", icon: Moon },
    { value: "system" as const, label: "System", icon: Monitor },
  ];
  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground">Appearance</h3>
      <p className="mt-1 text-sm text-muted-foreground">Choose how the interface looks.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {opts.map((o) => {
          const active = theme === o.value;
          return (
            <button
              key={o.value}
              onClick={() => {
                setTheme(o.value);
                toast.success(`Theme set to ${o.label}`);
              }}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-primary bg-accent/40 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40 hover:bg-accent/30"
              }`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
                <o.icon className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{o.label}</div>
                <div className="text-xs text-muted-foreground">
                  {o.value === "system" ? "Follow OS preference" : `${o.label} mode`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
