import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import type { DocumentGraphResponse } from "@/types/graph.types";

export const graphService = {
  getDocumentGraph(documentId: string): Promise<DocumentGraphResponse> {
    return apiClient.get<DocumentGraphResponse>(
      apiConfig.endpoints.graph.documentGraph(documentId),
    );
  },
};
