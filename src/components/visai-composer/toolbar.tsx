import type { NodeType } from '@/lib/visai-types';
import { Button } from '@/components/ui/button';
import { Image, Upload, MessageSquare, Combine } from 'lucide-react';

interface ToolbarProps {
  onAddNode: (type: NodeType) => void;
}

const nodeTypes = [
  { type: 'generate', label: 'Generate Image', icon: Image },
  { type: 'upload', label: 'Upload Image', icon: Upload },
  { type: 'prompt', label: 'AI Prompt', icon: MessageSquare },
  { type: 'output', label: 'Output Node', icon: Combine },
] as const;

export default function Toolbar({ onAddNode }: ToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10 bg-card p-2 rounded-lg shadow-md border border-border">
      <div className="flex flex-col gap-2">
        {nodeTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="ghost"
            className="justify-start"
            onClick={() => onAddNode(type)}
            aria-label={`Add ${label} node`}
          >
            <Icon className="mr-2 h-4 w-4" />
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
