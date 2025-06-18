-- seed data for public.lesson_types

insert into public.lesson_types (
  name,
  description,
  lucide_icon,
  bg_color
) values
  ('📖 concept lesson', 'teaches core theories, definitions, and ideas.', 'bookopen', 'hsl(220 80% 50%)'),
  ('✅ interactive quiz', 'practice questions with instant feedback.', 'circlecheckbig', 'hsl(140 80% 40%)'),
  ('🧠 problem solving', 'step-by-step walkthroughs of challenging problems.', 'brain', 'hsl(30 90% 50%)'),
  ('🎬 video lesson', 'educational videos with visual explanations.', 'play', 'hsl(350 75% 50%)'),
  ('🔬 simulation', 'visual or interactive simulations to demonstrate concepts.', 'cpu', 'hsl(200 85% 45%)'),
  ('🛠️ mini project', 'small, scoped real-world application projects.', 'packageplus', 'hsl(270 75% 50%)'),
  ('🔁 review session', 'summarized recap or review of key concepts.', 'refreshcw', 'hsl(50 90% 50%)'),
  ('💬 discussion prompt', 'open-ended topic to encourage peer discussion.', 'messagecirclemore', 'hsl(310 75% 55%)'),
  ('🏆 challenge', 'timed or graded test-like questions.', 'trophy', 'hsl(0 80% 40%)'),
  ('🃏 flashcards', 'fast-paced recall and memorization tool.', 'layers', 'hsl(160 80% 40%)'),
  ('📄 reading material', 'pdfs, articles, or deep dives into theory.', 'filetext', 'hsl(210 70% 45%)'),
  ('🧾 assessment test', 'evaluates learner''s progress over a topic.', 'filecheck', 'hsl(280 70% 45%)'),
  ('📋 poll / survey', 'collect learner opinions or quick checks.', 'slidershorizontal', 'hsl(190 75% 50%)'),
  ('🖍️ annotation task', 'mark up texts, code, or diagrams.', 'highlighter', 'hsl(40 90% 50%)'),
  ('🎧 audio lesson', 'podcast-style auditory learning.', 'headphones', 'hsl(260 80% 50%)');
