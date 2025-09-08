export type NodeType = 'generate' | 'upload' | 'output';

export interface NodeData {
  prompt?: string;
  context?: string;
  refinedPrompt?: string;
  imageDataUri?: string;
  blendingInstructions?: string;
  isProcessing?: boolean;
  inputStates?: { [nodeId: string]: string | undefined; };
}

export interface VisaiNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: NodeData;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}
