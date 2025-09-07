import React from 'react';
import type { VisaiNode, Connection } from '@/lib/visai-types';
import BaseNode from './base-node';
import { Button } from '@/components/ui/button';
import { Combine, Download, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface OutputNodeProps {
  node: VisaiNode;
  nodes: VisaiNode[];
  connections: Connection[];
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
}

export default function OutputNode({ node, nodes, connections, onMouseDown, updateNodeData }: OutputNodeProps) {
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
  
  // Placeholder for blend functionality
  const handleBlend = async () => {
    toast({
      title: "Coming Soon!",
      description: "Image blending functionality is not yet implemented.",
    });
  }

  return (
    <BaseNode title="Output" Icon={Combine} nodeId={node.id} position={node.position} onMouseDown={onMouseDown}>
      <div className="space-y-3">
         <Button onClick={handleBlend} disabled={node.data.isProcessing} className="w-full">
          {node.data.isProcessing ? (
            <Loader2 className="animate-spin" />
          ) : (
            'Blend Inputs (Coming Soon)'
          )}
        </Button>

        {node.data.imageDataUri && (
          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border">
            <Image src={node.data.imageDataUri} alt="Composite image" layout="fill" objectFit="cover" data-ai-hint="composite abstract"/>
          </div>
        )}

        <Button onClick={handleDownload} variant="outline" className="w-full" disabled={!node.data.imageDataUri}>
          <Download className="mr-2 h-4 w-4" />
          Download Image
        </Button>
      </div>
    </BaseNode>
  );
}
