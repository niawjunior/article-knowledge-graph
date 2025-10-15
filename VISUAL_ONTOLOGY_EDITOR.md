# Visual Ontology Editor - Full Implementation

## Overview

Implemented a full visual ontology editor using React Flow, allowing users to create ontologies with drag-and-drop nodes and visual connections.

## Installation Required

Before using the visual editor, install the required package:

```bash
npm install reactflow
# or
yarn add reactflow
# or
pnpm add reactflow
```

## Features

### 1. **Dual-Mode Editor**

Users can toggle between two modes:

**Simple Mode (Form-Based)**
- Traditional form inputs
- Good for quick creation
- Text-based entity/relationship definition

**Visual Mode (Canvas-Based)**
- Drag-and-drop interface
- Visual node connections
- Interactive graph canvas

### 2. **Visual Editor Capabilities**

#### **Entity Nodes**
- Drag to position
- Color-coded borders
- Edit button (pencil icon)
- Delete button (trash icon)
- Shows entity type and description

#### **Connections (Relationships)**
- Drag from one node to another
- Modal pops up to define relationship
- Animated edges
- Labeled with relationship type
- Purple colored connections

#### **Canvas Controls**
- **Zoom** - Mouse wheel or controls
- **Pan** - Click and drag background
- **MiniMap** - Overview of entire canvas
- **Background Grid** - Dotted pattern

#### **Toolbar**
- **Add Entity** - Create new entity node
- **Auto Layout** - Automatically arrange nodes in grid

## User Flow

### Creating an Ontology Visually

1. **Enter Basic Info**
   ```
   Name: Healthcare Records
   Description: Medical entity extraction
   ```

2. **Select Visual Mode**
   ```
   [Simple Mode] [Visual Mode ✓]
   ```

3. **Add Entities**
   ```
   Click "Add Entity" →
   - Type: Patient
   - Color: 🔵 Blue
   - Description: Person receiving medical care
   - Examples: John Doe, Patient ID 12345
   → Node appears on canvas
   ```

4. **Position Nodes**
   ```
   Drag nodes to arrange them visually
   ```

5. **Create Relationships**
   ```
   Drag from Patient node → Doctor node
   → Modal appears
   - Type: treated-by
   - Description: Patient receives care from doctor
   → Animated connection appears
   ```

6. **Auto Layout** (Optional)
   ```
   Click "Auto Layout" → Nodes arrange in grid
   ```

7. **Save**
   ```
   Click "Create Ontology" → Saves to database
   ```

## Component Architecture

### OntologyVisualEditor Component

```tsx
<OntologyVisualEditor
  entities={entities}
  relationships={relationships}
  onEntitiesChange={setEntities}
  onRelationshipsChange={setRelationships}
/>
```

**Props:**
- `entities` - Array of entity definitions
- `relationships` - Array of relationship definitions
- `onEntitiesChange` - Callback when entities change
- `onRelationshipsChange` - Callback when relationships change

### Custom Entity Node

```tsx
<EntityNode data={{
  label: "Patient",
  type: "Patient",
  description: "Person receiving medical care",
  examples: ["John Doe"],
  color: "#3b82f6",
  onEdit: () => handleEdit(),
  onDelete: () => handleDelete()
}} />
```

**Features:**
- Colored border matching entity color
- Color dot indicator
- Entity type as title
- Description preview
- Edit/Delete buttons

## Visual Examples

### Canvas Layout

```
┌─────────────────────────────────────────────────────────┐
│  [+ Add Entity]  [Auto Layout]                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   ┌──────────────┐                                      │
│   │ 🔵 Patient   │                                      │
│   │ Person...    │                                      │
│   │ [✏️] [🗑️]    │                                      │
│   └──────┬───────┘                                      │
│          │ treated-by                                   │
│          ▼                                               │
│   ┌──────────────┐        diagnosed-with                │
│   │ 🟢 Doctor    │──────────────────────┐              │
│   │ Medical...   │                       │              │
│   │ [✏️] [🗑️]    │                       ▼              │
│   └──────────────┘                ┌──────────────┐     │
│                                    │ 🔴 Diagnosis │     │
│                                    │ Medical...   │     │
│                                    │ [✏️] [🗑️]    │     │
│                                    └──────────────┘     │
│                                                          │
│  💡 Drag nodes • Connect to create relationships        │
└─────────────────────────────────────────────────────────┘
```

### Modals

**Add/Edit Entity Modal:**
```
┌────────────────────────────────┐
│ Add Entity                      │
├────────────────────────────────┤
│ Entity Type *                   │
│ [Patient                    ]   │
│                                 │
│ Color                           │
│ [🔵]                            │
│                                 │
│ Description *                   │
│ [Person receiving medical...]   │
│                                 │
│ Examples                        │
│ [John Doe, Patient ID 12345]    │
│                                 │
│        [Cancel]  [💾 Save]      │
└────────────────────────────────┘
```

