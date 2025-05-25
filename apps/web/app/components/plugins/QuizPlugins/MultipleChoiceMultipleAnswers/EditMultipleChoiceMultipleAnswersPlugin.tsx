import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Save, Trash } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { v4 as uuidv4 } from 'uuid';

import {
  MultipleChoiceMultipleAnswersContentSchema,
  type MultipleChoiceType,
} from '@gonasi/schemas/plugins';

import type { EditPluginComponentProps } from '../../EditPluginTypesRenderer';

import { Button, OutlineButton } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { ErrorList, hasErrors, TextareaField } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

export function EditMultipleChoiceMultipleAnswersPlugin({ block }: EditPluginComponentProps) {
  const isPending = useIsPending();

  const [form, fields] = useForm({
    id: `edit-${block.plugin_type}-form`,
    constraint: getZodConstraint(MultipleChoiceMultipleAnswersContentSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    defaultValue: {
      ...block.content,
    },
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: MultipleChoiceMultipleAnswersContentSchema });
    },
  });

  const choices = fields.choices.getFieldList();

  const getChoices = (): MultipleChoiceType[] =>
    choices.map((fieldset) => {
      const { choiceState, uuid } = fieldset.getFieldset();
      return {
        uuid: uuid.value ?? '',
        choiceState: choiceState.value ?? '',
      };
    });

  const updateChoices = (updated: MultipleChoiceType[]) => {
    form.update({
      name: fields.choices.name,
      value: updated,
    });
  };

  const addChoice = () => {
    const current = getChoices();
    const newChoice: MultipleChoiceType = {
      uuid: uuidv4(),
      choiceState: '',
    };
    updateChoices([...current, newChoice]);
  };

  const removeChoice = (uuid: string) => {
    const current = getChoices(); // current choices
    const indexToRemove = current.findIndex((choice) => choice.uuid === uuid);

    if (indexToRemove !== -1) {
      form.remove({ name: fields.choices.name, index: indexToRemove });

      const remainingUuids = current
        .filter((_, i) => i !== indexToRemove)
        .map((choice) => choice.uuid);

      const correctAnswerUuids = (fields.correctAnswers.value as string[]) ?? [];

      const newCorrectAnswers = correctAnswerUuids.filter((answerUuid) =>
        remainingUuids.includes(answerUuid),
      );

      form.update({
        name: fields.correctAnswers.name,
        value: newCorrectAnswers.length > 0 ? newCorrectAnswers : [],
      });
    }
  };

  return (
    <Form method='POST' {...getFormProps(form)}>
      <div className='flex flex-col space-y-4'>
        <HoneypotInputs />

        <RichTextInputField
          labelProps={{ children: 'Question', required: true }}
          meta={fields.questionState as FieldMetadata<string>}
          placeholder='Type your multiple choice question here'
          errors={fields.questionState.errors}
          description='The question that students will answer by selecting multiple options below.'
        />

        <div className='mt-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <h3
              className={cn('font-secondary text-sm font-medium', {
                'text-danger': form.allErrors.choices,
              })}
            >
              Answer Options *
            </h3>
            <OutlineButton
              type='button'
              size='sm'
              onClick={() => addChoice()}
              disabled={choices.length >= 10}
              className={cn({
                'border-danger text-danger': form.allErrors.choices,
              })}
            >
              <Plus className='mr-2 h-4 w-4' /> Add Choice
            </OutlineButton>
          </div>
          <div className='bg-card/50 rounded-lg p-4'>
            {choices && choices.length ? (
              <AnimatePresence>
                {choices.map((choice, index) => {
                  const { choiceState, uuid } = choice.getFieldset();
                  return (
                    <motion.div
                      key={uuid.value ?? index} // Make sure to use a stable ID if possible
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RichTextInputField
                        labelProps={{
                          children: `Choice ${index + 1}`,
                          required: true,
                          endAdornment: (
                            <OutlineButton
                              size='sm'
                              type='button'
                              onClick={() => removeChoice(uuid.value ?? '')}
                            >
                              <Trash size={16} />
                            </OutlineButton>
                          ),
                        }}
                        meta={choiceState as FieldMetadata<string>}
                        errors={choiceState?.errors}
                      />
                      <input
                        type='hidden'
                        name={`${fields.choices.name}[${index}].uuid`}
                        value={uuid.value}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <p className='text-warning text-sm'>No options added</p>
            )}
            <ErrorList errors={form.allErrors.choices} />
          </div>
          <div className='bg-card/50 rounded-lg p-4'>
            <h3 className='font-secondary mb-2 text-sm font-medium'>
              Select all correct answers *
            </h3>
            <div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
              {choices.map((choice, index) => {
                const { uuid } = choice.getFieldset();

                return (
                  <div key={uuid.value ?? index} className='flex gap-2'>
                    <Checkbox
                      name={fields.correctAnswers.name}
                      value={uuid.value}
                      defaultChecked={
                        fields.correctAnswers.value && Array.isArray(fields.correctAnswers.value)
                          ? fields.correctAnswers.value.includes(uuid.value)
                          : fields.correctAnswers.value === uuid.value
                      }
                    />
                    <Label
                      error={hasErrors(fields.correctAnswers.errors)}
                      className='text-body-xs text-muted-foreground self-center'
                    >
                      {`Choice ${index + 1}`}
                    </Label>
                  </div>
                );
              })}
            </div>
            <ErrorList errors={fields.correctAnswers?.errors} />
            <p className='text-muted-foreground mt-2 text-xs'>
              Choose all options that are correct answers
            </p>
          </div>
        </div>

        <RichTextInputField
          labelProps={{ children: 'Explanation', required: true }}
          meta={fields.explanationState as FieldMetadata<string>}
          placeholder='Explain the reasoning behind the correct answers'
          errors={fields.explanationState?.errors}
          description='Help learners understand why the correct answers are right and why other options are wrong.'
        />

        <TextareaField
          labelProps={{ children: 'Hint' }}
          textareaProps={{
            ...getInputProps(fields.hint, { type: 'text' }),
            placeholder: 'Optional hint to guide learners',
          }}
          errors={fields.hint?.errors}
          description='Give learners a nudge or context clue (optional).'
        />

        <ErrorList errors={form.errors} id={form.errorId} />

        <div className='mt-4 flex justify-end space-x-2'>
          <Button
            type='submit'
            rightIcon={<Save />}
            disabled={isPending}
            isLoading={isPending}
            name='intent'
            value={block.plugin_type}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
