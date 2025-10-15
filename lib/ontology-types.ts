import { z } from "zod";

// Entity definition in an ontology
export const EntityDefinitionSchema = z.object({
  type: z.string().min(1, "Entity type is required"),
  description: z.string().min(1, "Description is required"),
  examples: z.array(z.string()).optional(),
  color: z.string().optional(),
});

export type EntityDefinition = z.infer<typeof EntityDefinitionSchema>;

// Relationship definition in an ontology
export const RelationshipDefinitionSchema = z.object({
  type: z.string().min(1, "Relationship type is required"),
  description: z.string().min(1, "Description is required"),
  fromType: z.string().optional(), // Optional: can be any entity type
  toType: z.string().optional(), // Optional: can be any entity type
});

export type RelationshipDefinition = z.infer<typeof RelationshipDefinitionSchema>;

// Complete ontology
export const OntologySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Ontology name is required"),
  description: z.string().optional(),
  entities: z.array(EntityDefinitionSchema).min(1, "At least one entity type is required"),
  relationships: z.array(RelationshipDefinitionSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Ontology = z.infer<typeof OntologySchema>;

// Article extraction mode
export type ExtractionMode = "easy" | "advanced";

// Article with mode
export interface ArticleWithMode {
  title?: string;
  content: string;
  mode: ExtractionMode;
  ontologyId?: string; // Required if mode is "advanced"
}
