import ArticleInput from "@/components/ArticleInput";
import ArticleList from "@/components/ArticleList";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Article Knowledge Graph
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Transform any article into an interactive mind map
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ArticleInput />
          </div>
          <div>
            <ArticleList />
          </div>
        </div>
      </div>
    </div>
  );
}
