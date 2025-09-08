import React, { useState, useEffect } from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Image as ImageIcon, Loader2, Edit, Shuffle, Download, Wand2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { generateInitialImageNode } from '@/ai/flows/generate-initial-image-node';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { getRandomItem } from '../node-editor';
import { editImage } from '@/ai/flows/edit-image';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const generatePrompts = [
  'A majestic lion with a nebula for a mane, standing on a cliff overlooking a galaxy.',
  'A serene Japanese zen garden on a floating island in the sky, with cherry blossoms drifting in the wind.',
  'An ancient, moss-covered library inside a giant, hollowed-out tree.',
  'A bustling cyberpunk market street at night, with neon signs reflected in the rain-soaked pavement.',
  'A crystal-clear underwater city inhabited by bioluminescent creatures.',
  'A portrait of a wise old wizard, his beard made of swirling stardust.',
  'A whimsical treehouse village connected by rope bridges, nestled in a redwood forest.',
  'An Art Deco-style robot butler serving tea in a luxurious, futuristic lounge.',
  'A dragon made entirely of stained glass, perched atop a Gothic cathedral.',
  'A lone astronaut playing a guitar on the surface of Mars, with Earth visible in the sky.',
  'A surreal landscape where the ground is a giant chessboard and the sky is filled with floating clocks.',
  'A secret garden at midnight, where all the flowers glow with a soft, magical light.',
  'A steampunk airship navigating through a storm of colorful, swirling clouds.',
  'An enchanted waterfall that flows upwards into the sky.',
  'A cozy, cluttered artist studio on a rainy day, filled with half-finished canvases.',
  'A miniature world inside a snow globe, with tiny people going about their day.',
  'A warrior queen riding a giant, armored polar bear into battle.',
  'A futuristic high-speed train weaving through a mountain range made of giant crystals.',
  'A village of mushroom houses lit from within, deep in a fantasy forest.',
  'An elegant ballroom dance between a ghost and a vampire.',
  'A colossal, ancient turtle carrying an entire ecosystem on its back.',
  'A quiet coffee shop in Paris, but the patrons are all famous painters from different eras.',
];

function EditImageDialog({
  imageDataUri,
  onEditSubmit,
}: {
  imageDataUri: string;
  onEditSubmit: (editPrompt: string) => Promise<void>;
}) {
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleApplyEdit = async () => {
    if (!editPrompt) {
      toast({
        title: 'Error',
        description: 'Please enter an edit prompt.',
        variant: 'destructive',
      });
      return;
    }
    setIsEditing(true);
    setIsOpen(false); 
    await onEditSubmit(editPrompt);
    setIsEditing(false);
    setEditPrompt('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 left-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Edit image"
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
          <DialogDescription>
            Describe the changes you want to make to the image.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border bg-muted/20">
            <Image src={imageDataUri} alt="Image to edit" layout="fill" objectFit="contain" />
          </div>
          <Input
            placeholder="e.g. make it a watercolor painting..."
            value={editPrompt}
            onChange={e => setEditPrompt(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleApplyEdit} disabled={isEditing}>
            {isEditing ? <Loader2 className="animate-spin" /> : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


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
  
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!node.data.imageDataUri) {
        toast({ title: "No image to download", variant: "destructive" });
        return;
    }
    const link = document.createElement('a');
    link.href = node.data.imageDataUri;
    link.download = `visai-generated-${node.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageEdit = async (editPrompt: string) => {
    updateNodeData(node.id, { isProcessing: true });
    try {
      const result = await editImage({
        imageDataUri: node.data.imageDataUri!,
        prompt: editPrompt,
      });
      updateNodeData(node.id, {
        imageDataUri: result.editedImageDataUri,
        isProcessing: false,
      });
    } catch (error) {
      console.error('Image editing failed:', error);
      toast({
        title: 'Editing Failed',
        description: 'Could not edit image. Please try again.',
        variant: 'destructive',
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
        {node.data.imageDataUri && (
           <div className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div className={cn("relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in bg-muted/20",
                   node.data.isProcessing && "opacity-50"
                )}>
                  <Image src={node.data.imageDataUri} alt={node.data.prompt || 'Generated image'} layout="fill" objectFit="contain" data-ai-hint="generated art" />
                   {node.data.isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-auto p-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>Generated Image</DialogTitle>
                  <DialogDescription>A larger view of the generated image. Prompt: {node.data.prompt}</DialogDescription>
                </DialogHeader>
                <Image src={node.data.imageDataUri} alt={node.data.prompt || 'Generated image'} width={1024} height={1024} className="rounded-md w-full h-auto" />
              </DialogContent>
            </Dialog>
            <EditImageDialog imageDataUri={node.data.imageDataUri} onEditSubmit={handleImageEdit} />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDownload}
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        )}

        {isEditing ? (
          <>
            <Textarea
              placeholder="Enter a prompt to generate an image..."
              value={node.data.prompt || ''}
              onChange={(e) => updateNodeData(node.id, { prompt: e.target.value })}
              className="text-sm"
              onMouseDown={(e) => e.stopPropagation()}
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
