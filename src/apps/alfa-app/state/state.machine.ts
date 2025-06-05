import { ActorRefFrom, assign, setup, SnapshotFrom } from 'xstate';

export const lessonMachine = setup({
  types: {
    context: {} as { word: string; index: number },
    events: {} as
      | { type: 'CORRECT_ANSWER' }
      | { type: 'INCORRECT_ANSWER' }
      | { type: 'START_OF_LESSON' },
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
  context: ({ input }) => ({
    word: (input as { word?: string } | undefined)?.word ?? 'hat',
    index: 0,
  }),

  states: {
    word: {
      meta: {
        prompt:
          'Please ask the student to sound out the word that they can see on the screen.',
      },
      on: {
        CORRECT_ANSWER: { target: 'complete' },
        INCORRECT_ANSWER: { target: 'letter' },
        START_OF_LESSON: { target: 'word' },
      },
    },

    letter: {
      meta: {
        prompt:
          'Please also ask the student to sound out the letter that they can see on the screen. Do not say any letter in your response.',
      },
      on: {
        CORRECT_ANSWER: [
          { guard: 'isLastLetter', target: 'word', actions: 'resetIndex' },
          { target: 'letter', actions: 'incrementIndex' },
        ],
        INCORRECT_ANSWER: { target: 'image' },
      },
    },

    image: {
      meta: {
        prompt:
          'Please gently tell the student they got the previous answer wrong. Please briefly encourage the student. The student can see a image on a screen. Please ask the student what the image is of.',
      },
      on: {
        CORRECT_ANSWER: { target: 'letterImage' },
        INCORRECT_ANSWER: { target: 'image' },
      },
    },

    letterImage: {
      meta: {
        prompt: `The student can see a image on a screen. The student has just successfully identified the image. Please ask the student what the first sound of the object represented in the image.`,
      },
      on: {
        CORRECT_ANSWER: [
          { guard: 'isLastLetter', target: 'word', actions: 'resetIndex' },
          { target: 'letter', actions: 'incrementIndex' },
        ],
        INCORRECT_ANSWER: { target: 'image' },
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
