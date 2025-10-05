import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const articleId = (await params).id;
    const session = getSession();

    try {
      // Get article and entities
      const result = await session.run(
        `
        MATCH (a:Article {id: $articleId})-[:MENTIONS]->(e:Entity)
        RETURN a.title as title, collect(DISTINCT e.type) as entityTypes, 
               collect(DISTINCT e.name)[0..5] as sampleEntities
        `,
        { articleId }
      );

      if (result.records.length === 0) {
        return NextResponse.json({ questions: [] });
      }

      const record = result.records[0];
      const entityTypes = record.get("entityTypes") as string[];
      const sampleEntities = record.get("sampleEntities") as string[];

      // Generate article-specific questions based on actual entity types
      const questions: string[] = [];

      // Filter out Article type and get unique entity types
      const nonArticleTypes = entityTypes.filter(t => t !== "Article");
      
      // Add entity type specific questions for the most common types
      const typeQuestions: Record<string, string> = {
        "REVENUE METRIC": "What are the revenue metrics?",
        "REVENUE STREAM": "What are the revenue streams?",
        "ORGANIZATION": "What organizations are mentioned?",
        "CUSTOMER SEGMENT": "What customer segments are there?",
        "GEOGRAPHIC MARKET": "Which geographic markets are mentioned?",
        "TIME PERIOD": "What time periods are covered?",
        "CONCEPT": "What key concepts are discussed?",
        "Person": "Who are the key people?",
        "Organization": "What organizations are mentioned?",
        "Location": "Which locations are involved?",
        "Technology": "What technologies are mentioned?",
        "Event": "What events are described?",
      };

      // Add questions for entity types that exist in the graph
      nonArticleTypes.slice(0, 2).forEach(type => {
        if (typeQuestions[type]) {
          questions.push(typeQuestions[type]);
        }
      });

      // Add questions based on sample entities
      if (sampleEntities.length >= 2) {
        questions.push(
          `How is ${sampleEntities[0]} connected to ${sampleEntities[1]}?`
        );
      }

      // Add general questions only if we have entities
      if (nonArticleTypes.length > 0) {
        questions.push("What are the main relationships?");
      }

      // Only add sentiment question if there are entities (not just showing a generic question)
      // This will be filtered by the query API if no entities have sentiment
      if (nonArticleTypes.length > 0) {
        questions.push("Show me entities with negative sentiment");
      }

      return NextResponse.json({
        questions: questions.slice(0, 4), // Return top 4
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error fetching examples:", error);
    return NextResponse.json({ questions: [] }, { status: 500 });
  }
}
