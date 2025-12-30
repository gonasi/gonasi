import type { JSX } from 'react';
import { lazy, Suspense } from 'react';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import type { LexicalEditor } from 'lexical';
import { AudioLines, ChevronDown, File, ImagePlus, Plus, SquareSplitVertical, Tag } from 'lucide-react';

import useModal from '../../hooks/useModal';

import { Spinner } from '~/components/loaders';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

const InsertImageDialog = lazy(() => import('../Files/ImagesPlugin/InsertImageDialog'));
const InsertAudioDialog = lazy(() => import('../Files/AudioPlugin/InsertAudioDialog'));

interface InsertDropdownProps {
  activeEditor: LexicalEditor;
  isEditable: boolean;
  toolbarState: {
    isLowercase: boolean;
  };
}

export function InsertDropdown({
  activeEditor,
  isEditable,
  toolbarState,
}: InsertDropdownProps): JSX.Element {
  const [modal, showModal] = useModal();

  return (
    <>
      <div className='flex-shrink-0'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              disabled={!isEditable}
              leftIcon={<Plus />}
              rightIcon={<ChevronDown />}
              aria-label='Insert specialized editor node'
            >
              Insert
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className=''>
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  showModal(
                    'Insert Image', // title
                    (
                      onClose, // getContent
                    ) => (
                      <Suspense fallback={<Spinner />}>
                        <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
                      </Suspense>
                    ),
                    '', // className (empty string is fine)
                    <File />, // leadingIcon (null is valid)
                    'lg', // size (valid value from 'sm' | 'md' | 'lg' | 'full')
                  );
                }}
                active={toolbarState.isLowercase}
              >
                <ImagePlus />
                Image
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  showModal(
                    'Insert Audio', // title
                    (
                      onClose, // getContent
                    ) => (
                      <Suspense fallback={<Spinner />}>
                        <InsertAudioDialog activeEditor={activeEditor} onClose={onClose} />
                      </Suspense>
                    ),
                    '', // className (empty string is fine)
                    <File />, // leadingIcon (null is valid)
                    'lg', // size (valid value from 'sm' | 'md' | 'lg' | 'full')
                  );
                }}
                active={toolbarState.isLowercase}
              >
                <AudioLines />
                Audio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                }}
                active={toolbarState.isLowercase}
              >
                <Tag />
                Tag
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
                }}
                active={toolbarState.isLowercase}
              >
                <SquareSplitVertical />
                Horizontal Rule
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {modal}
    </>
  );
}
