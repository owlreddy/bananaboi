import React from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateInitialImageNode } from '@/ai/flows/generate-initial-image-node';

interface GenerateImageNodeProps {
  node: VisaiNode;
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  startConnection: (fromNodeId: string, fromPosition: { x: number, y: number }) => void;
}

export default function GenerateImageNode({ node, onMouseDown, updateNodeData, deleteNode, startConnection }: GenerateImageNodeProps) {
  const { toast } = useToast();
  
  const handleGenerate = async () => {
    if (!node.data.prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt.",
        variant: "destructive",
      });
      return;
    }
    updateNodeData(node.id, { isProcessing: true });
    try {
      const result = await generateInitialImageNode({ prompt: node.data.prompt });
      updateNodeData(node.id, { imageDataUri: result.imageDataUri, isProcessing: false });
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive",
      });
      updateNodeData(node.id, { isProcessing: false });
    }
  };

  return (
    <BaseNode 
      title="Generate Image" 
      Icon={ImageIcon} 
      nodeId={node.id} 
      position={node.position} 
      onMouseDown={onMouseDown} 
      onDelete={() => deleteNode(node.id)}
      startConnection={startConnection}
      hasInput={false}
    >
      <div className="space-y-3">
        <Textarea
          placeholder="Enter a prompt to generate an image..."
          value={node.data.prompt || ''}
          onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
          className="text-sm"
        />
        <Button onClick={handleGenerate} disabled={node.data.isProcessing} className="w-full">
          {node.data.isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : (
            'Generate'
          )}
        </Button>
        {node.data.imageDataUri && (
          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border">
            <Image src={node.data.imageDataUri} alt={node.data.prompt || 'Generated image'} layout="fill" objectFit="cover" data-ai-hint="generated art" />
          </div>
        )}
      </div>
    </BaseNode>
  );
}
