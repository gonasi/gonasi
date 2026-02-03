import { BookOpen } from 'lucide-react';

import { LucideIconRenderer } from '~/components/cards';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '~/components/ui/accordion/accordion';
import { Badge } from '~/components/ui/badge/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card/card';

interface LessonType {
  id: string;
  name: string;
  description: string;
  lucide_icon: string;
  bg_color: string;
}

interface Lesson {
  id: string;
  name: string;
  position: number;
  total_blocks: number;
  lesson_types: LessonType;
}

interface Chapter {
  id: string;
  name: string;
  description: string;
  position: number;
  total_lessons: number;
  total_blocks: number;
  lessons?: Lesson[];
}

interface CourseStructureOverview {
  total_chapters: number;
  total_lessons: number;
  total_blocks: number;
  chapters?: Chapter[];
}

interface CourseStructureProps {
  course_structure_overview: CourseStructureOverview;
}

export function CourseStructure({ course_structure_overview }: CourseStructureProps) {
  if (!course_structure_overview) {
    return null;
  }

  return (
    <Card className='rounded-none'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <BookOpen className='size-5' />
          <CardTitle>Course Structure</CardTitle>
        </div>
        <CardDescription>
          {course_structure_overview.total_chapters} chapters •{' '}
          {course_structure_overview.total_lessons} lessons •{' '}
          {course_structure_overview.total_blocks} blocks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type='multiple' className='flex flex-col gap-2'>
          {course_structure_overview.chapters?.map((chapter, index) => (
            <AccordionItem key={chapter.id} value={`chapter-${index}`}>
              <AccordionTrigger>
                <div className='flex flex-col items-start gap-2 text-left'>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline'>{chapter.position}</Badge>
                    <h3 className='font-semibold'>{chapter.name}</h3>
                  </div>
                  {chapter.description && (
                    <p className='text-muted-foreground text-sm'>{chapter.description}</p>
                  )}
                  <div className='text-muted-foreground flex gap-4 text-xs'>
                    <span>{chapter.total_lessons} lessons</span>
                    <span>{chapter.total_blocks} blocks</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className='flex flex-col gap-2'>
                  {chapter.lessons?.map((lesson) => (
                    <div
                      key={lesson.id}
                      className='flex items-center justify-between rounded-md border p-3'
                      style={{
                        borderLeftWidth: '4px',
                        borderLeftColor: lesson.lesson_types.bg_color,
                      }}
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className='flex size-8 items-center justify-center rounded-md'
                          style={{
                            backgroundColor: `${lesson.lesson_types.bg_color}20`,
                          }}
                        >
                          <LucideIconRenderer
                            name={lesson.lesson_types.lucide_icon}
                            size={16}
                            color={lesson.lesson_types.bg_color}
                          />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='text-muted-foreground text-xs'>{lesson.position}</span>
                            <span className='text-sm font-medium'>{lesson.name}</span>
                          </div>
                          <p className='text-muted-foreground text-xs'>
                            {lesson.lesson_types.name} • {lesson.total_blocks} blocks
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
