import React from 'react';
import type { VisaiNode, Connection } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Combine, Download, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from '@/components/ui/textarea';
import { intelligentImageBlending } from '@/ai/flows/intelligent-image-blending';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';


interface OutputNodeProps {
  node: VisaiNode;
  nodes: VisaiNode[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
}

export default function OutputNode({ node, nodes, connections, onMouseDown, updateNodeData, deleteNode }: OutputNodeProps) {
  const { toast } = useToast();
  
  const handleDownload = () => {
    if (!node.data.imageDataUri) {
        toast({ title: "No image to download", variant: "destructive" });
        return;
    }
    const link = document.createElement('a');
    link.href = node.data.imageDataUri;
    link.download = 'visai-composition.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleBlend = async () => {
    const inputConnections = connections.filter(c => c.toNodeId === node.id);
    const imageNodes = inputConnections
      .map(c => nodes.find(n => n.id === c.fromNodeId))
      .filter((n): n is VisaiNode => !!(n && n.data.imageDataUri));


    if (imageNodes.length < 1) {
      toast({
        title: "Not enough inputs",
        description: "Connect at least one image node to blend.",
        variant: "destructive",
      });
      return;
    }
    
    updateNodeData(node.id, { isProcessing: true });
    try {
      const result = await intelligentImageBlending({
        imageNodes: imageNodes.map(n => ({
          imageDataUri: n!.data.imageDataUri!,
          prompt: n!.data.prompt! || 'user uploaded image'
        })),
        blendingInstructions: node.data.blendingInstructions || "Blend the images together seamlessly."
      });
      
      updateNodeData(node.id, { imageDataUri: result.compositeImage, isProcessing: false });
    } catch (error) {
       console.error("Image blending failed:", error);
      toast({
        title: "Blending Failed",
        description: "Could not blend images. Please try again.",
        variant: "destructive",
      });
      updateNodeData(node.id, { isProcessing: false });
    }
  };

  return (
    <BaseNode 
      title="Output" 
      Icon={Combine} 
      nodeId={node.id} 
      position={node.position} 
      onMouseDown={onMouseDown} 
      onDelete={() => deleteNode(node.id)}
      hasOutput={false}
    >
      <div className="space-y-3">
        <Textarea
            placeholder="Blending instructions..."
            value={node.data.blendingInstructions || ''}
            onChange={(e) => updateNodeData(node.id, { blendingInstructions: e.target.value })}
            className="h-24"
          />
         <Button onClick={handleBlend} disabled={node.data.isProcessing} className="w-full">
          {node.data.isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : (
            'Blend Inputs'
          )}
        </Button>

        {node.data.imageDataUri && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in">
                <Image src={node.data.imageDataUri} alt="Composite image" layout="fill" objectFit="cover" data-ai-hint="composite abstract"/>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-auto p-2">
              <Image src={node.data.imageDataUri} alt="Composite image" width={1024} height={1024} className="rounded-md w-full h-auto" />
            </DialogContent>
          </Dialog>
        )}

        <Button onClick={handleDownload} variant="outline" className="w-full" disabled={!node.data.imageDataUri}>
          <Download className="mr-2 h-4 w-4" />
          Download Image
        </Button>
      </div>
    </BaseNode>
  );
}
