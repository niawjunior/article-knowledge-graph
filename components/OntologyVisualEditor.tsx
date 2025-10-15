"use client";

import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  Handle,
  Position,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Save, Trash2, Edit2, Layout } from "lucide-react";
import { EntityDefinition, RelationshipDefinition } from "@/lib/ontology-types";

interface OntologyVisualEditorProps {
  entities: EntityDefinition[];
  relationships: RelationshipDefinition[];
  onEntitiesChange: (entities: EntityDefinition[]) => void;
  onRelationshipsChange: (relationships: RelationshipDefinition[]) => void;
}

interface EntityNodeData {
  label: string;
  type: string;
  description: string;
  examples: string[];
  color: string;
  onEdit: () => void;
  onDelete: () => void;
}

// Custom Entity Node Component
function EntityNode({ data }: { data: EntityNodeData }) {
  return (
    <div
      className="px-4 py-3 rounded-lg shadow-lg border-2 min-w-[150px] bg-white dark:bg-slate-800"
      style={{ borderColor: data.color }}
    >
      {/* Connection Handles - Both can be source and target */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="top"
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
        style={{ top: -6 }}
      />
      <Handle 
        type="source" 
        position={Position.Top} 
        id="top-source"
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
        style={{ top: -6 }}
      />
      <Handle 
        type="target" 
        position={Position.Bottom} 
        id="bottom"
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
        style={{ bottom: -6 }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="bottom-source"
        className="w-3 h-3 !bg-purple-500 border-2 border-white"
        style={{ bottom: -6 }}
      />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          ></div>
          <div className="font-semibold text-sm text-slate-900 dark:text-white">
            {data.label}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={data.onEdit}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
          >
            <Edit2 className="w-3 h-3 text-slate-600 dark:text-slate-400" />
          </button>
          <button
            type="button"
            onClick={data.onDelete}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          >
            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
          {data.description}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  entityNode: EntityNode,
};

export default function OntologyVisualEditor({
  entities,
  relationships,
  onEntitiesChange,
  onRelationshipsChange,
}: OntologyVisualEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityDefinition | null>(
    null
  );
  const [editingEntityIndex, setEditingEntityIndex] = useState<number>(-1);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);

  // Form states
  const [entityType, setEntityType] = useState("");
  const [entityDescription, setEntityDescription] = useState("");
  const [entityExamples, setEntityExamples] = useState("");
  const [entityColor, setEntityColor] = useState("#64748b");
  const [edgeType, setEdgeType] = useState("");
  const [edgeDescription, setEdgeDescription] = useState("");

  // Initialize nodes and edges from entities and relationships
  const initializeFromEntities = useCallback(() => {
    const newNodes: Node[] = entities.map((entity, index) => ({
      id: `entity-${index}`,
      type: "entityNode",
      position: {
        x: 100 + (index % 3) * 250,
        y: 100 + Math.floor(index / 3) * 150,
      },
      data: {
        label: entity.type,
        type: entity.type,
        description: entity.description,
        examples: entity.examples || [],
        color: entity.color || "#64748b",
        onEdit: () => handleEditEntity(index),
        onDelete: () => handleDeleteEntity(index),
      },
    }));

    const newEdges: Edge[] = relationships
      .map((rel, index) => {
        const fromIndex = entities.findIndex((e) => e.type === rel.fromType);
        const toIndex = entities.findIndex((e) => e.type === rel.toType);

        if (fromIndex === -1 || toIndex === -1) return null;

        return {
          id: `edge-${index}`,
          source: `entity-${fromIndex}`,
          target: `entity-${toIndex}`,
          label: rel.type,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#8b5cf6", strokeWidth: 2 },
          labelStyle: { fill: "#8b5cf6", fontWeight: 600 },
          labelBgStyle: { fill: "#f3e8ff" },
        };
      })
      .filter(Boolean) as Edge[];

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entities, relationships, setNodes, setEdges]);

  // Sync nodes/edges back to entities/relationships
  const syncToEntities = useCallback(() => {
    const updatedEntities: EntityDefinition[] = nodes.map((node: any) => ({
      type: node.data.type as string,
      description: node.data.description as string,
      examples: node.data.examples as string[],
      color: node.data.color as string,
    }));

    const updatedRelationships: RelationshipDefinition[] = edges.map(
      (edge: any) => {
        const sourceNode = nodes.find((n: any) => n.id === edge.source);
        const targetNode = nodes.find((n: any) => n.id === edge.target);

        return {
          type: (edge.label as string) || "relates-to",
          description: "",
          fromType: sourceNode?.data.type as string | undefined,
          toType: targetNode?.data.type as string | undefined,
        };
      }
    );

    onEntitiesChange(updatedEntities);
    onRelationshipsChange(updatedRelationships);
  }, [nodes, edges, onEntitiesChange, onRelationshipsChange]);

  // Handle connection between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      setEditingEdge({
        id: `edge-${edges.length}`,
        source: params.source!,
        target: params.target!,
        label: "",
      } as Edge);
      setEdgeType("");
      setEdgeDescription("");
      setShowEdgeModal(true);
    },
    [edges.length]
  );

  // Add new entity
  const handleAddEntity = () => {
    setEditingEntity(null);
    setEditingEntityIndex(-1);
    setEntityType("");
    setEntityDescription("");
    setEntityExamples("");
    setEntityColor("#64748b");
    setShowEntityModal(true);
  };

  // Edit existing entity
  const handleEditEntity = (index: number) => {
    const entity = entities[index];
    setEditingEntity(entity);
    setEditingEntityIndex(index);
    setEntityType(entity.type);
    setEntityDescription(entity.description);
    setEntityExamples(entity.examples?.join(", ") || "");
    setEntityColor(entity.color || "#64748b");
    setShowEntityModal(true);
  };

  // Delete entity
  const handleDeleteEntity = (index: number) => {
    if (
      !confirm("Delete this entity? All related connections will be removed.")
    )
      return;

    const updatedEntities = entities.filter((_, i) => i !== index);
    const entityType = entities[index].type;
    const updatedRelationships = relationships.filter(
      (r) => r.fromType !== entityType && r.toType !== entityType
    );

    onEntitiesChange(updatedEntities);
    onRelationshipsChange(updatedRelationships);
  };

  // Save entity
  const handleSaveEntity = () => {
    if (!entityType.trim() || !entityDescription.trim()) {
      alert("Entity type and description are required");
      return;
    }

    const newEntity: EntityDefinition = {
      type: entityType,
      description: entityDescription,
      examples: entityExamples
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      color: entityColor,
    };

    if (editingEntityIndex >= 0) {
      // Update existing
      const updated = [...entities];
      updated[editingEntityIndex] = newEntity;
      onEntitiesChange(updated);
    } else {
      // Add new
      onEntitiesChange([...entities, newEntity]);
    }

    setShowEntityModal(false);
  };

  // Save edge
  const handleSaveEdge = () => {
    if (!edgeType.trim()) {
      alert("Relationship type is required");
      return;
    }

    if (!editingEdge) return;

    const sourceNode = nodes.find((n) => n.id === editingEdge.source);
    const targetNode = nodes.find((n) => n.id === editingEdge.target);

    if (!sourceNode || !targetNode) return;

    const newRelationship: RelationshipDefinition = {
      type: edgeType,
      description: edgeDescription,
      fromType: (sourceNode.data as any).type as string,
      toType: (targetNode.data as any).type as string,
    };

    onRelationshipsChange([...relationships, newRelationship]);

    const newEdge: Edge = {
      id: editingEdge.id,
      source: editingEdge.source,
      target: editingEdge.target,
      label: edgeType,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#8b5cf6", strokeWidth: 2 },
      labelStyle: { fill: "#8b5cf6", fontWeight: 600 },
      labelBgStyle: { fill: "#f3e8ff" },
    };

    setEdges((eds) => addEdge(newEdge, eds));
    setShowEdgeModal(false);
  };

  // Auto layout
  const handleAutoLayout = () => {
    const updatedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: 100 + (index % 3) * 250,
        y: 100 + Math.floor(index / 3) * 150,
      },
    }));
    setNodes(updatedNodes);
  };

  // Initialize and update when entities/relationships change
  useEffect(() => {
    if (entities.length > 0) {
      initializeFromEntities();
    }
  }, [entities, relationships, initializeFromEntities]);

  return (
    <div className="relative w-full h-[600px] bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
        }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />

        <Panel position="top-right" className="flex gap-2">
          <button
            type="button"
            onClick={handleAddEntity}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Entity
          </button>
          <button
            type="button"
            onClick={handleAutoLayout}
            className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm shadow-lg"
          >
            <Layout className="w-4 h-4" />
            Auto Layout
          </button>
        </Panel>

        <Panel position="bottom-center">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg text-sm text-slate-600 dark:text-slate-400">
            💡 Drag nodes to position • Connect nodes to create relationships
          </div>
        </Panel>
      </ReactFlow>

      {/* Entity Modal */}
      {showEntityModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingEntityIndex >= 0 ? "Edit Entity" : "Add Entity"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Entity Type *
                </label>
                <input
                  type="text"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                  placeholder="e.g., Patient, Doctor"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={entityColor}
                  onChange={(e) => setEntityColor(e.target.value)}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={entityDescription}
                  onChange={(e) => setEntityDescription(e.target.value)}
                  placeholder="What this entity represents..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Examples (comma-separated)
                </label>
                <input
                  type="text"
                  value={entityExamples}
                  onChange={(e) => setEntityExamples(e.target.value)}
                  placeholder="e.g., John Doe, Patient ID 12345"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowEntityModal(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEntity}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edge Modal */}
      {showEdgeModal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Define Relationship
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relationship Type *
                </label>
                <input
                  type="text"
                  value={edgeType}
                  onChange={(e) => setEdgeType(e.target.value)}
                  placeholder="e.g., diagnosed-with, treated-by"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={edgeDescription}
                  onChange={(e) => setEdgeDescription(e.target.value)}
                  placeholder="What this relationship means..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowEdgeModal(false)}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdge}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
