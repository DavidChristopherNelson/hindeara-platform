import { assign, setup } from 'xstate';

export const lessonMachine = setup({
  types: {
    context: {} as { word: string; index: number },
    events: {} as
      | { type: 'CORRECT_ANSWER' }
      | { type: 'INCORRECT_ANSWER' }
      | { type: 'START_LESSON' },
  },
  actions: {
    incrementIndex: assign({
      index: ({ context }) => context.index + 1,
    }),
    resetIndex: assign({
      index: () => 0,
    }),
  },
  guards: {
    isLastLetter: ({ context }) => context.index === context.word.length - 1,
  },
}).createMachine({
  id: 'lesson',
  initial: 'word',
  context: {
    word: 'cat',
    index: 0,
  },

  states: {
    word: {
      meta: {
        prompt:
          'Please ask the student to sound out the word that they can see on the screen.',
      },
      on: {
        CORRECT_ANSWER: { target: 'complete' },
        INCORRECT_ANSWER: { target: 'letter' },
        START_LESSON: { target: 'word' }, // Handle the initial startup edge case.
      },
    },

    letter: {
      meta: {
        prompt:
          'Please ask the student to sound out the letter that they can see on the screen.',
      },
      on: {
        CORRECT_ANSWER: [
          { guard: 'isLastLetter', target: 'word', actions: 'resetIndex' },
          { target: 'letter', actions: 'incrementIndex' },
        ],
        INCORRECT_ANSWER: { target: 'picture' },
      },
    },

    picture: {
      meta: {
        prompt:
          'The student can see a picture on a screen. Please ask the student what the picture is of.',
      },
      on: {
        CORRECT_ANSWER: { target: 'letterPicture' },
        INCORRECT_ANSWER: { target: 'picture' },
      },
    },

    letterPicture: {
      meta: {
        prompt: `The student can see a picture on a screen. The student has just successfully identified the picture. Please ask the student what the first sound of the noun in the picture is.`,
      },
      on: {
        CORRECT_ANSWER: [
          { guard: 'isLastLetter', target: 'word', actions: 'resetIndex' },
          { target: 'letter', actions: 'incrementIndex' },
        ],
        INCORRECT_ANSWER: { target: 'picture' },
      },
    },

    complete: {
      type: 'final',
      meta: {
        prompt: `The student successfully read a word. Please congratulate them.`,
      },
    },
  },
});
