import type { z } from 'zod';

import type { LucideIconSchema } from '../lessonTypes';

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
    id: 'authoring_tools',
    name: 'Authoring Plugins',
    description: 'Plugins for content creation, formatting, and structuring',
    plugins: [
      {
        id: 'rich_text',
        name: 'Rich Text',
        description: 'Add formatted text including headings, bold, italic, lists, and links',
        icon: 'Text',
        pluginTypes: [
          {
            id: 'rich_text_editor',
            name: 'Rich Text Editor',
            description: 'Add and format content with headings, styles, and links.',
            example: 'Make this sentence *italic* or **bold**.',
            icon: 'TextCursorInput',
            comingSoon: false,
          },
        ],
      },
      {
        id: 'asset_embed',
        name: 'Asset Embed',
        description: 'Embed and customize various types of assets within content',
        icon: 'PackagePlus',
        pluginTypes: [
          {
            id: 'image_upload',
            name: 'Image Upload',
            description: 'Upload and embed images into content.',
            example: 'Embed a diagram showing the water cycle.',
            icon: 'ImageUp',
            comingSoon: false,
          },
          {
            id: 'gltf_embed',
            name: '3D Model (GLTF)',
            description: 'Insert interactive 3D models in GLTF format.',
            example: 'Embed a rotating 3D model of a molecule.',
            icon: 'Cube',
            comingSoon: true,
          },
          {
            id: 'video_embed',
            name: 'Video Embed',
            description: 'Embed videos from various sources.',
            example: 'Insert an instructional video on climate change.',
            icon: 'Video',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'callout_box',
        name: 'Callout Box',
        description: 'Highlight important notes, warnings, or tips',
        icon: 'Info',
        pluginTypes: [
          {
            id: 'note_callout',
            name: 'Note Callout',
            description: 'Show a highlighted box for notes, tips, or warnings.',
            example: '⚠️ Warning: Don’t mix bleach and ammonia.',
            icon: 'AlertCircle',
            comingSoon: false,
          },
        ],
      },
    ],
  },
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
            comingSoon: false,
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
