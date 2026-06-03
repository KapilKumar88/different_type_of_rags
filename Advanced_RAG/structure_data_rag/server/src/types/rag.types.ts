export type DocumentContentKind = 'text' | 'structured' | 'hybrid';

export type VectorPayloadKind = 'text' | 'table_summary';

export type StructuredTableSourceType =
  | 'csv'
  | 'xlsx'
  | 'json'
  | 'markdown'
  | 'docx'
  | 'pdf';

export type StructuredColumnValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'empty';

export type StructuredValue = string | number | boolean | null;

export type StructuredTableColumn = {
  key: string;
  name: string;
  index: number;
  valueType: StructuredColumnValueType;
  nonNullCount: number;
  sampleValues: StructuredValue[];
};

export type StructuredTableRow = {
  index: number;
  values: Record<string, StructuredValue>;
};

export type ParsedStructuredTable = {
  tableKey: string;
  title: string;
  sourceType: StructuredTableSourceType;
  sourceLabel: string;
  pageNumber?: number;
  columns: StructuredTableColumn[];
  rows: StructuredTableRow[];
};

export type ChunkPayload = {
  kind: VectorPayloadKind;
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  tableId?: string;
  tableKey?: string;
  tableTitle?: string;
  sourceType?: StructuredTableSourceType;
  rowCount?: number;
  columnCount?: number;
  createdAt: string;
};

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: ChunkPayload;
};

export type RetrievedTextChunk = ChunkPayload & {
  kind: 'text';
  score: number;
};

export type RetrievedTableSummary = ChunkPayload & {
  kind: 'table_summary';
  tableId: string;
  tableKey: string;
  tableTitle: string;
  sourceType: StructuredTableSourceType;
  rowCount: number;
  columnCount: number;
  score: number;
};

export type RetrievedChunk = RetrievedTextChunk | RetrievedTableSummary;

export type StructuredQueryOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export type StructuredQueryFilter = {
  columnKey: string;
  operator: StructuredQueryOperator;
  value: StructuredValue;
};

export type StructuredQuerySort = {
  columnKey: string;
  direction: 'asc' | 'desc';
};

export type StructuredQueryAggregation =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max';

export type StructuredQueryPlan = {
  tableId: string;
  operation: 'select' | StructuredQueryAggregation;
  columns: string[];
  filters: StructuredQueryFilter[];
  sort?: StructuredQuerySort;
  groupBy?: string[];
  limit: number;
};

export type StructuredQueryResultRow = Record<string, StructuredValue>;

export type StructuredQueryResult = {
  tableId: string;
  tableTitle: string;
  sourceLabel: string;
  operation: StructuredQueryPlan['operation'];
  columns: StructuredTableColumn[];
  rows: StructuredQueryResultRow[];
  rowCount: number;
};

export type TextSource = RetrievedTextChunk & {
  sourceKind: 'text';
};

export type TableSource = {
  sourceKind: 'table';
  tableId: string;
  documentId: string;
  fileName: string;
  tableTitle: string;
  sourceLabel: string;
  sourceType: StructuredTableSourceType;
  rowCount: number;
  columnCount: number;
  score?: number;
};

export type QueryResultSource = StructuredQueryResult & {
  sourceKind: 'query_result';
  documentId: string;
  fileName: string;
};

export type RagSource = TextSource | TableSource | QueryResultSource;
