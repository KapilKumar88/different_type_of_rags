export type RagDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  contentKind: "text" | "structured" | "hybrid";
  structuredTableCount: number;
  structuredRowCount: number;
  createdAt: string;
  updatedAt: string;
};

export type StructuredValue = string | number | boolean | null;

export type StructuredTableColumn = {
  id: string;
  tableId: string;
  columnKey: string;
  name: string;
  columnIndex: number;
  valueType: "string" | "number" | "boolean" | "date" | "empty";
  nonNullCount: number;
  sampleValues: StructuredValue[];
};

export type StructuredTableRow = {
  id: string;
  tableId: string;
  rowIndex: number;
  values: Record<string, StructuredValue>;
};

export type StructuredDocumentTable = {
  id: string;
  documentId: string;
  tableKey: string;
  title: string;
  sourceType: "csv" | "xlsx" | "json" | "markdown" | "docx" | "pdf";
  sourceLabel: string;
  pageNumber?: number | null;
  rowCount: number;
  columnCount: number;
  fileName: string;
  columns: StructuredTableColumn[];
  rows: StructuredTableRow[];
  createdAt: string;
  updatedAt: string;
};

export type DocumentsListResponse = {
  success: true;
  message: string;
  data: {
    documents: RagDocument[];
  };
};

export type DocumentMutationResponse = {
  success: true;
  message: string;
  data: {
    document: RagDocument;
  };
};

export type DocumentTablesResponse = {
  success: true;
  message: string;
  data: {
    tables: StructuredDocumentTable[];
  };
};
