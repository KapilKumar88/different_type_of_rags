import { apiConfig } from "@/config/api.config";
import { apiClient } from "@/lib/api-client";
import type { AskQuestionPayload, AskQuestionResponse } from "@/types/chat.types";

export const chatService = {
  ask(payload: AskQuestionPayload): Promise<AskQuestionResponse> {
    return apiClient.post<AskQuestionResponse, AskQuestionPayload>(
      apiConfig.endpoints.chat.ask,
      payload,
    );
  },
};
