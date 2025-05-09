import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import RichTextRenderer from '../RichTextRenderer';

import { PlainButton } from '~/components/ui/button';
import { CardFooter } from '~/components/ui/card';

export const QuizExplanation = ({
  explanation,
  onShowExplanation,
}: {
  explanation: string;
  onShowExplanation: () => void;
}) => {
  if (!explanation) return null;

  return (
    <CardFooter className='-mx-6'>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className='bg-background/40 rounded-b-0 w-full px-6 py-4 md:rounded-b-lg'
      >
        <div className='flex items-center justify-between pb-2'>
          <h4 className='text-lg font-medium'>Explanation</h4>
          <PlainButton onClick={onShowExplanation}>
            <X />
          </PlainButton>
        </div>
        <RichTextRenderer editorState={explanation} />
      </motion.div>
    </CardFooter>
  );
};
