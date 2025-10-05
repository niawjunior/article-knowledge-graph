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

      // Generate article-specific questions
      const questions: string[] = [];

      // Add entity type specific questions
      if (entityTypes.includes("Organization")) {
        questions.push("What organizations are mentioned?");
      }
      if (entityTypes.includes("Person")) {
        questions.push("Who are the key people?");
      }
      if (entityTypes.includes("Location")) {
        questions.push("Which locations are involved?");
      }

      // Add questions based on sample entities
      if (sampleEntities.length >= 2) {
        questions.push(
          `How is ${sampleEntities[0]} connected to ${sampleEntities[1]}?`
        );
      }

      // Add general questions
      questions.push("What are the main relationships?");
      questions.push("Show me entities with negative sentiment");

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
