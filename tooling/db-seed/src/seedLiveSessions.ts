import { faker } from '@faker-js/faker';

import { getUserId } from '@gonasi/database/auth';
import { createLiveSession, upsertLiveSessionBlock } from '@gonasi/database/liveSessions';

import { PASSWORD, supabase } from './constants';
import { SIGNED_UP_EMAILS } from './signUpUsers';

// Generate fake lexical state for rich text blocks
function generateFakeLexicalState(): string {
  const paragraphCount = faker.number.int({ min: 1, max: 3 });
  const paragraphs = Array.from({ length: paragraphCount }, () => {
    const wordCount = faker.number.int({ min: 5, max: 15 });
    const text = faker.lorem.words(wordCount);

    return {
      type: 'paragraph',
      version: 1,
      textFormat: 0,
      textStyle: '',
      children: [
        {
          type: 'text',
          version: 1,
          text,
          style: '',
          format: 0,
          detail: 0,
          mode: 'normal',
        },
      ],
    };
  });

  return JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      children: paragraphs,
    },
  });
}

// Generate fake true/false question
function generateTrueOrFalseQuestion(): {
  questionState: string;
  correctAnswer: 'true' | 'false';
} {
  const statements = [
    'The Earth is the third planet from the Sun.',
    'Water boils at 100 degrees Celsius at sea level.',
    'The Great Wall of China is visible from space.',
    'JavaScript was created by Brendan Eich.',
    'Photosynthesis occurs in mitochondria.',
    'The Pacific Ocean is the largest ocean on Earth.',
    'HTML stands for HyperText Markup Language.',
    'Humans have 206 bones in their body.',
    'The speed of light is faster than sound.',
    'Python is a compiled programming language.',
    'The Mona Lisa was painted by Leonardo da Vinci.',
    'Sharks are mammals.',
    "The Amazon Rainforest produces 20% of the world's oxygen.",
    'React is a JavaScript library for building user interfaces.',
    'Mount Everest is the tallest mountain in the world.',
  ];

  // These statements are true: 0, 1, 3, 5, 6, 7, 8, 10, 13, 14
  const trueStatementIndices = [0, 1, 3, 5, 6, 7, 8, 10, 13, 14];

  const statementIndex = faker.number.int({ min: 0, max: statements.length - 1 });
  const statement = statements[statementIndex];
  const correctAnswer = trueStatementIndices.includes(statementIndex) ? 'true' : 'false';

  const questionState = JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      children: [
        {
          type: 'paragraph',
          version: 1,
          textFormat: 0,
          textStyle: '',
          children: [
            {
              type: 'text',
              version: 1,
              text: statement,
              style: '',
              format: 0,
              detail: 0,
              mode: 'normal',
            },
          ],
        },
      ],
    },
  });

  return { questionState, correctAnswer };
}

// Get all organizations for a user
async function getUserOrganizations(userId: string) {
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('id, name, handle')
    .eq('owned_by', userId);

  if (error) {
    console.error('Error fetching user organizations:', error);
    return [];
  }

  return organizations || [];
}

// Seeds the database with live sessions and blocks for organizations
export async function seedLiveSessions() {
  console.log('🌱 Starting to seed live sessions...');

  for (const email of SIGNED_UP_EMAILS) {
    console.log(`\n👤 Processing live sessions for user: ${email}`);

    // Sign in as the user
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password: PASSWORD,
    });

    if (signInResult.error) {
      console.error(`❌ Failed to sign in as ${email}: ${signInResult.error.message}`);
      continue;
    }

    const userId = await getUserId(supabase);

    if (!userId) {
      console.error(`❌ Could not get user ID for ${email}`);
      await supabase.auth.signOut();
      continue;
    }

    // Get user's organizations
    const organizations = await getUserOrganizations(userId);

    if (organizations.length === 0) {
      console.log(`⚠️  No organizations found for ${email}, skipping...`);
      await supabase.auth.signOut();
      continue;
    }

    // Create 1 live session per organization
    for (const org of organizations) {
      console.log(`\n🏢 Creating live session for organization: ${org.name}`);

      const sessionName = `${faker.word.adjective()} ${faker.word.noun()} Quiz`;
      const visibility = faker.helpers.arrayElement(['public', 'unlisted', 'private'] as const);
      const sessionData = {
        name: sessionName,
        description: faker.lorem.sentence(),
        organizationId: org.id,
        visibility,
        sessionKey: visibility === 'private' ? faker.string.alphanumeric(8) : undefined,
        maxParticipants: faker.datatype.boolean() ? faker.number.int({ min: 10, max: 100 }) : null,
        allowLateJoin: faker.datatype.boolean(),
        showLeaderboard: faker.datatype.boolean(),
        enableChat: faker.datatype.boolean(),
        enableReactions: faker.datatype.boolean(),
      };

      const {
        success,
        message,
        data: liveSessionData,
      } = await createLiveSession({
        supabase,
        data: sessionData,
      });

      if (!success || !liveSessionData) {
        console.error(`❌ Failed to create live session: ${message}`);
        continue;
      }

      console.log(
        `✅ Created live session: "${sessionName}" with code: ${liveSessionData.sessionCode}`,
      );

      // Create 5-8 blocks with mixed types (rich text and true/false)
      const blockCount = faker.number.int({ min: 5, max: 8 });
      const blockTypes = ['rich_text', 'true_or_false'] as const;

      for (let i = 0; i < blockCount; i++) {
        const blockType = faker.helpers.arrayElement(blockTypes);
        const difficulty = faker.helpers.arrayElement(['easy', 'medium', 'hard'] as const);
        const timeLimit = faker.number.int({ min: 10, max: 30 });

        let blockPayload;

        if (blockType === 'rich_text') {
          blockPayload = {
            live_session_id: liveSessionData.id,
            organization_id: org.id,
            plugin_type: 'live_session_rich_text',
            content: {
              richTextState: generateFakeLexicalState(),
            },
            settings: {},
            difficulty,
            time_limit: timeLimit,
          };
        } else {
          const { questionState, correctAnswer } = generateTrueOrFalseQuestion();
          blockPayload = {
            live_session_id: liveSessionData.id,
            organization_id: org.id,
            plugin_type: 'live_session_true_or_false',
            content: {
              questionState,
              correctAnswer,
            },
            settings: {},
            difficulty,
            time_limit: timeLimit,
          };
        }

        const { success: blockSuccess, message: blockMessage } = await upsertLiveSessionBlock({
          supabase,
          payload: blockPayload,
        });

        if (!blockSuccess) {
          console.error(`❌ Failed to create block: ${blockMessage}`);
        } else {
          console.log(
            `   📝 Created ${blockType === 'rich_text' ? 'rich text' : 'true/false'} block (${difficulty}, ${timeLimit}s)`,
          );
        }
      }
    }

    // Sign out after processing user
    await supabase.auth.signOut();
  }

  console.log('\n🎉 Live sessions seeding completed!');
}
