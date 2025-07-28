// src/apps/alfa-app/state/state.machine.ts
import { ActorRefFrom, and, assign, setup, SnapshotFrom } from 'xstate';
import {
  markWord,
  markLetter,
  markImage,
  MarkArgs,
  detectIncorrectEndMatra,
  detectIncorrectMiddleMatra,
} from './evaluate-answer.utils';
import { identifyWrongCharacters } from './identify-wrong-characters.utils';

type AnswerFn = (args: MarkArgs) => boolean;

export const lessonMachine = setup({
  /*───────────────────────────*
   *           TYPES           *
   *───────────────────────────*/
  types: {
    context: {} as {
      word: string;
      wrongCharacters: string[];
      wordErrors: number;
      imageErrors: number;
      letterImageErrors: number;
      hint: string;
      answer: string | undefined;
      previousAnswerStatus: boolean | null;
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
    identifyWrongCharacters: assign({
      wrongCharacters: ({ event }) =>
        identifyWrongCharacters({
          correctAnswer: event.correctAnswer,
          studentAnswer: event.studentAnswer,
        }),
    }),
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
    giveEndMatraHint: assign({
      hint: ({ context }) => {
        const hintOne =
          'Tell the student to try again, just join the letters a little faster. ';
        const hintTwo =
          "Tell the student not to pronounce the 'a' sound at the end of the word. ";
        if (context.hint === hintOne) {
          return hintTwo;
        }
        return hintOne;
      },
    }),
    giveMiddleMatraHint: assign({
      hint: () =>
        'Ask the student to join the first two letters together, then join the last two letters together and then finally join the whole word together. ',
    }),
    previousAnswerCorrect: assign({
      previousAnswerStatus: () => true,
    }),
    previousAnswerIncorrect: assign({
      previousAnswerStatus: () => false,
    }),
    dropFirstWrongCharacter: assign({
      wrongCharacters: ({ context }) => context.wrongCharacters.slice(1),
    }),
  },

  /*───────────────────────────*
   *          GUARDS           *
   *───────────────────────────*/
  guards: {
    isLastLetter: ({ context }) => context.wrongCharacters.length <= 1,

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

    incorrectEndMatra: ({ event }) => {
      return detectIncorrectEndMatra({
        correctAnswer: event.correctAnswer,
        studentAnswer: event.studentAnswer,
      });
    },

    incorrectMiddleMatra: ({ event }) => {
      return detectIncorrectMiddleMatra({
        correctAnswer: event.correctAnswer,
        studentAnswer: event.studentAnswer,
      });
    },

    // This is to catch cases like correctAnswer="cat" and studentAnswer="cate"
    detectInsertion: ({ event }) => {
      const wrongChars = identifyWrongCharacters({
        correctAnswer: event.correctAnswer,
        studentAnswer: event.studentAnswer,
      });
      return wrongChars.length === 0;
    },
  },
}).createMachine({
  id: 'lesson',
  initial: 'word',
  context: ({ input }) => ({
    word: (input as { word?: string } | undefined)?.word ?? 'hat',
    wrongCharacters: [],
    wordErrors: 0,
    imageErrors: 0,
    letterImageErrors: 0,
    hint: '',
    answer: (input as { word?: string } | undefined)?.word ?? 'hat',
    previousAnswerStatus: null,
  }),

  /*───────────────────────────*
   *          STATES           *
   *───────────────────────────*/
  states: {
    word: {
      meta: {
        prompt:
          'Please ask the student to sound out the word that they can see on the screen. (Do not name or describe the word yourself.) No image is currently being shown.',
      },
      entry: assign({
        answer: ({ context }) => context.word,
      }),
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markWord } },
            target: 'complete',
            actions: 'previousAnswerCorrect',
          },
          {
            guard: 'thirdIncorrect',
            target: 'complete',
            actions: 'previousAnswerIncorrect',
          },
          {
            guard: 'incorrectEndMatra',
            target: 'word',
            actions: [
              'giveEndMatraHint',
              'incrementWordErrors',
              'previousAnswerIncorrect',
            ],
          },
          {
            guard: 'incorrectMiddleMatra',
            target: 'word',
            actions: [
              'giveMiddleMatraHint',
              'incrementWordErrors',
              'previousAnswerIncorrect',
            ],
          },
          {
            guard: 'detectInsertion',
            target: 'word',
            actions: ['incrementWordErrors', 'previousAnswerIncorrect'],
          },
          {
            target: 'letter',
            actions: [
              'identifyWrongCharacters',
              'incrementWordErrors',
              'previousAnswerIncorrect',
            ],
          },
        ],
      },
    },

    letter: {
      meta: {
        prompt:
          'Please also ask the student to sound out the letter that they can see on the screen. Do not say any letter in your response.',
      },
      entry: assign({
        answer: ({ context }) => context.wrongCharacters[0],
      }),
      on: {
        ANSWER: [
          {
            guard: and([
              'isLastLetter',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'word',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
            ],
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
            ],
          },
          { target: 'image', actions: 'previousAnswerIncorrect' },
        ],
      },
    },

    image: {
      meta: {
        prompt:
          'Please briefly encourage the student. The student can see a image on a screen. Please ask the student what the image is of.',
      },
      entry: assign({
        answer: ({ context }) => context.wrongCharacters[0],
      }),
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markImage } },
            target: 'letterImage',
            actions: 'previousAnswerCorrect',
          },
          {
            guard: 'thirdIncorrect',
            target: 'letterImage',
            actions: ['resetImageErrors', 'previousAnswerIncorrect'],
          },
          {
            target: 'image',
            actions: ['incrementImageErrors', 'previousAnswerIncorrect'],
          },
        ],
      },
    },

    letterImage: {
      meta: {
        prompt:
          'The student can see a image on a screen. The student has just successfully identified the image. Please ask the student what the first sound of the object represented in the image.',
      },
      entry: assign({
        answer: ({ context }) => context.wrongCharacters[0],
      }),
      on: {
        ANSWER: [
          /* correct & last letter → next word */
          {
            guard: and([
              'isLastLetter',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'word',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
            ],
          },
          /* correct → next letter */
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
            ],
          },
          /* third incorrect & last letter → still advance to word */
          {
            guard: and(['isLastLetter', 'thirdIncorrect']),
            target: 'word',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
            ],
          },
          /* third incorrect → advance to next letter */
          {
            guard: 'thirdIncorrect',
            target: 'letter',
            actions: [
              'resetLetterImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
            ],
          },
          {
            target: 'letterImage',
            actions: ['incrementLetterImageErrors', 'previousAnswerIncorrect'],
          },
        ],
      },
    },

    /* ───────── COMPLETE ──────── */
    complete: {
      type: 'final',
      meta: {
        prompt:
          'The student finished the lesson. If they got the last answer correct please congratulate them. If they got the last answer wrong say something like let us try another word.',
      },
      entry: assign({
        answer: () => undefined,
      }),
    },
  },
});

export type LessonSnapshot = SnapshotFrom<typeof lessonMachine>;
type LessonActor = ActorRefFrom<typeof lessonMachine>;

export const getWord = (actor: LessonActor) => actor.getSnapshot().context.word;

export const getWrongCharacters = (actor: LessonActor) =>
  actor.getSnapshot().context.wrongCharacters;

export const getAnswer = (actor: LessonActor) =>
  actor.getSnapshot().context.answer;

export const getPrompt = (actor: LessonActor): string => {
  const snap = actor.getSnapshot();
  const meta = snap.getMeta() as Record<string, { prompt?: string }>;
  const key = `lesson.${snap.value as string}`;
  const hint = snap.context.hint;
  const previousAnswer = `${
    snap.context.previousAnswerStatus === null
      ? ''
      : snap.context.previousAnswerStatus
        ? 'The student got the previous answer correct.'
        : 'The student got the previous answer incorrect.'
  }`;
  return `${previousAnswer} ${meta[key]?.prompt ?? ''} ${hint}`;
};
