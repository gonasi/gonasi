import { motion } from 'framer-motion';
import { X } from 'lucide-react';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { PlainButton } from '~/components/ui/button';
import { CardFooter } from '~/components/ui/card';

export const QuizExplanation = ({
  explanation,
  toggleExplanation,
}: {
  explanation: string;
  toggleExplanation: () => void;
}) => {
  if (!explanation) return null;

  return (
   
  );
};
