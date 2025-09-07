"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { VisaiNode, Connection, NodeType } from '@/lib/visai-types';
import Toolbar from './toolbar';
import NodeRenderer from './node-renderer';
import ConnectionRenderer from './connection-renderer';
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
  const [drawingConnection, setDrawingConnection] = useState<{ fromNodeId: string; fromPosition: { x: number; y: number } } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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

  const deleteNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
  }, []);

  const startConnection = (fromNodeId: string, fromPosition: { x: number; y: number }) => {
    setDrawingConnection({ fromNodeId, fromPosition });
  };
  
  const endConnection = (toNodeId: string) => {
    if (drawingConnection && drawingConnection.fromNodeId !== toNodeId) {
      // Prevent duplicate connections
      const alreadyExists = connections.some(c => c.fromNodeId === drawingConnection.fromNodeId && c.toNodeId === toNodeId);
      if (alreadyExists) {
        toast({ title: "Connection already exists.", variant: "destructive" });
        return;
      }
      const newConnection: Connection = {
        id: `${drawingConnection.fromNodeId}-${toNodeId}`,
        fromNodeId: drawingConnection.fromNodeId,
        toNodeId: toNodeId,
      };
      setConnections(prev => [...prev, newConnection]);
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });

      if (draggingNodeId) {
        setNodes(produce(draft => {
          const node = draft.find(n => n.id === draggingNodeId);
          if (node) {
            node.position.x += e.movementX;
            node.position.y += e.movementY;
          }
        }));
      } else if (drawingConnection) {
        // This just re-renders to update the temporary connection line
      }
    }
  }, [draggingNodeId, drawingConnection]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const nodeElement = target.closest('[data-node-id]');
    
    if (drawingConnection && nodeElement) {
      const toNodeId = nodeElement.getAttribute('data-node-id');
      if (toNodeId) {
        endConnection(toNodeId);
      }
    }

    setDraggingNodeId(null);
    setDrawingConnection(null);
  }, [drawingConnection]);
  
  useEffect(() => {
    const currentEditorRef = editorRef.current;
    if (currentEditorRef) {
      currentEditorRef.addEventListener('mousemove', handleMouseMove);
      currentEditorRef.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (currentEditorRef) {
        currentEditorRef.removeEventListener('mousemove', handleMouseMove);
        currentEditorRef.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const getNodePosition = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
  }

  return (
    <div ref={editorRef} className="w-full h-full relative overflow-hidden bg-dots">
      <style jsx>{`
        .bg-dots {
          background-image: radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
      <Toolbar onAddNode={addNode} />
      <ConnectionRenderer 
        connections={connections}
        getNodePosition={getNodePosition}
        drawingConnection={drawingConnection}
        mousePosition={mousePosition}
      />
      {nodes.map(node => (
        <NodeRenderer
          key={node.id}
          node={node}
          nodes={nodes}
          connections={connections}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          updateNodeData={updateNodeData}
          deleteNode={deleteNode}
          startConnection={startConnection}
        />
      ))}
    </div>
  );
}