**Define Relationship Modal:**
```
┌────────────────────────────────┐
│ Define Relationship             │
├────────────────────────────────┤
│ Relationship Type *             │
│ [treated-by                 ]   │
│                                 │
│ Description                     │
│ [Patient receives care...]      │
│                                 │
│        [Cancel]  [💾 Save]      │
└────────────────────────────────┘
```

## Technical Implementation

### React Flow Integration

```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  fitView
>
  <Background variant={BackgroundVariant.Dots} />
  <Controls />
  <MiniMap />
  <Panel position="top-right">
    {/* Toolbar buttons */}
  </Panel>
</ReactFlow>
```

### Node Structure

```typescript
{
  id: 'entity-0',
  type: 'entityNode',
  position: { x: 100, y: 100 },
  data: {
    label: 'Patient',
    type: 'Patient',
    description: 'Person receiving medical care',
    examples: ['John Doe'],
    color: '#3b82f6',
    onEdit: () => {},
    onDelete: () => {}
  }
}
```

### Edge Structure

```typescript
{
  id: 'edge-0',
  source: 'entity-0',
  target: 'entity-1',
  label: 'treated-by',
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#8b5cf6', strokeWidth: 2 },
  labelStyle: { fill: '#8b5cf6', fontWeight: 600 },
  labelBgStyle: { fill: '#f3e8ff' }
}
```

### Data Synchronization

The visual editor syncs with the form-based entities/relationships:

```typescript
// Visual → Form
const syncToEntities = () => {
  const updatedEntities = nodes.map(node => ({
    type: node.data.type,
    description: node.data.description,
    examples: node.data.examples,
    color: node.data.color,
  }));
  
  const updatedRelationships = edges.map(edge => ({
    type: edge.label,
    description: '',
    fromType: sourceNode.data.type,
    toType: targetNode.data.type,
  }));
  
  onEntitiesChange(updatedEntities);
  onRelationshipsChange(updatedRelationships);
};
```

## Benefits

### vs. Form-Based Editor

| Feature | Form-Based | Visual Editor |
|---------|------------|---------------|
| **Speed** | ⚡ Fast for simple | 🐢 Slower initial setup |
| **Visualization** | ❌ No visual | ✅ See structure |
| **Complexity** | ❌ Hard for complex | ✅ Easy to understand |
| **Relationships** | ❌ Text-based | ✅ Visual connections |
| **Learning Curve** | ✅ Easy | 🤔 Moderate |
| **Best For** | 2-5 entities | 5+ entities |

### Use Cases

**Simple Mode:**
- Quick ontology creation
- Simple domains (2-5 entity types)
- Text-oriented users
- Mobile devices

**Visual Mode:**
- Complex ontologies (5+ entity types)
- Multiple relationships
- Visual learners
- Understanding structure
- Presentations/documentation

## Example: Healthcare Ontology

### Visual Representation

```
        Patient
          │
    ┌─────┼─────┐
    │     │     │
treated-by │  diagnosed-with
    │     │     │
    ▼     │     ▼
  Doctor  │  Diagnosis
          │
      receives
          │
          ▼
      Treatment
          │
      includes
          │
          ▼
     Medication
          ▲
          │
      prescribes
          │
        Doctor
```

### Nodes Created

1. 🔵 **Patient** - Person receiving medical care
2. 🟢 **Doctor** - Medical professional
3. 🔴 **Diagnosis** - Medical condition
4. 🟡 **Treatment** - Medical intervention
5. 🟣 **Medication** - Pharmaceutical drug

### Relationships Created

1. Patient → treated-by → Doctor
2. Patient → diagnosed-with → Diagnosis
3. Patient → receives → Treatment
4. Doctor → prescribes → Medication
5. Treatment → includes → Medication

## Keyboard Shortcuts

- **Space + Drag** - Pan canvas
- **Mouse Wheel** - Zoom in/out
- **Delete** - Delete selected node/edge
- **Ctrl/Cmd + Z** - Undo (if implemented)

## Future Enhancements

### Phase 1 (Current) ✅
- Drag-and-drop nodes
- Visual connections
- Edit/Delete nodes
- Auto layout

### Phase 2 (Future) 🎯
- **Undo/Redo** - History management
- **Copy/Paste** - Duplicate nodes
- **Templates** - Pre-built ontologies
- **Export** - PNG/SVG export
- **Import** - Load from file
- **Validation** - Check for issues
- **Search** - Find nodes
- **Grouping** - Organize related entities

## Summary

### What We Built

1. ✅ **Full visual editor** with React Flow
2. ✅ **Dual-mode toggle** (Simple/Visual)
3. ✅ **Drag-and-drop nodes** with custom styling
4. ✅ **Visual connections** with labels
5. ✅ **Edit/Delete** functionality
6. ✅ **Auto layout** for organization
7. ✅ **Modals** for entity/relationship definition

### Installation

```bash
npm install reactflow
```

### Usage

```tsx
// Toggle between modes
[Simple Mode] [Visual Mode]

// Visual mode features
- Add Entity button
- Drag nodes to position
- Connect nodes by dragging
- Edit/Delete with node buttons
- Auto Layout for organization
```

The visual ontology editor makes creating complex ontologies intuitive and fun! 🎨🎉
