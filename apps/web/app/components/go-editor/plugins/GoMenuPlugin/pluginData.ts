import type { z } from 'zod';

import type { LucideIconSchema } from '@gonasi/schemas/lessonTypes';

// ----------------- CONSTANT PLUGIN DATA -----------------

export interface PluginType {
  id: string;
  name: string;
  description: string;
  example?: string;
  icon: z.infer<typeof LucideIconSchema>;
  comingSoon: boolean;
}

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: z.infer<typeof LucideIconSchema>;
  pluginTypes?: PluginType[];
}

export interface PluginCategory {
  id: string;
  name: string;
  description: string;
  plugins: Plugin[];
}

export const ALL_PLUGINS = [
  {
    id: 'assessment',
    name: 'Assessment Plugins',
    description: 'Plugins for evaluating learner understanding',
    plugins: [
      {
        id: 'quiz',
        name: 'Quiz Plugin',
        description: 'Multiple choice, true/false, fill-in-the-blank, etc.',
        icon: 'ListCheck',
        pluginTypes: [
          {
            id: 'true_false',
            name: 'True or False',
            description: 'Classic binary choice.',
            example: 'The Earth is flat.',
            icon: 'ToggleRight',
            comingSoon: false,
          },
          {
            id: 'multiple_choice_single',
            name: 'Multiple Choice (Single Answer)',
            description: 'One correct answer, multiple options.',
            example: 'What is the capital of France?',
            icon: 'CircleDot',
            comingSoon: true,
          },
          {
            id: 'multiple_choice_multiple',
            name: 'Multiple Choice (Multiple Answers)',
            description: 'More than one correct answer.',
            example: 'Which of the following are programming languages?',
            icon: 'SquareCheck',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'drag_and_drop',
        name: 'Drag and Drop Plugin',
        description: 'Match related concepts, sequence ordering, categorization',
        icon: 'SquareMousePointer',
        pluginTypes: [
          {
            id: 'match_concepts',
            name: 'Match Concepts',
            description: 'Match concepts or words from one list to another.',
            example: 'Match the country to its capital.',
            icon: 'DragAndDropMatch',
            comingSoon: false,
          },
          {
            id: 'sequence_ordering',
            name: 'Sequence Ordering',
            description: 'Order items or events in a sequence.',
            example: 'Arrange the steps of a scientific method.',
            icon: 'DragAndDropSequence',
            comingSoon: true,
          },
          {
            id: 'categorization',
            name: 'Categorization',
            description: 'Categorize items into defined groups.',
            example: 'Sort animals into mammal, reptile, and bird.',
            icon: 'DragAndDropCategorize',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'visualization',
    name: 'Interactive Visualization Plugins',
    description: 'Plugins for interactive visuals and exploration',
    plugins: [
      {
        id: 'graph_builder',
        name: 'Graph/Chart Builder',
        description: 'Create interactive charts or graphs',
        icon: 'BarChart4',
        pluginTypes: [
          {
            id: 'bar_chart',
            name: 'Bar Chart',
            description: 'Create bar charts to represent data visually.',
            example: 'Show population by country using a bar chart.',
            icon: 'BarChart',
            comingSoon: true,
          },
          {
            id: 'line_chart',
            name: 'Line Chart',
            description: 'Create line charts to visualize data trends.',
            example: 'Show temperature changes over time with a line chart.',
            icon: 'LineChart',
            comingSoon: true,
          },
          {
            id: 'pie_chart',
            name: 'Pie Chart',
            description: 'Create pie charts to represent data as parts of a whole.',
            example: 'Show market share distribution with a pie chart.',
            icon: 'PieChart',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'timeline_explorer',
        name: 'Timeline Explorer',
        description: 'Explore events on an interactive timeline',
        icon: 'ChartNoAxesGantt',
        pluginTypes: [
          {
            id: 'historical_events',
            name: 'Historical Events',
            description: 'Explore and visualize historical events on a timeline.',
            example: 'Display key events from World War II on a timeline.',
            icon: 'TimelineHistorical',
            comingSoon: true,
          },
          {
            id: 'project_milestones',
            name: 'Project Milestones',
            description: 'Show project milestones and deadlines on a timeline.',
            example: 'Visualize project phases in a timeline format.',
            icon: 'TimelineProject',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'content_delivery',
    name: 'Content Delivery Plugins',
    description: 'Plugins for revealing and structuring learning material',
    plugins: [
      {
        id: 'reveal',
        name: 'Reveal Plugin',
        description: 'Progressive content disclosure and hint systems',
        icon: 'Eye',
        pluginTypes: [
          {
            id: 'tap_to_reveal',
            name: 'Tap to Reveal',
            description: 'Reveal content when the learner taps on a hidden element.',
            example: 'Tap a card to reveal the answer underneath.',
            icon: 'MousePointerClick',
            comingSoon: false,
          },
          {
            id: 'step_by_step_reveal',
            name: 'Step-by-Step Reveal',
            description: 'Progressively reveal content in steps.',
            example: 'Show instructions in steps as the user progresses.',
            icon: 'ListOrdered',
            comingSoon: false,
          },
        ],
      },
      {
        id: 'media_player',
        name: 'Media Player Plugin',
        description: 'Interactive videos, audio lessons, and slideshows',
        icon: 'PlayCircle',
        pluginTypes: [
          {
            id: 'video_player',
            name: 'Video Player',
            description: 'Embed and play videos with interactive features.',
            example: 'Show a tutorial video with pause and play controls.',
            icon: 'VideoPlayer',
            comingSoon: true,
          },
          {
            id: 'audio_player',
            name: 'Audio Player',
            description: 'Embed and play audio lessons or podcasts.',
            example: 'Play an audio lesson on language learning.',
            icon: 'AudioPlayer',
            comingSoon: true,
          },
          {
            id: 'slideshow_player',
            name: 'Slideshow Player',
            description: 'Display slideshows with images and text.',
            example: 'Show a presentation in a slideshow format.',
            icon: 'SlideshowPlayer',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'simulation',
    name: 'Simulation Plugins',
    description: 'Simulations for lab and interactive modeling',
    plugins: [
      {
        id: 'physics_simulation',
        name: 'Physics Simulation',
        description: 'Interactive simulations of physical phenomena',
        icon: 'Atom',
        pluginTypes: [
          {
            id: 'motion_simulation',
            name: 'Motion Simulation',
            description: 'Simulate the motion of objects in different environments.',
            example: 'Simulate the motion of a pendulum.',
            icon: 'MotionSimulation',
            comingSoon: true,
          },
          {
            id: 'gravity_simulation',
            name: 'Gravity Simulation',
            description: 'Simulate the effects of gravity on different objects.',
            example: 'Simulate an object falling under gravity.',
            icon: 'GravitySimulation',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'circuit_builder',
        name: 'Circuit Builder',
        description: 'Create and test virtual circuits',
        icon: 'Cpu',
        pluginTypes: [
          {
            id: 'basic_circuits',
            name: 'Basic Circuits',
            description: 'Create simple electrical circuits with components.',
            example: 'Create a basic circuit with resistors and capacitors.',
            icon: 'BasicCircuits',
            comingSoon: true,
          },
          {
            id: 'advanced_circuits',
            name: 'Advanced Circuits',
            description: 'Design and test more complex circuits.',
            example: 'Simulate a complex series and parallel circuit setup.',
            icon: 'AdvancedCircuits',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'engagement',
    name: 'Engagement Plugins',
    description: 'Motivate learners with points, badges, and streaks',
    plugins: [
      {
        id: 'gamification',
        name: 'Gamification Plugin',
        description: 'XP system, achievements, and leaderboards',
        icon: 'Sparkles',
        pluginTypes: [
          {
            id: 'xp_system',
            name: 'XP System',
            description: 'Award XP points for completing tasks and challenges.',
            example: 'Award XP points after each quiz attempt.',
            icon: 'XPSystem',
            comingSoon: true,
          },
          {
            id: 'leaderboards',
            name: 'Leaderboards',
            description: 'Display player rankings based on achievements.',
            example: 'Show top learners based on XP points.',
            icon: 'Leaderboards',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'social_learning',
    name: 'Social Learning Plugins',
    description: 'Collaborative tools and peer learning experiences',
    plugins: [
      {
        id: 'discussion_forum',
        name: 'Discussion Forum',
        description: 'Enable discussions and community Q&A',
        icon: 'MessagesSquare',
        pluginTypes: [
          {
            id: 'open_forum',
            name: 'Open Forum',
            description: 'Allow free-form discussions on various topics.',
            example: 'Allow students to discuss any topic related to the course.',
            icon: 'OpenForum',
            comingSoon: true,
          },
          {
            id: 'moderated_forum',
            name: 'Moderated Forum',
            description: 'Enable moderated discussions with a review process.',
            example: 'Posts are reviewed before being published.',
            icon: 'ModeratedForum',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'peer_review',
        name: 'Peer Review System',
        description: 'Review and evaluate peer submissions',
        icon: 'UsersRound',
        pluginTypes: [
          {
            id: 'manual_review',
            name: 'Manual Review',
            description: 'Peer reviews are manually assigned.',
            example: 'Peer review assigned by the instructor.',
            icon: 'ManualReview',
            comingSoon: true,
          },
          {
            id: 'automated_review',
            name: 'Automated Review',
            description: 'Peer reviews are automatically assigned.',
            example: 'Peer review assigned based on the number of submissions.',
            icon: 'AutomatedReview',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'feedback',
    name: 'Feedback Plugins',
    description: 'Plugins for collecting feedback from learners',
    plugins: [
      {
        id: 'rating',
        name: 'Rating Plugin',
        description: 'Allow learners to rate content or performance',
        icon: 'Star',
        pluginTypes: [
          {
            id: 'star_rating',
            name: 'Star Rating',
            description: 'Allow learners to give feedback using a star rating system.',
            example: 'Rate the quiz from 1 to 5 stars.',
            icon: 'Star',
            comingSoon: true,
          },
          {
            id: 'emoji_rating',
            name: 'Emoji Rating',
            description: 'Allow learners to give feedback using emojis.',
            example: 'Rate your experience with emojis (like thumbs up, heart, etc.).',
            icon: 'EmojiHappy',
            comingSoon: true,
          },
          {
            id: 'numerical_rating',
            name: 'Numerical Rating',
            description: 'Allow learners to give a numerical rating.',
            example: 'Rate the video on a scale from 1 to 10.',
            icon: 'Numbers',
            comingSoon: true,
          },
        ],
      },
    ],
  },
] as const;

// ----------------- INFERRED PLUGIN TYPES -----------------

type PluginCategoryConst = (typeof ALL_PLUGINS)[number];
type PluginConst = PluginCategoryConst['plugins'][number];
type PluginTypeConst = PluginConst['pluginTypes'][number];

export type PluginId = PluginConst['id'];
export type PluginTypeId = PluginTypeConst['id'];

export function getPluginNameById(id: PluginId): string {
  for (const category of ALL_PLUGINS) {
    const plugin = category.plugins.find((p) => p.id === id);
    if (plugin) return plugin.name;
  }
  return 'Unknown Plugin';
}

export function getPluginTypeNameById(pluginId: PluginId, typeId: PluginTypeId): string {
  for (const category of ALL_PLUGINS) {
    const plugin = category.plugins.find((p) => p.id === pluginId);
    if (plugin) {
      const pluginType = plugin.pluginTypes?.find((type) => type.id === typeId);
      if (pluginType) return pluginType.name;
    }
  }
  return 'Unknown Plugin Type';
}
