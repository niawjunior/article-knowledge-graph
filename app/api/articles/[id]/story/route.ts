import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const articleId = (await params).id;
    const session = getSession();

    try {
      // Get article and graph data
      const result = await session.run(
        `
        MATCH (a:Article {id: $articleId})
        OPTIONAL MATCH (a)-[:MENTIONS]->(e:Entity)
        OPTIONAL MATCH (e1:Entity)-[r:RELATES_TO]->(e2:Entity)
        WHERE (a)-[:MENTIONS]->(e1) AND (a)-[:MENTIONS]->(e2)
        RETURN a.title as title,
               a.content as content,
               a.articleType as articleType,
               collect(DISTINCT {
                 id: e.id,
                 name: e.name,
                 type: e.type,
                 description: e.description,
                 importance: e.importance
               }) as entities,
               collect(DISTINCT {
                 from: e1.name,
                 to: e2.name,
                 type: type(r),
                 strength: r.strength
               }) as relationships
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
      const title = record.get("title");
      const articleType = record.get("articleType") || "general";
      const entities = record.get("entities").filter((e: any) => e.id);
      const relationships = record
        .get("relationships")
        .filter((r: any) => r.from && r.to);

      // Generate story using OpenAI
      const prompt = `You are a data storytelling expert. Create an engaging narrative story about this knowledge graph.

Article: ${title}
Article Type: ${articleType}

Entities (${entities.length}):
${entities
  .map(
    (e: any) =>
      `- ${e.name} (${e.type})${e.description ? `: ${e.description}` : ""}`
  )
  .join("\n")}

Relationships (${relationships.length}):
${relationships
  .slice(0, 20)
  .map((r: any) => `- ${r.from} → ${r.to} (${r.type})`)
  .join("\n")}

Create a story with 4-6 chapters that guides the reader through this data. Each chapter should:
1. Have a clear title
2. Focus on specific entities (mention their exact names)
3. Tell a cohesive narrative
4. Build upon previous chapters

Return ONLY a JSON array with this structure:
[
  {
    "chapter": 1,
    "title": "Chapter title",
    "narrative": "The story text that mentions specific entity names",
    "entityNames": ["Entity Name 1", "Entity Name 2"],
    "duration": 5000
  }
]

Make it engaging and insightful. Focus on the most important entities and relationships.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a data storytelling expert. Return only valid JSON with a 'chapters' array.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });
      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("No content generated");
      }

      // Clean up markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```")) {
        // Remove markdown code blocks
        cleanContent = cleanContent
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "")
          .trim();
      }

      let storyData = JSON.parse(cleanContent);
      
      // Handle if the response is wrapped in a "story" or "chapters" key
      if (storyData.story) storyData = storyData.story;
      if (storyData.chapters) storyData = storyData.chapters;
      
      // Ensure it's an array
      const chapters = Array.isArray(storyData) ? storyData : [storyData];

      // Map entity names to IDs
      const entityNameToId = new Map(
        entities.map((e: any) => [e.name.toLowerCase(), e.id])
      );

      const story = chapters.map((chapter: any) => ({
        ...chapter,
        entityIds: (chapter.entityNames || [])
          .map((name: string) => entityNameToId.get(name.toLowerCase()))
          .filter(Boolean),
      }));

      return NextResponse.json({ story });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error generating story:", error);
    return NextResponse.json(
      { error: "Failed to generate story" },
      { status: 500 }
    );
  }
}
