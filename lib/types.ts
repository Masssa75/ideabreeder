export interface Gene {
  id: string;
  text: string;
  fitness: number;
  offspring_count: number;
  created_at: string;
}

export interface Idea {
  id: string;
  description: string;
  virus_score: number;
  scores: {
    virality: number;
    immediacy: number;
    recurrence: number;
    urgency: number;
    simplicity: number;
  };
  genes_used: string[];
  generation: number;
  created_at: string;
}

export interface Generation {
  id: string;
  number: number;
  status: 'breeding' | 'scoring' | 'extracting' | 'complete';
  current_idea?: Idea;
  genes_selected: string[];
  genes_extracted: string[];
  created_at: string;
}

export interface EvolutionState {
  generation: number;
  status: 'idle' | 'selecting_genes' | 'breeding' | 'scoring' | 'extracting' | 'complete';
  genes: Gene[];
  currentIdea: Idea | null;
  topIdeas: Idea[];
  log: string[];
}
