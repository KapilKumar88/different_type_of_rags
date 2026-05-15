import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, MessageSquare, FileText, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockChats, mockDocuments, tokensByChat, tokensByDay } from "@/lib/mock/data";
import { usePageMeta } from "@/hooks/use-page-meta";

export function UsagePage() {
  usePageMeta("Usage Stats - RAG Assistant");
  const totalTokens = tokensByDay.reduce((a, d) => a + d.tokens, 0);
  const todayTokens = tokensByDay[tokensByDay.length - 1].tokens;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Usage overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Last 14 days</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tokens"
          value={totalTokens.toLocaleString()}
          icon={Coins}
          delta="+12.4%"
        />
        <StatCard
          label="Tokens today"
          value={todayTokens.toLocaleString()}
          icon={TrendingUp}
          delta="+3.1%"
        />
        <StatCard
          label="Total chats"
          value={String(mockChats.length)}
          icon={MessageSquare}
          delta="+2 this week"
        />
        <StatCard
          label="Documents"
          value={String(mockDocuments.length)}
          icon={FileText}
          delta="+1 this week"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Tokens used over time</h3>
              <p className="text-xs text-muted-foreground">Daily token consumption</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tokensByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  stroke="var(--primary)"
                  fill="url(#g1)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top chats by tokens</h3>
            <p className="text-xs text-muted-foreground">Recent conversations</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tokensByChat}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="tokens" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Chat history</h3>
            <p className="text-xs text-muted-foreground">All conversations and their token usage</p>
          </div>
          <Link
            to="/app/chat"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            View chats <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chat</TableHead>
              <TableHead className="hidden sm:table-cell">Last activity</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="hidden md:table-cell text-right">Documents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockChats.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.title}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {c.updatedAt}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {c.tokens.toLocaleString()}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right tabular-nums">
                  {c.refs}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  delta,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  delta?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {delta && <p className="mt-1 text-xs text-success">{delta}</p>}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}
