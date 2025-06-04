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
  context: {
    word: 'cat',
    index: 0,
  },

  states: {
    word: {
      meta: {
        prompt:
          'Please ask the student to sound out the word that they can see on the screen. Your response must only contain the actual words you want to communicate to the student.',
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
          'Please also ask the student to sound out the letter that they can see on the screen. Please generate a unique response. Your response must only contain the actual words you want to communicate to the student.',
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
          'Please gently tell the student they got the previous answer wrong. Please encourage the student. The student can see a picture on a screen. Please ask the student what the picture is of. Please generate a unique response. Your response must only contain the actual words you want to communicate to the student.',
      },
      on: {
        CORRECT_ANSWER: { target: 'letterPicture' },
        INCORRECT_ANSWER: { target: 'picture' },
      },
    },

    letterPicture: {
      meta: {
        prompt: `The student can see a picture on a screen. The student has just successfully identified the picture. Please ask the student what the first sound of the object represented in the picture. Please generate a unique response. Your response must only contain the actual words you want to communicate to the student.`,
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
        prompt: `The student successfully read a word. Please congratulate them. Please generate a unique response. Your response must only contain the actual words you want to communicate to the student.`,
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
