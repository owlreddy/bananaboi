import React from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { assistedPromptComposition } from '@/ai/flows/assisted-prompt-composition';

interface PromptNodeProps {
  node: VisaiNode;
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  startConnection: (fromNodeId: string, fromPosition: { x: number, y: number }) => void;
}

export default function PromptNode({ node, onMouseDown, updateNodeData, deleteNode, startConnection }: PromptNodeProps) {
  const { toast } = useToast();

  const handleRefine = async () => {
    if (!node.data.prompt) {
      toast({
        title: "Error",
        description: "Please enter an initial prompt.",
        variant: "destructive",
      });
      return;
    }
    updateNodeData(node.id, { isProcessing: true });
    try {
      const result = await assistedPromptComposition({
        initialPrompt: node.data.prompt,
        context: node.data.context
      });
      updateNodeData(node.id, { refinedPrompt: result.refinedPrompt, isProcessing: false });
    } catch (error) {
      console.error("Prompt refinement failed:", error);
      toast({
        title: "Refinement Failed",
        description: "Could not refine prompt. Please try again.",
        variant: "destructive",
      });
      updateNodeData(node.id, { isProcessing: false });
    }
  };

  return (
    <BaseNode 
      title="AI Prompt Tool" 
      Icon={MessageSquare} 
      nodeId={node.id} 
      position={node.position} 
      onMouseDown={onMouseDown} 
      onDelete={() => deleteNode(node.id)}
      startConnection={startConnection}
    >
      <div className="space-y-3">
        <Textarea
          placeholder="Initial prompt..."
          value={node.data.prompt || ''}
          onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <Textarea
          placeholder="Context (optional)..."
          value={node.data.context || ''}
          onChange={(e) => updateNodeData(node.id, { context: e.target.value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <Button onClick={handleRefine} disabled={node.data.isProcessing} className="w-full">
          {node.data.isProcessing ? <Loader2 className="animate-spin" /> : 'Refine Prompt'}
        </Button>
        {node.data.refinedPrompt && (
          <Textarea
            placeholder="Refined prompt appears here..."
            value={node.data.refinedPrompt}
            readOnly
            className="bg-muted"
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}
      </div>
    </BaseNode>
  );
}
