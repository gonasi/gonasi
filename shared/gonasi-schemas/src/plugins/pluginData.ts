import type { z } from 'zod';

import type { LucideIconSchema } from '../lessonTypes';

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

export interface PluginGroup {
  id: string;
  name: string;
  description: string;
  pluginGroups: Plugin[];
}

export const ALL_PLUGINS = [
  {
    id: 'authoring_tools',
    name: 'Authoring Plugins',
    description: 'Plugins for content creation, formatting, and structuring',
    pluginGroups: [
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
    ],
  },
  {
    id: 'assessment',
    name: 'Assessment Plugins',
    description: 'Plugins for evaluating learner understanding',
    pluginGroups: [
      {
        id: 'quiz',
        name: 'Quiz Plugin',
        description: 'Multiple choice, true/false, fill-in-the-blank, etc.',
        icon: 'ListCheck',
        pluginTypes: [
          {
            id: 'true_or_false',
            name: 'True or False',
            description: 'Classic binary choice.',
            example: 'The Earth is flat.',
            icon: 'ToggleRight',
            comingSoon: false,
          },
          {
            id: 'fill_in_the_blank',
            name: 'Fill in the Blank',
            description: 'Type the correct answer with letter-by-letter feedback.',
            example: 'The capital of France is ____.',
            icon: 'PenLine',
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
            comingSoon: false,
          },
          {
            id: 'matching_game',
            name: 'Matching Game',
            description: 'Match left items with corresponding right items.',
            example: 'Match countries with their capitals.',
            icon: 'ArrowLeftRight',
            comingSoon: false,
          },
          {
            id: 'swipe_categorize',
            name: 'Swipe Categorize',
            description: 'Swipe cards left or right to sort items into two categories.',
            example: 'Sort statements as true or false by swiping.',
            icon: 'SwipeLeft',
            comingSoon: false,
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
            icon: 'ArrowLeftRight',
            comingSoon: false,
          },
          {
            id: 'sequence_ordering',
            name: 'Sequence Ordering',
            description: 'Order items or events in a sequence.',
            example: 'Arrange the steps of a scientific method.',
            icon: 'ArrowUpDown',
            comingSoon: true,
          },
          {
            id: 'categorization',
            name: 'Categorization',
            description: 'Categorize items into defined groups.',
            example: 'Sort animals into mammal, reptile, and bird.',
            icon: 'LayoutGrid',
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
    pluginGroups: [
      {
        id: 'reveal',
        name: 'Reveal Plugin',
        description: 'Progressive content disclosure and hint systems',
        icon: 'Eye',
        pluginTypes: [
          {
            id: 'step_by_step_reveal',
            name: 'Step-by-Step Reveal',
            description:
              'Reveal content in one or more steps. Works as a simple tap-to-reveal card when there’s only one step, or as a guided sequence when multiple steps are added.',
            example:
              'Reveal an answer by tapping a card, or show a procedure step by step as the learner progresses.',
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
            icon: 'MonitorPlay',
            comingSoon: false,
          },
          {
            id: 'audio_player',
            name: 'Audio Player',
            description: 'Embed and play audio lessons or podcasts.',
            example: 'Play an audio lesson on language learning.',
            icon: 'AudioLines',
            comingSoon: false,
          },
          {
            id: 'slideshow_player',
            name: 'Slideshow Player',
            description: 'Display slideshows with images and text.',
            example: 'Show a presentation in a slideshow format.',
            icon: 'Presentation',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'embeddable_media',
    name: 'Embeddable Media Plugins',
    description: 'Plugins for embedding external media from popular platforms',
    pluginGroups: [
      {
        id: 'video_embeds',
        name: 'Video Embed Plugins',
        description: 'Embed videos from platforms like YouTube and Vimeo directly into lessons.',
        icon: 'Video',
        pluginTypes: [
          {
            id: 'youtube_embed',
            name: 'YouTube Embed',
            description:
              'Embed a YouTube video using a link or video ID. Supports autoplay, captions, and playback controls.',
            example: 'Embed a YouTube tutorial directly in the lesson.',
            icon: 'Youtube',
            comingSoon: false,
          },
          {
            id: 'vimeo_embed',
            name: 'Vimeo Embed',
            description:
              'Embed a Vimeo video using a link or video ID. Supports privacy settings and player customization.',
            example: 'Show a Vimeo-hosted lecture in your course module.',
            icon: 'Vimeo',
            comingSoon: false,
          },
          {
            id: 'twitch_embed',
            name: 'Twitch Embed',
            description:
              'Embed live or recorded Twitch streams for interactive learning experiences.',
            example: 'Embed a coding livestream or recorded session for learners to follow along.',
            icon: 'Twitch',
            comingSoon: true,
          },
        ],
      },
      {
        id: 'social_embeds',
        name: 'Social Media Embeds',
        description:
          'Embed interactive media from social platforms like Instagram, TikTok, or Twitter.',
        icon: 'Share',
        pluginTypes: [
          {
            id: 'instagram_embed',
            name: 'Instagram Embed',
            description: 'Embed Instagram posts, reels, or IGTV videos directly into lessons.',
            example: 'Show a relevant Instagram reel to support the lesson content.',
            icon: 'Instagram',
            comingSoon: true,
          },
          {
            id: 'tiktok_embed',
            name: 'TikTok Embed',
            description:
              'Embed TikTok videos to demonstrate trends or bite-sized learning content.',
            example: 'Embed a short tutorial or learning clip from TikTok.',
            icon: 'Tiktok',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'media_interaction',
    name: 'Media Interaction',
    description: 'Plugins for adding interactive and engaging visual elements',
    pluginGroups: [
      {
        id: 'image_hotspots',
        name: 'Image Hotspots',
        description: 'Highlight areas of an image for exploration, guidance, or assessment',
        icon: 'Image',
        pluginTypes: [
          {
            id: 'guided_image_hotspots',
            name: 'Guided Image Hotspots',
            description:
              'Lead learners through a series of highlighted areas on an image, zooming in and revealing information step-by-step.',
            example:
              'Step 1: Focus on the rearview mirror and learn how to adjust it. Step 2: Look at the dashboard to understand the warning lights.',
            icon: 'Focus',
            comingSoon: false,
          },
          {
            id: 'hotspot_identification_question',
            name: 'Hotspot Identification Question',
            description:
              'Ask learners to click on the correct spot(s) in an image to answer a question, with instant feedback.',
            example:
              'Where should you check for your seatbelt? Click the correct area on the image.',
            icon: 'Target',
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
    pluginGroups: [
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
            icon: 'CalendarClock',
            comingSoon: true,
          },
          {
            id: 'project_milestones',
            name: 'Project Milestones',
            description: 'Show project milestones and deadlines on a timeline.',
            example: 'Visualize project phases in a timeline format.',
            icon: 'Calendar',
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
    pluginGroups: [
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
            icon: 'Move',
            comingSoon: true,
          },
          {
            id: 'gravity_simulation',
            name: 'Gravity Simulation',
            description: 'Simulate the effects of gravity on different objects.',
            example: 'Simulate an object falling under gravity.',
            icon: 'ArrowDown',
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rapid_recall',
    name: 'Rapid Recall Plugins',
    description: 'Active recall plugins for visual learning and memorization',
    pluginGroups: [
      {
        id: 'image_focus_quiz',
        name: 'Image Focus Quiz',
        description: 'Focus on regions of an image with answer reveals for visual recall training',
        icon: 'ScanEye',
        pluginTypes: [
          {
            id: 'image_focus_quiz',
            name: 'Image Focus Quiz',
            description: 'Upload an image, define focus regions, and create rapid recall drills.',
            example: 'Cram road signs, anatomical charts, or circuit diagrams.',
            icon: 'Focus',
            comingSoon: false,
          },
        ],
      },
    ],
  },
] as const;
// ----------------- INFERRED PLUGIN TYPES -----------------

type PluginGroupConst = (typeof ALL_PLUGINS)[number];
type PluginConst = PluginGroupConst['pluginGroups'][number];
type PluginTypeConst = PluginConst['pluginTypes'][number];

export type PluginGroupId = PluginConst['id'];
export type PluginTypeId = PluginTypeConst['id'];

export function getPluginTypesFromGroupId(pluginGroupId: PluginGroupId): Plugin | null {
  for (const group of ALL_PLUGINS) {
    const plugin = group.pluginGroups.find((p) => p.id === pluginGroupId);
    if (plugin) {
      return {
        ...plugin,
        pluginTypes: plugin.pluginTypes ? [...plugin.pluginTypes] : undefined, // ensure mutability
      };
    }
  }
  return null;
}

export function getPluginGroupNameByPluginGroupId(id: PluginGroupId): string {
  for (const group of ALL_PLUGINS) {
    const plugin = group.pluginGroups.find((p) => p.id === id);
    if (plugin) return plugin.name;
  }
  return 'Unknown Plugin';
}

export function getPluginTypeNameById(pluginId: PluginGroupId, typeId: PluginTypeId): string {
  for (const category of ALL_PLUGINS) {
    const plugin = category.pluginGroups.find((p) => p.id === pluginId);
    if (plugin) {
      const plugin_type = plugin.pluginTypes?.find((type) => type.id === typeId);
      if (plugin_type) return plugin_type.name;
    }
  }
  return 'Unknown Plugin Type';
}
