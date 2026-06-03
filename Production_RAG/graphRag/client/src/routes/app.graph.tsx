import React, { useCallback, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type NodeObject,
  type LinkObject,
} from "react-force-graph-2d";
import { useQuery } from "@tanstack/react-query";
import { Network, AlertCircle, Loader2 } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { documentsService } from "@/services/documents.service";
import { graphService } from "@/services/graph.service";
import type { GraphNode, GraphEdge } from "@/types/graph.types";

const ENTITY_TYPE_COLORS: Record<string, string> = {
  PERSON: "#6366f1",
  ORGANIZATION: "#f59e0b",
  LOCATION: "#10b981",
  CONCEPT: "#3b82f6",
  EVENT: "#ef4444",
  PRODUCT: "#8b5cf6",
  TECHNOLOGY: "#06b6d4",
};

function getNodeColor(type: string): string {
  return ENTITY_TYPE_COLORS[type.toUpperCase()] ?? "#94a3b8";
}

type ForceNode = NodeObject & GraphNode;
type ForceLink = LinkObject & { source: string; target: string; edgeData: GraphEdge };

type TooltipState = {
  x: number;
  y: number;
  content: string;
} | null;

export function GraphPage() {
  usePageMeta("Knowledge Graph");

  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentsService.list(),
  });

  const documents = docsData?.data?.documents ?? [];

  const {
    data: graphData,
    isLoading: graphLoading,
    error: graphError,
  } = useQuery({
    queryKey: ["document-graph", selectedDocumentId],
    queryFn: () => graphService.getDocumentGraph(selectedDocumentId),
    enabled: !!selectedDocumentId,
  });

  const graph = graphData?.data?.graph;

  const forceNodes: ForceNode[] = (graph?.nodes ?? []).map((node) => ({
    ...node,
  }));

  const forceLinks: ForceLink[] = (graph?.edges ?? []).map((edge) => ({
    ...edge,
    source: edge.sourceId,
    target: edge.targetId,
    edgeData: edge,
  }));

  const handleNodeHover = useCallback((node: NodeObject | null, event?: MouseEvent) => {
    if (!node) {
      setTooltip(null);
      return;
    }
    const n = node as ForceNode;
    if (event) {
      setTooltip({
        x: event.clientX + 12,
        y: event.clientY - 28,
        content: `${n.name} (${n.type})\n${n.description || "No description"}`,
      });
    }
  }, []);

  const handleNodeClick = useCallback((node: NodeObject) => {
    const n = node as ForceNode;
    setTooltip(null);
    graphRef.current?.centerAt(n.x ?? 0, n.y ?? 0, 600);
    graphRef.current?.zoom(3, 600);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Network className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Knowledge Graph</h1>
      </div>

      <div className="flex items-center gap-3 border-b px-6 py-3">
        {docsLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <select
            value={selectedDocumentId}
            onChange={(e) => setSelectedDocumentId(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Select a document —</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.fileName}
              </option>
            ))}
          </select>
        )}
        {graph && (
          <span className="text-xs text-muted-foreground">
            {graph.nodes.length} entities · {graph.edges.length} relationships
          </span>
        )}
      </div>

      <div className="relative flex-1 overflow-hidden bg-muted/30">
        {!selectedDocumentId && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Network className="h-12 w-12 opacity-30" />
            <p className="text-sm">Select a document to view its knowledge graph</p>
          </div>
        )}

        {selectedDocumentId && graphLoading && (
          <div className="flex h-full items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Building graph…</span>
          </div>
        )}

        {selectedDocumentId && graphError && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Failed to load knowledge graph</p>
          </div>
        )}

        {graph && graph.nodes.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Network className="h-12 w-12 opacity-30" />
            <p className="text-sm">No knowledge graph found for this document</p>
            <p className="text-xs">The document may not have extractable entities</p>
          </div>
        )}

        {graph && graph.nodes.length > 0 && (
          <GraphCanvas
            nodes={forceNodes}
            links={forceLinks}
            graphRef={graphRef}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
          />
        )}

        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 max-w-xs rounded-md border bg-popover px-3 py-2 text-xs shadow-md text-popover-foreground whitespace-pre-line"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {graph && graph.nodes.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-6 py-3">
          {Object.entries(ENTITY_TYPE_COLORS).map(([type, color]) => {
            const hasType = graph.nodes.some((n) => n.type.toUpperCase() === type);
            if (!hasType) return null;
            return (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {type}
              </span>
            );
          })}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#94a3b8]" />
            OTHER
          </span>
        </div>
      )}
    </div>
  );
}

type GraphCanvasProps = {
  nodes: ForceNode[];
  links: ForceLink[];
  graphRef: React.MutableRefObject<ForceGraphMethods | undefined>;
  onNodeHover: (node: NodeObject | null, event?: MouseEvent) => void;
  onNodeClick: (node: NodeObject) => void;
};

function GraphCanvas({ nodes, links, graphRef, onNodeHover, onNodeClick }: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const width = containerRef.current?.clientWidth ?? 800;
  const height = containerRef.current?.clientHeight ?? 600;

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes, links }}
        width={width}
        height={height}
        nodeLabel={() => ""}
        nodeColor={(node) => getNodeColor((node as ForceNode).type)}
        nodeRelSize={6}
        linkLabel={(link) => (link as ForceLink).edgeData?.type ?? ""}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkColor={() => "#94a3b8"}
        onNodeHover={onNodeHover}
        onNodeClick={onNodeClick}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as ForceNode;
          const label = n.name;
          const fontSize = Math.max(10 / globalScale, 2);
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#e2e8f0";
          ctx.fillText(label, n.x ?? 0, (n.y ?? 0) + 8);
        }}
      />
    </div>
  );
}
