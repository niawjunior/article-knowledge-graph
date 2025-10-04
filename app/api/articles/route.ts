import { NextRequest, NextResponse } from 'next/server';
import { extractEntitiesFromArticle } from '@/lib/openai';
import { createArticleGraph, getAllArticles } from '@/lib/graph-operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Article content is required' },
        { status: 400 }
      );
    }

    // Generate article ID
    const articleId = `article-${Date.now()}`;

    // Extract entities using OpenAI
    const extracted = await extractEntitiesFromArticle(content, title);

    // Store in Neo4j
    await createArticleGraph(
      articleId,
      title || 'Untitled Article',
      content,
      extracted.summary,
      extracted.entities,
      extracted.relationships
    );

    return NextResponse.json({
      success: true,
      articleId,
      summary: extracted.summary,
      entitiesCount: extracted.entities.length,
      relationshipsCount: extracted.relationships.length,
    });
  } catch (error) {
    console.error('Error processing article:', error);
    return NextResponse.json(
      { error: 'Failed to process article', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const articles = await getAllArticles();
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
