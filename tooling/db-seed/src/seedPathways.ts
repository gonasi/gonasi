import { faker } from '@snaplet/copycat';
import { type profilesScalars } from '@snaplet/seed';

import { createLearningPath } from '@gonasi/database/learningPaths';

import { TOTAL_PATHWAYS } from './config';
import { generateRealImage, PASSWORD, supabase } from './constants';

export async function seedPathways(users: profilesScalars[]) {
  const total = TOTAL_PATHWAYS;

  for (let i = 0; i < total; i++) {
    const user = faker.helpers.arrayElement(users);
    const image = generateRealImage();

    await supabase.auth.signInWithPassword({
      email: user.email,
      password: PASSWORD,
    });

    const { success, message } = await createLearningPath(supabase, {
      name: faker.lorem.words(3),
      description: faker.lorem.paragraph(),
      image,
      blurHash: null,
    });

    console.log(success ? `✅ ${message}` : `❌ ${message}`);

    await supabase.auth.signOut();
  }
}
