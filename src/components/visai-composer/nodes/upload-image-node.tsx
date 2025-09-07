import React, { useRef } from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface UploadImageNodeProps {
  node: VisaiNode;
  onMouseDown: (e: React.MouseEvent) => void;
  updateNodeData: (nodeId: string, data: Partial<VisaiNode['data']>) => void;
}

export default function UploadImageNode({ node, onMouseDown, updateNodeData }: UploadImageNodeProps) {
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
    <BaseNode title="Upload Image" Icon={Upload} nodeId={node.id} position={node.position} onMouseDown={onMouseDown}>
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
          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border">
            <Image src={node.data.imageDataUri} alt="Uploaded image" layout="fill" objectFit="cover" data-ai-hint="uploaded background"/>
          </div>
        )}
      </div>
    </BaseNode>
  );
}
