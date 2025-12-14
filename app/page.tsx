'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GenePool from '@/components/GenePool';
import BreedingView from '@/components/BreedingView';
import Leaderboard from '@/components/Leaderboard';
import ActivityLog from '@/components/ActivityLog';

interface Gene {
  text: string;
  fitness: number;
}

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

const SEED_GENES = [
  'screenshot-ready output',
  'public accountability',
  'solo founders',
  'weekly ritual',
  'professional anxiety',
  'badge embed for virality',
  'fear of missing out',
  'social proof display',
  'one-click sharing',
  'leaderboard competition',
  'AI-powered analysis',
  'instant gratification',
  'status signaling',
  'community validation',
  'gamification mechanics'
];

export default function Home() {
  const [genes, setGenes] = useState<Gene[]>([]);
  const [topIdeas, setTopIdeas] = useState<Idea[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [generation, setGeneration] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState<string>('idle');

  const [currentIdea, setCurrentIdea] = useState<{ name: string; description: string; hook: string } | null>(null);
  const [scores, setScores] = useState<{ virality: number; immediacy: number; recurrence: number; urgency: number; simplicity: number } | null>(null);
  const [virusScore, setVirusScore] = useState<number | null>(null);
  const [genesUsed, setGenesUsed] = useState<string[]>([]);
  const [genesExtracted, setGenesExtracted] = useState<string[]>([]);
  const [reasoning, setReasoning] = useState('');

  const isRunningRef = useRef(false);

  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev.slice(-100), message]);
  }, []);

  const selectGenes = useCallback((genePool: Gene[], count: number = 3): string[] => {
    if (genePool.length === 0) return SEED_GENES.slice(0, count);

    const totalFitness = genePool.reduce((sum, g) => sum + g.fitness, 0);
    const selected: string[] = [];
    const available = [...genePool];

    while (selected.length < count && available.length > 0) {
      let random = Math.random() * totalFitness;
      for (let i = 0; i < available.length; i++) {
        random -= available[i].fitness;
        if (random <= 0) {
          selected.push(available[i].text);
          available.splice(i, 1);
          break;
        }
      }
    }

    if (selected.length < count && Math.random() < 0.3) {
      const randomSeed = SEED_GENES[Math.floor(Math.random() * SEED_GENES.length)];
      if (!selected.includes(randomSeed)) {
        selected.push(randomSeed);
      }
    }

    return selected;
  }, []);

  const updateGeneFitness = useCallback((geneTexts: string[], scoreDelta: number) => {
    setGenes(prev => {
      const updated = [...prev];

      for (const text of geneTexts) {
        const normalizedText = text.toLowerCase().trim();
        const existing = updated.find(g => g.text === normalizedText);

        if (existing) {
          existing.fitness = Math.max(0.5, Math.min(10, existing.fitness + scoreDelta));
        } else {
          updated.push({
            text: normalizedText,
            fitness: 5 + scoreDelta
          });
        }
      }

      return updated.sort((a, b) => b.fitness - a.fitness);
    });
  }, []);

  const runGeneration = useCallback(async () => {
    if (!isRunningRef.current) return;

    try {
      setStatus('selecting_genes');
      addLog(`Starting generation #${generation}`);

      const selectedGenes = selectGenes(genes, 3);
      setGenesUsed(selectedGenes);
      addLog(`Selected genes: ${selectedGenes.join(', ')}`);

      await new Promise(r => setTimeout(r, 1000));
      if (!isRunningRef.current) return;

      setStatus('breeding');
      addLog('Breeding new idea from genes...');

      const generateRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genes: selectedGenes })
      });

      if (!generateRes.ok) throw new Error('Failed to generate idea');
      const { idea } = await generateRes.json();

      setCurrentIdea(idea);
      addLog(`Generated: "${idea.name}"`);

      await new Promise(r => setTimeout(r, 1500));
      if (!isRunningRef.current) return;

      setStatus('scoring');
      addLog('Scoring with VIRUS framework...');

      const scoreRes = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });

      if (!scoreRes.ok) throw new Error('Failed to score idea');
      const scoreData = await scoreRes.json();

      setScores(scoreData.scores);
      setVirusScore(scoreData.virus_score);
      setReasoning(scoreData.reasoning);
      addLog(`VIRUS Score: ${scoreData.virus_score}/50`);

      const fitnessDelta = (scoreData.virus_score - 25) / 25;
      updateGeneFitness(selectedGenes, fitnessDelta);

      await new Promise(r => setTimeout(r, 1500));
      if (!isRunningRef.current) return;

      setStatus('extracting');
      addLog('Extracting new genes...');

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, scores: scoreData.scores })
      });

      if (!extractRes.ok) throw new Error('Failed to extract genes');
      const { genes: newGenes } = await extractRes.json();

      setGenesExtracted(newGenes);
      addLog(`Discovered ${newGenes.length} new genes`);

      const newGeneFitness = (scoreData.virus_score - 25) / 50;
      updateGeneFitness(newGenes, newGeneFitness);

      const fullIdea: Idea = {
        id: `idea-${Date.now()}`,
        name: idea.name,
        description: idea.description,
        hook: idea.hook,
        virus_score: scoreData.virus_score,
        generation: generation,
        scores: scoreData.scores,
        genes_used: selectedGenes,
        genes_extracted: newGenes,
        reasoning: scoreData.reasoning
      };

      setTopIdeas(prev => {
        const updated = [...prev, fullIdea]
          .sort((a, b) => b.virus_score - a.virus_score)
          .slice(0, 10);
        return updated;
      });

      setStatus('complete');
      addLog(`Generation #${generation} complete!`);

      await new Promise(r => setTimeout(r, 2000));

      setGeneration(prev => prev + 1);
      setCurrentIdea(null);
      setScores(null);
      setVirusScore(null);
      setGenesUsed([]);
      setGenesExtracted([]);
      setReasoning('');
      setStatus('idle');

      if (isRunningRef.current) {
        setTimeout(() => runGeneration(), 500);
      }

    } catch (error) {
      console.error('Generation error:', error);
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('idle');

      if (isRunningRef.current) {
        setTimeout(() => runGeneration(), 5000);
      }
    }
  }, [generation, genes, selectGenes, updateGeneFitness, addLog]);

  const toggleEvolution = () => {
    if (isRunning) {
      isRunningRef.current = false;
      setIsRunning(false);
      addLog('Evolution paused');
    } else {
      isRunningRef.current = true;
      setIsRunning(true);
      addLog('Evolution started');
      runGeneration();
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedGenes = localStorage.getItem('ideabreeder_genes');
    const savedIdeas = localStorage.getItem('ideabreeder_ideas');
    const savedGeneration = localStorage.getItem('ideabreeder_generation');

    if (savedGenes) {
      setGenes(JSON.parse(savedGenes));
      addLog('Loaded genes from storage');
    } else {
      setGenes(SEED_GENES.map(text => ({ text, fitness: 5 })));
      addLog('Initialized with seed genes');
    }

    if (savedIdeas) {
      setTopIdeas(JSON.parse(savedIdeas));
      addLog('Loaded ideas from storage');
    }

    if (savedGeneration) {
      setGeneration(parseInt(savedGeneration, 10));
    }
  }, [addLog]);

  // Save genes to localStorage when they change
  useEffect(() => {
    if (genes.length > 0) {
      localStorage.setItem('ideabreeder_genes', JSON.stringify(genes));
    }
  }, [genes]);

  // Save ideas to localStorage when they change
  useEffect(() => {
    if (topIdeas.length > 0) {
      localStorage.setItem('ideabreeder_ideas', JSON.stringify(topIdeas));
    }
  }, [topIdeas]);

  // Save generation to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('ideabreeder_generation', generation.toString());
  }, [generation]);

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              IdeaBreeder.ai
            </span>
          </h1>
          <p className="text-white/50 text-lg">
            Watch AI evolve startup ideas in real-time
          </p>

          <button
            onClick={toggleEvolution}
            className={`mt-4 px-8 py-3 rounded-full font-semibold transition-all ${
              isRunning
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 animate-pulse-glow'
            }`}
          >
            {isRunning ? 'Pause Evolution' : 'Start Evolution'}
          </button>

          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-white/40">
            <span>Generation: <strong className="text-white/70">{generation}</strong></span>
            <span>Genes: <strong className="text-white/70">{genes.length}</strong></span>
            <span>Ideas: <strong className="text-white/70">{topIdeas.length}</strong></span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Gene Pool */}
          <div className="lg:col-span-3">
            <GenePool
              genes={genes}
              selectedGenes={genesUsed}
            />
          </div>

          {/* Center Column - Breeding View */}
          <div className="lg:col-span-6">
            <BreedingView
              status={status}
              currentIdea={currentIdea}
              scores={scores}
              virusScore={virusScore}
              genesUsed={genesUsed}
              genesExtracted={genesExtracted}
              reasoning={reasoning}
              generation={generation}
            />

            <div className="mt-6">
              <ActivityLog logs={logs} />
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-3">
            <Leaderboard ideas={topIdeas} />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 text-center glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Want a personalized idea tailored to YOU?
          </h2>
          <p className="text-white/50 mb-4">
            Enter your skills, resources, and network to get AI-generated ideas optimized for your unique situation.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full font-semibold text-white hover:opacity-90 transition-all">
            Get Your Personalized Idea - $19
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-white/30 text-sm">
          <p>Built with AI that evolves itself. Each generation gets smarter.</p>
        </footer>
      </div>
    </main>
  );
}
