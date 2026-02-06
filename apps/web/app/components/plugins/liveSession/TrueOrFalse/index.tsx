import { ToggleRight } from 'lucide-react';

import { LiveSessionTrueOrFalseSchema } from '@gonasi/schemas/liveSessions/schemas/liveTrueOrFalse';
import { EMPTY_LEXICAL_STATE } from '@gonasi/schemas/plugins';

import { createLiveSessionPlugin } from '../core/createLiveSessionPlugin';
import { LiveTrueOrFalseView } from '../LiveSessionViews';

import { DifficultyField } from '~/components/plugins/common/settings/DifficultyField';
import { LayoutStyleField } from '~/components/plugins/common/settings/LayoutStyleField';
import { RandomizationModeField } from '~/components/plugins/common/settings/RandomizationModeField';
import { GoRadioGroupField, GoRichTextInputField } from '~/components/ui/forms/elements';

export const LiveSessionTrueOrFalsePlugin = createLiveSessionPlugin({
  pluginType: 'true_or_false',

  metadata: {
    name: 'True or False',
    description: 'Students decide if a statement is true or false.',
    icon: ToggleRight,
  },

  schema: LiveSessionTrueOrFalseSchema,

  defaults: {
    content: { questionState: EMPTY_LEXICAL_STATE, correctAnswer: 'true' },
    settings: { layoutStyle: 'double', randomization: 'shuffle' },
    difficulty: 'medium',
    time_limit: 10,
  },

  renderFields: () => (
    <>
      <GoRichTextInputField
        name='content.questionState'
        labelProps={{ children: 'Question', required: true }}
        placeholder='Type your statement here...'
      />

      <GoRadioGroupField
        name='content.correctAnswer'
        labelProps={{ children: 'Correct Answer', required: true }}
        options={[
          { value: 'true', label: 'True' },
          { value: 'false', label: 'False' },
        ]}
      />
    </>
  ),

  renderSettings: ({ methods }) => {
    const layoutStyle = methods.getValues('settings.layoutStyle');
    const randomization = methods.getValues('settings.randomization');
    const difficulty = methods.getValues('difficulty');

    return (
      <>
        <LayoutStyleField name='settings.layoutStyle' watchValue={layoutStyle} />
        <RandomizationModeField name='settings.randomization' watchValue={randomization} />
        <DifficultyField name='difficulty' watchValue={difficulty} />
      </>
    );
  },

  ViewComponent: LiveTrueOrFalseView,
});
