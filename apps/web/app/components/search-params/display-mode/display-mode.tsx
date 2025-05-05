import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTree, Rows4 } from 'lucide-react';

import { Label } from '~/components/ui/label';
import { Switch } from '~/components/ui/switch';

export function DisplayMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const displayMode = searchParams.get('display') || 'path';
  const isPathView = displayMode === 'path';

  const handleToggle = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('display', isPathView ? 'columns' : 'path');
    setSearchParams(newParams);
  };

  const modes = [
    { key: 'path', label: 'Path', icon: '🛤️', active: isPathView },
    { key: 'columns', label: 'Columns', icon: '🧱', active: !isPathView },
  ];

  const Icon = isPathView ? ListTree : Rows4;
  const description = `Currently showing as ${isPathView ? 'a path' : 'columns'}.`;

  return (
    <div className='py-8'>
      <Label className='font-bold' htmlFor='view-all-switch'>
        <div className='flex items-center space-x-2'>
          <div>View mode:</div>
          {modes.map((mode, index) => (
            <div key={mode.key} className='flex items-center space-x-1'>
              {index > 0 && <div>|</div>}
              <div>{mode.icon}</div>
              <motion.div
                initial={{ opacity: 0.6 }}
                animate={{
                  opacity: mode.active ? 1 : 0.6,
                  scale: mode.active ? 1.05 : 1,
                }}
                transition={{ duration: 0.3 }}
                className={`cursor-pointer ${mode.active ? 'font-medium underline' : ''}`}
              >
                {mode.label}
              </motion.div>
            </div>
          ))}
        </div>
      </Label>

      <Switch id='view-all-switch' checked={isPathView} onCheckedChange={handleToggle} />

      <div className='text-muted-foreground min-h-[24px] text-xs'>
        <AnimatePresence mode='wait'>
          <motion.div
            key={displayMode}
            className='flex items-center space-x-1'
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
          >
            <Icon size={16} />
            <p className='pt-1'>{description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
