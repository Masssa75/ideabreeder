'use client';

interface BreedingViewProps {
  status: string;
  currentIdea: {
    name: string;
    description: string;
    hook: string;
  } | null;
  scores: {
    virality: number;
    immediacy: number;
    recurrence: number;
    urgency: number;
    simplicity: number;
  } | null;
  virusScore: number | null;
  genesUsed: string[];
  genesExtracted: string[];
  reasoning: string;
  generation: number;
}

export default function BreedingView({
  status,
  currentIdea,
  scores,
  virusScore,
  genesUsed,
  genesExtracted,
  reasoning,
  generation
}: BreedingViewProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'selecting_genes': return 'text-blue-400';
      case 'breeding': return 'text-purple-400';
      case 'scoring': return 'text-yellow-400';
      case 'extracting': return 'text-green-400';
      case 'complete': return 'text-emerald-400';
      default: return 'text-white/50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'selecting_genes': return 'Selecting genes...';
      case 'breeding': return 'Breeding new idea...';
      case 'scoring': return 'Scoring with VIRUS framework...';
      case 'extracting': return 'Extracting new genes...';
      case 'complete': return 'Generation complete!';
      default: return 'Idle';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    if (score >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white/90">
          Generation #{generation}
        </h2>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {status !== 'idle' && (
            <span className="inline-block w-2 h-2 rounded-full bg-current mr-2 animate-pulse" />
          )}
          {getStatusText()}
        </span>
      </div>

      {/* Genes being combined */}
      {genesUsed.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-white/50 mb-2">Combining genes:</p>
          <div className="flex flex-wrap gap-2">
            {genesUsed.map((gene) => (
              <span key={gene} className="gene-pill text-xs">
                {gene}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Current Idea */}
      {currentIdea && (
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <h3 className="text-xl font-bold text-white mb-2">{currentIdea.name}</h3>
          <p className="text-white/70 text-sm mb-3">{currentIdea.description}</p>
          <p className="text-indigo-300 text-sm italic">&ldquo;{currentIdea.hook}&rdquo;</p>
        </div>
      )}

      {/* VIRUS Scores */}
      {scores && (
        <div className="mb-4">
          <div className="grid grid-cols-5 gap-2 mb-2">
            {[
              { key: 'virality', label: 'V', title: 'Virality' },
              { key: 'immediacy', label: 'I', title: 'Immediacy' },
              { key: 'recurrence', label: 'R', title: 'Recurrence' },
              { key: 'urgency', label: 'U', title: 'Urgency' },
              { key: 'simplicity', label: 'S', title: 'Simplicity' }
            ].map(({ key, label, title }) => (
              <div key={key} className="text-center">
                <div className="text-xs text-white/50 mb-1" title={title}>{label}</div>
                <div className={`text-2xl font-bold ${getScoreColor(scores[key as keyof typeof scores])}`}>
                  {scores[key as keyof typeof scores]}
                </div>
              </div>
            ))}
          </div>
          {virusScore !== null && (
            <div className="text-center mt-2 pt-2 border-t border-white/10">
              <span className="text-white/50 text-sm">VIRUS Score: </span>
              <span className={`text-2xl font-bold ${getScoreColor(virusScore / 5)}`}>
                {virusScore}/50
              </span>
            </div>
          )}
          {reasoning && (
            <p className="text-xs text-white/40 mt-2 italic">{reasoning}</p>
          )}
        </div>
      )}

      {/* Extracted Genes */}
      {genesExtracted.length > 0 && (
        <div>
          <p className="text-xs text-white/50 mb-2">New genes discovered:</p>
          <div className="flex flex-wrap gap-2">
            {genesExtracted.map((gene) => (
              <span key={gene} className="gene-pill text-xs bg-green-500/20 border-green-500/30">
                + {gene}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Idle State */}
      {status === 'idle' && !currentIdea && (
        <div className="text-center py-8 text-white/40">
          <p>Ready to evolve</p>
        </div>
      )}
    </div>
  );
}
