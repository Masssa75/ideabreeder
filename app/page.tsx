'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import GenePool from '@/components/GenePool';
import BreedingView from '@/components/BreedingView';
import Leaderboard from '@/components/Leaderboard';
import ActivityLog from '@/components/ActivityLog';
import HistoryModal from '@/components/HistoryModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Gene {
  id?: string;
  text: string;
  fitness: number;
  offspring_count?: number;
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
  // Viral mechanics
  'screenshot-ready output',
  'one-click sharing',
  'badge embed for virality',
  'leaderboard competition',
  'social proof display',
  // Psychology
  'fear of missing out',
  'instant gratification',
  'curiosity gap',
  'nostalgia trigger',
  'status signaling',
  // Diverse audiences
  'gen-z consumers',
  'parents with toddlers',
  'fitness beginners',
  'home cooks',
  'pet owners',
  'budget travelers',
  'college students',
  // Diverse verticals
  'health and wellness',
  'dating and relationships',
  'food and dining',
  'personal finance',
  'entertainment and media',
  // Tech enablers
  'AI-powered analysis',
  'voice-first interface',
  'camera-based input',
  'location awareness',
  // Gamification
  'streak rewards',
  'mystery box mechanic',
  'unlockable achievements'
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
  const [showHistory, setShowHistory] = useState(false);

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

  const updateGeneFitness = useCallback(async (geneTexts: string[], scoreDelta: number) => {
    for (const text of geneTexts) {
      const normalizedText = text.toLowerCase().trim();

      // Check if gene exists
      const { data: existing } = await supabase
        .from('genes')
        .select('*')
        .eq('text', normalizedText)
        .single();

      if (existing) {
        // Update existing gene
        await supabase
          .from('genes')
          .update({
            fitness: Math.max(0.5, Math.min(10, existing.fitness + scoreDelta)),
            offspring_count: (existing.offspring_count || 0) + 1
          })
          .eq('id', existing.id);
      } else {
        // Insert new gene
        await supabase
          .from('genes')
          .insert({
            text: normalizedText,
            fitness: Math.max(0.5, Math.min(10, 5 + scoreDelta)),
            offspring_count: 1
          });
      }
    }

    // Also update local state for immediate UI feedback
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

      // Save idea to Supabase
      const { data: savedIdea, error: saveError } = await supabase
        .from('ideas')
        .insert({
          name: idea.name,
          description: idea.description,
          hook: idea.hook,
          virus_score: scoreData.virus_score,
          generation: generation,
          scores: scoreData.scores,
          genes_used: selectedGenes,
          genes_extracted: newGenes,
          reasoning: scoreData.reasoning
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save idea:', saveError);
      }

      const fullIdea: Idea = savedIdea || {
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

      // Update generation in Supabase
      await supabase
        .from('evolution_state')
        .update({
          current_generation: generation + 1,
          last_run_at: new Date().toISOString()
        })
        .eq('id', 1);

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

  const toggleEvolution = async () => {
    if (isRunning) {
      isRunningRef.current = false;
      setIsRunning(false);
      addLog('Evolution paused');

      // Update Supabase state
      await supabase
        .from('evolution_state')
        .update({ is_running: false, status: 'idle' })
        .eq('id', 1);
    } else {
      isRunningRef.current = true;
      setIsRunning(true);
      addLog('Evolution started');

      // Update Supabase state
      await supabase
        .from('evolution_state')
        .update({ is_running: true, status: 'running' })
        .eq('id', 1);

      runGeneration();
    }
  };

  // Load from Supabase on mount
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        // Load genes
        const { data: genesData, error: genesError } = await supabase
          .from('genes')
          .select('*')
          .order('fitness', { ascending: false })
          .limit(100);

        if (genesError) throw genesError;

        if (genesData && genesData.length > 0) {
          setGenes(genesData);
          addLog(`Loaded ${genesData.length} genes from database`);
        } else {
          setGenes(SEED_GENES.map(text => ({ text, fitness: 5 })));
          addLog('Initialized with seed genes');
        }

        // Load top ideas
        const { data: ideasData, error: ideasError } = await supabase
          .from('ideas')
          .select('*')
          .order('virus_score', { ascending: false })
          .limit(10);

        if (ideasError) throw ideasError;

        if (ideasData && ideasData.length > 0) {
          setTopIdeas(ideasData);
          addLog(`Loaded ${ideasData.length} top ideas`);
        }

        // Load evolution state
        const { data: stateData, error: stateError } = await supabase
          .from('evolution_state')
          .select('*')
          .eq('id', 1)
          .single();

        if (stateError) throw stateError;

        if (stateData) {
          setGeneration(stateData.current_generation || 1);
          if (stateData.is_running) {
            isRunningRef.current = true;
            setIsRunning(true);
            addLog('Resuming evolution from database');
            setTimeout(() => runGeneration(), 1000);
          }
        }
      } catch (error) {
        console.error('Failed to load from Supabase:', error);
        addLog('Using local fallback');
        setGenes(SEED_GENES.map(text => ({ text, fitness: 5 })));
      }
    }

    loadFromSupabase();
  }, [addLog]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTopIdeas(prev => {
            const exists = prev.some(i => i.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Idea]
              .sort((a, b) => b.virus_score - a.virus_score)
              .slice(0, 10);
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'genes' }, () => {
        // Refresh genes on any change
        supabase
          .from('genes')
          .select('*')
          .order('fitness', { ascending: false })
          .limit(100)
          .then(({ data }) => {
            if (data) setGenes(data);
          });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'evolution_state' }, (payload) => {
        const newState = payload.new as { current_generation: number; is_running: boolean };
        setGeneration(newState.current_generation);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={toggleEvolution}
              className={`px-8 py-3 rounded-full font-semibold transition-all ${
                isRunning
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 animate-pulse-glow'
              }`}
            >
              {isRunning ? 'Pause Evolution' : 'Start Evolution'}
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="px-6 py-3 rounded-full font-semibold bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 hover:text-white transition-all"
            >
              View All Ideas
            </button>
          </div>

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

      {/* History Modal */}
      <HistoryModal isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </main>
  );
}
