-- Insert user first
INSERT INTO auth.users (id, email) VALUES
  ('123e4567-e89b-12d3-a456-426614174000', 'gonasiapp@gmail.com');

-- ====================================
-- Seed Data: Course Categories & Subs
-- ====================================

-- Set the user_id variable (PostgreSQL syntax)
DO $$
DECLARE
    user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
BEGIN

-- 📘 General Education
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '📘 General Education', 'Build a strong academic foundation with essential school subjects.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Mathematics',
       'Science',
       'Language & Communication',
       'History & Culture',
       'Art & Design',
       'Geography'
     ]) AS subcats(name)
WHERE cc.name = '📘 General Education';

-- 💼 Professional Skills
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '💼 Professional Skills', 'Gain practical skills to thrive in the modern workplace.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Business & Management',
       'Marketing & Sales',
       'Finance & Accounting',
       'Leadership',
       'Human Resources',
       'Entrepreneurship'
     ]) AS subcats(name)
WHERE cc.name = '💼 Professional Skills';

-- 🖥️ Technology
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '🖥️ Technology', 'Explore the digital world through coding, data, and innovation.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Web Development',
       'Mobile Development',
       'Data Science & AI',
       'Cybersecurity',
       'Game Development',
       'DevOps & Cloud',
       'IT & Networking',
       'UI/UX Design'
     ]) AS subcats(name)
WHERE cc.name = '🖥️ Technology';

-- 🧠 Personal Development
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '🧠 Personal Development', 'Grow your mindset, habits, and everyday life skills.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Productivity',
       'Public Speaking',
       'Mental Health',
       'Goal Setting',
       'Personal Finance',
       'Critical Thinking'
     ]) AS subcats(name)
WHERE cc.name = '🧠 Personal Development';

-- 🎨 Creative Arts
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '🎨 Creative Arts', 'Unlock your creative potential through art, music, and design.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Photography',
       'Music',
       'Drawing & Painting',
       'Graphic Design',
       'Video Editing',
       'Writing'
     ]) AS subcats(name)
WHERE cc.name = '🎨 Creative Arts';

-- 📚 Test Prep & Study
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '📚 Test Prep & Study', 'Prepare for exams and improve your academic performance.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Standardized Tests',
       'Admissions Prep',
       'Study Skills',
       'Essay Writing',
       'Tutoring'
     ]) AS subcats(name)
WHERE cc.name = '📚 Test Prep & Study';

-- 🚗 Driving & Safety
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '🚗 Driving & Safety', 'Learn safe driving skills and pass official road tests.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Road Rules',
       'Driving Skills',
       'Vehicle Maintenance',
       'NTSA Test Prep',
       'Road Signs'
     ]) AS subcats(name)
WHERE cc.name = '🚗 Driving & Safety';

-- ⚙️ Vocational Training
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '⚙️ Vocational Training', 'Get hands-on training for skilled trades and careers.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Carpentry',
       'Plumbing',
       'Electrical Work',
       'Auto Mechanics',
       'Construction Safety'
     ]) AS subcats(name)
WHERE cc.name = '⚙️ Vocational Training';

-- 🧘 Lifestyle & Wellness
INSERT INTO public.course_categories (id, name, description, created_by, updated_by)
VALUES (gen_random_uuid(), '🧘 Lifestyle & Wellness', 'Live a healthier, more balanced life with wellness practices.', user_id, user_id);

INSERT INTO public.course_sub_categories (id, category_id, name, created_by, updated_by)
SELECT gen_random_uuid(), cc.id, subcats.name, user_id, user_id
FROM public.course_categories cc,
     unnest(ARRAY[
       'Fitness',
       'Nutrition',
       'Yoga & Meditation',
       'Home Skills',
       'Travel & Adventure'
     ]) AS subcats(name)
WHERE cc.name = '🧘 Lifestyle & Wellness';

END $$;