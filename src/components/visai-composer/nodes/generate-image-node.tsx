
import React, { useState, useEffect } from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Image as ImageIcon, Loader2, Edit, Shuffle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateInitialImageNode } from '@/ai/flows/generate-initial-image-node';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { getRandomItem } from '../node-editor';

const generatePrompts = [
  'A mystical forest at twilight',
  'A futuristic cityscape on a distant planet',
  'An abstract painting representing the sound of jazz',
  'A lone astronaut discovering a glowing alien artifact',
  'A steampunk-inspired mechanical owl with intricate gears',
];

interface GenerateImageNodeProps {
  node: VisaiNode;
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  startConnection: (fromNodeId: string, fromPosition: { x: number, y: number }) => void;
}

export default function GenerateImageNode({ node, onMouseDown, updateNodeData, deleteNode, startConnection }: GenerateImageNodeProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!node.data.imageDataUri);

  useEffect(() => {
    // If an image is generated or removed, update the editing state
    setIsEditing(!node.data.imageDataUri);
  }, [node.data.imageDataUri]);
  
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

  const handleRandomize = () => {
    updateNodeData(node.id, { prompt: getRandomItem(generatePrompts) });
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
        {node.data.imageDataUri && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in">
                <Image src={node.data.imageDataUri} alt={node.data.prompt || 'Generated image'} layout="fill" objectFit="cover" data-ai-hint="generated art" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-auto p-2">
                <Image src={node.data.imageDataUri} alt={node.data.prompt || 'Generated image'} width={1024} height={1024} className="rounded-md w-full h-auto" />
            </DialogContent>
          </Dialog>
        )}

        {isEditing ? (
          <>
            <Textarea
              placeholder="Enter a prompt to generate an image..."
              value={node.data.prompt || ''}
              onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={node.data.isProcessing} className="w-full">
                {node.data.isProcessing ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  'Generate'
                )}
              </Button>
              <Button onClick={handleRandomize} variant="outline" size="icon" aria-label="Randomize prompt">
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
            <Edit className="mr-2 h-4 w-4" />
            Modify
          </Button>
        )}
      </div>
    </BaseNode>
  );
}
