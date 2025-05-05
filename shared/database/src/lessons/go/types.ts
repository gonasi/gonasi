// Defining all known node types explicitly
export type NodeType =
  | 'page-break'
  | 'true-or-false'
  | 'tap-to-reveal'
  | 'multiple-choice-many-correct';

// Deriving interactive node types explicitly
export type InteractiveNodeType = 'true-or-false' | 'multiple-choice-many-correct';

// Defining node types for runtime usage
export const nodeTypes: NodeType[] = [
  'page-break',
  'true-or-false',
  'tap-to-reveal',
  'multiple-choice-many-correct',
];

// Helper type that maps NodeType to its corresponding payload type
export interface PayloadTypeMap {
  'page-break': PageBreakNodePayload;
  'true-or-false': InteractiveNodePayload;
  'tap-to-reveal': TapToRevealNodePayload;
  'multiple-choice-many-correct': InteractiveNodePayload;
}

export function isNodeType(value: unknown): value is NodeType {
  return typeof value === 'string' && nodeTypes.includes(value as NodeType);
}

// Base payload for all node types
export interface BaseNodePayload {
  nodeType: NodeType;
  uuid: string;
  timestamp: string;
}

// Choice attempt structure
export interface ChoiceAttempt {
  selectedAnswer: boolean | null;
  isCorrect: boolean;
  timestamp: string;
}

// Shared fields for interactive node payloads
interface InteractiveData {
  isCorrect: boolean;
  isAnswerChecked: boolean;
  showExplanation: boolean;
  showCorrectAnswer: boolean;
  attempts: ChoiceAttempt[];
}

// Interactive node payload
export interface InteractiveNodePayload extends BaseNodePayload, InteractiveData {
  nodeType: InteractiveNodeType;
}

// Page break node payload
export interface PageBreakNodePayload extends BaseNodePayload {
  nodeType: 'page-break';
}

export interface TapToRevealNodePayload extends BaseNodePayload {
  nodeType: 'tap-to-reveal';
  isPlayed: boolean;
}

// Union of all node progress payloads
export type NodeProgressPayload =
  | InteractiveNodePayload
  | PageBreakNodePayload
  | TapToRevealNodePayload;

export type NodeProgressMap = Record<
  string, // UUID as key
  {
    type: NodeType;
    payload: NodeType extends 'page-break'
      ? PageBreakNodePayload
      : InteractiveNodePayload | TapToRevealNodePayload;
  }
>;

// Progress record for a lesson
export interface LessonProgress {
  id: string;
  user_id: string;
  node_progress: NodeProgressMap;
  is_complete: boolean;
  updated_at: string;
}

// Full lesson data + optional progress
export interface LessonData {
  id: string;
  course_id: string;
  chapter_id: string;
  name: string;
  content: any;
  created_at: string;
  updated_at: string;
  lessons_progress: LessonProgress | null;
}
