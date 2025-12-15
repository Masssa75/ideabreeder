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

// DataGold API types
export interface ApiTechnical {
  auth: string;
  rate_limit: string;
  formats: string[];
  pricing?: string;
}

export interface Api {
  id: string;
  title: string;
  hook: string;
  description: string;
  bullets: string[];
  what_it_contains: string[];
  who_uses_this: string[];
  technical: ApiTechnical;
  free: boolean;
  url: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface ApiInsert {
  title: string;
  hook: string;
  description: string;
  bullets: string[];
  what_it_contains: string[];
  who_uses_this: string[];
  technical: ApiTechnical;
  free: boolean;
  url: string;
  category: string;
}
