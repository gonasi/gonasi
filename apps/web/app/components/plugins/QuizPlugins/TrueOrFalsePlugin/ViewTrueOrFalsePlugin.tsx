import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, PartyPopper, RefreshCw, X, XCircle } from 'lucide-react';

import type { TrueOrFalseSchemaType } from '@gonasi/schemas/plugins';

import { useTrueOrFalseInteraction } from './hooks/useTrueOrFalseInteraction';
import { PlayPluginWrapper } from '../../common/PlayPluginWrapper';
import { RenderFeedback } from '../../common/RenderFeedback';
import { ViewPluginWrapper } from '../../common/ViewPluginWrapper';
import { useViewPluginCore } from '../../hooks/useViewPluginCore';
import type { ViewPluginComponentProps } from '../../viewPluginTypesRenderer';

import RichTextRenderer from '~/components/go-editor/ui/RichTextRenderer';
import {
  AnimateInButtonWrapper,
  BlockActionButton,
  Button,
  OutlineButton,
  PlainButton,
} from '~/components/ui/button';
import { CardFooter } from '~/components/ui/card';
import { ReducingProgress } from '~/components/ui/circular-progress';
import { cn } from '~/lib/utils';

export function ViewTrueOrFalsePlugin({ block, mode }: ViewPluginComponentProps) {
  const { loading, canRender, handleContinue, blockInteractionData, isLastBlock } =
    useViewPluginCore({
      blockId: block.id,
      pluginType: block.plugin_type,
      settings: block.settings,
      mode,
    });

  const { is_complete } = blockInteractionData ?? {};
  const { playbackMode, autoContinue, delayBeforeAutoContinue } = block.settings;
  const { questionState, correctAnswer, explanationState, hint } =
    block.content as TrueOrFalseSchemaType;

  const shouldShowActionButton = !is_complete && mode !== 'preview' && !autoContinue;
  const shouldShowProgress = !is_complete && autoContinue;

  const [showExplanation, setShowExplanation] = useState(false);
  const interaction = useTrueOrFalseInteraction();

  const { state, selectedOption, selectOption, checkAnswer, revealCorrectAnswer, tryAgain } =
    interaction;

  if (!canRender) return null;

  return (
    <ViewPluginWrapper isComplete={is_complete} playbackMode={playbackMode}>
      <PlayPluginWrapper hint={hint}>
        {/* Question */}
        <RichTextRenderer editorState={questionState} />

        {/* Options: True / False */}
        <div className='flex flex-col gap-4'>
          <div className='flex justify-between space-x-8 py-6'>
            {([true, false] as const).map((val) => {
              const isSelected = selectedOption === val;
              const icon = val ? <Check /> : <X />;

              const isCorrectAttempt =
                !!state.correctAttempt && state.correctAttempt.selected === val;
              const isWrongAttempt = !!state.wrongAttempts?.some(
                (attempt) => attempt.selected === val,
              );

              const isDisabled =
                isCorrectAttempt || isWrongAttempt || state.continue || state.isCorrect !== null;

              return (
                <div key={String(val)} className='relative w-full'>
                  <OutlineButton
                    onClick={() => selectOption(val)}
                    leftIcon={icon}
                    className={cn('relative w-full', {
                      'border-secondary bg-secondary/20 hover:bg-secondary-10 hover:border-secondary/80':
                        isSelected,
                    })}
                    disabled={isDisabled}
                  >
                    {val ? 'True' : 'False'}
                  </OutlineButton>

                  {/* Attempt indicator icon */}
                  <div className='absolute -top-1.5 -right-1.5 rounded-full'>
                    {isCorrectAttempt && (
                      <Check
                        size={14}
                        className='text-success-foreground bg-success rounded-full p-0.5'
                      />
                    )}
                    {isWrongAttempt && (
                      <X
                        size={14}
                        className='text-danger-foreground bg-danger rounded-full p-0.5'
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Attempt count */}
        <div className='text-muted-foreground font-secondary pb-1 text-xs'>
          Attempts: <span className='font-normal'>{state.attemptsCount}</span>
        </div>

        {/* Explanation section */}
        {state.canShowExplanationButton && showExplanation && (
          <CardFooter className='-mx-6'>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className='rounded-b-0 bg-background/40 w-full px-6 py-4 md:rounded-b-lg'
            >
              <div className='flex items-center justify-between pb-2'>
                <h4 className='text-lg font-medium'>Explanation</h4>
                <PlainButton onClick={() => setShowExplanation(false)}>
                  <X />
                </PlainButton>
              </div>
              <RichTextRenderer editorState={explanationState} />
            </motion.div>
          </CardFooter>
        )}

        {/* Actions: Check, Feedback, Continue, Try Again */}
        <div className='w-full pb-4'>
          {/* Check Button */}
          {!state.continue && state.isCorrect === null && (
            <div className='flex w-full justify-end'>
              <AnimateInButtonWrapper>
                <Button
                  variant='secondary'
                  className='mb-4 rounded-full'
                  rightIcon={<CheckCheck />}
                  disabled={selectedOption === null || state.continue}
                  onClick={() => checkAnswer(correctAnswer === 'true')}
                >
                  Check
                </Button>
              </AnimateInButtonWrapper>
            </div>
          )}

          {/* Correct feedback */}
          {state.continue && (
            <RenderFeedback
              color='success'
              icon={<PartyPopper />}
              label='Correct!'
              actions={
                <div className='flex'>
                  <div>
                    {shouldShowActionButton && (
                      <BlockActionButton
                        onClick={handleContinue}
                        loading={loading}
                        isLastBlock={isLastBlock}
                      />
                    )}
                    {shouldShowProgress && <ReducingProgress time={delayBeforeAutoContinue} />}
                  </div>
                  <div>
                    {!showExplanation && (
                      <AnimateInButtonWrapper>
                        <OutlineButton
                          className='ml-4 rounded-full'
                          onClick={() => setShowExplanation(true)}
                        >
                          Why?
                        </OutlineButton>
                      </AnimateInButtonWrapper>
                    )}
                  </div>
                </div>
              }
            />
          )}

          {/* Incorrect feedback */}
          {state.isCorrect === false && (
            <RenderFeedback
              color='destructive'
              icon={<XCircle />}
              label='Incorrect!'
              actions={
                <div className='flex items-center space-x-4'>
                  <OutlineButton
                    className='rounded-full'
                    rightIcon={<RefreshCw size={16} />}
                    onClick={tryAgain}
                  >
                    Try Again
                  </OutlineButton>
                  {!showExplanation && (
                    <Button
                      variant='secondary'
                      className='rounded-full'
                      onClick={() => revealCorrectAnswer(correctAnswer === 'true')}
                    >
                      Show Answer
                    </Button>
                  )}
                </div>
              }
            />
          )}
        </div>
      </PlayPluginWrapper>

      {/* Debug information for developers */}
      {/* <TrueOrFalseInteractionDebug interaction={interaction} /> */}
    </ViewPluginWrapper>
  );
}
