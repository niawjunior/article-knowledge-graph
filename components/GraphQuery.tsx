"use client";

import { useState, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  highlightNodes?: string[];
}

interface GraphQueryProps {
  articleId: string;
  onHighlight?: (nodeIds: string[]) => void;
}

export default function GraphQuery({ articleId, onHighlight }: GraphQueryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([
    "What are the key entities?",
    "Who are the people mentioned?",
    "Show me all organizations",
    "What are the main relationships?",
  ]);

  // Fetch article-specific example questions
  useEffect(() => {
    const fetchExamples = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}/examples`);
        if (response.ok) {
          const data = await response.json();
          if (data.questions && data.questions.length > 0) {
            setExampleQuestions(data.questions);
          }
        }
      } catch (err) {
        // Keep default questions if fetch fails
        console.error('Failed to fetch example questions:', err);
      }
    };

    fetchExamples();
  }, [articleId]);

  const handleSubmit = async (question?: string) => {
    const queryText = question || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: queryText };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/articles/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId, question: queryText }),
      });

      if (!response.ok) throw new Error('Query failed');

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer,
        highlightNodes: data.highlightNodes,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Highlight nodes if callback provided
      if (data.highlightNodes && data.highlightNodes.length > 0 && onHighlight) {
        console.log('Highlighting nodes:', data.highlightNodes);
        onHighlight(data.highlightNodes);
      }
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Ask About This Graph
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ask questions about entities and relationships
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Try asking:
            </p>
            {exampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(q)}
                className="w-full text-left p-3 text-sm bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-slate-300"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.highlightNodes && message.highlightNodes.length > 0 && (
                <button
                  onClick={() => {
                    console.log('Highlight button clicked with nodes:', message.highlightNodes);
                    onHighlight?.(message.highlightNodes!);
                  }}
                  className="mt-2 text-xs underline opacity-75 hover:opacity-100"
                >
                  Highlight on graph ({message.highlightNodes.length} nodes)
                </button>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
