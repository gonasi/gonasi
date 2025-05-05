export interface CourseCardProps {
  name: string;
  author: {
    displayName: string;
    imageUrl: string | null;
  };
  description: string | null;
  iconUrl: string | null;
  lessonsCount: number | null;
  chaptersCount: number | null;
  to: string;
  price: number | null;
  category?: string | null;
  subcategory?: string | null;
  updatedAt: string;
  status: string | null;
}
