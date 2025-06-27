import { createLessonType } from '@gonasi/database/lessonTypes';

import { signInWithEmailAndPassword } from '../../auth';
import { SU_EMAIL, SU_PASSWORD } from '../fixtures/test-data';
import { TestCleanupManager, testSupabase } from '../setup/test-helpers';

const lessonTypes = [
  {
    name: '📖 Concept Lesson',
    description: 'Teaches core theories, definitions, and ideas.',
    lucideIcon: 'BookOpen',
    bgColor: 'hsl(220 80% 50%)', // Bold Blue
  },
  {
    name: '✅ Interactive Quiz',
    description: 'Practice questions with instant feedback.',
    lucideIcon: 'CircleCheckBig',
    bgColor: 'hsl(140 80% 40%)', // Bold Green
  },
  {
    name: '🧠 Problem Solving',
    description: 'Step-by-step walkthroughs of challenging problems.',
    lucideIcon: 'Brain',
    bgColor: 'hsl(30 90% 50%)', // Bold Orange
  },
  {
    name: '🎬 Video Lesson',
    description: 'Educational videos with visual explanations.',
    lucideIcon: 'Play',
    bgColor: 'hsl(350 75% 50%)', // Bold Red
  },
  {
    name: '🔬 Simulation',
    description: 'Visual or interactive simulations to demonstrate concepts.',
    lucideIcon: 'Cpu',
    bgColor: 'hsl(200 85% 45%)', // Bold Cyan
  },
  {
    name: '🛠️ Mini Project',
    description: 'Small, scoped real-world application projects.',
    lucideIcon: 'PackagePlus',
    bgColor: 'hsl(270 75% 50%)', // Bold Purple
  },
  {
    name: '🔁 Review Session',
    description: 'Summarized recap or review of key concepts.',
    lucideIcon: 'RefreshCw',
    bgColor: 'hsl(50 90% 50%)', // Bold Yellow
  },
  {
    name: '💬 Discussion Prompt',
    description: 'Open-ended topic to encourage peer discussion.',
    lucideIcon: 'MessageCircleMore',
    bgColor: 'hsl(310 75% 55%)', // Bold Magenta
  },
  {
    name: '🏆 Challenge',
    description: 'Timed or graded test-like questions.',
    lucideIcon: 'Trophy',
    bgColor: 'hsl(0 80% 40%)', // Dark Red
  },
  {
    name: '🃏 Flashcards',
    description: 'Fast-paced recall and memorization tool.',
    lucideIcon: 'Layers',
    bgColor: 'hsl(160 80% 40%)', // Teal Green
  },
  {
    name: '📄 Reading Material',
    description: 'PDFs, articles, or deep dives into theory.',
    lucideIcon: 'FileText',
    bgColor: 'hsl(210 70% 45%)', // Deep Blue
  },
  {
    name: '🧾 Assessment Test',
    description: "Evaluates learner's progress over a topic.",
    lucideIcon: 'FileCheck',
    bgColor: 'hsl(280 70% 45%)', // Vivid Violet
  },
  {
    name: '📋 Poll / Survey',
    description: 'Collect learner opinions or quick checks.',
    lucideIcon: 'SlidersHorizontal',
    bgColor: 'hsl(190 75% 50%)', // Ocean Blue
  },
  {
    name: '🖍️ Annotation Task',
    description: 'Mark up texts, code, or diagrams.',
    lucideIcon: 'Highlighter',
    bgColor: 'hsl(40 90% 50%)', // Bright Amber
  },
  {
    name: '🎧 Audio Lesson',
    description: 'Podcast-style auditory learning.',
    lucideIcon: 'Headphones',
    bgColor: 'hsl(260 80% 50%)', // Deep Indigo
  },
];

export async function seedAllLessonTypes() {
  await TestCleanupManager.signOutAllClients();

  const { error: signInError } = await signInWithEmailAndPassword(testSupabase, {
    email: SU_EMAIL,
    password: SU_PASSWORD,
  });

  if (signInError) {
    console.error(`❌ Failed to sign in as ${SU_EMAIL}:`, signInError.message);
    throw new Error('Stopping seed due to sign-in failure.');
  }

  for (const { name, description, lucideIcon, bgColor } of lessonTypes) {
    const { success, message } = await createLessonType(testSupabase, {
      name,
      description,
      lucideIcon,
      bgColor,
    });

    if (!success) {
      console.error(`❌ Failed to create lesson type "${name}" - ${message}`);
      await TestCleanupManager.signOutAllClients();
      throw new Error('Stopping seed due to lesson type creation failure.');
    }
  }

  await TestCleanupManager.signOutAllClients();
}
