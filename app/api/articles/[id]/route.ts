import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import { extractEntitiesFromArticle } from "@/lib/openai";
import { ArticleType } from "@/lib/article-types";

// GET - Fetch article details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const articleId = (await params).id;
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (a:Article {id: $articleId})
        OPTIONAL MATCH (a)-[:USES_ONTOLOGY]->(o:Ontology)
        RETURN a.id as id, a.title as title, a.content as content, 
               a.articleType as articleType, a.mode as mode,
               a.createdAt as createdAt,
               o.id as ontologyId, o.name as ontologyName
        `,
        { articleId }
      );

      if (result.records.length === 0) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }

      const record = result.records[0];
      return NextResponse.json({
        id: record.get("id"),
        title: record.get("title"),
        content: record.get("content"),
        articleType: record.get("articleType"),
        mode: record.get("mode") || "easy",
        ontologyId: record.get("ontologyId"),
        ontologyName: record.get("ontologyName"),
        createdAt: record.get("createdAt"),
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PATCH - Update article and regenerate graph
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const articleId = (await params).id;
    const { title, content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const session = getSession();

    try {
      // Get article type
      const articleResult = await session.run(
        `
        MATCH (a:Article {id: $articleId})
        RETURN a.articleType as articleType
        `,
        { articleId }
      );

      if (articleResult.records.length === 0) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }

      const articleType = articleResult.records[0].get("articleType") as ArticleType;

      // Extract new entities and relationships
      const extractedData = await extractEntitiesFromArticle(
        content,
        title || "Untitled",
        articleType
      );

      // Delete old entities and relationships
      await session.run(
        `
        MATCH (a:Article {id: $articleId})-[r:MENTIONS]->(e:Entity)
        DETACH DELETE e
        `,
        { articleId }
      );

      // Update article
      await session.run(
        `
        MATCH (a:Article {id: $articleId})
        SET a.title = $title,
            a.content = $content,
            a.summary = $summary,
            a.updatedAt = datetime()
        `,
        {
          articleId,
          title: title || "Untitled",
          content,
          summary: extractedData.summary,
        }
      );

      // Create new entities
      for (const entity of extractedData.entities) {
        await session.run(
          `
          MATCH (a:Article {id: $articleId})
          CREATE (e:Entity {
            id: $entityId,
            name: $name,
            type: $type,
            description: $description,
            sentiment: $sentiment,
            importance: $importance
          })
          CREATE (a)-[:MENTIONS]->(e)
          `,
          {
            articleId,
            entityId: entity.id,
            name: entity.name,
            type: entity.type,
            description: entity.description || null,
            sentiment: entity.sentiment || null,
            importance: entity.importance || null,
          }
        );
      }

      // Create new relationships
      for (const rel of extractedData.relationships) {
        await session.run(
          `
          MATCH (a:Article {id: $articleId})-[:MENTIONS]->(from:Entity {id: $fromId})
          MATCH (a)-[:MENTIONS]->(to:Entity {id: $toId})
          CREATE (from)-[r:RELATES_TO {
            type: $type,
            description: $description,
            strength: $strength
          }]->(to)
          `,
          {
            articleId,
            fromId: rel.from,
            toId: rel.to,
            type: rel.type,
            description: rel.description || null,
            strength: rel.strength || null,
          }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Article updated and graph regenerated",
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}
