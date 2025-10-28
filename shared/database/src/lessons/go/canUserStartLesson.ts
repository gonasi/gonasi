// import { createClient } from '@supabase/supabase-js';

// // Initialize Supabase client
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!);

// export async function canUserStartLesson(userId: string, lessonId: string): Promise<boolean> {
//   const { data, error } = await supabase
//     .from('lessons_progress')
//     .select('is_complete')
//     .eq('user_id', userId)
//     .eq('lesson_id', async () => {
//       // Find the previous lesson in the same chapter
//       const { data: prevLesson, error: lessonError } = await supabase
//         .from('lessons')
//         .select('id')
//         .eq('chapter_id', async () => {
//           const { data: currentLesson, error: currentError } = await supabase
//             .from('lessons')
//             .select('chapter_id, position')
//             .eq('id', lessonId)
//             .single();

//           if (currentError || !currentLesson) return null;
//           return currentLesson.chapter_id;
//         })
//         .eq('position', async () => {
//           const { data: currentLesson, error: currentError } = await supabase
//             .from('lessons')
//             .select('position')
//             .eq('id', lessonId)
//             .single();

//           if (currentError || !currentLesson) return null;
//           return currentLesson.position - 1;
//         })
//         .single();

//       if (lessonError || !prevLesson) return null;
//       return prevLesson.id;
//     });

//   if (error) {
//     console.error('Error checking previous lesson:', error);
//     return false;
//   }

//   return data?.length > 0 && data[0].is_complete;
// }
