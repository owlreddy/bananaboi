import React, { useRef, useState } from 'react';
import type { VisaiNode } from '@/lib/visai-types';
import BaseNode from './base-node';
import Image from 'next/image';
import { Upload, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { editImage } from '@/ai/flows/edit-image';
import { Input } from '@/components/ui/input';

function EditImageDialog({
  imageDataUri,
  onEdit,
}: {
  imageDataUri: string;
  onEdit: (editedImageDataUri: string) => void;
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
    try {
      const result = await editImage({ imageDataUri, prompt: editPrompt });
      onEdit(result.editedImageDataUri);
      setIsOpen(false);
    } catch (error) {
      console.error('Image editing failed:', error);
      toast({
        title: 'Editing Failed',
        description: 'Could not edit image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
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

  const handleImageEdit = (editedImageDataUri: string) => {
    updateNodeData(node.id, { imageDataUri: editedImageDataUri });
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
          <div className="relative group">
            <Dialog>
              <DialogTrigger asChild>
                <div className="relative aspect-video w-full rounded-md overflow-hidden border border-border cursor-zoom-in bg-muted/20">
                  <Image src={node.data.imageDataUri} alt="Uploaded image" layout="fill" objectFit="contain" data-ai-hint="uploaded background"/>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl h-auto p-2">
                <DialogHeader className="sr-only">
                  <DialogTitle>Uploaded Image</DialogTitle>
                  <DialogDescription>A larger view of the uploaded image.</DialogDescription>
                </DialogHeader>
                <Image src={node.data.imageDataUri} alt="Uploaded image" width={1024} height={1024} className="rounded-md w-full h-auto" />
              </DialogContent>
            </Dialog>
            <EditImageDialog imageDataUri={node.data.imageDataUri} onEdit={handleImageEdit} />
          </div>
        )}
      </div>
    </BaseNode>
  );
}
