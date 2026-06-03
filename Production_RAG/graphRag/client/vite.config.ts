import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function getManualChunk(id: string): string | undefined {
  const normalizedId = id.replaceAll("\\", "/");

  if (!normalizedId.includes("/node_modules/")) {
    return undefined;
  }

  if (
    normalizedId.includes("/node_modules/react/") ||
    normalizedId.includes("/node_modules/react-dom/") ||
    normalizedId.includes("/node_modules/react-router/") ||
    normalizedId.includes("/node_modules/react-router-dom/") ||
    normalizedId.includes("/node_modules/scheduler/")
  ) {
    return "vendor-react";
  }

  if (
    normalizedId.includes("/node_modules/@tanstack/react-query/") ||
    normalizedId.includes("/node_modules/@tanstack/query-core/") ||
    normalizedId.includes("/node_modules/zustand/")
  ) {
    return "vendor-query-state";
  }

  if (
    normalizedId.includes("/node_modules/react-force-graph-2d/") ||
    normalizedId.includes("/node_modules/force-graph/") ||
    normalizedId.includes("/node_modules/d3-force/") ||
    normalizedId.includes("/node_modules/d3-quadtree/") ||
    normalizedId.includes("/node_modules/d3-timer/") ||
    normalizedId.includes("/node_modules/d3-dispatch/")
  ) {
    return "vendor-graph";
  }

  if (
    normalizedId.includes("/node_modules/react-markdown/") ||
    normalizedId.includes("/node_modules/remark-gfm/") ||
    normalizedId.includes("/node_modules/remark-parse/") ||
    normalizedId.includes("/node_modules/remark-rehype/") ||
    normalizedId.includes("/node_modules/unified/") ||
    normalizedId.includes("/node_modules/micromark") ||
    normalizedId.includes("/node_modules/mdast-util") ||
    normalizedId.includes("/node_modules/hast-util") ||
    normalizedId.includes("/node_modules/unist-util") ||
    normalizedId.includes("/node_modules/vfile") ||
    normalizedId.includes("/node_modules/property-information/") ||
    normalizedId.includes("/node_modules/space-separated-tokens/") ||
    normalizedId.includes("/node_modules/comma-separated-tokens/")
  ) {
    return "vendor-markdown";
  }

  return undefined;
}

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
  plugins: [react(), tailwindcss(), tsconfigPaths()],
});
