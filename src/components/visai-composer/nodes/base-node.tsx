import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BaseNodeProps {
  title: string;
  Icon: LucideIcon;
  nodeId: string;
  position: { x: number; y: number };
  onMouseDown: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export default function BaseNode({ title, Icon, nodeId, position, onMouseDown, children, className }: BaseNodeProps) {
  return (
    <div
      id={`node-${nodeId}`}
      className="absolute w-80"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(0, 0)',
      }}
    >
      <Card className={cn("bg-card shadow-lg border border-border rounded-lg", className)}>
        <CardHeader
          onMouseDown={onMouseDown}
          className="flex flex-row items-center space-y-0 p-3 cursor-move bg-muted/50 rounded-t-lg"
        >
          <Icon className="w-5 h-5 mr-2 text-primary" />
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
