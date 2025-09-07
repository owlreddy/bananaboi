import React, { useRef } from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface UploadImageNodeProps {
  node: VisaiNode;
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  startConnection: (fromNodeId: string, fromPosition: { x: number, y: number }) => void;
}

export default function UploadImageNode({ node, onMouseDown, updateNodeData, deleteNode, startConnection }: UploadImageNodeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateNodeData(node.id, { imageDataUri: result, prompt: file.name });
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read file.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <BaseNode 
      title="Upload Image" 
      Icon={Upload} 
      nodeId={node.id} 
      position={node.position} 
      onMouseDown={onMouseDown} 
      onDelete={() => deleteNode(node.id)}
      startConnection={startConnection}
      hasInput={false}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      <div className="space-y-3">
        <Button onClick={handleButtonClick} variant="outline" className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Choose an image
        </Button>
        {node.data.imageDataUri && (
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in">
                <Image src={node.data.imageDataUri} alt="Uploaded image" layout="fill" objectFit="cover" data-ai-hint="uploaded background"/>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-auto p-2">
              <Image src={node.data.imageDataUri} alt="Uploaded image" width={1024} height={1024} className="rounded-md w-full h-auto" />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </BaseNode>
  );
}
