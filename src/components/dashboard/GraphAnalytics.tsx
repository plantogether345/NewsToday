'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';

interface GraphNode {
  id: string;
  label: string;
  type: string;
  size: number;
  color: string;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label?: string;
}

interface GraphAnalyticsProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  title?: string;
}

export function GraphAnalytics({ nodes, edges, title }: GraphAnalyticsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const draggedNodeRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Clean up previous instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
      sigmaRef.current = null;
    }

    const graph = new Graph();
    graphRef.current = graph;

    // Add nodes
    nodes.forEach((node) => {
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.label,
          size: node.size,
          color: node.color,
          x: Math.random() * 100,
          y: Math.random() * 100,
          type: node.type,
          originalColor: node.color,
        });
      }
    });

    // Add edges
    edges.forEach((edge, i) => {
      if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
        try {
          graph.addEdge(edge.source, edge.target, {
            size: Math.max(1, edge.weight),
            color: 'rgba(255, 255, 255, 0.08)',
            label: edge.label || '',
            weight: edge.weight,
          });
        } catch {
          // Skip duplicate edges
        }
      }
    });

    // Apply circular layout first
    circular.assign(graph);

    // Then apply force-directed layout
    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, {
      iterations: 100,
      settings: {
        ...settings,
        gravity: 1,
        scalingRatio: 5,
      },
    });

    // Create Sigma instance
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelColor: { color: 'rgba(255, 255, 255, 0.7)' },
      labelFont: 'Inter, sans-serif',
      labelSize: 11,
      labelWeight: '500',
      defaultEdgeColor: 'rgba(255, 255, 255, 0.06)',
      defaultNodeColor: '#6366f1',
      edgeLabelFont: 'Inter, sans-serif',
      edgeLabelSize: 9,
      stagePadding: 30,
      nodeReducer: (node: string, data: any) => {
        const res = { ...data };
        if (hoveredNode && hoveredNode !== node && !graph.hasEdge(hoveredNode, node) && !graph.hasEdge(node, hoveredNode)) {
          res.color = 'rgba(255, 255, 255, 0.05)';
          res.label = '';
        }
        if (selectedNode && selectedNode.id === node) {
          res.highlighted = true;
          res.color = '#a78bfa';
        }
        return res;
      },
      edgeReducer: (edge: string, data: any) => {
        const res = { ...data };
        if (hoveredNode) {
          const source = graph.source(edge);
          const target = graph.target(edge);
          if (source !== hoveredNode && target !== hoveredNode) {
            res.hidden = true;
          } else {
            res.color = 'rgba(255, 255, 255, 0.2)';
          }
        }
        return res;
      },
    });

    sigmaRef.current = sigma;

    // Node dragging - only the clicked node, not the whole graph
    let draggedNode: string | null = null;

    sigma.on('downNode', (e) => {
      draggedNode = e.node;
      draggedNodeRef.current = e.node;
      isDraggingRef.current = true;
      graph.setNodeAttribute(e.node, 'highlighted', true);
      // Disable camera dragging when dragging a node
      sigma.getCamera().disable();
    });

    sigma.getMouseCaptor().on('mousemovebody', (e) => {
      if (!isDraggingRef.current || !draggedNode) return;

      // Get new position from Sigma viewport coordinates
      const pos = sigma.viewportToGraph(e);
      graph.setNodeAttribute(draggedNode, 'x', pos.x);
      graph.setNodeAttribute(draggedNode, 'y', pos.y);
    });

    sigma.getMouseCaptor().on('mouseup', () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, 'highlighted');
      }
      draggedNode = null;
      draggedNodeRef.current = null;
      isDraggingRef.current = false;
      sigma.getCamera().enable();
    });

    // Click node - show info
    sigma.on('clickNode', (e) => {
      if (!isDraggingRef.current) {
        const attrs = graph.getNodeAttributes(e.node);
        setSelectedNode({
          id: e.node,
          label: attrs.label,
          type: attrs.type,
          size: attrs.size,
          color: attrs.originalColor || attrs.color,
        });
      }
    });

    // Hover effects
    sigma.on('enterNode', (e) => {
      setHoveredNode(e.node);
      containerRef.current!.style.cursor = 'grab';
    });

    sigma.on('leaveNode', () => {
      setHoveredNode(null);
      containerRef.current!.style.cursor = 'default';
    });

    // Click stage - deselect
    sigma.on('clickStage', () => {
      setSelectedNode(null);
    });

    return () => {
      sigma.kill();
    };
  }, [nodes, edges]);

  // Re-render when hover/selection changes
  useEffect(() => {
    if (sigmaRef.current) {
      sigmaRef.current.refresh();
    }
  }, [hoveredNode, selectedNode]);

  if (nodes.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-white/30 text-xs font-medium">No graph data available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {title && (
        <div className="mb-3">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium">{title}</h3>
          <p className="text-[10px] text-white/30 mt-1">Drag individual nodes to rearrange. Click to inspect.</p>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-[450px] rounded-lg border border-white/5 bg-black/20 overflow-hidden"
        style={{ cursor: 'default' }}
      />

      {/* Node info panel */}
      {selectedNode && (
        <div className="absolute top-4 right-4 glass-card rounded-lg p-4 max-w-[220px] z-20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
            <span className="text-xs font-medium text-white/90">{selectedNode.label}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">Type</span>
              <span className="text-white/70 capitalize">{selectedNode.type}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">Weight</span>
              <span className="text-white/70">{selectedNode.size}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span className="text-white/40">ID</span>
              <span className="text-white/70 truncate ml-2">{selectedNode.id}</span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-3 text-[10px] text-white/40 hover:text-white/70 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {Array.from(new Set(nodes.map((n) => n.type))).map((type) => {
          const nodeOfType = nodes.find((n) => n.type === type);
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeOfType?.color || '#6366f1' }} />
              <span className="text-[10px] text-white/40 capitalize">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
