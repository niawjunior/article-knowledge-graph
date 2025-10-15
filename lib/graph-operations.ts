import { getSession } from './neo4j';
import { Entity, Relationship } from './openai';

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  description?: string;
}

export interface KeyInsight {
  text: string;
  description?: string;
  nodeIds: string[];
  edgeId: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  keyInsights?: KeyInsight[];
  articleType?: string;
}

export async function createArticleGraph(
  articleId: string,
  title: string,
  content: string,
  summary: string,
  entities: Entity[],
  relationships: Relationship[],
  articleType?: string,
  mode?: string,
  ontologyId?: string
): Promise<void> {
  const session = getSession();

  try {
    // Create article node
    await session.run(
      `
      MERGE (a:Article {id: $articleId})
      SET a.title = $title,
          a.content = $content,
          a.summary = $summary,
          a.articleType = $articleType,
          a.mode = $mode,
          a.createdAt = datetime()
      `,
      { 
        articleId, 
        title, 
        content, 
        summary, 
        articleType: articleType || 'general',
        mode: mode || 'easy'
      }
    );

    // Link to ontology if provided
    if (ontologyId) {
      await session.run(
        `
        MATCH (a:Article {id: $articleId})
        MATCH (o:Ontology {id: $ontologyId})
        MERGE (a)-[:USES_ONTOLOGY]->(o)
        `,
        { articleId, ontologyId }
      );
    }

    // Create entity nodes
    for (const entity of entities) {
      await session.run(
        `
        MERGE (e:Entity {id: $id})
        SET e.name = $name,
            e.type = $type,
            e.description = $description
        WITH e
        MATCH (a:Article {id: $articleId})
        MERGE (a)-[:MENTIONS]->(e)
        `,
        {
          id: entity.id,
          name: entity.name,
          type: entity.type,
          description: entity.description || '',
          articleId,
        }
      );
    }

    // Create relationships between entities
    for (const rel of relationships) {
      await session.run(
        `
        MATCH (from:Entity {id: $fromId})
        MATCH (to:Entity {id: $toId})
        MERGE (from)-[r:RELATES_TO {type: $relType}]->(to)
        SET r.description = $description
        `,
        {
          fromId: rel.from,
          toId: rel.to,
          relType: rel.type,
          description: rel.description || '',
        }
      );
    }
  } finally {
    await session.close();
  }
}

export async function getArticleGraph(articleId: string): Promise<GraphData> {
  const session = getSession();

  try {
    // Get article and its entities
    const result = await session.run(
      `
      MATCH (a:Article {id: $articleId})-[:MENTIONS]->(e:Entity)
      OPTIONAL MATCH (e)-[r:RELATES_TO]->(e2:Entity)
      RETURN a, e, r, e2
      `,
      { articleId }
    );

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const nodeIds = new Set<string>();

    // Add article node and get article type
    let articleType = 'general';
    if (result.records.length > 0) {
      const article = result.records[0].get('a').properties;
      articleType = article.articleType || 'general';
      nodes.push({
        id: articleId,
        name: article.title,
        type: 'Article',
        description: article.summary,
      });
      nodeIds.add(articleId);
    }

    result.records.forEach((record) => {
      const entity = record.get('e');
      const relationship = record.get('r');
      const entity2 = record.get('e2');

      // Add entity node
      if (entity && !nodeIds.has(entity.properties.id)) {
        nodes.push({
          id: entity.properties.id,
          name: entity.properties.name,
          type: entity.properties.type,
          description: entity.properties.description,
        });
        nodeIds.add(entity.properties.id);

        // Add edge from article to entity
        edges.push({
          from: articleId,
          to: entity.properties.id,
          type: 'MENTIONS',
        });
      }

      // Add relationship edge
      if (relationship && entity2) {
        if (!nodeIds.has(entity2.properties.id)) {
          nodes.push({
            id: entity2.properties.id,
            name: entity2.properties.name,
            type: entity2.properties.type,
            description: entity2.properties.description,
          });
          nodeIds.add(entity2.properties.id);

          // Add edge from article to entity2
          edges.push({
            from: articleId,
            to: entity2.properties.id,
            type: 'MENTIONS',
          });
        }

        edges.push({
          from: entity.properties.id,
          to: entity2.properties.id,
          type: relationship.properties.type,
          description: relationship.properties.description,
        });
      }
    });

    // Generate key insights from graph relationships
    const keyInsights: KeyInsight[] = [];
    
    // Find strong relationships first
    const strongRelationships = edges.filter((e) => {
      const relNode = result.records.find((r) => {
        const rel = r.get('r');
        return rel && rel.properties.type === e.type;
      });
      return relNode && relNode.get('r')?.properties.strength === 'strong';
    });

    // Use strong relationships if available, otherwise use all relationships
    const relationshipsToShow = strongRelationships.length > 0 
      ? strongRelationships 
      : edges.filter((e) => e.from !== articleId); // Exclude article->entity edges

    // Create insights from relationships
    relationshipsToShow.slice(0, 8).forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from);
      const toNode = nodes.find((n) => n.id === edge.to);
      if (fromNode && toNode) {
        keyInsights.push({
          text: `${fromNode.name} → ${edge.type.replace(/-/g, ' ')} → ${toNode.name}`,
          description: edge.description,
          nodeIds: [edge.from, edge.to],
          edgeId: `${edge.from}-${edge.to}`,
        });
      }
    });

    return { nodes, edges, keyInsights, articleType };
  } finally {
    await session.close();
  }
}

export async function getAllArticles(): Promise<Array<{ id: string; title: string; createdAt: string }>> {
  const session = getSession();

  try {
    const result = await session.run(
      `
      MATCH (a:Article)
      RETURN a.id as id, a.title as title, a.createdAt as createdAt
      ORDER BY a.createdAt DESC
      `
    );

    return result.records.map((record) => {
      const createdAt = record.get('createdAt');
      return {
        id: record.get('id'),
        title: record.get('title'),
        createdAt: createdAt ? createdAt.toString() : new Date().toISOString(),
      };
    });
  } finally {
    await session.close();
  }
}
