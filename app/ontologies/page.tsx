'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, BookOpen, Edit } from 'lucide-react';
import { Ontology } from '@/lib/ontology-types';

export default function OntologiesPage() {
  const router = useRouter();
  const [ontologies, setOntologies] = useState<Ontology[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOntologies();
  }, []);

  const fetchOntologies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ontologies');
      if (response.ok) {
        const data = await response.json();
        setOntologies(data.ontologies || []);
      }
    } catch (err) {
      console.error('Failed to fetch ontologies:', err);
      setError('Failed to load ontologies');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ontologies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOntologies(ontologies.filter(o => o.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete ontology');
      }
    } catch (err) {
      console.error('Failed to delete ontology:', err);
      alert('Failed to delete ontology');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Ontology Library
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Manage your custom ontologies for domain-specific extraction
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/ontologies/new')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Ontology
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : ontologies.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No Ontologies Yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Create your first custom ontology to start extracting domain-specific entities
            </p>
            <button
              onClick={() => router.push('/ontologies/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ontology
            </button>
          </div>
        ) : (
          /* Ontology Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ontologies.map((ontology) => (
              <div
                key={ontology.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {ontology.name}
                    </h3>
                    {ontology.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {ontology.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span className="text-slate-600 dark:text-slate-400">
                      {ontology.entities.length} entities
                    </span>
                  </div>
                  {ontology.relationships && ontology.relationships.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {ontology.relationships.length} relationships
                      </span>
                    </div>
                  )}
                </div>

                {/* Entity Types Preview */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {ontology.entities.slice(0, 4).map((entity, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded"
                        style={{
                          backgroundColor: entity.color + '20',
                          color: entity.color,
                          borderColor: entity.color,
                          borderWidth: '1px',
                        }}
                      >
                        {entity.type}
                      </span>
                    ))}
                    {ontology.entities.length > 4 && (
                      <span className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                        +{ontology.entities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/ontologies/${ontology.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ontology.id, ontology.name)}
                    disabled={deletingId === ontology.id}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === ontology.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
