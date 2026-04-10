'use client';

import { useEffect, useRef, useState } from 'react';

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

// Canvas-based graph renderer (no external deps that need window at import)
export function GraphAnalytics({ nodes, edges, title }: GraphAnalyticsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<{ nodeId: string | null; offsetX: number; offsetY: number }>({ nodeId: null, offsetX: 0, offsetY: 0 });
  const animFrameRef = useRef<number>(0);

  // Generate demo data if no real data
  const effectiveNodes = nodes.length > 0 ? nodes : generateDemoNodes();
  const effectiveEdges = edges.length > 0 ? edges : generateDemoEdges(effectiveNodes);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Initialize positions using force-directed layout
    if (Object.keys(positionsRef.current).length === 0 || nodes.length !== Object.keys(positionsRef.current).length) {
      const positions: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
      
      effectiveNodes.forEach((node, i) => {
        const angle = (2 * Math.PI * i) / effectiveNodes.length;
        const radius = Math.min(width, height) * 0.3;
        positions[node.id] = {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        };
      });

      // Run simple force simulation
      for (let iter = 0; iter < 200; iter++) {
        // Repulsion between all nodes
        for (let i = 0; i < effectiveNodes.length; i++) {
          for (let j = i + 1; j < effectiveNodes.length; j++) {
            const a = positions[effectiveNodes[i].id];
            const b = positions[effectiveNodes[j].id];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
            const force = 2000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }

        // Attraction along edges
        effectiveEdges.forEach((edge) => {
          const a = positions[edge.source];
          const b = positions[edge.target];
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          const force = (dist - 100) * 0.01;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        });

        // Center gravity
        effectiveNodes.forEach((node) => {
          const pos = positions[node.id];
          pos.vx += (width / 2 - pos.x) * 0.001;
          pos.vy += (height / 2 - pos.y) * 0.001;
        });

        // Apply velocities with damping
        effectiveNodes.forEach((node) => {
          const pos = positions[node.id];
          pos.vx *= 0.9;
          pos.vy *= 0.9;
          pos.x += pos.vx;
          pos.y += pos.vy;
          // Keep in bounds
          pos.x = Math.max(40, Math.min(width - 40, pos.x));
          pos.y = Math.max(40, Math.min(height - 40, pos.y));
        });
      }

      // Store final positions
      const finalPositions: Record<string, { x: number; y: number }> = {};
      effectiveNodes.forEach((node) => {
        finalPositions[node.id] = { x: positions[node.id].x, y: positions[node.id].y };
      });
      positionsRef.current = finalPositions;
    }

    // Draw function
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw edges
      effectiveEdges.forEach((edge) => {
        const from = positionsRef.current[edge.source];
        const to = positionsRef.current[edge.target];
        if (!from || !to) return;

        const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = isHighlighted ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      });

      // Draw nodes
      effectiveNodes.forEach((node) => {
        const pos = positionsRef.current[node.id];
        if (!pos) return;

        const isHovered = hoveredNode === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isDimmed = hoveredNode && !isHovered && 
          !effectiveEdges.some(e => 
            (e.source === hoveredNode && e.target === node.id) || 
            (e.target === hoveredNode && e.source === node.id)
          );

        const radius = (node.size || 8) * (isHovered ? 1.3 : 1);
        
        // Glow
        if (isHovered || isSelected) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${node.color}30`;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.05)' : node.color;
        ctx.fill();
        ctx.strokeStyle = isDimmed ? 'rgba(255, 255, 255, 0.03)' : `${node.color}80`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        if (!isDimmed) {
          ctx.font = '500 10px Inter, sans-serif';
          ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.6)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label.slice(0, 18), pos.x, pos.y + radius + 14);
        }
      });

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Mouse events
    const getNodeAt = (mx: number, my: number): GraphNode | null => {
      for (let i = effectiveNodes.length - 1; i >= 0; i--) {
        const node = effectiveNodes[i];
        const pos = positionsRef.current[node.id];
        if (!pos) continue;
        const dx = mx - pos.x;
        const dy = my - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= (node.size || 8) + 4) return node;
      }
      return null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (dragRef.current.nodeId) {
        positionsRef.current[dragRef.current.nodeId] = {
          x: mx - dragRef.current.offsetX,
          y: my - dragRef.current.offsetY,
        };
        canvas.style.cursor = 'grabbing';
        return;
      }

      const node = getNodeAt(mx, my);
      setHoveredNode(node?.id || null);
      canvas.style.cursor = node ? 'grab' : 'default';
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const node = getNodeAt(mx, my);
      
      if (node) {
        const pos = positionsRef.current[node.id];
        dragRef.current = {
          nodeId: node.id,
          offsetX: mx - pos.x,
          offsetY: my - pos.y,
        };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragRef.current.nodeId) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const node = getNodeAt(mx, my);
        if (node) {
          setSelectedNode(node);
        } else {
          setSelectedNode(null);
        }
      }
      dragRef.current = { nodeId: null, offsetX: 0, offsetY: 0 };
      canvas.style.cursor = 'default';
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [effectiveNodes, effectiveEdges, hoveredNode, selectedNode]);

  return (
    <div className="relative">
      {title && (
        <div className="mb-3">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium">{title}</h3>
          <p className="text-[10px] text-white/30 mt-1">Drag individual nodes to rearrange. Click to inspect.</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border border-white/5 bg-black/20"
        style={{ height: '450px' }}
      />

      {/* Node info panel */}
      {selectedNode && (
        <div className="absolute top-12 right-4 glass-card rounded-lg p-4 max-w-[220px] z-20">
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
        {Array.from(new Set(effectiveNodes.map((n) => n.type))).map((type) => {
          const nodeOfType = effectiveNodes.find((n) => n.type === type);
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

// Demo data generators for when no real data is available
function generateDemoNodes(): GraphNode[] {
  return [
    { id: 'workspace', label: 'Workspace', type: 'hub', size: 14, color: '#6366f1' },
    { id: 'gmail', label: 'Gmail', type: 'tool', size: 10, color: '#8b5cf6' },
    { id: 'calendar', label: 'Calendar', type: 'tool', size: 10, color: '#a78bfa' },
    { id: 'drive', label: 'Drive', type: 'tool', size: 10, color: '#c084fc' },
    { id: 'contacts', label: 'Contacts', type: 'tool', size: 8, color: '#818cf8' },
    { id: 'tasks', label: 'Tasks', type: 'tool', size: 8, color: '#7c3aed' },
    { id: 'sheets', label: 'Sheets', type: 'tool', size: 8, color: '#4f46e5' },
    { id: 'docs', label: 'Docs', type: 'tool', size: 8, color: '#a855f7' },
    { id: 'slides', label: 'Slides', type: 'tool', size: 7, color: '#6d28d9' },
    { id: 'youtube', label: 'YouTube', type: 'tool', size: 9, color: '#e879f9' },
    { id: 'inbox', label: 'Inbox', type: 'feature', size: 6, color: '#38bdf8' },
    { id: 'sent', label: 'Sent Mail', type: 'feature', size: 5, color: '#38bdf8' },
    { id: 'meetings', label: 'Meetings', type: 'feature', size: 6, color: '#2dd4bf' },
    { id: 'files', label: 'My Files', type: 'feature', size: 6, color: '#34d399' },
    { id: 'shared', label: 'Shared', type: 'feature', size: 5, color: '#34d399' },
  ];
}

function generateDemoEdges(nodes: GraphNode[]): GraphEdge[] {
  return [
    { source: 'workspace', target: 'gmail', weight: 3 },
    { source: 'workspace', target: 'calendar', weight: 3 },
    { source: 'workspace', target: 'drive', weight: 3 },
    { source: 'workspace', target: 'contacts', weight: 2 },
    { source: 'workspace', target: 'tasks', weight: 2 },
    { source: 'workspace', target: 'sheets', weight: 2 },
    { source: 'workspace', target: 'docs', weight: 2 },
    { source: 'workspace', target: 'slides', weight: 1 },
    { source: 'workspace', target: 'youtube', weight: 1 },
    { source: 'gmail', target: 'inbox', weight: 2 },
    { source: 'gmail', target: 'sent', weight: 1 },
    { source: 'gmail', target: 'contacts', weight: 1 },
    { source: 'calendar', target: 'meetings', weight: 2 },
    { source: 'calendar', target: 'contacts', weight: 1 },
    { source: 'drive', target: 'files', weight: 2 },
    { source: 'drive', target: 'shared', weight: 1 },
    { source: 'drive', target: 'sheets', weight: 1 },
    { source: 'drive', target: 'docs', weight: 1 },
    { source: 'drive', target: 'slides', weight: 1 },
  ];
}
