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
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
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

  const addNode = useCallback(() => {
    const newNode: VisaiNode = {
      id: Date.now().toString(),
      type: 'generate',
      position: { x: 250, y: 150 },
      data: { prompt: 'New prompt' },
    };
    setNodes(produce(draft => {
      draft.push(newNode);
    }));
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
    // Left click only for node dragging
    if (e.button !== 0) return;
    e.stopPropagation();
    setDraggingNodeId(nodeId);
  };
  
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    // Middle or Right click for panning
    if (e.button === 1 || e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const worldX = (clientX - rect.left - viewTransform.x) / viewTransform.scale;
      const worldY = (clientY - rect.top - viewTransform.y) / viewTransform.scale;
      
      setMousePosition({ x: worldX, y: worldY });

      if (isPanning) {
        setViewTransform(prev => ({
          ...prev,
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }

      if (draggingNodeId) {
        setNodes(produce(draft => {
          const node = draft.find(n => n.id === draggingNodeId);
          if (node) {
            node.position.x += e.movementX / viewTransform.scale;
            node.position.y += e.movementY / viewTransform.scale;
          }
        }));
      }
    }
  }, [draggingNodeId, isPanning, viewTransform.scale, viewTransform.x, viewTransform.y]);

  const handleMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
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
    setIsPanning(false);
  }, [drawingConnection]);
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newScale = e.deltaY > 0 ? viewTransform.scale / zoomFactor : viewTransform.scale * zoomFactor;
    const clampedScale = Math.max(0.2, Math.min(newScale, 2));

    const rect = editorRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - viewTransform.x) * (clampedScale / viewTransform.scale);
    const newY = mouseY - (mouseY - viewTransform.y) * (clampedScale / viewTransform.scale);

    setViewTransform({
      scale: clampedScale,
      x: newX,
      y: newY,
    });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = (e: MouseEvent) => handleMouseUp(e);
    
    if (draggingNodeId || isPanning || drawingConnection) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggingNodeId, isPanning, drawingConnection, handleMouseMove, handleMouseUp]);

  const getNodePosition = (nodeId: string) => {
    return nodes.find(n => n.id === nodeId)?.position || { x: 0, y: 0 };
  }

  return (
    <div 
      ref={editorRef} 
      className="w-full h-full relative overflow-hidden bg-dots cursor-grab"
      onMouseDown={handleEditorMouseDown}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click pan
    >
      <style jsx>{`
        .bg-dots {
          background-image: radial-gradient(circle at 1px 1px, hsl(var(--border)) 1px, transparent 0);
          background-size: ${20 * viewTransform.scale}px ${20 * viewTransform.scale}px;
          background-position: ${viewTransform.x}px ${viewTransform.y}px;
        }
        .cursor-grab {
          cursor: ${isPanning ? 'grabbing' : 'grab'};
        }
      `}</style>
      <Toolbar onAddNode={addNode} />
      
      <div 
        className="w-full h-full absolute top-0 left-0"
        style={{
          transform: `translate(${viewTransform.x}px, ${viewTransform.y}px) scale(${viewTransform.scale})`,
          transformOrigin: '0 0',
        }}
      >
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
    </div>
  );
}
