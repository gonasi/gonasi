import { faker } from '@snaplet/copycat';
import { type profilesScalars } from '@snaplet/seed';

import { createCourseCategory } from '@gonasi/database/courseCategories';
import { createCourseSubCategory } from '@gonasi/database/courseSubCategories';

import { PASSWORD, SU_EMAIL, supabase } from './constants';

const categories = [
  {
    name: '📘 General Education',
    description: 'Build a strong academic foundation with essential school subjects.',
    subcategories: [
      'Mathematics',
      'Science',
      'Language & Communication',
      'History & Culture',
      'Art & Design',
      'Geography',
    ],
  },
  {
    name: '💼 Professional Skills',
    description: 'Gain practical skills to thrive in the modern workplace.',
    subcategories: [
      'Business & Management',
      'Marketing & Sales',
      'Finance & Accounting',
      'Leadership',
      'Human Resources',
      'Entrepreneurship',
    ],
  },
  {
    name: '🖥️ Technology',
    description: 'Explore the digital world through coding, data, and innovation.',
    subcategories: [
      'Web Development',
      'Mobile Development',
      'Data Science & AI',
      'Cybersecurity',
      'Game Development',
      'DevOps & Cloud',
      'IT & Networking',
      'UI/UX Design',
    ],
  },
  {
    name: '🧠 Personal Development',
    description: 'Grow your mindset, habits, and everyday life skills.',
    subcategories: [
      'Productivity',
      'Public Speaking',
      'Mental Health',
      'Goal Setting',
      'Personal Finance',
      'Critical Thinking',
    ],
  },
  {
    name: '🎨 Creative Arts',
    description: 'Unlock your creative potential through art, music, and design.',
    subcategories: [
      'Photography',
      'Music',
      'Drawing & Painting',
      'Graphic Design',
      'Video Editing',
      'Writing',
    ],
  },
  {
    name: '📚 Test Prep & Study',
    description: 'Prepare for exams and improve your academic performance.',
    subcategories: [
      'Standardized Tests',
      'Admissions Prep',
      'Study Skills',
      'Essay Writing',
      'Tutoring',
    ],
  },
  {
    name: '🚗 Driving & Safety',
    description: 'Learn safe driving skills and pass official road tests.',
    subcategories: [
      'Road Rules',
      'Driving Skills',
      'Vehicle Maintenance',
      'NTSA Test Prep',
      'Road Signs',
    ],
  },
  {
    name: '⚙️ Vocational Training',
    description: 'Get hands-on training for skilled trades and careers.',
    subcategories: [
      'Carpentry',
      'Plumbing',
      'Electrical Work',
      'Auto Mechanics',
      'Construction Safety',
    ],
  },
  {
    name: '🧘 Lifestyle & Wellness',
    description: 'Live a healthier, more balanced life with wellness practices.',
    subcategories: [
      'Fitness',
      'Nutrition',
      'Yoga & Meditation',
      'Home Skills',
      'Travel & Adventure',
    ],
  },
];

export async function seedCourseCategories(users: profilesScalars[]) {
  const admins = users.filter((user) => user.email === SU_EMAIL);

  for (const category of categories) {
    const creator = faker.helpers.arrayElement(admins);

    const signInResult = await supabase.auth.signInWithPassword({
      email: creator.email,
      password: PASSWORD,
    });

    if (!signInResult.error) {
      const { name, description, subcategories } = category;

      const {
        success: categorySuccess,
        data: categoryData,
        message,
      } = await createCourseCategory(supabase, { name, description });

      console.log(
        categorySuccess
          ? `✅ Created category: ${name}`
          : `❌ Failed to create category "${name}" - ${message}`,
      );

      if (categorySuccess && categoryData?.id) {
        for (const subName of subcategories) {
          const { success: subSuccess } = await createCourseSubCategory(supabase, {
            name: subName,
            courseCategoryId: categoryData.id,
          });

          console.log(
            subSuccess
              ? `  ↳ ✅ Created subcategory: ${subName}`
              : `  ↳ ❌ Failed to create subcategory: ${subName}`,
          );
        }
      }

      await supabase.auth.signOut();
    } else {
      console.log(`❌ Failed to sign in as ${creator.email}`);
    }
  }
}
