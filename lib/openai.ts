import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Entity {
  id: string;
  name: string;
  type: 'Person' | 'Organization' | 'Location' | 'Concept' | 'Event' | 'Date' | 'Technology';
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  importance?: 'high' | 'medium' | 'low';
}

export interface Relationship {
  from: string;
  to: string;
  type: string;
  description?: string;
  strength?: 'strong' | 'medium' | 'weak';
}

export interface ExtractedData {
  entities: Entity[];
  relationships: Relationship[];
  summary: string;
}

export async function extractEntitiesFromArticle(
  articleText: string,
  articleTitle?: string
): Promise<ExtractedData> {
  const prompt = `You are an expert analyst specializing in news, security incidents, and business intelligence.
Analyze the following article and extract a knowledge graph with rich context.

IMPORTANT: Keep all entity names, descriptions, and relationships in the SAME LANGUAGE as the original article. Do NOT translate to English.

Article Title: ${articleTitle || 'Untitled'}
Article Text:
${articleText}

Extract:
1. **Entities** with context:
   - Organizations (companies, institutions, hacker groups)
   - People (executives, analysts, attackers)
   - Technology (software, systems, platforms)
   - Events (breaches, announcements, incidents)
   - Concepts (security concepts, business impacts)
   - Locations (countries, cities, regions)
   - Dates (when events occurred)

2. **Relationships** with semantic meaning:
   - Use specific relationship types like: "attacked-by", "victim-of", "owns", "uses", "affected-by", "leaked-from", "reported-by", "contains", "targets", "supplies-to", "competes-with", "partners-with"
   - Avoid generic "mentions" or "related-to" unless no specific relationship exists
   - Include relationship strength (strong/medium/weak)

3. **Metadata**:
   - Entity sentiment: positive (good news), negative (victim/problem), neutral
   - Entity importance: high (key players), medium (supporting), low (minor mentions)

Return JSON:
{
  "summary": "Concise summary highlighting key facts and impact",
  "entities": [
    {
      "id": "kebab-case-id",
      "name": "Entity Name",
      "type": "Person|Organization|Location|Concept|Event|Date|Technology",
      "description": "What this entity is and its role in the story",
      "sentiment": "positive|negative|neutral",
      "importance": "high|medium|low"
    }
  ],
  "relationships": [
    {
      "from": "entity-id-1",
      "to": "entity-id-2",
      "type": "specific-action-verb",
      "description": "Explain the relationship context",
      "strength": "strong|medium|weak"
    }
  ]
}

Rules:
- Extract 8-20 entities (focus on quality over quantity)
- Create 10-30 relationships (build a rich network)
- Use specific, actionable relationship types
- Mark victims/attackers with appropriate sentiment
- Prioritize entities by their importance to the story
- For security incidents: identify attacker, victim, method, impact, affected parties
- For business news: identify companies, products, market impact, stakeholders
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that extracts structured data from text. Always respond with valid JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const extracted = JSON.parse(content) as ExtractedData;
  return extracted;
}
