import type { VisaiNode, Connection } from '@/lib/visai-types';
import GenerateImageNode from './nodes/generate-image-node';
import UploadImageNode from './nodes/upload-image-node';
import OutputNode from './nodes/output-node';

interface NodeRendererProps {
  node: VisaiNode;
  nodes: VisaiNode[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  startConnection: (fromNodeId: string, fromPosition: { x: number, y: number }) => void;
}

export default function NodeRenderer({ node, ...props }: NodeRendererProps) {
  const nodeProps = { node, ...props };
  switch (node.type) {
    case 'generate':
      return <GenerateImageNode {...nodeProps} />;
    case 'upload':
      return <UploadImageNode {...nodeProps} />;
    case 'output':
      return <OutputNode {...nodeProps} />;
    default:
      return null;
  }
}
