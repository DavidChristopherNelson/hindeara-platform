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
  types: {
    context: {} as { word: string; index: number },
    events: {} as {
      type: 'ANSWER';
      correctAnswer: string;
      studentAnswer: string;
    },
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
  },
}).createMachine({
  id: 'lesson',
  initial: 'word',
  context: ({ input }) => ({
    word: (input as { word?: string } | undefined)?.word ?? 'hat',
    index: 0,
  }),

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
          { target: 'letter' },
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
            actions: 'resetIndex',
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: 'incrementIndex',
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
          { target: 'image' },
        ],
      },
    },

    letterImage: {
      meta: {
        prompt: `The student can see a image on a screen. The student has just successfully identified the image. Please ask the student what the first sound of the object represented in the image.`,
      },
      on: {
        ANSWER: [
          {
            guard: and([
              'isLastLetter',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'word',
            actions: 'resetIndex',
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: 'incrementIndex',
          },
          { target: 'letterImage' },
        ],
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
