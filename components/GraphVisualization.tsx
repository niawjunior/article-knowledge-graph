"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Position,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Loader2, Sparkles, FileEdit } from "lucide-react";
import CustomNode, { CustomNodeData } from "./CustomNode";
import { KeyInsight } from "@/lib/graph-operations";
import GraphQuery from "./GraphQuery";
import StoryPlayer from "./StoryPlayer";
import ArticleEditor from "./ArticleEditor";
import {
  getVisualizationConfig,
  getNodeColor as getConfigNodeColor,
  getEdgeStyle as getConfigEdgeStyle,
} from "@/lib/visualization-config";
import { ArticleType } from "@/lib/article-types";

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
  articleType?: string;
}

const nodeTypes = {
  custom: CustomNode,
} as any;

// This function is now replaced by getConfigNodeColor from visualization-config
// Keeping for backward compatibility during migration
const getNodeColor = (
  type: string,
  sentiment?: string,
  articleType?: string
) => {
  const config = getVisualizationConfig(
    (articleType as ArticleType) || "general"
  );
  return getConfigNodeColor(type, sentiment, config);
};

function GraphVisualizationInner({ articleId }: { articleId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    [] as Node<CustomNodeData>[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyInsights, setKeyInsights] = useState<KeyInsight[]>([]);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(
    new Set()
  );
  const [selectedInsightIndex, setSelectedInsightIndex] = useState<
    number | null
  >(null);
  const [showEdgeLabels, setShowEdgeLabels] = useState(false);
  const [showStory, setShowStory] = useState(false);
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const router = useRouter();
  const { fitView } = useReactFlow();

  const [graphData, setGraphData] = useState<GraphData | null>(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/graph`);
        if (!response.ok) {
          throw new Error("Failed to fetch graph data");
        }

        const data: GraphData = await response.json();
        setGraphData(data);

        // Set key insights
        setKeyInsights(data.keyInsights || []);

        // Get visualization config based on article type
        const vizConfig = getVisualizationConfig(
          (data.articleType as ArticleType) || "general"
        );
        console.log(
          "Using visualization config:",
          vizConfig.name,
          "for article type:",
          data.articleType
        );

        const articleNode = data.nodes.find((n) => n.type === "Article");
        const entityNodes = data.nodes.filter((n) => n.type !== "Article");

        const flowNodes: Node<CustomNodeData>[] = [];

        // Position nodes based on layout direction
        const columnWidth = vizConfig.layout.spacing.nodeHorizontal;
        const rowHeight = vizConfig.layout.spacing.nodeVertical;
        const sectionGap = vizConfig.layout.spacing.sectionGap;

        if (vizConfig.layout.direction === "LR") {
          // Left-to-Right hierarchical layout using column order from config
          const nodesByDepth = new Map<number, typeof entityNodes>();

          // Group nodes by their type-based column from config
          console.log(
            "Entity types found:",
            entityNodes.map((n) => n.type)
          );
          console.log("Column order config:", vizConfig.columnOrder);

          entityNodes.forEach((node) => {
            const depth = vizConfig.columnOrder?.[node.type] ?? 99; // Default to last column
            console.log(
              `Node "${node.name}" (type: ${node.type}) -> column ${depth}`
            );
            if (!nodesByDepth.has(depth)) {
              nodesByDepth.set(depth, []);
            }
            nodesByDepth.get(depth)!.push(node);
          });

          // Calculate total height to center the Article node
          const firstColumnNodes =
            nodesByDepth.get(Math.min(...Array.from(nodesByDepth.keys()))) ||
            [];
          const totalHeight = firstColumnNodes.length * rowHeight;
          const articleY = 50 + totalHeight / 2 - rowHeight / 2;

          // Place article node at column 0, centered vertically
          if (articleNode) {
            flowNodes.push({
              id: articleNode.id,
              type: "custom",
              position: { x: 50, y: articleY },
              sourcePosition: Position.Right,
              data: {
                label: articleNode.name,
                type: articleNode.type,
                description: articleNode.description,
                color: getNodeColor(
                  articleNode.type,
                  undefined,
                  data.articleType
                ),
                isRoot: true,
              },
            });
          }

          // Position nodes by depth (left to right) with proper spacing
          const sortedDepths = Array.from(nodesByDepth.keys()).sort(
            (a, b) => a - b
          );

          sortedDepths.forEach((depth) => {
            const nodesAtDepth = nodesByDepth.get(depth)!;
            // Start from column 1 (article is at column 0) with extra gap after article
            const articleGap = vizConfig.layout.spacing.articleGap || 0;
            const x = 50 + columnWidth + articleGap + (depth - 1) * columnWidth;

            nodesAtDepth.forEach((node, index) => {
              const y = 50 + index * rowHeight;
              const nodeColor = getNodeColor(
                node.type,
                node.sentiment,
                data.articleType
              );

              flowNodes.push({
                id: node.id,
                type: "custom",
                position: { x, y },
                sourcePosition: Position.Right,
                targetPosition: Position.Left,
                data: {
                  label: node.name,
                  type: node.type,
                  description: node.description,
                  color: nodeColor,
                  sentiment: node.sentiment,
                  importance: node.importance,
                  isRoot: false,
                },
                style: {
                  opacity:
                    highlightedNodes.size > 0 && !highlightedNodes.has(node.id)
                      ? 0.3
                      : 1,
                  border: highlightedNodes.has(node.id)
                    ? "3px solid #fbbf24"
                    : undefined,
                  boxShadow: highlightedNodes.has(node.id)
                    ? "0 0 20px 5px rgba(251, 191, 36, 0.6)"
                    : undefined,
                },
              });
            });
          });
        } else {
          // Default grid layout for other types
          const nodesByType: Record<string, typeof entityNodes> = {};
          entityNodes.forEach((node) => {
            if (!nodesByType[node.type]) {
              nodesByType[node.type] = [];
            }
            nodesByType[node.type].push(node);
          });

          let currentY = 250;

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
                type: "custom",
                position: { x, y },
                data: {
                  label: node.name,
                  type: node.type,
                  description: node.description,
                  color: getNodeColor(
                    node.type,
                    node.sentiment,
                    data.articleType
                  ),
                  sentiment: node.sentiment,
                  importance: node.importance,
                  isRoot: false,
                },
                style: {
                  opacity:
                    highlightedNodes.size > 0 && !highlightedNodes.has(node.id)
                      ? 0.3
                      : 1,
                  border: highlightedNodes.has(node.id)
                    ? "3px solid #fbbf24"
                    : undefined,
                  boxShadow: highlightedNodes.has(node.id)
                    ? "0 0 20px 5px rgba(251, 191, 36, 0.6)"
                    : undefined,
                },
              });
            });

            // Move to next section
            const rows = Math.ceil(nodes.length / nodesPerRow);
            currentY += rows * rowHeight + sectionGap;
          });
        }

        // Create all edges using config styling
        const flowEdges: Edge[] = data.edges.map((edge, index) => {
          const isFromArticle = edge.from === articleNode?.id;
          const isStrongRelation = edge.strength === "strong";
          const isHighlighted =
            highlightedNodes.size > 0 &&
            highlightedNodes.has(edge.from) &&
            highlightedNodes.has(edge.to);
          const shouldFade = highlightedNodes.size > 0 && !isHighlighted;

          const edgeStyle = getConfigEdgeStyle(
            isFromArticle,
            edge.strength,
            isHighlighted,
            vizConfig
          );

          return {
            id: `edge-${index}`,
            source: edge.from,
            target: edge.to,
            label: showEdgeLabels ? edge.type.replace(/-/g, " ") : "",
            type:
              vizConfig.layout.direction === "LR" ? "smoothstep" : "default",
            animated:
              vizConfig.edgeStyle.animated ||
              isFromArticle ||
              isStrongRelation ||
              isHighlighted,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 20,
              height: 20,
            },
            style: {
              ...edgeStyle,
              opacity: shouldFade ? 0.2 : edgeStyle.opacity,
            },
            labelStyle: {
              fontSize: isHighlighted ? 12 : 11,
              fontWeight: isHighlighted ? 700 : isStrongRelation ? 600 : 500,
              fill: isHighlighted ? "#f59e0b" : "#475569",
            },
            labelBgStyle: {
              fill: "#ffffff",
              fillOpacity: 0.9,
            },
          };
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraphData();
  }, [articleId, showEdgeLabels]);

  // Update node and edge styles when highlighting changes (without resetting positions)
  useEffect(() => {
    if (!graphData || nodes.length === 0) return;

    // Update only the styles of existing nodes, preserving their positions
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity:
            highlightedNodes.size > 0 && !highlightedNodes.has(node.id)
              ? 0.3
              : 1,
          border: highlightedNodes.has(node.id)
            ? "3px solid #fbbf24"
            : undefined,
          boxShadow: highlightedNodes.has(node.id)
            ? "0 0 20px 5px rgba(251, 191, 36, 0.6)"
            : undefined,
        },
      }))
    );

    // Auto-focus on highlighted nodes
    if (highlightedNodes.size > 0) {
      // Small delay to ensure nodes are updated before focusing
      setTimeout(() => {
        fitView({
          nodes: Array.from(highlightedNodes).map((id) => ({ id })),
          duration: 800, // Smooth animation duration in ms
          padding: 0.3, // 30% padding around the focused nodes
          maxZoom: 1.5, // Don't zoom in too much
          minZoom: 0.5, // Don't zoom out too much
        });
      }, 100);
    }

    // Update edge styles based on highlighting
    const vizConfig = getVisualizationConfig(
      (graphData.articleType as ArticleType) || "general"
    );
    const articleNode = graphData.nodes.find((n) => n.type === "Article");

    const flowEdges: Edge[] = graphData.edges.map((edge, index) => {
      const isFromArticle = edge.from === articleNode?.id;
      const isStrongRelation = edge.strength === "strong";
      const isHighlighted =
        highlightedNodes.size > 0 &&
        highlightedNodes.has(edge.from) &&
        highlightedNodes.has(edge.to);
      const shouldFade = highlightedNodes.size > 0 && !isHighlighted;

      const edgeStyle = getConfigEdgeStyle(
        isFromArticle,
        edge.strength,
        isHighlighted,
        vizConfig
      );

      return {
        id: `edge-${index}`,
        source: edge.from,
        target: edge.to,
        label: showEdgeLabels ? edge.type.replace(/-/g, " ") : "",
        type: "default",
        animated:
          vizConfig.edgeStyle.animated ||
          isFromArticle ||
          isStrongRelation ||
          isHighlighted,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
        },
        style: {
          ...edgeStyle,
          opacity: shouldFade ? 0.2 : edgeStyle.opacity,
        },
        labelStyle: {
          fontSize: isHighlighted ? 12 : 11,
          fontWeight: isHighlighted ? 700 : isStrongRelation ? 600 : 500,
          fill: isHighlighted ? "#f59e0b" : "#475569",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.9,
        },
      };
    });

    setEdges(flowEdges);
  }, [
    graphData,
    highlightedNodes,
    showEdgeLabels,
    setNodes,
    setEdges,
    fitView,
  ]);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log("Node clicked:", node);
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
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleQueryHighlight = (nodeIds: string[]) => {
    console.log("handleQueryHighlight called with:", nodeIds);
    const nodeSet = new Set(nodeIds);
    console.log("Setting highlighted nodes:", nodeSet);
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
                      ? "bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 border-amber-400 dark:border-amber-600 shadow-lg ring-2 ring-amber-400"
                      : "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-blue-100 dark:border-slate-600 hover:shadow-md"
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
            nodeColor={(node) => (node.data.color as string) || "#64748b"}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Panel position="top-left">
            <div className="flex  gap-2">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <button
                onClick={() => setShowEdgeLabels(!showEdgeLabels)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors border ${
                  showEdgeLabels
                    ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                    : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-600"
                }`}
              >
                <span className="text-sm font-medium">
                  {showEdgeLabels ? "Hide" : "Show"} Labels
                </span>
              </button>
              <button
                onClick={() => setShowStory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:from-purple-500 hover:to-blue-500 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Tell Me The Story</span>
              </button>
              <button
                onClick={() => setShowArticleEditor(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
              >
                <FileEdit className="w-4 h-4" />
                <span className="text-sm font-medium">View/Edit Article</span>
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Graph Query Panel */}
      <div className="w-96">
        <GraphQuery articleId={articleId} onHighlight={handleQueryHighlight} />
      </div>

      {/* Story Player */}
      {showStory && (
        <StoryPlayer
          articleId={articleId}
          onHighlight={handleQueryHighlight}
          onClose={() => setShowStory(false)}
        />
      )}

      {/* Article Editor */}
      {showArticleEditor && (
        <ArticleEditor
          articleId={articleId}
          onClose={() => setShowArticleEditor(false)}
          onSave={() => {
            setShowArticleEditor(false);
            // Reload the page to refresh the graph
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export default function GraphVisualization({
  articleId,
}: {
  articleId: string;
}) {
  return (
    <ReactFlowProvider>
      <GraphVisualizationInner articleId={articleId} />
    </ReactFlowProvider>
  );
}
