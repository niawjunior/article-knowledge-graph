'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Loader2, BookOpen, ArrowRight, Grid, List } from 'lucide-react';
import { EntityDefinition, RelationshipDefinition } from '@/lib/ontology-types';
import dynamic from 'next/dynamic';

const OntologyVisualEditor = dynamic(() => import('@/components/OntologyVisualEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-slate-50 dark:bg-slate-900 rounded-lg">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    </div>
  ),
});

export default function NewOntologyPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entities, setEntities] = useState<EntityDefinition[]>([
    { type: '', description: '', examples: [], color: '#64748b' }
  ]);
  const [relationships, setRelationships] = useState<RelationshipDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editorMode, setEditorMode] = useState<'simple' | 'visual'>('simple');

  const addEntity = () => {
    setEntities([...entities, { type: '', description: '', examples: [], color: '#64748b' }]);
  };

  const removeEntity = (index: number) => {
    setEntities(entities.filter((_, i) => i !== index));
  };

  const updateEntity = (index: number, field: keyof EntityDefinition, value: any) => {
    const updated = [...entities];
    updated[index] = { ...updated[index], [field]: value };
    setEntities(updated);
  };

  const addRelationship = () => {
    setRelationships([...relationships, { type: '', description: '' }]);
  };

  const removeRelationship = (index: number) => {
    setRelationships(relationships.filter((_, i) => i !== index));
  };

  const updateRelationship = (index: number, field: keyof RelationshipDefinition, value: any) => {
    const updated = [...relationships];
    updated[index] = { ...updated[index], [field]: value };
    setRelationships(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate
    if (!name.trim()) {
      setError('Ontology name is required');
      setIsLoading(false);
      return;
    }

    const validEntities = entities.filter(e => e.type.trim() && e.description.trim());
    if (validEntities.length === 0) {
      setError('At least one entity with type and description is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ontologies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          entities: validEntities,
          relationships: relationships.filter(r => r.type.trim() && r.description.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create ontology');
      }

      // Redirect back to home
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Create Custom Ontology
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Define your own entity types and relationships for domain-specific extraction
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ontology Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Healthcare Records, Legal Documents"
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this ontology is for..."
                rows={2}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Editor Mode Toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Editor Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEditorMode('simple')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  editorMode === 'simple'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <List className={`w-5 h-5 ${
                  editorMode === 'simple' ? 'text-blue-600' : 'text-slate-400'
                }`} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    editorMode === 'simple' ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    Simple Mode
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Form-based editor
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  editorMode === 'visual'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                <Grid className={`w-5 h-5 ${
                  editorMode === 'visual' ? 'text-purple-600' : 'text-slate-400'
                }`} />
                <div className="text-left">
                  <div className={`font-semibold text-sm ${
                    editorMode === 'visual' ? 'text-purple-900 dark:text-purple-100' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    Visual Mode
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Drag-and-drop canvas
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Visual Editor */}
          {editorMode === 'visual' ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Visual Ontology Editor
              </h2>
              <OntologyVisualEditor
                entities={entities}
                relationships={relationships}
                onEntitiesChange={setEntities}
                onRelationshipsChange={setRelationships}
              />
            </div>
          ) : (
            <>
          {/* Entity Definitions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Entity Types
              </h2>
              <button
                type="button"
                onClick={addEntity}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Entity
              </button>
            </div>

            <div className="space-y-4">
              {entities.map((entity, index) => (
                <div key={index} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Entity Type *
                          </label>
                          <input
                            type="text"
                            value={entity.type}
                            onChange={(e) => updateEntity(index, 'type', e.target.value)}
                            placeholder="e.g., Patient, Doctor"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Color
                          </label>
                          <input
                            type="color"
                            value={entity.color}
                            onChange={(e) => updateEntity(index, 'color', e.target.value)}
                            className="w-full h-10 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                      {/* Entity Preview */}
                      {entity.type && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entity.color }}
                          ></div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {entity.type}
                          </span>
                        </div>
                      )}
                    </div>
                    {entities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntity(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Description * (Help AI understand what this entity means)
                      </label>
                      <textarea
                        value={entity.description}
                        onChange={(e) => updateEntity(index, 'description', e.target.value)}
                        placeholder="e.g., A person receiving medical treatment or care"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Examples (Optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={entity.examples?.join(', ') || ''}
                        onChange={(e) => updateEntity(index, 'examples', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        placeholder="e.g., John Doe, Patient ID 12345"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Definitions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Relationship Types (Optional)
              </h2>
              <button
                type="button"
                onClick={addRelationship}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Relationship
              </button>
            </div>

            {relationships.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                No relationships defined. AI will infer appropriate relationships.
              </p>
            ) : (
              <div className="space-y-4">
                {relationships.map((rel, index) => (
                  <div key={index} className="p-4 border border-slate-200 dark:border-slate-600 rounded-lg space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Relationship Type
                          </label>
                          <input
                            type="text"
                            value={rel.type}
                            onChange={(e) => updateRelationship(index, 'type', e.target.value)}
                            placeholder="e.g., diagnosed-with, treated-by"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={rel.description}
                            onChange={(e) => updateRelationship(index, 'description', e.target.value)}
                            placeholder="e.g., Patient has been diagnosed with a condition"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              From Type (Optional)
                            </label>
                            <select
                              value={rel.fromType || ''}
                              onChange={(e) => updateRelationship(index, 'fromType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            >
                              <option value="">Any entity type</option>
                              {entities.filter(e => e.type.trim()).map((entity, idx) => (
                                <option key={idx} value={entity.type}>
                                  {entity.type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              To Type (Optional)
                            </label>
                            <select
                              value={rel.toType || ''}
                              onChange={(e) => updateRelationship(index, 'toType', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                            >
                              <option value="">Any entity type</option>
                              {entities.filter(e => e.type.trim()).map((entity, idx) => (
                                <option key={idx} value={entity.type}>
                                  {entity.type}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {/* Relationship Preview */}
                        {rel.type && (rel.fromType || rel.toType) && (
                          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {rel.fromType || 'Any'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                              {rel.type}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {rel.toType || 'Any'}
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRelationship(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Ontology
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
