import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import type { DocumentMutationResponse, DocumentsListResponse } from "@/types/document.types";

export const documentsService = {
  list(): Promise<DocumentsListResponse> {
    return apiClient.get<DocumentsListResponse>(apiConfig.endpoints.documents.list);
  },

  upload(file: File): Promise<DocumentMutationResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post<DocumentMutationResponse, FormData>(
      apiConfig.endpoints.documents.upload,
      formData,
      {
        timeoutMs: apiConfig.requestTimeouts.documentUpload,
      },
    );
  },

  delete(id: string): Promise<DocumentMutationResponse> {
    return apiClient.delete<DocumentMutationResponse>(apiConfig.endpoints.documents.delete(id));
  },
};
