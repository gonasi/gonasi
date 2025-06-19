import { faker } from '@snaplet/copycat';

// Generate a random number of paragraphs
const paragraphCount = faker.number.int({ min: 1, max: 8 });

// Generate paragraphs with random text content
const paragraphs = Array.from({ length: paragraphCount }, () => {
  const wordCount = faker.number.int({ min: 3, max: 12 }); // words per paragraph
  const text = faker.word.words({ count: wordCount });

  return {
    type: 'paragraph',
    version: 1,
    textFormat: 0,
    textStyle: '',
    children: [
      {
        type: 'text',
        version: 1,
        text,
        style: '',
        format: 0,
        detail: 0,
        mode: 'normal',
      },
    ],
  };
});

// Export the randomly populated Lexical state
export const FAKE_LEXICAL_STATE = JSON.stringify({
  root: {
    type: 'root',
    version: 1,
    children: paragraphs,
  },
});
