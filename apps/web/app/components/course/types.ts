export interface Lesson {
  id: string;
  title: string;
  duration?: string;
  isCompleted?: boolean;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  name: string;
  thumbnail?: string;
  description?: string;
  instructor: {
    name: string;
    avatar?: string;
  };
  lessons?: number;
  enrolled?: number;
  lastUpdated?: string;
  category?: string;
  subCategory?: string;
}
