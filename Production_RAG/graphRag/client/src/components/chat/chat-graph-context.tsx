import { Network } from "lucide-react";
import type { GraphStreamEvent } from "@/types/chat.types";

type Props = Readonly<{
  graphContext: GraphStreamEvent;
}>;

export function ChatGraphContext({ graphContext }: Props) {
  const { entities, relationships } = graphContext;

  if (entities.length === 0 && relationships.length === 0) {
    return null;
  }

  return (
    <details className="w-full rounded-lg border border-border bg-muted/30 p-3">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-foreground">
        <Network className="h-3.5 w-3.5 text-primary" />
        Knowledge graph used ({entities.length} entities
        {relationships.length > 0 ? `, ${relationships.length} relationships` : ""})
      </summary>

      <div className="mt-3 space-y-3">
        {entities.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Entities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entities.map((entity) => (
                <span
                  key={entity.id}
                  title={entity.description || entity.name}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs"
                >
                  <span className="font-medium text-foreground">{entity.name}</span>
                  <span className="text-muted-foreground">· {entity.type}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {relationships.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Relationships
            </p>
            <div className="space-y-1">
              {relationships.map((rel) => (
                <div key={rel.id} className="flex items-start gap-1.5 text-xs">
                  <span className="font-medium text-foreground">{rel.sourceNormalizedName}</span>
                  <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-semibold text-primary">
                    {rel.type}
                  </span>
                  <span className="font-medium text-foreground">{rel.targetNormalizedName}</span>
                  {rel.description && (
                    <span className="text-muted-foreground">— {rel.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
