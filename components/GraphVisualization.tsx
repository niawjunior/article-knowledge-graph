'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Loader2 } from 'lucide-react';
import CustomNode from './CustomNode';
import { KeyInsight } from '@/lib/graph-operations';
import GraphQuery from './GraphQuery';

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    sentiment?: string;
    importance?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: string;
    description?: string;
    strength?: string;
  }>;
  keyInsights?: KeyInsight[];
}

const nodeTypes = {
  custom: CustomNode,
} as any;

const getNodeColor = (type: string, sentiment?: string) => {
  // Base colors by type
  const colors: Record<string, string> = {
    Article: '#3b82f6',
    Person: '#10b981',
    Organization: '#8b5cf6',
    Location: '#f59e0b',
    Concept: '#ec4899',
    Event: '#ef4444',
    Date: '#6366f1',
    Technology: '#06b6d4',
  };
  
  // Override with sentiment colors for important context
  if (sentiment === 'negative') {
    return '#dc2626'; // red for victims/problems
  } else if (sentiment === 'positive') {
    return '#16a34a'; // green for positive news
  }
  
  return colors[type] || '#64748b';
};

export default function GraphVisualization({
  articleId,
}: {
  articleId: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [selectedInsightIndex, setSelectedInsightIndex] = useState<number | null>(null);
  const router = useRouter();

  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/graph`);
        if (!response.ok) {
          throw new Error('Failed to fetch graph data');
        }

        const data: GraphData = await response.json();
        setGraphData(data);

        // Set key insights
        setKeyInsights(data.keyInsights || []);

        const articleNode = data.nodes.find((n) => n.type === 'Article');
        const entityNodes = data.nodes.filter((n) => n.type !== 'Article');

        const flowNodes: Node[] = [];

        // Place article node at top center
        if (articleNode) {
          flowNodes.push({
            id: articleNode.id,
            type: 'custom',
            position: { x: 400, y: 50 },
            data: {
              label: articleNode.name,
              type: articleNode.type,
              description: articleNode.description,
              color: getNodeColor(articleNode.type),
              isRoot: true,
            },
          });
        }

        // Group nodes by type for better organization
        const nodesByType: Record<string, typeof entityNodes> = {};
        entityNodes.forEach((node) => {
          if (!nodesByType[node.type]) {
            nodesByType[node.type] = [];
          }
          nodesByType[node.type].push(node);
        });

        // Position nodes in a grid layout by type
        let currentY = 250;
        const columnWidth = 300;
        const rowHeight = 150;
        
        Object.entries(nodesByType).forEach(([type, nodes]) => {
          const nodesPerRow = Math.min(4, nodes.length);
          const totalWidth = nodesPerRow * columnWidth;
          const startX = (1200 - totalWidth) / 2;

          nodes.forEach((node, index) => {
            const col = index % nodesPerRow;
            const row = Math.floor(index / nodesPerRow);
            const x = startX + col * columnWidth;
            const y = currentY + row * rowHeight;

            flowNodes.push({
              id: node.id,
              type: 'custom',
              position: { x, y },
              data: {
                label: node.name,
                type: node.type,
                description: node.description,
                color: getNodeColor(node.type, node.sentiment),
                sentiment: node.sentiment,
                importance: node.importance,
                isRoot: false,
              },
              style: {
                opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.3 : 1,
                border: highlightedNodes.has(node.id) ? '3px solid #fbbf24' : undefined,
                boxShadow: highlightedNodes.has(node.id) ? '0 0 20px 5px rgba(251, 191, 36, 0.6)' : undefined,
              },
            });
          });

          // Move to next section
          const rows = Math.ceil(nodes.length / nodesPerRow);
          currentY += rows * rowHeight + 50;
        });

        // Create all edges
        const flowEdges: Edge[] = data.edges.map((edge, index) => {
          const isFromArticle = edge.from === articleNode?.id;
          const isStrongRelation = edge.strength === 'strong';
          const isHighlighted = highlightedNodes.size > 0 && 
            highlightedNodes.has(edge.from) && highlightedNodes.has(edge.to);
          const shouldFade = highlightedNodes.size > 0 && !isHighlighted;

          return {
            id: `edge-${index}`,
            source: edge.from,
            target: edge.to,
            label: edge.type.replace(/-/g, ' '),
            type: 'default',
            animated: isFromArticle || isStrongRelation || isHighlighted,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            style: {
              strokeWidth: isHighlighted ? 4 : isStrongRelation ? 3 : isFromArticle ? 2.5 : 1.5,
              stroke: isHighlighted ? '#fbbf24' : isFromArticle ? '#3b82f6' : isStrongRelation ? '#6366f1' : '#94a3b8',
              opacity: shouldFade ? 0.2 : 1,
            },
            labelStyle: {
              fontSize: isHighlighted ? 12 : 11,
              fontWeight: isHighlighted ? 700 : isStrongRelation ? 600 : 500,
              fill: isHighlighted ? '#f59e0b' : '#475569',
            },
            labelBgStyle: {
              fill: '#ffffff',
              fillOpacity: 0.9,
            },
          };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [articleId]);

  // Rebuild graph when highlighting changes
  useEffect(() => {
    if (!graphData) return;

    console.log('Rebuilding graph with highlighted nodes:', highlightedNodes);
    const data = graphData;
    const articleNode = data.nodes.find((n) => n.type === 'Article');
    const entityNodes = data.nodes.filter((n) => n.type !== 'Article');
    
    console.log('All node IDs in graph:', data.nodes.map(n => n.id));

    const flowNodes: Node[] = [];

    // Place article node at top center
    if (articleNode) {
      flowNodes.push({
        id: articleNode.id,
        type: 'custom',
        position: { x: 400, y: 50 },
        data: {
          label: articleNode.name,
          type: articleNode.type,
          description: articleNode.description,
          color: getNodeColor(articleNode.type),
          isRoot: true,
        },
      });
    }

    // Group nodes by type for better organization
    const nodesByType: Record<string, typeof entityNodes> = {};
    entityNodes.forEach((node) => {
      if (!nodesByType[node.type]) {
        nodesByType[node.type] = [];
      }
      nodesByType[node.type].push(node);
    });

    // Position nodes in a grid layout by type
    let currentY = 250;
    const columnWidth = 300;
    const rowHeight = 150;
    
    Object.entries(nodesByType).forEach(([, nodes]) => {
      const nodesPerRow = Math.min(4, nodes.length);
      const totalWidth = nodesPerRow * columnWidth;
      const startX = (1200 - totalWidth) / 2;

      nodes.forEach((node, index) => {
        const col = index % nodesPerRow;
        const row = Math.floor(index / nodesPerRow);
        const x = startX + col * columnWidth;
        const y = currentY + row * rowHeight;

        flowNodes.push({
          id: node.id,
          type: 'custom',
          position: { x, y },
          data: {
            label: node.name,
            type: node.type,
            description: node.description,
            color: getNodeColor(node.type, node.sentiment),
            sentiment: node.sentiment,
            importance: node.importance,
            isRoot: false,
          },
          style: {
            opacity: highlightedNodes.size > 0 && !highlightedNodes.has(node.id) ? 0.3 : 1,
            border: highlightedNodes.has(node.id) ? '3px solid #fbbf24' : undefined,
            boxShadow: highlightedNodes.has(node.id) ? '0 0 20px 5px rgba(251, 191, 36, 0.6)' : undefined,
          },
        });
      });

      // Move to next section
      const rows = Math.ceil(nodes.length / nodesPerRow);
      currentY += rows * rowHeight + 50;
    });

    // Create all edges
    const flowEdges: Edge[] = data.edges.map((edge, index) => {
      const isFromArticle = edge.from === articleNode?.id;
      const isStrongRelation = edge.strength === 'strong';
      const isHighlighted = highlightedNodes.size > 0 && 
        highlightedNodes.has(edge.from) && highlightedNodes.has(edge.to);
      const shouldFade = highlightedNodes.size > 0 && !isHighlighted;

      return {
        id: `edge-${index}`,
        source: edge.from,
        target: edge.to,
        label: edge.type.replace(/-/g, ' '),
        type: 'default',
        animated: isFromArticle || isStrongRelation || isHighlighted,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          strokeWidth: isHighlighted ? 4 : isStrongRelation ? 3 : isFromArticle ? 2.5 : 1.5,
          stroke: isHighlighted ? '#fbbf24' : isFromArticle ? '#3b82f6' : isStrongRelation ? '#6366f1' : '#94a3b8',
          opacity: shouldFade ? 0.2 : 1,
        },
        labelStyle: {
          fontSize: isHighlighted ? 12 : 11,
          fontWeight: isHighlighted ? 700 : isStrongRelation ? 600 : 500,
          fill: isHighlighted ? '#f59e0b' : '#475569',
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.9,
        },
      };
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [graphData, highlightedNodes, setNodes, setEdges]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading knowledge graph...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleQueryHighlight = (nodeIds: string[]) => {
    console.log('handleQueryHighlight called with:', nodeIds);
    const nodeSet = new Set(nodeIds);
    console.log('Setting highlighted nodes:', nodeSet);
    setHighlightedNodes(nodeSet);
    setSelectedInsightIndex(null);
  };

  return (
    <div className="h-full w-full flex">
      {/* Key Insights Panel */}
      {keyInsights.length > 0 && (
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">💡</span>
                Key Insights
              </h2>
              {highlightedNodes.size > 0 && (
                <button
                  onClick={() => {
                    setHighlightedNodes(new Set());
                    setSelectedInsightIndex(null);
                  }}
                  className="text-xs px-2 py-1 bg-slate-200 dark:bg-slate-600 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2">
              {keyInsights.map((insight, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setHighlightedNodes(new Set(insight.nodeIds));
                    setSelectedInsightIndex(index);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedInsightIndex === index
                      ? 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 border-amber-400 dark:border-amber-600 shadow-lg ring-2 ring-amber-400'
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-blue-100 dark:border-slate-600 hover:shadow-md'
                  }`}
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    {insight.text}
                  </p>
                  {insight.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {insight.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Graph */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={4}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => (node.data.color as string) || '#64748b'}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Panel position="top-left">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Graph Query Panel */}
      <div className="w-96">
        <GraphQuery articleId={articleId} onHighlight={handleQueryHighlight} />
      </div>
    </div>
  );
}
