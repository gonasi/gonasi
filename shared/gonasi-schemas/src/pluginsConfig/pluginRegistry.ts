import type { z } from 'zod';

import type { LucideIconSchema } from '../lessonTypes';

// Category IDs
export enum PluginCategoryId {
  AUTHORING_TOOLS = 'authoring_tools',
  ASSESSMENT = 'assessment',
  VISUALIZATION = 'visualization',
  CONTENT_DELIVERY = 'content_delivery',
  SIMULATION = 'simulation',
}

// Plugin Group IDs
export enum PluginGroupId {
  TEXT_TOOLS = 'text_tools',
  QUESTION_TYPES = 'question_types',
  INTERACTIVE_QUESTIONS = 'interactive_questions',
  CHART_TOOLS = 'chart_tools',
  TIMELINE_TOOLS = 'timeline_tools',
  REVEAL_TOOLS = 'reveal_tools',
  MEDIA_TOOLS = 'media_tools',
  PHYSICS_SIMULATIONS = 'physics_simulations',
}

// Plugin Type IDs
export enum PluginTypeId {
  RICH_TEXT_EDITOR = 'rich_text_editor',
  TRUE_FALSE = 'true_false',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  MATCH_PAIRS = 'match_pairs',
  ORDER_SEQUENCE = 'order_sequence',
  ITEM_CATEGORIZATION = 'item_categorization',
  BAR_CHART = 'bar_chart',
  LINE_CHART = 'line_chart',
  PIE_CHART = 'pie_chart',
  HISTORY_TIMELINE = 'history_timeline',
  PROJECT_TIMELINE = 'project_timeline',
  TAP_REVEAL = 'tap_reveal',
  STEP_REVEAL = 'step_reveal',
  VIDEO_PLAYER = 'video_player',
  AUDIO_PLAYER = 'audio_player',
  SLIDESHOW = 'slideshow',
  MOTION_SIMULATION = 'motion_simulation',
  GRAVITY_SIMULATION = 'gravity_simulation',
}

// Type for plugin types
export interface PluginType {
  id: PluginTypeId;
  name: string;
  description: string;
  example: string;
  icon: z.infer<typeof LucideIconSchema>;
  comingSoon: boolean;
}

// Type for plugin groups
export interface PluginGroup {
  id: PluginGroupId;
  name: string;
  description: string;
  icon: string;
  pluginTypes: PluginType[];
}

// Type for categories
export interface Category {
  id: PluginCategoryId;
  name: string;
  description: string;
  pluginGroups: PluginGroup[];
}

