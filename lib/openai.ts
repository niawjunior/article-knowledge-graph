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

// Extract entities using custom ontology (Advanced Mode)
export async function extractEntitiesWithOntology(
  articleText: string,
  articleTitle: string,
  ontology: {
    name: string;
    entities: Array<{
      type: string;
      description: string;
      examples?: string[];
    }>;
    relationships?: Array<{
      type: string;
      description: string;
      fromType?: string;
      toType?: string;
    }>;
  }
): Promise<ExtractedData> {
  // Create dynamic schema based on custom ontology
  const entityTypes = ontology.entities.map(e => e.type);
  const ExtractedDataSchema = createExtractedDataSchema(entityTypes as any);
  
  // Build ontology description for prompt
  const entityDescriptions = ontology.entities.map(e => 
    `- **${e.type}**: ${e.description}${e.examples ? `\n  Examples: ${e.examples.join(', ')}` : ''}`
  ).join('\n');
  
  const relationshipDescriptions = ontology.relationships?.map(r =>
    `- **${r.type}**: ${r.description}${r.fromType && r.toType ? ` (${r.fromType} → ${r.toType})` : ''}`
  ).join('\n') || 'Use appropriate relationship types based on the context.';

  const prompt = `You are an expert analyst extracting entities using a custom ontology: "${ontology.name}".

CRITICAL INSTRUCTIONS:
1. You MUST use ONLY the entity types listed below - NO OTHER TYPES ARE ALLOWED
2. Do NOT use generic types like "Person", "Organization", "Location", "Date" unless they are explicitly listed below
3. If something doesn't fit the defined types, DO NOT extract it
4. Keep all entity names in the SAME LANGUAGE as the original article

**ALLOWED Entity Types (USE ONLY THESE):**
${entityDescriptions}

**Available Relationship Types:**
${relationshipDescriptions}

**Extraction Rules:**
- Extract ONLY entities that match the defined types above
- If an entity doesn't fit any of the defined types, skip it
- Each unique entity should appear ONLY ONCE - do not create duplicate entities
- Use the entity descriptions to understand what each type means
- Create meaningful relationships between entities
- All entity IDs must be unique and in kebab-case
- Keep entity names in the original article language
- DO NOT invent new entity types - use ONLY the types defined above

Article Title: ${articleTitle || 'Untitled'}
Article Text:
${articleText}

Extract entities and relationships following the ontology above. Remember: ONLY use the entity types explicitly defined in the ontology.`;

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert analyst that extracts structured knowledge graphs using custom ontologies. 

STRICT RULES:
- You MUST use ONLY the entity types defined in the ontology
- The allowed entity types are: ${entityTypes.join(', ')}
- DO NOT use any other entity types
- If you try to use an entity type not in the list, the extraction will fail
- Follow the ontology definitions precisely`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(ExtractedDataSchema, 'extracted_data'),
    temperature: 0.1,
  });

  const extracted = completion.choices[0].message.parsed;
  
  if (!extracted) {
    throw new Error('Failed to parse structured output from OpenAI');
  }

  return extracted;
}
