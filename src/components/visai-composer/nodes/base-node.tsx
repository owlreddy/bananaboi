import React, { useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BaseNodeProps {
  title: string;
  Icon: LucideIcon;
  nodeId: string;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  startConnection?: (fromNodeId: string, fromPosition: { x: number; y: number }) => void;
  children: React.ReactNode;
  className?: string;
  hasInput?: boolean;
  hasOutput?: boolean;
}

export default function BaseNode({ 
  title, 
  Icon, 
  nodeId, 
  position, 
  onMouseDown,
  onDelete,
  startConnection, 
  children, 
  className,
  hasInput = true,
  hasOutput = true,
}: BaseNodeProps) {
  const outputRef = useRef<HTMLDivElement>(null);
  
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (startConnection && outputRef.current) {
      const rect = outputRef.current.getBoundingClientRect();
      const editorRect = (e.currentTarget as HTMLElement).closest('.relative.overflow-hidden')!.getBoundingClientRect();
      const fromPosition = {
        x: (rect.left - editorRect.left) + rect.width / 2,
        y: (rect.top - editorRect.top) + rect.height / 2,
      };
      startConnection(nodeId, fromPosition);
    }
  };

  return (
    <div
      id={`node-${nodeId}`}
      data-node-id={nodeId}
      className="absolute w-80"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Card className={cn("bg-card shadow-lg border border-border rounded-lg relative", className)}>
        {hasInput && (
          <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-2 border-card" />
        )}
        {hasOutput && (
          <div 
            ref={outputRef}
            onMouseDown={handleStartConnection}
            className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 bg-primary rounded-full border-2 border-card cursor-pointer" 
          />
        )}
        <CardHeader
          onMouseDown={onMouseDown}
          className="flex flex-row items-center justify-between space-y-0 p-3 cursor-move bg-muted/50 rounded-t-lg"
        >
          <div className="flex items-center">
            <Icon className="w-5 h-5 mr-2 text-primary" />
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6" onClick={onDelete}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
