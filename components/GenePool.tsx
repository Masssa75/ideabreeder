'use client';

interface Gene {
  text: string;
  fitness: number;
}

interface GenePoolProps {
  genes: Gene[];
  selectedGenes: string[];
  maxDisplay?: number;
}

export default function GenePool({ genes, selectedGenes, maxDisplay = 30 }: GenePoolProps) {
  const displayGenes = genes.slice(0, maxDisplay);

  const getFitnessColor = (fitness: number) => {
    if (fitness >= 7) return 'from-green-500/30 to-emerald-500/30 border-green-500/50';
    if (fitness >= 5) return 'from-yellow-500/30 to-amber-500/30 border-yellow-500/50';
    return 'from-red-500/30 to-orange-500/30 border-red-500/50';
  };

  const getFitnessWidth = (fitness: number) => `${(fitness / 10) * 100}%`;

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white/90">Gene Pool</h2>
        <span className="text-sm text-white/50">{genes.length} genes</span>
      </div>

      {genes.length === 0 ? (
        <div className="text-center py-8 text-white/40">
          <p>No genes yet. Starting evolution...</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {displayGenes.map((gene, index) => (
            <div
              key={gene.text}
              className={`relative rounded-lg p-2 transition-all ${
                selectedGenes.includes(gene.text)
                  ? 'ring-2 ring-indigo-500 bg-indigo-500/20'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-white/80 truncate flex-1">
                  {gene.text}
                </span>
                <span className="text-xs font-mono text-white/50 w-8 text-right">
                  {gene.fitness.toFixed(1)}
                </span>
              </div>
              <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getFitnessColor(gene.fitness)} transition-all duration-500`}
                  style={{ width: getFitnessWidth(gene.fitness) }}
                />
              </div>
              {selectedGenes.includes(gene.text) && (
                <div className="absolute -right-1 -top-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )}

      {genes.length > maxDisplay && (
        <p className="text-xs text-white/40 mt-2 text-center">
          +{genes.length - maxDisplay} more genes
        </p>
      )}
    </div>
  );
}
