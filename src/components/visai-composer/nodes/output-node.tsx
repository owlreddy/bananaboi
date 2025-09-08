import React, { useState, useEffect } from 'react';
import type { VisaiNode, Connection } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Combine, Download, Loader2, Edit, RefreshCw, AlertTriangle } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(!node.data.imageDataUri);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setIsEditing(!node.data.imageDataUri);
  }, [node.data.imageDataUri]);
  
  useEffect(() => {
    if (!node.data.imageDataUri || !node.data.inputStates) {
      setIsDirty(false);
      return;
    }

    const inputConnections = connections.filter(c => c.toNodeId === node.id);
    const currentInputNodes = inputConnections
      .map(c => nodes.find(n => n.id === c.fromNodeId))
      .filter((n): n is VisaiNode => !!n);
      
    // Check if any connected node's image has changed
    const hasChanged = currentInputNodes.some(inputNode => {
      const savedState = node.data.inputStates?.[inputNode.id];
      const currentState = inputNode.data.imageDataUri;
      return savedState !== currentState;
    });

    // Check if a connection was removed
    const removedConnection = Object.keys(node.data.inputStates).some(savedNodeId => 
      !currentInputNodes.find(n => n.id === savedNodeId)
    );

    setIsDirty(hasChanged || removedConnection);
  }, [nodes, connections, node.data.imageDataUri, node.data.inputStates, node.id]);
  
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
      
      const inputStates = imageNodes.reduce((acc, n) => {
        acc[n.id] = n.data.imageDataUri;
        return acc;
      }, {} as { [nodeId: string]: string | undefined });

      updateNodeData(node.id, { imageDataUri: result.compositeImage, isProcessing: false, inputStates });
      setIsDirty(false);

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
        {node.data.imageDataUri && (
          <div>
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in group">
                  <Image src={node.data.imageDataUri} alt="Composite image" layout="fill" objectFit="cover" data-ai-hint="composite abstract"/>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-auto p-2">
                <Image src={node.data.imageDataUri} alt="Composite image" width={1024} height={1024} className="rounded-md w-full h-auto" />
              </DialogContent>
            </Dialog>
            {isDirty && (
              <div className="mt-2 text-xs text-center text-amber-600 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Inputs have changed.</span>
              </div>
            )}
          </div>
        )}

        {isEditing ? (
            <>
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
            </>
        ) : (
            isDirty ? (
                <Button onClick={handleBlend} disabled={node.data.isProcessing} className="w-full">
                    {node.data.isProcessing ? <Loader2 className="animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Regenerate
                </Button>
            ) : (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Modify
                </Button>
            )
        )}

        {node.data.imageDataUri && (
          <Button onClick={handleDownload} variant="outline" className="w-full" disabled={isDirty}>
            <Download className="mr-2 h-4 w-4" />
            Download Image
          </Button>
        )}
      </div>
    </BaseNode>
  );
}
