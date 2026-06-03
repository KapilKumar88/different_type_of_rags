export type ExtractedEntity = {
  name: string;
  type: string;
  description: string;
};

export type ExtractedRelationship = {
  source: string;
  target: string;
  type: string;
  description: string;
};

export type ExtractionResult = {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
};

export type GraphEntity = {
  id: string;
  userId: string;
  documentId: string;
  name: string;
  normalizedName: string;
  type: string;
  description: string;
  createdAt: string;
};

export type GraphRelationship = {
  id: string;
  userId: string;
  documentId: string;
  sourceId: string;
  targetId: string;
  sourceNormalizedName: string;
  targetNormalizedName: string;
  type: string;
  description: string;
  createdAt: string;
};

export type GraphChunk = {
  id: string;
  userId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  createdAt: string;
};

export type GraphContext = {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
  chunks: GraphChunk[];
};

export type GraphNode = {
  id: string;
  name: string;
  type: string;
  description: string;
  documentId: string;
};

export type GraphEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  description: string;
  documentId: string;
};

export type DocumentGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};
