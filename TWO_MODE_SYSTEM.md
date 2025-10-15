# Two-Mode Extraction System

## Overview

Implemented a dual-mode system for entity extraction:
1. **Easy Mode** - Auto-extract with predefined entity types
2. **Advanced Mode** - Custom ontology with user-defined entities

## Architecture

### Mode Selection
```
User → Choose Mode → Extract Entities → Generate Graph
         ↓
    Easy Mode: Use predefined types (Person, Organization, etc.)
    Advanced Mode: Use custom ontology (Patient, Diagnosis, etc.)
```

## Easy Mode (Current Behavior)

### Features
- ⚡ Quick and simple
- No setup required
- Predefined entity types
- Choose from 4 article types:
  - General Article
  - Investment Analysis
  - Revenue Analysis
  - Mystery & Investigation

### Usage
```
1. Select "Easy Mode"
2. Choose article type
3. Paste content
4. Generate graph
```

### Entity Types (Predefined)
```typescript
General: Person, Organization, Location, Technology, Event, Concept, Date
Investment: Company, Investor, Fund, Valuation, Round, Sector
Revenue: RevenueMetric, RevenueStream, Product, Service, Customer
Mystery: Person, Location, Event, Evidence, Clue
```

## Advanced Mode (NEW!)

### Features
- 🎯 Custom entity definitions
- 📝 Entity descriptions for AI guidance
- 🎨 Custom colors per entity
- 🔗 Custom relationship types
- 💾 Save and reuse ontologies
- 🌍 Domain-specific extraction

### Usage
```
1. Select "Advanced Mode"
2. Choose existing ontology OR create new
3. Paste content
4. AI extracts using your ontology
```

### Ontology Structure
```typescript
interface Ontology {
  id: string;
  name: string;
  description: string;
  entities: EntityDefinition[];
  relationships: RelationshipDefinition[];
}

interface EntityDefinition {
  type: string;           // e.g., "Patient"
  description: string;    // What this entity means
  examples?: string[];    // Example values
  color?: string;         // Visualization color
}

interface RelationshipDefinition {
  type: string;           // e.g., "diagnosed-with"
  description: string;    // What this relationship means
  fromType?: string;      // Optional: source entity type
  toType?: string;        // Optional: target entity type
}
```

## Example: Healthcare Ontology

```json
{
  "name": "Healthcare Records",
  "description": "Extract medical entities from patient records",
  "entities": [
    {
      "type": "Patient",
      "description": "A person receiving medical treatment or care",
      "examples": ["John Doe", "Patient ID 12345"],
      "color": "#3b82f6"
    },
    {
      "type": "Doctor",
      "description": "Medical professional providing care",
      "examples": ["Dr. Smith", "Physician"],
      "color": "#10b981"
    },
    {
      "type": "Diagnosis",
      "description": "Medical condition or disease identified",
      "examples": ["Diabetes", "Hypertension", "COVID-19"],
      "color": "#ef4444"
    },
    {
      "type": "Treatment",
      "description": "Medical intervention, therapy, or procedure",
      "examples": ["Surgery", "Chemotherapy", "Physical therapy"],
      "color": "#f59e0b"
    },
    {
      "type": "Medication",
      "description": "Pharmaceutical drug prescribed",
      "examples": ["Aspirin", "Insulin", "Antibiotics"],
      "color": "#8b5cf6"
    }
  ],
  "relationships": [
    {
      "type": "diagnosed-with",
      "description": "Patient has been diagnosed with a condition",
      "fromType": "Patient",
      "toType": "Diagnosis"
    },
    {
      "type": "treated-by",
      "description": "Patient receives care from a doctor",
      "fromType": "Patient",
      "toType": "Doctor"
    },
    {
      "type": "prescribed",
      "description": "Doctor prescribes medication to patient",
      "fromType": "Doctor",
      "toType": "Medication"
    },
    {
      "type": "treated-with",
      "description": "Patient receives a specific treatment",
      "fromType": "Patient",
      "toType": "Treatment"
    }
  ]
}
```

## AI Extraction with Ontology

### Prompt Enhancement
```
You are extracting entities using ontology: "Healthcare Records"

Entity Types (ONLY use these):
- **Patient**: A person receiving medical treatment or care
  Examples: John Doe, Patient ID 12345
- **Doctor**: Medical professional providing care
  Examples: Dr. Smith, Physician
- **Diagnosis**: Medical condition or disease identified
  Examples: Diabetes, Hypertension, COVID-19

Relationship Types:
- **diagnosed-with**: Patient has been diagnosed with a condition (Patient → Diagnosis)
- **treated-by**: Patient receives care from a doctor (Patient → Doctor)

Extract ONLY entities matching these types.
```

### Example Extraction

**Input Article:**
```
John Doe visited Dr. Smith on Monday. He was diagnosed with Type 2 Diabetes.
Dr. Smith prescribed Metformin and recommended lifestyle changes.
```

