import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { ArticleType, getArticleTypeConfig } from './article-types';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create dynamic entity schema based on article type
function createEntitySchema(entityTypes: readonly string[]) {
  return z.object({
    id: z.string().describe('Unique kebab-case identifier for the entity'),
    name: z.string().describe('Entity name in the original article language'),
    type: z.enum(entityTypes as [string, ...string[]]).describe('Entity type - must be one of the allowed types for this article type'),
    description: z.string().optional().describe('What this entity is and its role in the context'),
    sentiment: z.enum(['positive', 'negative', 'neutral']).optional().describe('Sentiment associated with this entity'),
    importance: z.enum(['high', 'medium', 'low']).optional().describe('Importance level of this entity'),
  });
}

// Relationship schema (same for all article types)
const RelationshipSchema = z.object({
  from: z.string().describe('Source entity ID'),
  to: z.string().describe('Target entity ID'),
  type: z.string().describe('Specific relationship type (e.g., works-at, generates-revenue, invests-in)'),
  description: z.string().optional().describe('Context explaining the relationship'),
  strength: z.enum(['strong', 'medium', 'weak']).optional().describe('Strength of the relationship'),
});

// Create dynamic extracted data schema
function createExtractedDataSchema(entityTypes: readonly string[]) {
  const EntitySchema = createEntitySchema(entityTypes);
  
  return z.object({
    summary: z.string().describe('Concise summary highlighting key facts and impact'),
    entities: z.array(EntitySchema).describe('List of extracted entities'),
    relationships: z.array(RelationshipSchema).describe('List of relationships between entities'),
  });
}

// TypeScript types (using general entity schema as base)
export type Entity = {
  id: string;
  name: string;
  type: string;
  description?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  importance?: 'high' | 'medium' | 'low';
};

export type Relationship = z.infer<typeof RelationshipSchema>;

export type ExtractedData = {
  summary: string;
  entities: Entity[];
  relationships: Relationship[];
};

export async function extractEntitiesFromArticle(
  articleText: string,
  articleTitle?: string,
  articleType: ArticleType = 'general'
): Promise<ExtractedData> {
  // Get the appropriate config and create dynamic schema
  const typeConfig = getArticleTypeConfig(articleType);
  const ExtractedDataSchema = createExtractedDataSchema(typeConfig.entityTypes);
  
  const prompt = `${typeConfig.systemPrompt}

Article Title: ${articleTitle || 'Untitled'}
Article Text:
${articleText}

Extract entities and relationships following the guidelines above. Ensure:
- All entity IDs are unique and in kebab-case
- Entity types MUST be one of the allowed types (schema enforced)
- Relationships use specific, meaningful types (not generic "mentions" or "related-to")
- All entity names remain in the original article language`;

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert analyst that extracts structured knowledge graphs from articles. Follow the instructions precisely and use ONLY the exact entity types specified in the schema.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(ExtractedDataSchema, 'extracted_data'),
    temperature: 0.3,
  });

  const extracted = completion.choices[0].message.parsed;
  
  if (!extracted) {
    throw new Error('Failed to parse structured output from OpenAI');
  }

  return extracted;
}
