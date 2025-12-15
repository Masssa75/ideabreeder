'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Idea {
  id: string;
  name: string;
  description: string;
  hook: string;
  virus_score: number;
  scores: Record<string, number>;
  genes_used: string[];
  genes_extracted: string[];
  reasoning: string;
  generation: number;
  created_at: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryModal({ isOpen, onClose }: HistoryModalProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    if (isOpen) {
      loadIdeas();
    }
  }, [isOpen]);

  const loadIdeas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setIdeas(data);
    }
    setLoading(false);
  };

  const sortedIdeas = [...ideas].sort((a, b) => {
    if (sortBy === 'score') {
      return b.virus_score - a.virus_score;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getScoreColor = (score: number, max: number = 60) => {
    const pct = score / max;
    if (pct >= 0.7) return 'text-green-400';
    if (pct >= 0.5) return 'text-yellow-400';
    if (pct >= 0.3) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Idea History</h2>
            <p className="text-sm text-white/50">{ideas.length} ideas generated</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
              className="bg-white/10 text-white text-sm rounded px-3 py-1 border border-white/20"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
            </select>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="text-center text-white/50 py-8">Loading...</div>
          ) : ideas.length === 0 ? (
            <div className="text-center text-white/50 py-8">No ideas yet. Start evolution to generate ideas!</div>
          ) : selectedIdea ? (
            /* Idea Detail View */
            <div>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-indigo-400 text-sm mb-4 hover:underline"
              >
                &larr; Back to list
              </button>

              <div className="bg-white/5 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{selectedIdea.name}</h3>
                    <p className="text-white/50 text-sm">
                      Generation #{selectedIdea.generation} &bull; {formatDate(selectedIdea.created_at)}
                    </p>
                  </div>
                  <div className={`text-3xl font-bold ${getScoreColor(selectedIdea.virus_score, selectedIdea.scores?.utility !== undefined ? 60 : 50)}`}>
                    {selectedIdea.virus_score}/{selectedIdea.scores?.utility !== undefined ? 60 : 50}
                  </div>
                </div>

                <p className="text-white/80 mb-4">{selectedIdea.description}</p>
                <p className="text-indigo-300 italic mb-6">&ldquo;{selectedIdea.hook}&rdquo;</p>

                {/* Scores */}
                {selectedIdea.scores && (
                  <div className="mb-6">
                    {/* Detect which scoring system was used */}
                    {selectedIdea.scores.utility !== undefined ? (
                      <>
                        <h4 className="text-sm text-white/50 mb-2">USEFUL Scores</h4>
                        <div className="grid grid-cols-6 gap-3">
                          {[
                            { key: 'utility', label: 'Utility' },
                            { key: 'simplicity', label: 'Simplicity' },
                            { key: 'economics', label: 'Economics' },
                            { key: 'frequency', label: 'Frequency' },
                            { key: 'uniqueness', label: 'Uniqueness' },
                            { key: 'leverage', label: 'Leverage' }
                          ].map(({ key, label }) => (
                            <div key={key} className="bg-white/5 rounded p-2 text-center">
                              <div className="text-xs text-white/50 mb-1">{label}</div>
                              <div className={`text-xl font-bold ${getScoreColor((selectedIdea.scores[key] || 0) * 6, 60)}`}>
                                {selectedIdea.scores[key] ?? '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 className="text-sm text-white/50 mb-2">VIRUS Scores (Legacy)</h4>
                        <div className="grid grid-cols-5 gap-3">
                          {[
                            { key: 'virality', label: 'Virality' },
                            { key: 'immediacy', label: 'Immediacy' },
                            { key: 'recurrence', label: 'Recurrence' },
                            { key: 'urgency', label: 'Urgency' },
                            { key: 'simplicity', label: 'Simplicity' }
                          ].map(({ key, label }) => (
                            <div key={key} className="bg-white/5 rounded p-2 text-center">
                              <div className="text-xs text-white/50 mb-1">{label}</div>
                              <div className={`text-xl font-bold ${getScoreColor((selectedIdea.scores[key] || 0) * 5, 50)}`}>
                                {selectedIdea.scores[key] ?? '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Reasoning */}
                {selectedIdea.reasoning && (
                  <div className="mb-6">
                    <h4 className="text-sm text-white/50 mb-2">AI Analysis</h4>
                    <p className="text-white/70 text-sm bg-white/5 rounded p-3">{selectedIdea.reasoning}</p>
                  </div>
                )}

                {/* Genes */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm text-white/50 mb-2">Genes Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.genes_used?.map((gene) => (
                        <span key={gene} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          {gene}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm text-white/50 mb-2">Genes Extracted</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedIdea.genes_extracted?.map((gene) => (
                        <span key={gene} className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                          + {gene}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Ideas List */
            <div className="space-y-2">
              {sortedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className="bg-white/5 hover:bg-white/10 rounded-lg p-4 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white truncate">{idea.name}</h3>
                        <span className="text-xs text-white/40">Gen #{idea.generation}</span>
                      </div>
                      <p className="text-sm text-white/50 truncate">{idea.hook}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <span className="text-xs text-white/40">{formatDate(idea.created_at)}</span>
                      <span className={`text-lg font-bold ${getScoreColor(idea.virus_score)}`}>
                        {idea.virus_score}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
