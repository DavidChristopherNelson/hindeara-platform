import { createMachine, assign } from 'xstate';

/* ----------  shared prompt prefix ---------- */

const COMMON =
  `Please role-play being the world's best teacher. ` +
  `Please only return the words that the teacher says. ` +
  `Generate a unique response each time. ` +
  `Your response cannot use the word 'name'. `;

/* ----------  machine context & events ---------- */

interface Context {
  word: string;
  index: number;
  prompt: string;
}

type Events = { type: 'CORRECT_ANSWER' } | { type: 'INCORRECT_ANSWER' };

/* ----------  reusable actions ---------- */

const setPrompt = assign({
  prompt: (
    _: Context,
    __: Events,
    meta: { state: { meta?: { prompt?: string } } },
  ) => COMMON + (meta.state.meta?.prompt ?? ''),
});

const incrementIndex = assign<Context, Events, Events, never, never>({
  index: ({ context }) => context.index + 1,
});

const resetIndex = assign<Context, Events, Events, never, never>({
  index: () => 0,
});

/* ----------  machine definition ---------- */

export const teacherMachine = createMachine(
  {
    id: 'teacher',
    initial: 'word',
    context: () => ({
      word: 'cat',
      index: 0,
      prompt: '',
    }),
    entry: 'setPrompt',
    states: {
      word: {
        meta: {
          prompt:
            'If the current state is word or letter then ask the student to sound out the word.',
        },
        entry: 'setPrompt',
        on: {
          CORRECT_ANSWER: { target: 'complete' },
          INCORRECT_ANSWER: { target: 'letter' },
        },
      },

      letter: {
        meta: {
          prompt:
            'If the current state is word or letter then ask the student to sound out the letter.',
        },
        entry: 'setPrompt',
        on: {
          CORRECT_ANSWER: [
            {
              guard: 'isLastLetter',
              target: 'word',
              actions: ['resetIndex'],
            },
            {
              target: 'letter',
              actions: ['incrementIndex'],
            },
          ],
          INCORRECT_ANSWER: { target: 'picture' },
        },
      },

      picture: {
        meta: {
          prompt:
            'If the current state is picture then ask the student what the first sound is in the word for that picture.',
        },
        entry: 'setPrompt',
        on: {
          CORRECT_ANSWER: { target: 'letterPicture' },
          INCORRECT_ANSWER: { target: 'picture' },
        },
      },

      letterPicture: {
        meta: {
          prompt:
            'If the current state is letterPicture then ask the student to sound out the letter.',
        },
        entry: 'setPrompt',
        on: {
          CORRECT_ANSWER: { target: 'letter', actions: ['incrementIndex'] },
          INCORRECT_ANSWER: { target: 'picture' },
        },
      },

      complete: {
        type: 'final',
        meta: {
          prompt:
            'If the current state is complete then congratulate the student.',
        },
        entry: 'setPrompt',
      },
    },
    types: {} as {
      context: Context;
      events: Events;
    },
  },
  {
    actions: {
      setPrompt,
      incrementIndex,
      resetIndex,
    },
    guards: {
      isLastLetter: (args) => args.context.index >= args.context.word.length - 1,
    },
  },
);
