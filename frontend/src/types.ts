export type Salience = "none" | "low" | "moderate" | "high";

export const DIMENSIONS = [
  { key: "duty", label: "Duty", letter: "D", description: "Work, obligations, responsibility" },
  { key: "intellect", label: "Intellect", letter: "I", description: "Cognitive challenges, problem-solving" },
  { key: "adversity", label: "Adversity", letter: "A", description: "Conflicts, risks, difficulties" },
  { key: "mating", label: "Mating", letter: "M", description: "Romance, attraction" },
  { key: "positivity", label: "Positivity", letter: "O", description: "Fun, enjoyment, humor" },
  { key: "negativity", label: "Negativity", letter: "N", description: "Anxiety, threats" },
  { key: "deception", label: "Deception", letter: "D", description: "Manipulation, trickery" },
  { key: "sociality", label: "Sociality", letter: "S", description: "Bonding, connection" },
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number]["key"];

export const SALIENCE_VALUES: Salience[] = ["none", "low", "moderate", "high"];

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DimensionScore {
  score: number;
  salience: Salience;
}

export type AnnotationInput = Record<DimensionKey, DimensionScore> & {
  notes: string;
};

export interface Annotation extends AnnotationInput {
  id: string;
  conversation_id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
  annotation: Annotation | null;
}

export interface DimensionStats {
  mean_score: number;
  salience_counts: Record<Salience, number>;
}

export interface AnnotationStats {
  total: number;
  dimensions: Record<DimensionKey, DimensionStats>;
}
