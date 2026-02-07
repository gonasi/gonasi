import type { LiveSessionViewComponentProps } from './core/types';

/**
 * Base wrapper for live session views
 * Provides common layout and structure
 */
function BaseLiveSessionView({
  block,
  children,
}: LiveSessionViewComponentProps & { children?: React.ReactNode }) {
  return (
    <div className='w-full space-y-4'>
      {/* Placeholder for live session content */}
      <div className='text-muted-foreground rounded-lg border border-dashed p-8 text-center'>
        <p className='text-sm'>Live Session View</p>
        <p className='text-muted-foreground mt-1 text-xs'>Plugin: {block.plugin_type}</p>
        <p className='text-muted-foreground mt-1 text-xs'>Status: {block.status || 'pending'}</p>
        {children}
      </div>
    </div>
  );
}

/**
 * Default/fallback live view for plugins without a specific implementation
 */
export function DefaultLiveSessionView(props: LiveSessionViewComponentProps) {
  return (
    <BaseLiveSessionView {...props}>
      <p className='text-muted-foreground mt-4 text-xs'>Live view not yet implemented</p>
    </BaseLiveSessionView>
  );
}
