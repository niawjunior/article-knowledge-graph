import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/neo4j";
import { OntologySchema } from "@/lib/ontology-types";

// GET - Fetch single ontology
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ontologyId = (await params).id;
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (o:Ontology {id: $ontologyId})
        OPTIONAL MATCH (o)-[:DEFINES]->(e:EntityDefinition)
        OPTIONAL MATCH (o)-[:DEFINES]->(r:RelationshipDefinition)
        RETURN o.id as id, o.name as name, o.description as description,
               o.createdAt as createdAt, o.updatedAt as updatedAt,
               collect(DISTINCT e) as entities,
               collect(DISTINCT r) as relationships
        `,
        { ontologyId }
      );

      if (result.records.length === 0) {
        return NextResponse.json(
          { error: "Ontology not found" },
          { status: 404 }
        );
      }

      const record = result.records[0];
      const ontology = {
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
      };

      return NextResponse.json(ontology);
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error fetching ontology:", error);
    return NextResponse.json(
      { error: "Failed to fetch ontology" },
      { status: 500 }
    );
  }
}

// PATCH - Update ontology
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ontologyId = (await params).id;
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

    const session = getSession();

    try {
      // Update ontology node
      await session.run(
        `
        MATCH (o:Ontology {id: $id})
        SET o.name = $name,
            o.description = $description,
            o.updatedAt = datetime()
        `,
        {
          id: ontologyId,
          name,
          description: description || "",
        }
      );

      // Delete old definitions
      await session.run(
        `
        MATCH (o:Ontology {id: $ontologyId})-[:DEFINES]->(def)
        DETACH DELETE def
        `,
        { ontologyId }
      );

      // Create new entity definitions
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

      // Create new relationship definitions
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
        message: "Ontology updated successfully",
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error updating ontology:", error);
    return NextResponse.json(
      { error: "Failed to update ontology" },
      { status: 500 }
    );
  }
}

// DELETE - Delete ontology
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ontologyId = (await params).id;
    const session = getSession();

    try {
      await session.run(
        `
        MATCH (o:Ontology {id: $ontologyId})
        OPTIONAL MATCH (o)-[:DEFINES]->(def)
        DETACH DELETE o, def
        `,
        { ontologyId }
      );

      return NextResponse.json({
        success: true,
        message: "Ontology deleted successfully",
      });
    } finally {
      await session.close();
    }
  } catch (error) {
    console.error("Error deleting ontology:", error);
    return NextResponse.json(
      { error: "Failed to delete ontology" },
      { status: 500 }
    );
  }
}
