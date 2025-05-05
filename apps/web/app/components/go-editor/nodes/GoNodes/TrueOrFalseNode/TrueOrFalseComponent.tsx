import { useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { motion } from 'framer-motion';
import { $getNodeByKey } from 'lexical';

import type { TrueOrFalseBase } from '.';

import useModal from '~/components/go-editor/hooks/useModal';
import { InsertTrueOrFalseDialog } from '~/components/go-editor/plugins/GoMenuPlugin/QuizPlugins/TrueOrFalsePlugin';
import { TrueOrFalseOptions } from '~/components/go-editor/ui/quiz/AnswerOptions/TrueOrFalseOptions';
import { getPayloadByUuidAndType } from '~/components/go-editor/ui/quiz/getPayloadByUuidAndType';
import { QuizActions } from '~/components/go-editor/ui/quiz/QuizActions';
import { QuizCard } from '~/components/go-editor/ui/quiz/QuizCard';
import { QuizExplanation } from '~/components/go-editor/ui/quiz/QuizExplanation';
import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import { useStore } from '~/store';

interface TrueOrFalseComponentProps extends TrueOrFalseBase {
  nodeKey: string;
}

export default function TrueOrFalseComponent({
  nodeKey,
  questionState,
  correctAnswer,
  hint,
  explanationState,
  uuid,
}: TrueOrFalseComponentProps) {
  const { nodeProgress } = useStore();
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();

  // Consolidated state using a single object
  const [quizState, setQuizState] = useState(() => {
    const initialData = getPayloadByUuidAndType(nodeProgress, uuid, 'true-or-false');
    const lastAttempt = initialData?.attempts?.[initialData.attempts.length - 1];

    return {
      selectedAnswer: lastAttempt?.selectedAnswer ?? null,
      isAnswerChecked: initialData?.isAnswerChecked ?? false,
      isCorrect: lastAttempt?.isCorrect ?? false,
      incorrectAttempt: null as boolean | null,
      showExplanation: initialData?.showExplanation ?? false,
      showCorrectAnswer: initialData?.showCorrectAnswer ?? false,
      attemptsCount: initialData?.attempts?.length ?? 0,
      isPrePopulated: !!initialData,
      attempts: initialData?.attempts ?? [],
    };
  });

  // Memoized properties to avoid recalculations
  const isDisabled = editor._editable || quizState.isPrePopulated;

  // Handlers as callbacks to prevent unnecessary re-renders
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
      'Edit true or false',
      (onClose) => (
        <InsertTrueOrFalseDialog
          activeEditor={editor}
          onClose={onClose}
          defaultData={{
            questionState: JSON.stringify(questionState),
            correctAnswer: correctAnswer ? 'true' : 'false',
            explanationState: JSON.stringify(explanationState),
            hint,
            uuid,
          }}
          mode='edit'
          nodeKey={nodeKey}
        />
      ),
      'h-fit',
      null,
    );
  }, [editor, showModal, questionState, correctAnswer, explanationState, hint, uuid, nodeKey]);

  const handleAnswer = useCallback(
    (answer: boolean) => {
      if (quizState.isAnswerChecked) return;
      if (quizState.incorrectAttempt === answer) return;

      setQuizState((prev) => ({
        ...prev,
        selectedAnswer: answer,
      }));
    },
    [quizState.isAnswerChecked, quizState.incorrectAttempt],
  );

  const checkAnswer = useCallback(() => {
    if (quizState.selectedAnswer === null || quizState.isAnswerChecked) return;

    const isCorrect = quizState.selectedAnswer === correctAnswer;
    const timestamp = new Date().toISOString();

    setQuizState((prev) => ({
      ...prev,
      isAnswerChecked: true,
      isCorrect,
      attemptsCount: prev.attemptsCount + 1,
      incorrectAttempt: !isCorrect ? prev.selectedAnswer : prev.incorrectAttempt,
      attempts: [
        ...prev.attempts,
        {
          selectedAnswer: prev.selectedAnswer ?? false,
          isCorrect,
          timestamp,
        },
      ],
    }));
  }, [quizState.selectedAnswer, quizState.isAnswerChecked, correctAnswer]);

  const resetQuestion = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: null,
      isAnswerChecked: false,
      showExplanation: false,
      showCorrectAnswer: false,
      // Keep incorrectAttempt to maintain disabled state
    }));
  }, []);

  const handleShowAnswer = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      showCorrectAnswer: true,
    }));
  }, []);

  const handleToggleExplanation = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      showExplanation: !prev.showExplanation,
    }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-uuid={uuid}
    >
      {modal}
      <QuizCard hint={hint} onEdit={onEditNode} onDelete={onDeleteNode} editable={editor._editable}>
        <RichTextRenderer editorState={JSON.stringify(questionState)} />
        <TrueOrFalseOptions
          selectedAnswer={quizState.selectedAnswer}
          correctAnswer={correctAnswer}
          incorrectAttempt={quizState.incorrectAttempt}
          isAnswerChecked={quizState.isAnswerChecked}
          showCorrectAnswer={quizState.showCorrectAnswer}
          onAnswer={handleAnswer}
          isDisabled={isDisabled}
        />
        <div className='text-muted-foreground pb-1'>
          <span className='font-secondary text-xs'>Attempts: </span>
          <span>{quizState.attemptsCount}</span>
        </div>
        {quizState.showExplanation && (
          <QuizExplanation
            explanation={JSON.stringify(explanationState)}
            onShowExplanation={handleToggleExplanation}
          />
        )}
        <QuizActions
          isAnswerChecked={quizState.isAnswerChecked}
          isCorrect={quizState.isCorrect}
          showExplanation={quizState.showExplanation}
          showCorrectAnswer={quizState.showCorrectAnswer}
          selectedAnswer={quizState.selectedAnswer}
          onCheck={checkAnswer}
          onReset={resetQuestion}
          onShowAnswer={handleShowAnswer}
          onShowExplanation={handleToggleExplanation}
          uuid={uuid}
          hideContinue={quizState.isPrePopulated}
          isPrePopulated={quizState.isPrePopulated}
          attempts={quizState.attempts}
        />
      </QuizCard>
    </motion.div>
  );
}
