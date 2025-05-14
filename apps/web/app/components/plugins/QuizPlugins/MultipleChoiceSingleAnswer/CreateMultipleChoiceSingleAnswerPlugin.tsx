import { Form } from 'react-router';
import { type FieldMetadata, getFormProps, getInputProps, useForm } from '@conform-to/react';
import { getZodConstraint, parseWithZod } from '@conform-to/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Save, Trash } from 'lucide-react';
import { HoneypotInputs } from 'remix-utils/honeypot/react';

import { MultipleChoiceSingleAnswerSchema, type PluginTypeId } from '@gonasi/schemas/plugins';

import { Button, OutlineButton, PlainButton } from '~/components/ui/button';
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

  const handleAddChoice = () => {
    // Create a new item
    const newChoice = { choiceState: '' };

    // Get current items array or initialize it
    const currentChoices = fields.choices.getFieldList().map((item) => {
      const choice = item.getFieldset();
      return {
        choiceState: choice.choiceState.value || '',
      };
    });

    // Update the form with the new item added
    form.update({
      name: fields.choices.name,
      value: [...currentChoices, newChoice],
    });
  };

  // Function to remove an item
  const handleRemoveChoice = (index: number) => {
    // Get current items
    const currentChoices = fields.choices.getFieldList().map((item) => {
      const choice = item.getFieldset();
      return {
        choiceState: choice.choiceState.value || '',
      };
    });

    // Remove the item at the specified index
    const updatedChoices = currentChoices.filter((_, i) => i !== index);

    // Update the form with the filtered items
    form.update({
      name: fields.choices.name,
      value: updatedChoices,
    });
  };

  const optionsList = fields.choices.getFieldList();

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
              onClick={() => handleAddChoice()}
              disabled={optionsList.length >= 6}
              className={cn({
                'border-danger text-danger': form.allErrors.choices,
              })}
            >
              <Plus className='mr-2 h-4 w-4' /> Add Option
            </OutlineButton>
          </div>
          <div className='bg-card/50 rounded-lg p-4'>
            {optionsList && optionsList.length ? (
              <AnimatePresence>
                {optionsList.map((option, index) => {
                  const optionFields = option.getFieldset();
                  return (
                    <motion.div
                      key={option.id ?? index} // Make sure to use a stable ID if possible
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RichTextInputField
                        labelProps={{
                          children: `Option ${index + 1}`,
                          required: true,
                          endAdornment: (
                            <PlainButton type='button' onClick={() => handleRemoveChoice(index)}>
                              <Trash size={16} />
                            </PlainButton>
                          ),
                        }}
                        meta={optionFields.choiceState as FieldMetadata<string>}
                        errors={optionFields.choiceState?.errors}
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
            labelProps={{ children: 'Choose the correct answer', required: true }}
            options={optionsList.map((_, index) => ({
              value: index.toString(),
              label: `Option ${index + 1}`,
            }))}
            errors={fields.correctAnswer.errors}
            description='Select which option is the correct answer'
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
