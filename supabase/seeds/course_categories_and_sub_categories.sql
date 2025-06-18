-- enable the uuid extension if not already enabled
create extension if not exists "uuid-ossp";

-- insert categories and subcategories
with inserted_categories as (
  insert into public.course_categories (id, name, description, created_by, updated_by)
  values
    (uuid_generate_v4(), '📘 General Education', 'Build a strong academic foundation with essential school subjects.', null, null),
    (uuid_generate_v4(), '🏫 Primary School', 'Courses tailored to early learners building core literacy and numeracy.', null, null),
    (uuid_generate_v4(), '🏫 High School', 'Courses aligned with secondary school curriculum and exams.', null, null),
    (uuid_generate_v4(), '🌐 Language Learning', 'Master new languages and improve fluency across skills.', null, null),
    (uuid_generate_v4(), '💼 Professional Skills', 'Gain practical skills to thrive in the modern workplace.', null, null),
    (uuid_generate_v4(), '🖥️ Technology', 'Explore the digital world through coding, data, and innovation.', null, null),
    (uuid_generate_v4(), '🧠 Personal Development', 'Grow your mindset, habits, and everyday life skills.', null, null),
    (uuid_generate_v4(), '🎨 Creative Arts', 'Unlock your creative potential through art, music, and design.', null, null),
    (uuid_generate_v4(), '📚 Test Prep & Study', 'Prepare for exams and improve your academic performance.', null, null),
    (uuid_generate_v4(), '🚗 Driving & Safety', 'Learn safe driving skills and pass official road tests.', null, null),
    (uuid_generate_v4(), '⚙️ Vocational Training', 'Get hands-on training for skilled trades and careers.', null, null),
    (uuid_generate_v4(), '🧘 Lifestyle & Wellness', 'Live a healthier, more balanced life with wellness practices.', null, null)
  returning id, name
)
insert into public.course_sub_categories (id, category_id, name, created_by, updated_by)
select uuid_generate_v4(), ic.id, sub, null, null
from inserted_categories ic,
lateral (
  select unnest(array[
    case ic.name
      when '📘 General Education' then array[
        'Mathematics',
        'Science', 
        'Language & Communication',
        'History & Culture',
        'Geography',
        'Art & Design',
        'Civics & Social Studies',
        'Religious Studies'
      ]
      when '🏫 Primary School' then array[
        'Basic Math',
        'Reading & Phonics',
        'Environmental Studies',
        'Early Science',
        'Creative Writing',
        'Moral Education',
        'Physical Education',
        'Art & Crafts'
      ]
      when '🏫 High School' then array[
        'Algebra & Geometry',
        'Biology',
        'Chemistry',
        'Physics',
        'English Literature',
        'World History',
        'Economics',
        'Government & Civics',
        'ICT (Information & Communication Technology)'
      ]
      when '🌐 Language Learning' then array[
        'English (ESL)',
        'French',
        'Spanish',
        'German',
        'Mandarin Chinese',
        'Swahili',
        'Arabic',
        'Sign Language',
        'Language Test Prep (TOEFL, IELTS, DELE, etc.)',
        'Phonetics & Pronunciation'
      ]
      when '💼 Professional Skills' then array[
        'Business & Management',
        'Marketing & Sales',
        'Finance & Accounting',
        'Leadership',
        'Human Resources',
        'Entrepreneurship'
      ]
      when '🖥️ Technology' then array[
        'Web Development',
        'Mobile Development',
        'Data Science & AI',
        'Cybersecurity',
        'Game Development',
        'DevOps & Cloud',
        'IT & Networking',
        'UI/UX Design'
      ]
      when '🧠 Personal Development' then array[
        'Productivity',
        'Public Speaking',
        'Mental Health',
        'Goal Setting',
        'Personal Finance',
        'Critical Thinking'
      ]
      when '🎨 Creative Arts' then array[
        'Photography',
        'Music',
        'Drawing & Painting',
        'Graphic Design',
        'Video Editing',
        'Writing'
      ]
      when '📚 Test Prep & Study' then array[
        'Standardized Tests',
        'Admissions Prep',
        'Study Skills',
        'Essay Writing',
        'Tutoring'
      ]
      when '🚗 Driving & Safety' then array[
        'Road Rules',
        'Driving Skills',
        'Vehicle Maintenance',
        'NTSA Test Prep',
        'Road Signs'
      ]
      when '⚙️ Vocational Training' then array[
        'Carpentry',
        'Plumbing',
        'Electrical Work',
        'Auto Mechanics',
        'Construction Safety'
      ]
      when '🧘 Lifestyle & Wellness' then array[
        'Fitness',
        'Nutrition',
        'Yoga & Meditation',
        'Home Skills',
        'Travel & Adventure'
      ]
    end
  ]) as sub
) as subquery;
