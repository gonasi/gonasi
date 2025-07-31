import type { ShortcutValue } from '../ShortcutsPlugin/shortcuts';
import { type blockTypeToBlockName, blockTypeToIconComponent } from './ToolbarContext';

import { DropdownMenuItem, DropdownMenuShortcut } from '~/components/ui/dropdown-menu';
import { cn } from '~/lib/utils';

export interface BlockTypeDropdownItemProps {
  blockType: keyof typeof blockTypeToBlockName;
  label: string;
  active: boolean;
  shortcut: ShortcutValue;
  onClick: () => void;
}

export function BlockTypeDropdownItem(props: BlockTypeDropdownItemProps) {
  const { blockType, label, shortcut, onClick, active } = props;
  const Icon = blockTypeToIconComponent[blockType];

  const iconClass = cn('w-4 h-4 text-muted-foreground z-5', active && 'text-primary');

  return (
    <DropdownMenuItem active={active} onClick={onClick}>
      {Icon && <Icon className={iconClass} />}
      {label}
      <DropdownMenuShortcut className={cn({ 'text-primary': active })}>
        {shortcut}
      </DropdownMenuShortcut>
    </DropdownMenuItem>
  );
}
