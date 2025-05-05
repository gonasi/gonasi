import * as LucideIcons from 'lucide-react';
import type { z } from 'zod';

import type { LucideIconSchema } from '@gonasi/schemas/lessonTypes';
import { hslToHsla } from '@gonasi/utils/hslToHsla';

import { ActionDropdown } from '../action-dropdown';
import { LucideIconRenderer } from './lucide-icon-renderer';

interface Props {
  id: string;
  name: string;
  description: string;
  lucideIcon: z.infer<typeof LucideIconSchema>;
  bgColor: string;
}

export function LessonTypeCard({ id, name, description, lucideIcon, bgColor }: Props) {
  return (
    <div
      className='bg-card/80 max-w-xl rounded-2xl border-t-4 p-4'
      style={{ borderTopColor: hslToHsla(bgColor, 90) }}
    >
      <div className='flex items-center justify-between pb-4'>
        <div className='flex items-center space-x-2'>
          <LucideIconRenderer name={lucideIcon} aria-hidden color={bgColor} />
          <h3 className='mt-1 font-medium'>{name}</h3>
        </div>

        <ActionDropdown
          items={[
            {
              title: 'Edit',
              icon: LucideIcons.Pencil,
              to: `/go-admin/lesson-types/${id}/edit`,
            },
            {
              title: 'Delete',
              icon: LucideIcons.Trash,
              to: `/go-admin/lesson-types/${id}/delete`,
            },
          ]}
        />
      </div>
      <p className='font-secondary text-muted-foreground line-clamp-3 text-sm'>{description}</p>
    </div>
  );
}
