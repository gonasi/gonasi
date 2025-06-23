import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface Props {
  hasNotifications?: boolean;
}

export function SettingsNotificationsIcon({ hasNotifications = false }: Props) {
  return (
    <div className='group relative'>
      {/* Settings Icon */}
      <Settings
        className='transition-transform duration-200 group-hover:scale-105 group-hover:rotate-15'
        size={26}
      />

      {hasNotifications && (
        <>
          {/* Ping Animation (optional ring) */}
          <motion.div
            className='bg-primary/30 absolute -top-2 -right-2 h-3 w-3 rounded-full'
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />

          {/* Animated Notification Badge */}
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: 'easeInOut',
            }}
            className='bg-primary absolute -top-1.5 -right-1.5 h-1.5 w-1.5 rounded-full shadow-md'
          >
            <span className='sr-only'>Notifications available</span>
          </motion.div>
        </>
      )}
    </div>
  );
}