**Extracted Graph:**
```json
{
  "entities": [
    { "id": "john-doe", "name": "John Doe", "type": "Patient" },
    { "id": "dr-smith", "name": "Dr. Smith", "type": "Doctor" },
    { "id": "diabetes", "name": "Type 2 Diabetes", "type": "Diagnosis" },
    { "id": "metformin", "name": "Metformin", "type": "Medication" }
  ],
  "relationships": [
    { "from": "john-doe", "to": "dr-smith", "type": "treated-by" },
    { "from": "john-doe", "to": "diabetes", "type": "diagnosed-with" },
    { "from": "dr-smith", "to": "metformin", "type": "prescribed" }
  ]
}
```

## API Endpoints

### Ontologies

#### GET `/api/ontologies`
List all ontologies
```json
{
  "ontologies": [
    {
      "id": "ontology-123",
      "name": "Healthcare Records",
      "description": "...",
      "entities": [...],
      "relationships": [...]
    }
  ]
}
```

#### POST `/api/ontologies`
Create new ontology
```json
{
  "name": "Healthcare Records",
  "description": "Extract medical entities",
  "entities": [...],
  "relationships": [...]
}
```

#### GET `/api/ontologies/[id]`
Get single ontology

#### DELETE `/api/ontologies/[id]`
Delete ontology

### Articles (Updated)

#### POST `/api/articles`
```json
{
  "title": "Patient Record",
  "content": "...",
  "mode": "advanced",
  "ontologyId": "ontology-123"
}
```

**Response:**
```json
{
  "success": true,
  "articleId": "article-456",
  "mode": "advanced",
  "entitiesCount": 4,
  "relationshipsCount": 3
}
```

## UI Components

### 1. Mode Selector (ArticleInput)
```tsx
<ModeSelector>
  [⚡ Easy Mode] [🎯 Advanced Mode]
</ModeSelector>
```

### 2. Easy Mode View
```tsx
<ArticleTypeSelector>
  - General Article
  - Investment Analysis
  - Revenue Analysis
  - Mystery & Investigation
</ArticleTypeSelector>
```

### 3. Advanced Mode View
```tsx
<OntologySelector>
  {ontologies.length === 0 ? (
    <CreateOntologyPrompt />
  ) : (
    <select>
      {ontologies.map(ont => (
        <option>{ont.name} ({ont.entities.length} entities)</option>
      ))}
    </select>
  )}
</OntologySelector>
```

## Database Schema

### Ontology Node
```cypher
CREATE (o:Ontology {
  id: "ontology-123",
  name: "Healthcare Records",
  description: "...",
  createdAt: datetime(),
  updatedAt: datetime()
})
```

### Entity Definition Node
```cypher
CREATE (e:EntityDefinition {
  type: "Patient",
  description: "A person receiving medical treatment",
  examples: ["John Doe", "Patient ID 12345"],
  color: "#3b82f6"
})
CREATE (o)-[:DEFINES]->(e)
```

### Relationship Definition Node
```cypher
CREATE (r:RelationshipDefinition {
  type: "diagnosed-with",
  description: "Patient has been diagnosed with a condition",
  fromType: "Patient",
  toType: "Diagnosis"
})
CREATE (o)-[:DEFINES]->(r)
```

## Benefits

### Easy Mode
- ✅ Quick start
- ✅ No setup
- ✅ Good for general use
- ✅ Predefined types

### Advanced Mode
- ✅ Domain-specific
- ✅ Precise extraction
- ✅ Custom entities
- ✅ Reusable ontologies
- ✅ Better for specialized domains

## Use Cases

### Easy Mode
- News articles
- Blog posts
- General content
- Quick analysis

### Advanced Mode
- Healthcare records
- Legal documents
- Scientific papers
- Technical documentation
- Domain-specific analysis

## Next Steps

To complete the implementation, we still need:

1. ✅ **Ontology data model** - DONE
2. ✅ **Ontology CRUD APIs** - DONE
3. ✅ **Mode selection UI** - DONE
4. ✅ **Advanced extraction logic** - DONE
5. ⏳ **Ontology Editor UI** - TODO
6. ⏳ **Ontology Library page** - TODO

## Summary

### What We Built
- ✅ Two-mode system (Easy + Advanced)
- ✅ Ontology data model with Zod validation
- ✅ Ontology CRUD APIs
- ✅ Mode selector in ArticleInput
- ✅ Ontology-based extraction function
- ✅ Updated articles API to handle both modes

### Result
Users can now:
- ⚡ **Easy Mode**: Quick extraction with predefined types
- 🎯 **Advanced Mode**: Custom ontology for domain-specific extraction
- 💾 **Save ontologies**: Reuse across multiple articles
- 🔧 **Flexible**: Switch between modes as needed

The platform now supports both casual users (Easy Mode) and power users (Advanced Mode)! 🚀