// Export the typed registry
export const ALL_PLUGINS = [
  {
    id: PluginCategoryId.AUTHORING_TOOLS,
    name: 'Authoring Tools',
    description: 'Tools for content creation, formatting, and structuring',
    pluginGroups: [
      {
        id: PluginGroupId.TEXT_TOOLS,
        name: 'Text Tools',
        description: 'Add and format rich text content',
        icon: 'Text',
        pluginTypes: [
          {
            id: PluginTypeId.RICH_TEXT_EDITOR,
            name: 'Rich Text Editor',
            description: 'Add and format content with headings, styles, and links.',
            example: 'Make this sentence *italic* or **bold**.',
            icon: 'TextCursorInput',
            comingSoon: false,
          },
        ],
      },
    ],
  },
  {
    id: PluginCategoryId.ASSESSMENT,
    name: 'Assessment Tools',
    description: 'Tools for evaluating learner understanding',
    pluginGroups: [
      {
        id: PluginGroupId.QUESTION_TYPES,
        name: 'Question Types',
        description: 'Support for various types of quiz questions',
        icon: 'ListCheck',
        pluginTypes: [
          {
            id: PluginTypeId.TRUE_FALSE,
            name: 'True/False',
            description: 'Classic binary choice.',
            example: 'The Earth is flat.',
            icon: 'ToggleRight',
            comingSoon: false,
          },
          {
            id: PluginTypeId.SINGLE_CHOICE,
            name: 'Single Choice',
            description: 'One correct answer, multiple options.',
            example: 'What is the capital of France?',
            icon: 'CircleDot',
            comingSoon: false,
          },
          {
            id: PluginTypeId.MULTIPLE_CHOICE,
            name: 'Multiple Choice',
            description: 'More than one correct answer.',
            example: 'Which of the following are programming languages?',
            icon: 'SquareCheck',
            comingSoon: false,
          },
        ],
      },
      {
        id: PluginGroupId.INTERACTIVE_QUESTIONS,
        name: 'Interactive Questions',
        description: 'Use drag and drop to match, order, or categorize items',
        icon: 'SquareMousePointer',
        pluginTypes: [
          {
            id: PluginTypeId.MATCH_PAIRS,
            name: 'Matching Pairs',
            description: 'Match concepts or words from one list to another.',
            example: 'Match the country to its capital.',
            icon: 'DragAndDropMatch',
            comingSoon: false,
          },
          {
            id: PluginTypeId.ORDER_SEQUENCE,
            name: 'Order Sequence',
            description: 'Order items or events in a sequence.',
            example: 'Arrange the steps of a scientific method.',
            icon: 'DragAndDropSequence',
            comingSoon: true,
          },
          {
            id: PluginTypeId.ITEM_CATEGORIZATION,
            name: 'Item Categorization',
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
    id: PluginCategoryId.VISUALIZATION,
    name: 'Interactive Visualizations',
    description: 'Visual tools for data and concept exploration',
    pluginGroups: [
      {
        id: PluginGroupId.CHART_TOOLS,
        name: 'Chart Tools',
        description: 'Create interactive charts and graphs',
        icon: 'BarChart4',
        pluginTypes: [
          {
            id: PluginTypeId.BAR_CHART,
            name: 'Bar Chart',
            description: 'Create bar charts to represent data visually.',
            example: 'Show population by country using a bar chart.',
            icon: 'BarChart',
            comingSoon: true,
          },
          {
            id: PluginTypeId.LINE_CHART,
            name: 'Line Chart',
            description: 'Create line charts to visualize data trends.',
            example: 'Show temperature changes over time with a line chart.',
            icon: 'LineChart',
            comingSoon: true,
          },
          {
            id: PluginTypeId.PIE_CHART,
            name: 'Pie Chart',
            description: 'Create pie charts to represent data as parts of a whole.',
            example: 'Show market share distribution with a pie chart.',
            icon: 'PieChart',
            comingSoon: true,
          },
        ],
      },
      {
        id: PluginGroupId.TIMELINE_TOOLS,
        name: 'Timeline Tools',
        description: 'Explore concepts and events on a timeline',
        icon: 'ChartNoAxesGantt',
        pluginTypes: [
          {
            id: PluginTypeId.HISTORY_TIMELINE,
            name: 'Historical Timeline',
            description: 'Explore and visualize historical events on a timeline.',
            example: 'Display key events from World War II on a timeline.',
            icon: 'TimelineHistorical',
            comingSoon: true,
          },
          {
            id: PluginTypeId.PROJECT_TIMELINE,
            name: 'Project Timeline',
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
    id: PluginCategoryId.CONTENT_DELIVERY,
    name: 'Content Delivery Tools',
    description: 'Tools for structuring and revealing content to learners',
    pluginGroups: [
      {
        id: PluginGroupId.REVEAL_TOOLS,
        name: 'Reveal Tools',
        description: 'Enable progressive content disclosure and hints',
        icon: 'Eye',
        pluginTypes: [
          {
            id: PluginTypeId.TAP_REVEAL,
            name: 'Tap to Reveal',
            description: 'Reveal content when the learner taps on a hidden element.',
            example: 'Tap a card to reveal the answer underneath.',
            icon: 'MousePointerClick',
            comingSoon: false,
          },
          {
            id: PluginTypeId.STEP_REVEAL,
            name: 'Step-by-Step Reveal',
            description: 'Progressively reveal content in steps.',
            example: 'Show instructions in steps as the user progresses.',
            icon: 'ListOrdered',
            comingSoon: false,
          },
        ],
      },
      {
        id: PluginGroupId.MEDIA_TOOLS,
        name: 'Media Tools',
        description: 'Use video, audio, and slides to enhance learning',
        icon: 'PlayCircle',
        pluginTypes: [
          {
            id: PluginTypeId.VIDEO_PLAYER,
            name: 'Video Player',
            description: 'Embed and play videos with interactive features.',
            example: 'Show a tutorial video with pause and play controls.',
            icon: 'VideoPlayer',
            comingSoon: true,
          },
          {
            id: PluginTypeId.AUDIO_PLAYER,
            name: 'Audio Player',
            description: 'Embed and play audio lessons or podcasts.',
            example: 'Play an audio lesson on language learning.',
            icon: 'AudioPlayer',
            comingSoon: true,
          },
          {
            id: PluginTypeId.SLIDESHOW,
            name: 'Slideshow Viewer',
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
    id: PluginCategoryId.SIMULATION,
    name: 'Simulation Tools',
    description: 'Interactive simulations and modeling environments',
    pluginGroups: [
      {
        id: PluginGroupId.PHYSICS_SIMULATIONS,
        name: 'Physics Simulations',
        description: 'Simulate physical systems and experiments',
        icon: 'Atom',
        pluginTypes: [
          {
            id: PluginTypeId.MOTION_SIMULATION,
            name: 'Motion Simulation',
            description: 'Simulate the motion of objects in different environments.',
            example: 'Simulate the motion of a pendulum.',
            icon: 'MotionSimulation',
            comingSoon: true,
          },
          {
            id: PluginTypeId.GRAVITY_SIMULATION,
            name: 'Gravity Simulation',
            description: 'Simulate the effects of gravity on different objects.',
            example: 'Simulate an object falling under gravity.',
            icon: 'GravitySimulation',
            comingSoon: true,
          },
        ],
      },
    ],
  },
] as const;

// Utility types and helper functions

// Create a union type of all plugin type IDs
export type AllPluginTypeIds =
  (typeof ALL_PLUGINS)[number]['pluginGroups'][number]['pluginTypes'][number]['id'];

// Helper function to get a plugin type by ID
export function getPluginTypeById(id: PluginTypeId): PluginType | undefined {
  for (const category of ALL_PLUGINS) {
    for (const pluginGroup of category.pluginGroups) {
      const found = pluginGroup.pluginTypes.find((pluginType) => pluginType.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

// Helper function to get all plugin types
export function getAllPluginTypes(): PluginType[] {
  return ALL_PLUGINS.flatMap((category) =>
    category.pluginGroups.flatMap((pluginGroup) => pluginGroup.pluginTypes),
  );
}

// Helper function to get all active (not coming soon) plugin types
export function getActivePluginTypes(): PluginType[] {
  return getAllPluginTypes().filter((pluginType) => !pluginType.comingSoon);
}

// Helper function to get plugin types by category
export function getPluginTypesByCategory(categoryId: PluginCategoryId): PluginType[] {
  const category = ALL_PLUGINS.find((c) => c.id === categoryId);
  return category ? category.pluginGroups.flatMap((pluginGroup) => pluginGroup.pluginTypes) : [];
}

// Helper function to get plugin types by plugin group
export function getPluginTypesByGroup(groupId: PluginGroupId): PluginType[] {
  for (const category of ALL_PLUGINS) {
    const pluginGroup = category.pluginGroups.find((pg) => pg.id === groupId);
    if (pluginGroup) return pluginGroup.pluginTypes;
  }
  return [];
}

// Validate that all IDs are unique across the entire registry
function validateUniqueIds(): boolean {
  const categoryIds = new Set<string>();
  const pluginGroupIds = new Set<string>();
  const pluginTypeIds = new Set<string>();

  for (const category of ALL_PLUGINS) {
    if (categoryIds.has(category.id)) return false;
    categoryIds.add(category.id);

    for (const pluginGroup of category.pluginGroups) {
      if (pluginGroupIds.has(pluginGroup.id)) return false;
      pluginGroupIds.add(pluginGroup.id);

      for (const pluginType of pluginGroup.pluginTypes) {
        if (pluginTypeIds.has(pluginType.id)) return false;
        pluginTypeIds.add(pluginType.id);
      }
    }
  }

  return true;
}

// This assertion will throw at runtime if there are duplicate IDs
const allIdsAreUnique = validateUniqueIds();
if (!allIdsAreUnique) {
  throw new Error('Plugin registry contains duplicate IDs');
}
