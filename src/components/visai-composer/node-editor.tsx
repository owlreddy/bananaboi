
"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { VisaiNode, Connection, NodeType } from '@/lib/visai-types';
import Toolbar from './toolbar';
import NodeRenderer from './node-renderer';
import ConnectionRenderer from './connection-renderer';
import { produce } from 'immer';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

const generatePrompts = [
  'A majestic lion with a nebula for a mane, standing on a cliff overlooking a galaxy.',
  'A serene Japanese zen garden on a floating island in the sky, with cherry blossoms drifting in the wind.',
  'An ancient, moss-covered library inside a giant, hollowed-out tree.',
  'A bustling cyberpunk market street at night, with neon signs reflected in the rain-soaked pavement.',
  'A crystal-clear underwater city inhabited by bioluminescent creatures.',
  'A portrait of a wise old wizard, his beard made of swirling stardust.',
  'A whimsical treehouse village connected by rope bridges, nestled in a redwood forest.',
  'An Art Deco-style robot butler serving tea in a luxurious, futuristic lounge.',
  'A dragon made entirely of stained glass, perched atop a Gothic cathedral.',
  'A lone astronaut playing a guitar on the surface of Mars, with Earth visible in the sky.',
  'A surreal landscape where the ground is a giant chessboard and the sky is filled with floating clocks.',
  'A secret garden at midnight, where all the flowers glow with a soft, magical light.',
  'A steampunk airship navigating through a storm of colorful, swirling clouds.',
  'An enchanted waterfall that flows upwards into the sky.',
  'A cozy, cluttered artist studio on a rainy day, filled with half-finished canvases.',
  'A miniature world inside a snow globe, with tiny people going about their day.',
  'A warrior queen riding a giant, armored polar bear into battle.',
  'A futuristic high-speed train weaving through a mountain range made of giant crystals.',
  'A village of mushroom houses lit from within, deep in a fantasy forest.',
  'An elegant ballroom dance between a ghost and a vampire.',
  'A colossal, ancient turtle carrying an entire ecosystem on its back.',
  'A quiet coffee shop in Paris, but the patrons are all famous painters from different eras.',
];

const blendInstructions = [
  'Blend the images into a surreal, dreamlike collage.',
  'Use the style of the first image and the subject of the second.',
  'Merge the inputs into a single, cohesive cyberpunk scene.',
  'Create a high-contrast, black and white composition from the inputs.',
  'Blend the images as if they were part of a double exposure photograph.',
  'Overlay the images with a watercolor texture.',
  'Combine the elements into a vintage travel poster.',
  'Merge the images into a pop-art style comic book panel.',
  'Create a fantasy landscape by combining the features of both images.',
  'Blend the images with a glitch art effect.',
  'Imagine the images are from the same sci-fi movie and combine them.',
  'Create a photorealistic composite of the two scenes.',
  'Turn the inputs into a single piece of abstract art.',
  'Fuse the images together with light leaks and lens flares.',
  'Reimagine the scene as an oil painting, combining elements from both images.',
  'Create a minimalist composition using only the key elements from each image.',
  'Blend the images with a gritty, dystopian atmosphere.',
  'Merge the inputs into a serene and peaceful nature scene.',
  'Combine the images in the style of a faded, old photograph.',
  'Create a whimsical and magical scene by merging the two inputs.',
];

export const getRandomItem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const getInitialNodes = (): VisaiNode[] => [
  { id: '1', type: 'generate', position: { x: 300, y: 250 }, data: { prompt: getRandomItem(generatePrompts) } },
  { id: '2', type: 'upload', position: { x: 300, y: 500 }, data: {} },
  { id: '3', type: 'output', position: { x: 800, y: 375 }, data: { blendingInstructions: getRandomItem(blendInstructions) } },
];

export default function NodeEditor() {
  const [nodes, setNodes] = useState<VisaiNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [drawingConnection, setDrawingConnection] = useState<{ fromNodeId: string; fromPosition: { x: number; y: number } } | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [viewTransform, setViewTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setNodes(getInitialNodes());
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<VisaiNode['data']>) => {
    setNodes(produce(draft => {
      const node = draft.find(n => n.id === nodeId);
      if (node) {
        Object.assign(node.data, data);
      }
    }));
  }, []);

  const addNode = useCallback((type: NodeType) => {
    // Get the center of the current view
    if (!editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const viewCenterX = (rect.width / 2 - viewTransform.x) / viewTransform.scale;
    const viewCenterY = (rect.height / 2 - viewTransform.y) / viewTransform.scale;


    const newNode: VisaiNode = {
      id: Date.now().toString(),
      type: type,
      position: { x: viewCenterX, y: viewCenterY },
      data: type === 'generate' ? { prompt: getRandomItem(generatePrompts) } : 
            type === 'output' ? { blendingInstructions: getRandomItem(blendInstructions) } : {},
    };
    setNodes(produce(draft => {
      draft.push(newNode);
    }));
  }, [viewTransform]);

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
    if (e.button === 0) { // Primary (left) mouse button
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

  useEffect(() => {
    if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      const initialX = (rect.width - 800 * 1) / 2; // Center the group horizontally
      const initialY = (rect.height - 600 * 1) / 2; // Center the group vertically
      setViewTransform(v => ({...v, x: initialX, y: initialY}));
    }
  }, []);

  return (
    <div 
      ref={editorRef} 
      className={cn(
        "w-full h-full relative overflow-hidden bg-dots cursor-grab",
        (draggingNodeId || drawingConnection || isPanning) && "select-none"
      )}
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
