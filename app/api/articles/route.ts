import { NextRequest, NextResponse } from "next/server";
import { extractEntitiesFromArticle, extractEntitiesWithOntology } from "@/lib/openai";
import { createArticleGraph, getAllArticles } from "@/lib/graph-operations";
import { ArticleType } from "@/lib/article-types";
import { ExtractionMode } from "@/lib/ontology-types";
import { getSession } from "@/lib/neo4j";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, articleType, mode, ontologyId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Article content is required" },
        { status: 400 }
      );
    }

    const extractionMode: ExtractionMode = mode || 'easy';

    // Validate advanced mode requirements
    if (extractionMode === 'advanced' && !ontologyId) {
      return NextResponse.json(
        { error: "Ontology ID is required for advanced mode" },
        { status: 400 }
      );
    }

    // Generate article ID
    const articleId = `article-${Date.now()}`;

    let extracted;

    if (extractionMode === 'advanced') {
      // Fetch ontology from database
      const session = getSession();
      try {
        const result = await session.run(
          `
          MATCH (o:Ontology {id: $ontologyId})
          OPTIONAL MATCH (o)-[:DEFINES]->(e:EntityDefinition)
          OPTIONAL MATCH (o)-[:DEFINES]->(r:RelationshipDefinition)
          RETURN o.name as name,
                 collect(DISTINCT e) as entities,
                 collect(DISTINCT r) as relationships
          `,
          { ontologyId }
        );

        if (result.records.length === 0) {
          return NextResponse.json(
            { error: "Ontology not found" },
            { status: 404 }
          );
        }

        const record = result.records[0];
        const ontology = {
          name: record.get("name"),
          entities: record.get("entities").filter((e: any) => e).map((e: any) => ({
            type: e.properties.type,
            description: e.properties.description,
            examples: e.properties.examples || [],
          })),
          relationships: record.get("relationships").filter((r: any) => r).map((r: any) => ({
            type: r.properties.type,
            description: r.properties.description,
            fromType: r.properties.fromType,
            toType: r.properties.toType,
          })),
        };

        // Extract using custom ontology
        extracted = await extractEntitiesWithOntology(
          content,
          title || 'Untitled',
          ontology
        );
      } finally {
        await session.close();
      }
    } else {
      // Easy mode: Extract using predefined article types
      extracted = await extractEntitiesFromArticle(
        content,
        title,
        (articleType as ArticleType) || 'general'
      );
    }

    // Store in Neo4j
    await createArticleGraph(
      articleId,
      title || 'Untitled Article',
      content,
      extracted.summary,
      extracted.entities,
      extracted.relationships,
      (articleType as ArticleType) || 'general',
      extractionMode,
      ontologyId
    );

    return NextResponse.json({
      success: true,
      articleId,
      mode: extractionMode,
      entitiesCount: extracted.entities.length,
      relationshipsCount: extracted.relationships.length,
    });
  } catch (error) {
    console.error("Error processing article:", error);
    return NextResponse.json(
      {
        error: "Failed to process article",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const articles = await getAllArticles();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
