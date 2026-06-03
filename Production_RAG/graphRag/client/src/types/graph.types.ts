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

export type DocumentGraphResponse = {
  success: true;
  message: string;
  data: {
    graph: DocumentGraph;
  };
};

export type GraphEntity = {
  id: string;
  name: string;
  type: string;
  description: string;
};

export type GraphRelationship = {
  id: string;
  sourceNormalizedName: string;
  targetNormalizedName: string;
  type: string;
  description: string;
};

export type GraphStreamEvent = {
  entities: GraphEntity[];
  relationships: GraphRelationship[];
};
