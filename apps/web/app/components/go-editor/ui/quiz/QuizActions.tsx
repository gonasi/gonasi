import { useCallback, useEffect, useState } from 'react';
import { useFetcher, useParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, PartyPopper, RefreshCw, XCircle } from 'lucide-react';

import type { InteractiveNodePayload, NodeProgressMap } from '@gonasi/database/lessons';

import { ContinueButton } from '../ContinueButton';

import { Button, OutlineButton } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useStore } from '~/store';

interface QuizActionsProps {
  isAnswerChecked: boolean;
  isCorrect: boolean;
  showExplanation: boolean;
  showCorrectAnswer: boolean;
  selectedAnswer: boolean | null;
  onCheck: () => void;
  onReset: () => void;
  onShowAnswer: () => void;
  onShowExplanation: () => void;
  uuid: string;
  hideContinue?: boolean;
  isPrePopulated?: boolean;
  attempts: { selectedAnswer: boolean | null; isCorrect: boolean; timestamp: string }[];
}

const baseButtonStyle = 'rounded-full';
const baseFeedbackStyle = 'flex items-center justify-between px-6 py-4 font-medium rounded-b-xl';

// Variants
const feedbackVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const shakeVariants = {
  initial: { x: 0, opacity: 0 },
  animate: {
    x: [0, -10, 10, -6, 6, -3, 3, 0],
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeInOut' },
  },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const resetExitVariant = {
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

export const QuizActions = ({
  isAnswerChecked,
  isCorrect,
  showExplanation,
  showCorrectAnswer,
  selectedAnswer,
  onCheck,
  onReset,
  onShowAnswer,
  onShowExplanation,
  uuid,
  hideContinue,
  isPrePopulated,
  attempts,
}: QuizActionsProps) => {
  const { optimisticallyUpdateNodeProgress } = useStore();

  const [isResetting, setIsResetting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetcher = useFetcher();
  const params = useParams();

  useEffect(() => {
    setLoading(fetcher.state === 'submitting');
  }, [fetcher.state]);

  const handleContinue = useCallback(() => {
    const formData = new FormData();

    const payload: InteractiveNodePayload = {
      uuid,
      nodeType: 'true-or-false',
      isCorrect,
      isAnswerChecked,
      showExplanation,
      showCorrectAnswer,
      attempts,
      timestamp: new Date().toISOString(),
    };

    formData.append('intent', 'addGoInteractive');
    formData.append('payload', JSON.stringify(payload));

    // Cast to unknown first and then to the target type to satisfy TypeScript
    const progressUpdate = {
      [uuid]: {
        type: 'true-or-false' as const,
        payload,
      },
    } as unknown as Partial<NodeProgressMap>;

    // Optimistic update in Zustand store
    optimisticallyUpdateNodeProgress(progressUpdate);

    fetcher.submit(formData, {
      method: 'post',
      action: `/go/course/${params.courseId}/${params.chapterId}/${params.lessonId}/api-interactive`,
    });
  }, [
    uuid,
    isCorrect,
    isAnswerChecked,
    showExplanation,
    showCorrectAnswer,
    attempts,
    optimisticallyUpdateNodeProgress,
    fetcher,
    params.courseId,
    params.chapterId,
    params.lessonId,
  ]);

  if (!isAnswerChecked) {
    return (
      <Button
        variant='secondary'
        className={cn(baseButtonStyle, 'mb-4')}
        rightIcon={<CheckCheck />}
        disabled={selectedAnswer === null || isPrePopulated}
        onClick={onCheck}
      >
        Check
      </Button>
    );
  }

  const handleResetWithAnimation = () => {
    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      onReset();
    }, 200); // matches exit duration
  };

  const renderFeedback = (
    color: 'success' | 'destructive',
    icon: React.ReactNode,
    label: string,
    actions: React.ReactNode,
  ) => {
    const isError = color === 'destructive';

    return (
      <AnimatePresence mode='wait'>
        {!isResetting && (
          <motion.div
            key={color}
            initial='initial'
            animate='animate'
            exit='exit'
            variants={isError ? { ...shakeVariants, ...resetExitVariant } : feedbackVariants}
            className='-mx-6'
          >
            <div
              className={cn(baseFeedbackStyle, {
                'bg-success/5 text-success': color === 'success',
                'bg-danger/3 text-danger': color === 'destructive',
                'rounded-none': showExplanation,
              })}
            >
              <div className='flex w-full items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  {icon}
                  <p>{label}</p>
                </div>
                <div className='flex space-x-2'>{actions}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (isCorrect || showCorrectAnswer) {
    return renderFeedback(
      'success',
      <PartyPopper />,
      'Correct!',
      <>
        <OutlineButton
          className={baseButtonStyle}
          onClick={onShowExplanation}
          disabled={showExplanation}
        >
          Why?
        </OutlineButton>
        {!hideContinue && (
          <ContinueButton
            onClick={handleContinue}
            loading={loading}
            disabled={loading || isPrePopulated}
          />
        )}
      </>,
    );
  }

  return renderFeedback(
    'destructive',
    <XCircle />,
    'Incorrect',
    <>
      <OutlineButton
        className={baseButtonStyle}
        rightIcon={<RefreshCw size={16} />}
        onClick={handleResetWithAnimation}
        disabled={isPrePopulated}
      >
        Try Again
      </OutlineButton>
      <Button
        variant='secondary'
        className={baseButtonStyle}
        onClick={onShowAnswer}
        disabled={isPrePopulated}
      >
        Show Answer
      </Button>
    </>,
  );
};
