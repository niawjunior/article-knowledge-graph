import OpenAI from 'openai';
import { ArticleType, getArticleTypeConfig } from './article-types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Entity {
  id: string;
  name: string;
  type: string; // Dynamic type based on article type (e.g., REVENUE METRIC, REVENUE STREAM, etc.)
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
  articleTitle?: string,
  articleType: ArticleType = 'general'
): Promise<ExtractedData> {
  // Get the appropriate system prompt based on article type
  const typeConfig = getArticleTypeConfig(articleType);
  
  const prompt = `${typeConfig.systemPrompt}

Article Title: ${articleTitle || 'Untitled'}
Article Text:
${articleText}

Return JSON in this exact format:
{
  "summary": "Concise summary highlighting key facts and impact",
  "entities": [
    {
      "id": "kebab-case-id",
      "name": "Entity Name",
      "type": "Use the entity types specified in the system prompt above",
      "description": "What this entity is and its role in the context",
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
}`;

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
