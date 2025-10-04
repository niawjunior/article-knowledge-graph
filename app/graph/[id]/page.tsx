import GraphVisualization from '@/components/GraphVisualization';

export default async function GraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900">
      <GraphVisualization articleId={id} />
    </div>
  );
}
