"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { VisaiNode, Connection, NodeType } from '@/lib/visai-types';
import Toolbar from './toolbar';
import NodeRenderer from './node-renderer';
import { produce } from 'immer';
import { useToast } from "@/hooks/use-toast";

const INITIAL_NODES: VisaiNode[] = [
  { id: '1', type: 'generate', position: { x: 100, y: 150 }, data: { prompt: 'A mystical forest at twilight' } },
  { id: '2', type: 'upload', position: { x: 100, y: 400 }, data: {} },
  { id: '3', type: 'output', position: { x: 600, y: 275 }, data: { blendingInstructions: 'Blend the two images seamlessly.' } },
];

export default function NodeEditor() {
  const [nodes, setNodes] = useState<VisaiNode[]>(INITIAL_NODES);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const updateNodeData = useCallback((nodeId: string, data: Partial<VisaiNode['data']>) => {
    setNodes(produce(draft => {
      const node = draft.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node.data, data);
      }
    }));
  }, []);

  const addNode = useCallback((type: NodeType) => {
    const newNode: VisaiNode = {
      id: Date.now().toString(),
      type,
      position: { x: 250, y: 150 },
      data: type === 'prompt' ? { prompt: '', context: '' } : {},
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNodeId && editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      setNodes(produce(draft => {
        const node = draft.find(n => n.id === draggingNodeId);
        if (node) {
          node.position.x += e.movementX;
          node.position.y += e.movementY;
        }
      }));
    }
  }, [draggingNodeId]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
  }, []);
  
  useEffect(() => {
    if (draggingNodeId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, handleMouseMove, handleMouseUp]);


  return (
    <div ref={editorRef} className="w-full h-full relative overflow-hidden bg-dots">
      <style jsx>{`
        .bg-dots {
          background-image: radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
      <Toolbar onAddNode={addNode} />
      {nodes.map(node => (
        <NodeRenderer
          key={node.id}
          node={node}
          nodes={nodes}
          connections={connections}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          updateNodeData={updateNodeData}
        />
      ))}
    </div>
  );
}
