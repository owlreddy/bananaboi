import React from 'react';
import type { Connection } from '@/lib/visai-types';

interface ConnectionRendererProps {
  connections: Connection[];
  getNodePosition: (nodeId: string) => { x: number; y: number };
  drawingConnection: { fromNodeId: string; fromPosition: { x: number; y: number } } | null;
  mousePosition: { x: number; y: number };
}

export default function ConnectionRenderer({
  connections,
  getNodePosition,
  drawingConnection,
  mousePosition,
}: ConnectionRendererProps) {
  
  const getHandlePosition = (nodeId: string, handle: 'input' | 'output') => {
    const pos = getNodePosition(nodeId);
    // These offsets should match the BaseNode component's handle positions
    const NODE_WIDTH = 320; // Corresponds to w-80
    
    if (handle === 'input') {
      return { x: pos.x - NODE_WIDTH / 2, y: pos.y };
    } else {
      return { x: pos.x + NODE_WIDTH / 2, y: pos.y };
    }
  };

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      {connections.map(conn => {
        const fromPos = getHandlePosition(conn.fromNodeId, 'output');
        const toPos = getHandlePosition(conn.toNodeId, 'input');
        const path = `M${fromPos.x},${fromPos.y} C${fromPos.x + 50},${fromPos.y} ${toPos.x - 50},${toPos.y} ${toPos.x},${toPos.y}`;

        return <path key={conn.id} d={path} stroke="hsl(var(--primary))" strokeWidth="2" fill="none" />;
      })}
      {drawingConnection && (
        <path
          d={`M${drawingConnection.fromPosition.x},${drawingConnection.fromPosition.y} L${mousePosition.x},${mousePosition.y}`}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          strokeDasharray="5,5"
        />
      )}
    </svg>
  );
}
