"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2, FileText, Zap, Settings } from "lucide-react";

interface ArticleEditorProps {
  articleId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ArticleEditor({
  articleId,
  onClose,
  onSave,
}: ArticleEditorProps) {
  const [article, setArticle] = useState<{
    title: string;
    content: string;
    articleType: string;
    mode?: string;
    ontologyId?: string;
    ontologyName?: string;
  } | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchArticle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/articles/${articleId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch article");
      }

      const data = await response.json();
      setArticle(data);
      setEditedContent(data.content);
      setEditedTitle(data.title || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");

      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update article");
      }

      // Refresh the graph
      onSave();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save article");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isEditing ? "Edit Article" : "View Article"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          ) : article ? (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Title
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Article title..."
                  />
                ) : (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                    {article.title || "Untitled"}
                  </div>
                )}
              </div>

              {/* Extraction Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Extraction Mode
                </label>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  {article.mode === 'advanced' ? (
                    <>
                      <Settings className="w-4 h-4 text-purple-600" />
                      <span className="text-slate-900 dark:text-white font-medium">Advanced Mode</span>
                      {article.ontologyName && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          • Ontology: {article.ontologyName}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-900 dark:text-white font-medium">Easy Mode</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        • Type: {article.articleType}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Content
                </label>
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none font-mono text-sm"
                    placeholder="Article content..."
                  />
                ) : (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
                    {article.content}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent(article?.content || "");
                    setEditedTitle(article?.title || "");
                  }}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Regenerate
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Article
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
