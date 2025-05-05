import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { TabsContent } from '~/components/ui/tabs';

interface AnimatedTabContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

export function AnimatedTabContent({ value, children, className }: AnimatedTabContentProps) {
  return (
    <TabsContent value={value} className={`py-4 ${className || ''}`} forceMount>
      <motion.div {...fadeIn}>{children}</motion.div>
    </TabsContent>
  );
}
