export type SourceChunk = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  score: number;
  createdAt: string;
};

export type AskQuestionPayload = {
  question: string;
};

export type AskQuestionResponse = {
  success: true;
  message: string;
  data: {
    answer: string;
    sources: SourceChunk[];
  };
};
