// Utility function to build base path for modal URLs
export const getLessonPath = ({ username, courseId, chapterId, lessonId }) =>
  `/${username}/course-builder/${courseId}/content/${chapterId}/${lessonId}/lesson-blocks`;
