import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { motion } from 'framer-motion';
import { $getNodeByKey } from 'lexical';

import { MatchConcepts } from './Components/MatchConcepts';
import type { MatchConceptsBase } from '.';

import useModal from '~/components/go-editor/hooks/useModal';
import { InsertMatchConceptsDialog } from '~/components/go-editor/plugins/GoMenuPlugin/DragAndDropPlugins/MatchConcepts';
import { getPayloadByUuidAndType } from '~/components/go-editor/ui/quiz/getPayloadByUuidAndType';
import { QuizCard } from '~/components/go-editor/ui/quiz/QuizCard';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { TapToRevealActions } from '~/components/go-editor/ui/tap-to-reveal-card/TapToRevealActions';
import { useStore } from '~/store';

interface MatchConceptsComponentProps extends MatchConceptsBase {
  nodeKey: string;
}

export default function MatchConceptsComponent({
  nodeKey,
  title,
  items,
  uuid,
}: MatchConceptsComponentProps) {
  const { nodeProgress } = useStore();
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();

  const initialPlayed =
    getPayloadByUuidAndType(nodeProgress, uuid, 'tap-to-reveal')?.isPlayed ?? false;

  const [isPlayed, setIsPlayed] = useState(initialPlayed);

  // Only show actions if this is the first time revealing the content
  // If initialPlayed is true, the user has already revealed this in a previous session
  const [shouldShowActions, setShouldShowActions] = useState(false);

  // Track revelations only for new content that hasn't been revealed before
  useEffect(() => {
    if (isPlayed && !initialPlayed) {
      setShouldShowActions(true);
    }
  }, [isPlayed, initialPlayed]);

  const onDeleteNode = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  const onEditNode = useCallback(() => {
    showModal(
      'Edit tap to reveal',
      (onClose) => (
        <InsertMatchConceptsDialog
          activeEditor={editor}
          onClose={onClose}
          defaultData={{
            titleState: JSON.stringify(title),
            itemsState: items.map((item) => ({
              itemState: JSON.stringify(item.item),
              valueState: JSON.stringify(item.value),
            })),
            uuid,
          }}
          mode='edit'
          nodeKey={nodeKey}
        />
      ),
      'h-fit',
      null,
    );
  }, [showModal, editor, title, items, uuid, nodeKey]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-uuid={uuid}
    >
      {modal}
      <QuizCard
        onEdit={onEditNode}
        onDelete={onDeleteNode}
        editable={editor._editable}
        className='flex w-full flex-col items-center justify-center bg-transparent'
      >
        <RichTextRenderer editorState={JSON.stringify(title)} />
        <MatchConcepts />
      </QuizCard>
      {shouldShowActions && <TapToRevealActions uuid={uuid} />}
    </motion.div>
  );
}
