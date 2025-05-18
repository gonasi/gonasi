import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Save, Trash } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';
import { v4 as uuidv4 } from 'uuid';

import {
  type ChoiceType,
  MultipleChoiceSingleAnswerSchema,
  type PluginTypeId,
} from '@gonasi/schemas/plugins';

import { Button, OutlineButton } from '~/components/ui/button';
import { ErrorList, RadioButtonField, TextareaField } from '~/components/ui/forms';
import { RichTextInputField } from '~/components/ui/forms/RichTextInputField';
import { cn } from '~/lib/utils';
import { useIsPending } from '~/utils/misc';

interface CreateMultipleChoiceSingleAnswerPluginProps {
  name: PluginTypeId;
}

export function CreateMultipleChoiceSingleAnswerPlugin({
  name,
}: CreateMultipleChoiceSingleAnswerPluginProps) {
  const pending = useIsPending();

  const [form, fields] = useForm({
    id: `create-${name}-form`,
    constraint: getZodConstraint(MultipleChoiceSingleAnswerSchema),
    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: MultipleChoiceSingleAnswerSchema });
    },
  });

  const choices = fields.choices.getFieldList();

  const getChoices = (): ChoiceType[] =>
    choices.map((fieldset) => {
      const { choiceState, uuid } = fieldset.getFieldset();
      return {
        uuid: uuid.value ?? '',
        choiceState: choiceState.value ?? '',
      };
    });

  const updateChoices = (updated: ChoiceType[]) => {
    form.update({
      name: fields.choices.name,
      value: updated,
    });
  };

  const addChoice = () => {
    const current = getChoices();
    const newChoice: ChoiceType = {
      uuid: uuidv4(),
      choiceState: '',
    };
    updateChoices([...current, newChoice]);
  };

  const removeChoice = (uuid: string) => {
    const current = getChoices();
    const updated = current.filter((choice) => choice.uuid !== uuid);
    updateChoices(updated);
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
          description='The question that students will answer by selecting one of the options below.'
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
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RichTextInputField
                        labelProps={{
                          children: `Choice ${index + 1} ${uuid.value}`,
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
          <RadioButtonField
            field={fields.correctAnswer}
            labelProps={{ children: 'Choose the correct answer choice', required: true }}
            options={choices.map((choice, index) => {
              const { uuid } = choice.getFieldset();
              return {
                value: uuid.value ?? '',
                label: `Choice ${index + 1} - ${uuid.value}`,
              };
            })}
            errors={fields.correctAnswer.errors}
            description='Select which choice is the correct choice'
          />
        </div>

        <RichTextInputField
          labelProps={{ children: 'Explanation', required: true }}
          meta={fields.explanationState as FieldMetadata<string>}
          placeholder='Explain the reasoning behind the correct answer'
          errors={fields.explanationState?.errors}
          description='Help learners understand why the correct answer is right and why other options are wrong.'
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
            disabled={pending}
            isLoading={pending}
            name='intent'
            value={name}
          >
            Save
          </Button>
        </div>
      </div>
    </Form>
  );
}
