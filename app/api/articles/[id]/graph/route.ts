import { NextRequest, NextResponse } from 'next/server';
import { getArticleGraph } from '@/lib/graph-operations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const graphData = await getArticleGraph(id);
    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Error fetching graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graph data' },
      { status: 500 }
    );
  }
}
