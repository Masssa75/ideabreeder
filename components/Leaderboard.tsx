'use client';

import { useState } from 'react';

interface Idea {
  id: string;
  name: string;
  description: string;
  hook: string;
  virus_score: number;
  generation: number;
  scores?: {
    virality: number;
    immediacy: number;
    recurrence: number;
    urgency: number;
    simplicity: number;
  };
  genes_used: string[];
  genes_extracted: string[];
  reasoning: string;
}

interface LeaderboardProps {
  ideas: Idea[];
}

export default function Leaderboard({ ideas }: LeaderboardProps) {
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 40) return 'text-green-400';
    if (score >= 30) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getIndividualScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMedal = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  return (
    <>
      <div className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold text-white/90 mb-3">Top Ideas</h2>

        {ideas.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            <p>No ideas yet. Evolution in progress...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea, index) => (
              <div
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getMedal(index)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-white truncate">
                        {idea.name}
                      </h3>
                      <span className={`text-sm font-mono ${getScoreColor(idea.virus_score)}`}>
                        {idea.virus_score}/50
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">
                      {idea.hook}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      Gen #{idea.generation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedIdea && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedIdea(null)}
        >
          <div
            className="glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-white">{selectedIdea.name}</h2>
              <button
                onClick={() => setSelectedIdea(null)}
                className="text-white/50 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className={`text-3xl font-bold mb-4 ${getScoreColor(selectedIdea.virus_score)}`}>
              {selectedIdea.virus_score}/50
              <span className="text-sm text-white/50 font-normal ml-2">VIRUS Score</span>
            </div>

            {selectedIdea.scores && (
              <div className="grid grid-cols-5 gap-2 mb-6 bg-white/5 rounded-lg p-3">
                {[
                  { key: 'virality', label: 'V', title: 'Virality' },
                  { key: 'immediacy', label: 'I', title: 'Immediacy' },
                  { key: 'recurrence', label: 'R', title: 'Recurrence' },
                  { key: 'urgency', label: 'U', title: 'Urgency' },
                  { key: 'simplicity', label: 'S', title: 'Simplicity' }
                ].map(({ key, label, title }) => (
                  <div key={key} className="text-center">
                    <div className="text-xs text-white/50 mb-1" title={title}>{title}</div>
                    <div className={`text-xl font-bold ${getIndividualScoreColor(selectedIdea.scores![key as keyof typeof selectedIdea.scores])}`}>
                      {selectedIdea.scores![key as keyof typeof selectedIdea.scores]}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white/70 mb-2">The Hook</h3>
              <p className="text-indigo-300 italic">&ldquo;{selectedIdea.hook}&rdquo;</p>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white/70 mb-2">Description</h3>
              <p className="text-white/80 leading-relaxed">{selectedIdea.description}</p>
            </div>

            {selectedIdea.reasoning && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/70 mb-2">AI Analysis</h3>
                <p className="text-white/60 text-sm italic">{selectedIdea.reasoning}</p>
              </div>
            )}

            {selectedIdea.genes_used && selectedIdea.genes_used.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/70 mb-2">Genes Used (Input)</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedIdea.genes_used.map((gene) => (
                    <span key={gene} className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {gene}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedIdea.genes_extracted && selectedIdea.genes_extracted.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/70 mb-2">Genes Extracted (Output)</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedIdea.genes_extracted.map((gene) => (
                    <span key={gene} className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                      + {gene}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-white/40 pt-4 border-t border-white/10">
              Generated in Generation #{selectedIdea.generation}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
