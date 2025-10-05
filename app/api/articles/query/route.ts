import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/neo4j';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { articleId, question } = await request.json();

    if (!articleId || !question) {
      return NextResponse.json(
        { error: 'Article ID and question are required' },
        { status: 400 }
      );
    }

    const session = getSession();

    try {
      // First, get the graph structure
      const graphResult = await session.run(
        `
        MATCH (a:Article {id: $articleId})-[:MENTIONS]->(e:Entity)
        OPTIONAL MATCH (e)-[r:RELATES_TO]->(e2:Entity)
        RETURN a, e, r, e2
        `,
        { articleId }
      );

      // Build a text representation of the graph
      const entities: Array<{ id: string; name: string; type: string; description?: string }> = [];
      const relationships: Array<{ from: string; to: string; type: string; description?: string }> = [];
      const entityMap = new Map();

      graphResult.records.forEach((record) => {
        const entity = record.get('e');
        if (entity && !entityMap.has(entity.properties.id)) {
          entities.push({
            id: entity.properties.id,
            name: entity.properties.name,
            type: entity.properties.type,
            description: entity.properties.description,
          });
          entityMap.set(entity.properties.id, entity.properties.name);
        }

        const entity2 = record.get('e2');
        if (entity2 && !entityMap.has(entity2.properties.id)) {
          entities.push({
            id: entity2.properties.id,
            name: entity2.properties.name,
            type: entity2.properties.type,
            description: entity2.properties.description,
          });
          entityMap.set(entity2.properties.id, entity2.properties.name);
        }

        const relationship = record.get('r');
        if (relationship && entity && entity2) {
          relationships.push({
            from: entity.properties.id,
            to: entity2.properties.id,
            type: relationship.properties.type,
            description: relationship.properties.description,
          });
        }
      });

      // Create a context for the AI with entity IDs
      const graphContext = `
Graph Structure:

Entities (format: ID | Name | Type):
${entities.map((e) => `- ${e.id} | ${e.name} (${e.type}): ${e.description || 'No description'}`).join('\n')}

Relationships:
${relationships.map((r) => {
  const fromName = entityMap.get(r.from);
  const toName = entityMap.get(r.to);
  return `- ${fromName} → ${r.type} → ${toName}${r.description ? `: ${r.description}` : ''}`;
}).join('\n')}
`;

      // Ask AI to answer the question
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions about a knowledge graph. 
            
When answering:
1. Be concise and specific
2. Reference actual entities and relationships from the graph
3. IMPORTANT: If the answer involves specific entities, you MUST list ALL their EXACT IDs (from the "ID | Name" format) in your response as [HIGHLIGHT: id1, id2, id3, ...]
   - If asked "Who are the key people?", include ALL person IDs: [HIGHLIGHT: person1, person2, person3, person4]
   - If asked about organizations, include ALL organization IDs
   - Example: If mentioning "Apple" with ID "apple", include [HIGHLIGHT: apple]
   - Example: If mentioning "Huawei" (ID: huawei) and "China" (ID: china), include [HIGHLIGHT: huawei, china]
4. If the question cannot be answered from the graph, say so clearly
5. Use the same language as the question (if asked in Thai, answer in Thai)`,
          },
          {
            role: 'user',
            content: `${graphContext}\n\nQuestion: ${question}`,
          },
        ],
        temperature: 0.3,
      });

      const rawAnswer = completion.choices[0].message.content || 'No answer generated.';

      // Extract highlighted node IDs if present
      const highlightMatch = rawAnswer.match(/\[HIGHLIGHT: ([^\]]+)\]/);
      let highlightNodes: string[] = [];
      
      if (highlightMatch) {
        highlightNodes = highlightMatch[1].split(',').map((id) => id.trim());
      } else {
        // If AI didn't provide IDs, try to extract entity names from the answer
        // and find their IDs
        const mentionedEntities: string[] = [];
        
        // Check if question is asking for all entities of a type
        const lowerQuestion = question.toLowerCase();
        if (lowerQuestion.includes('people') || lowerQuestion.includes('คน')) {
          // Return all Person entities
          entities.forEach((entity) => {
            if (entity.type === 'Person') {
              mentionedEntities.push(entity.id);
            }
          });
        } else if (lowerQuestion.includes('organization') || lowerQuestion.includes('องค์กร')) {
          // Return all Organization entities
          entities.forEach((entity) => {
            if (entity.type === 'Organization') {
              mentionedEntities.push(entity.id);
            }
          });
        } else if (lowerQuestion.includes('location') || lowerQuestion.includes('สถานที่')) {
          // Return all Location entities
          entities.forEach((entity) => {
            if (entity.type === 'Location') {
              mentionedEntities.push(entity.id);
            }
          });
        } else {
          // Otherwise, find entities mentioned by name in the answer
          entities.forEach((entity) => {
            if (rawAnswer.includes(entity.name)) {
              mentionedEntities.push(entity.id);
            }
          });
        }
        
        highlightNodes = mentionedEntities.slice(0, 10); // Limit to 10
      }

      // Debug logging
      console.log('AI Answer:', rawAnswer);
      console.log('Extracted highlight nodes:', highlightNodes);
      console.log('Available entity IDs:', entities.map(e => e.id));

      // Remove the highlight marker from the answer
      const answer = rawAnswer.replace(/\[HIGHLIGHT: [^\]]+\]/g, '').trim();

      return NextResponse.json({
        answer,
        highlightNodes,
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error('Error processing query:', error);
    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
