"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Zap, Settings, Plus, Library } from "lucide-react";
import { ARTICLE_TYPES, ArticleType } from "@/lib/article-types";
import { ExtractionMode, Ontology } from "@/lib/ontology-types";

export default function ArticleInput() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [articleType, setArticleType] = useState<ArticleType>("general");
  const [mode, setMode] = useState<ExtractionMode>("easy");
  const [ontologyId, setOntologyId] = useState<string>("");
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOntologies, setIsLoadingOntologies] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Fetch ontologies when in advanced mode
  useEffect(() => {
    if (mode === "advanced") {
      fetchOntologies();
    }
  }, [mode]);

  const fetchOntologies = async () => {
    try {
      setIsLoadingOntologies(true);
      const response = await fetch("/api/ontologies");
      if (response.ok) {
        const data = await response.json();
        setOntologies(data.ontologies || []);
      }
    } catch (err) {
      console.error("Failed to fetch ontologies:", err);
    } finally {
      setIsLoadingOntologies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          articleType: mode === "easy" ? articleType : "general",
          mode,
          ontologyId: mode === "advanced" ? ontologyId : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process article");
      }

      // Redirect to graph view
      router.push(`/graph/${data.articleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Add New Article
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Extraction Mode *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("easy")}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                mode === "easy"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <Zap
                className={`w-5 h-5 ${
                  mode === "easy" ? "text-blue-600" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div
                  className={`font-semibold ${
                    mode === "easy"
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Easy Mode
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Auto extract entities
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("advanced")}
              className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                mode === "advanced"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <Settings
                className={`w-5 h-5 ${
                  mode === "advanced" ? "text-purple-600" : "text-slate-400"
                }`}
              />
              <div className="text-left">
                <div
                  className={`font-semibold ${
                    mode === "advanced"
                      ? "text-purple-900 dark:text-purple-100"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  Advanced Mode
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Custom ontology
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Article Type (Easy Mode) or Ontology Selection (Advanced Mode) */}
        {mode === "easy" ? (
          <div>
            <label
              htmlFor="articleType"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Article Type *
            </label>
            <select
              id="articleType"
              value={articleType}
              onChange={(e) => setArticleType(e.target.value as ArticleType)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              {ARTICLE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {ARTICLE_TYPES.find((t) => t.id === articleType)?.description}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="ontology"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Select Ontology *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/ontologies/new")}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  title="Create new ontology"
                >
                  <Plus className="w-3 h-3" />
                  New
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/ontologies")}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                  title="Manage ontologies"
                >
                  <Library className="w-3 h-3" />
                  Manage
                </button>
              </div>
            </div>
            {isLoadingOntologies ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              </div>
            ) : ontologies.length === 0 ? (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  No ontologies found. Please create one first.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/ontologies/new")}
                  className="mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Create Ontology →
                </button>
              </div>
            ) : (
              <>
                <select
                  id="ontology"
                  value={ontologyId}
                  onChange={(e) => setOntologyId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select an ontology...</option>
                  {ontologies.map((ont) => (
                    <option key={ont.id} value={ont.id}>
                      {ont.name} ({ont.entities.length} entities)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {ontologyId &&
                    ontologies.find((o) => o.id === ontologyId)?.description}
                </p>
              </>
            )}
          </div>
        )}

        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Article Title (Optional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter article title..."
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Article Content *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your article content here..."
            rows={4}
            required
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Generate Knowledge Graph
            </>
          )}
        </button>
      </form>
    </div>
  );
}
