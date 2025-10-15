import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import { OntologySchema } from "@/lib/ontology-types";

// GET - List all ontologies
export async function GET() {
  try {
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (o:Ontology)
        OPTIONAL MATCH (o)-[:DEFINES]->(e:EntityDefinition)
        OPTIONAL MATCH (o)-[:DEFINES]->(r:RelationshipDefinition)
        RETURN o.id as id, o.name as name, o.description as description,
               o.createdAt as createdAt, o.updatedAt as updatedAt,
               collect(DISTINCT e) as entities,
               collect(DISTINCT r) as relationships
        ORDER BY o.createdAt DESC
        `
      );

      const ontologies = result.records.map((record) => ({
        id: record.get("id"),
        name: record.get("name"),
        description: record.get("description") || "",
        createdAt: record.get("createdAt"),
        updatedAt: record.get("updatedAt"),
        entities: record.get("entities").filter((e: any) => e).map((e: any) => ({
          type: e.properties.type,
          description: e.properties.description,
          examples: e.properties.examples || [],
          color: e.properties.color || "#64748b",
        })),
        relationships: record.get("relationships").filter((r: any) => r).map((r: any) => ({
          type: r.properties.type,
          description: r.properties.description,
          fromType: r.properties.fromType,
          toType: r.properties.toType,
        })),
      }));

      return NextResponse.json({ ontologies });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error fetching ontologies:", error);
    return NextResponse.json(
      { error: "Failed to fetch ontologies" },
      { status: 500 }
    );
  }
}

// POST - Create new ontology
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with Zod
    const validation = OntologySchema.omit({ id: true, createdAt: true, updatedAt: true }).safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid ontology data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { name, description, entities, relationships } = validation.data;
    const ontologyId = `ontology-${Date.now()}`;

    const session = getSession();

    try {
      // Create ontology node
      await session.run(
        `
        CREATE (o:Ontology {
          id: $id,
          name: $name,
          description: $description,
          createdAt: datetime(),
          updatedAt: datetime()
        })
        `,
        {
          id: ontologyId,
          name,
          description: description || "",
        }
      );

      // Create entity definitions
      for (const entity of entities) {
        await session.run(
          `
          MATCH (o:Ontology {id: $ontologyId})
          CREATE (e:EntityDefinition {
            type: $type,
            description: $description,
            examples: $examples,
            color: $color
          })
          CREATE (o)-[:DEFINES]->(e)
          `,
          {
            ontologyId,
            type: entity.type,
            description: entity.description,
            examples: entity.examples || [],
            color: entity.color || "#64748b",
          }
        );
      }

      // Create relationship definitions
      if (relationships) {
        for (const rel of relationships) {
          await session.run(
            `
            MATCH (o:Ontology {id: $ontologyId})
            CREATE (r:RelationshipDefinition {
              type: $type,
              description: $description,
              fromType: $fromType,
              toType: $toType
            })
            CREATE (o)-[:DEFINES]->(r)
            `,
            {
              ontologyId,
              type: rel.type,
              description: rel.description,
              fromType: rel.fromType || null,
              toType: rel.toType || null,
            }
          );
        }
      }

      return NextResponse.json({
        success: true,
        ontologyId,
        message: "Ontology created successfully",
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error creating ontology:", error);
    return NextResponse.json(
      { error: "Failed to create ontology" },
      { status: 500 }
    );
  }
}
