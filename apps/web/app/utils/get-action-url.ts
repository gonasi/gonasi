interface Params {
  username?: string;
  courseId?: string;
  chapterId?: string;
  lessonId?: string;
}

interface Block {
  id?: string;
}

export function getActionUrl(params: Params, block?: Block): string {
  const username = params.username ?? 'unknown-user';
  const courseId = params.courseId ?? 'unknown-course';
  const chapterId = params.chapterId ?? 'unknown-chapter';
  const lessonId = params.lessonId ?? 'unknown-lesson';
  const blockId = block?.id ?? 'create-new';

  const basePath = `/${username}/course-builder/${courseId}/content`;
  return `${basePath}/${chapterId}/${lessonId}/lesson-blocks/${blockId}/upsert`;
}
