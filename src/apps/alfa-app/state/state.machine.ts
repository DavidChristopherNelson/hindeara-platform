// src/apps/alfa-app/state/state.machine.ts
import { ActorRefFrom, and, assign, setup, SnapshotFrom } from 'xstate';
import {
  markWord,
  markLetter,
  markImage,
  MarkArgs,
} from './evaluate-answer.utils';

type AnswerFn = (args: MarkArgs) => boolean;

export const lessonMachine = setup({
  /*───────────────────────────*
   *           TYPES           *
   *───────────────────────────*/
  types: {
    context: {} as {
      word: string;
      index: number;
      wordErrors: number;
      imageErrors: number;
      letterImageErrors: number;
    },
    events: {} as {
      type: 'ANSWER';
      correctAnswer: string;
      studentAnswer: string;
    },
  },

  /*───────────────────────────*
   *          ACTIONS          *
   *───────────────────────────*/
  actions: {
    incrementIndex: assign({
      index: ({ context }) => context.index + 1,
    }),
    resetIndex: assign({ index: () => 0 }),
    incrementWordErrors: assign({
      wordErrors: ({ context }) => context.wordErrors + 1,
    }),
    resetWordErrors: assign({ wordErrors: () => 0 }),
    incrementImageErrors: assign({
      imageErrors: ({ context }) => context.imageErrors + 1,
    }),
    resetImageErrors: assign({ imageErrors: () => 0 }),
    incrementLetterImageErrors: assign({
      letterImageErrors: ({ context }) => context.letterImageErrors + 1,
    }),
    resetLetterImageErrors: assign({ letterImageErrors: () => 0 }),
  },

  /*───────────────────────────*
   *          GUARDS           *
   *───────────────────────────*/
  guards: {
    isLastLetter: ({ context }) => context.index === context.word.length - 1,

    checkAnswer: ({ event }, params: { fn: AnswerFn }) => {
      if (!('correctAnswer' in event) || !('studentAnswer' in event)) {
        throw new Error(
          'checkAnswer guard requires both correctAnswer and studentAnswer on the event',
        );
      }
      return params.fn({
        correctAnswer: event.correctAnswer,
        studentAnswer: event.studentAnswer,
      });
    },

    /** third consecutive incorrect response (any index) */
    thirdIncorrect: ({ context }) => {
      const { wordErrors, imageErrors, letterImageErrors } = context;
      return Math.max(wordErrors, imageErrors, letterImageErrors) >= 2;
    },
  },
}).createMachine({
  id: 'lesson',
  initial: 'word',
  context: ({ input }) => ({
    word: (input as { word?: string } | undefined)?.word ?? 'hat',
    index: 0,
    wordErrors: 0,
    imageErrors: 0,
    letterImageErrors: 0,
  }),

  /*───────────────────────────*
   *          STATES           *
   *───────────────────────────*/
  states: {
    word: {
      meta: {
        prompt:
          'Please ask the student to sound out the word that they can see on the screen. (Do not name or describe the word yourself.)',
      },
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markWord } },
            target: 'complete',
          },
          {
            guard: 'thirdIncorrect',
            target: 'complete',
            actions: 'resetWordErrors',
          },
          { target: 'letter', actions: 'incrementWordErrors' },
        ],
      },
    },

    letter: {
      meta: {
        prompt:
          'Please also ask the student to sound out the letter that they can see on the screen. Do not say any letter in your response.',
      },
      on: {
        ANSWER: [
          {
            guard: and([
              'isLastLetter',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'word',
            actions: ['resetIndex', 'resetLetterImageErrors'],
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: ['incrementIndex', 'resetLetterImageErrors'],
          },
          { target: 'image' },
        ],
      },
    },

    image: {
      meta: {
        prompt:
          'Please briefly encourage the student. The student can see a image on a screen. Please ask the student what the image is of.',
      },
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markImage } },
            target: 'letterImage',
          },
          {
            guard: 'thirdIncorrect',
            target: 'letterImage',
            actions: 'resetImageErrors',
          },
          { target: 'image', actions: 'incrementImageErrors' },
        ],
      },
    },

    letterImage: {
      meta: {
        prompt:
          'The student can see a image on a screen. The student has just successfully identified the image. Please ask the student what the first sound of the object represented in the image.',
      },
      on: {
        ANSWER: [
          /* correct & last letter → next word */
          {
            guard: and([
              'isLastLetter',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'word',
            actions: ['resetIndex', 'resetLetterImageErrors'],
          },
          /* correct → next letter */
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: ['incrementIndex', 'resetLetterImageErrors'],
          },
          /* third incorrect & last letter → still advance to word */
          {
            guard: and(['isLastLetter', 'thirdIncorrect']),
            target: 'word',
            actions: ['resetIndex', 'resetLetterImageErrors'],
          },
          /* third incorrect → advance to next letter */
          {
            guard: 'thirdIncorrect',
            target: 'letter',
            actions: ['incrementIndex', 'resetLetterImageErrors'],
          },
          /* first or second incorrect → stay, increment error count */
          {
            target: 'letterImage',
            actions: 'incrementLetterImageErrors',
          },
        ],
      },
    },

    /* ───────── COMPLETE ──────── */
    complete: {
      type: 'final',
      meta: {
        prompt:
          'The student successfully read a word. Please congratulate them.',
      },
    },
  },
});

export type LessonSnapshot = SnapshotFrom<typeof lessonMachine>;
type LessonActor = ActorRefFrom<typeof lessonMachine>;

export const getWord = (actor: LessonActor) => actor.getSnapshot().context.word;

export const getIndex = (actor: LessonActor) =>
  actor.getSnapshot().context.index;

export const getPrompt = (actor: LessonActor): string => {
  const snap = actor.getSnapshot();
  const meta = snap.getMeta() as Record<string, { prompt?: string }>;
  const key = `lesson.${snap.value as string}`;
  return meta[key]?.prompt ?? '';
};
