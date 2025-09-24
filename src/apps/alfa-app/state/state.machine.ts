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
import { ContextCreator } from '@nestjs/core/helpers/context-creator';

type AnswerFn = (args: MarkArgs) => boolean;

type PromptFn = (
  ctx: LessonContext,
  word?: string,
  answerLetter?: string,
  exampleNoun?: string
) => string;

type Hint = string | PromptFn;

export const lessonMachine = setup({
  /*───────────────────────────*
   *           TYPES           *
   *───────────────────────────*/
  types: {
    context: {} as {
      word: string;
      correctCharacters: string[];
      wrongCharacters: string[];
      wordErrors: number;
      imageErrors: number;
      letterImageErrors: number;
      letterNoImageErrors: number;
      hint: Hint;
      endMatraHintsGiven: number;
      answer: string | undefined;
      previousAnswerStatus: boolean | null;
      previousCorrectAnswer: string | null;
      previousStudentAnswer: string | null;
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
    identifyCorrectCharacters: assign({
      correctCharacters: ({ context, self }) => {
        const state = self.getSnapshot().value;

        if (state === 'letter') {
          // The letter being tested is the first unresolved wrongCharacter
          const first = context.wrongCharacters[0];
          return first ? [first] : [];
        }

        // Otherwise we're in 'word' (or anything that's not 'letter'):
        // correct = all characters of the word minus wrongCharacters
        const wrongSet = new Set(context.wrongCharacters);
        const wordChars = Array.from(context.word); // preserves order
        return wordChars.filter((ch) => !wrongSet.has(ch));
      },
    }),
    resetCorrectCharacters: assign({
      correctCharacters: () => [],
    }),
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
    incrementLetterNoImageErrors: assign({
      letterNoImageErrors: ({ context }) => context.letterNoImageErrors + 1,
    }),
    resetLetterNoImageErrors: assign({ letterNoImageErrors: () => 0 }),
    giveEndMatraHint: assign({
      hint: ({ context }) => {
        if (context.endMatraHintsGiven === 0) {
          context.endMatraHintsGiven ++;
          return 'Tell the student to try again, just join the letters a little faster. ';
        } else {
          context.endMatraHintsGiven ++;
          return `Give the student the example of a rhyming word. For instance, if the word is 'जम' say something like 'if ह;   म makes हम then what does ज;   म make? Replace this example with a word that rhymes with ${context.word}. Keep the rhyming word the same number of letters as ${context.word}, just replace the starting letter.Keep a little gap between the phonemes as you sound them out. `;
        }
      },
    }),
    giveMiddleMatraHint: assign({
      hint: ({ context }) => {
        const hintOne =
          'Ask the student to join the first two letters together, then join the last two letters together and then finally join the whole word together. ';
        const hintTwo =
          "Ask the student to break it down into two smaller words and then join the whole word together. ";
        if (context.hint === hintOne) {
          return hintTwo;
        }
        return hintOne;
      },
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
    persistEventData: assign({
      previousCorrectAnswer: ({ event }) => event.correctAnswer,
      previousStudentAnswer: ({ event }) => event.studentAnswer,
    }),
    resetHint: assign({
      hint: () => '',
    })
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

    catchNoImageLetters: ({ event, context}) => {
      console.log('---------------------------------------------------');
      console.log('Reached catchNoImageLetters guard');
      console.log('context.wrongCharacters: ', context.wrongCharacters);
      if (context.wrongCharacters.length === 0) {
        const wrongCharacters = identifyWrongCharacters({
          correctAnswer: event.correctAnswer,
          studentAnswer: event.studentAnswer,
        })
        console.log('wrongCharacters: ', wrongCharacters);
        const firstWrongCharacter = wrongCharacters[0];
        console.log('firstWrongCharacter: ', firstWrongCharacter);
        if (firstWrongCharacter === 'ञ' || firstWrongCharacter === 'ण') {
          console.log('if statement returns true');
          console.log('---------------------------------------------------');
          return true;
        }
        console.log('if statement returns false');
        console.log('---------------------------------------------------');
        return false;
      }
      console.log('Skip first if statement');
      console.log('context.wrongCharacters[0]: ', context.wrongCharacters[1]);
      if (
        context.wrongCharacters[0] === 'ञ' || 
        context.wrongCharacters[0] === 'ण' ||
        context.wrongCharacters[1] === 'ञ' || 
        context.wrongCharacters[1] === 'ण'
      ) {
        console.log('if statement returns true');
        console.log('---------------------------------------------------');
        return true;
      }
      console.log('Skip second if statement');
      console.log('---------------------------------------------------');
      return false;
    },
  },
}).createMachine({
  id: 'lesson',
  initial: 'word',
  context: ({ input }) => ({
    word: (input as { word?: string } | undefined)?.word ?? 'शहद',
    correctCharacters: [],
    wrongCharacters: [],
    wordErrors: 0,
    imageErrors: 0,
    letterImageErrors: 0,
    letterNoImageErrors: 0,
    hint: '',
    endMatraHintsGiven: 0,
    answer: (input as { word?: string } | undefined)?.word ?? 'शहद',
    previousAnswerStatus: null,
    previousCorrectAnswer: null,
    previousStudentAnswer: null,
  }),

  /*───────────────────────────*
   *          STATES           *
   *───────────────────────────*/
  states: {
    word: {
      meta: {
        prompt: (ctx: LessonContext, word?: string, answerLetter?: string, exampleNoun?: string) => {
          if (ctx.hint === '') {
            return 'Please ask the student to read the word. (Do not name or describe the word yourself.) No image is currently being shown.'
          }
          return '';
        },
      },
      entry: assign({
        answer: ({ context }) => context.word,
        wrongCharacters: () => [],
      }),
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markWord } },
            target: 'complete',
            actions: [
              'resetHint',
              'identifyCorrectCharacters',
              'previousAnswerCorrect',
              'persistEventData',
              'resetHint',
            ],
          },
          {
            guard: ({ context }) => context.wordErrors >= 2,
            target: 'complete',
            actions: [
              'resetHint',
              'identifyCorrectCharacters',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            guard: 'incorrectEndMatra',
            target: 'word',
            actions: [
              'resetHint',
              'identifyCorrectCharacters',
              'giveEndMatraHint',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            guard: 'incorrectMiddleMatra',
            target: 'word',
            actions: [
              'resetHint',
              'identifyCorrectCharacters',
              'giveMiddleMatraHint',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            guard: 'detectInsertion',
            target: 'word',
            actions: [
              'resetHint',
              'identifyCorrectCharacters',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            guard: 'catchNoImageLetters',
            target: 'letterNoImage',
            actions: [
              'resetHint',
              'identifyWrongCharacters',
              'identifyCorrectCharacters',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            target: 'letter',
            actions: [
              'resetHint',
              'identifyWrongCharacters',
              'identifyCorrectCharacters',
              'incrementWordErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
        ] as const,
      },
    },

    letter: {
      meta: {
        prompt:
          'Please ask the student to read the letter that they can see on the screen. Do not say any letter in your response.' as string,
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
              'identifyCorrectCharacters',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: and([
              'catchNoImageLetters',
              { type: 'checkAnswer', params: { fn: markLetter } }
            ]),
            target: 'letterNoImage',
            actions: [
              'resetCorrectCharacters',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            reenter: true,
            actions: [
              'identifyCorrectCharacters',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            target: 'image',
            actions: [
              'resetCorrectCharacters',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
        ] as const,
      },
    },

    image: {
      meta: {
        prompt: (ctx: LessonContext, word?: string, answerLetter?: string, exampleNoun?: string) => {
          if (ctx.imageErrors === 0) {
            return 'Please briefly encourage the student. The student can see an image on a screen. Please ask the student what the image is of. Use a hindi word like तस्वीर or चित्र rather than the English word image ';
          }
          return `Please tell the student that the answer we are looking for is ${exampleNoun}. Please ask the student to say the word ${exampleNoun}.`;
        },
      },
      entry: assign({
        answer: ({ context }) => context.wrongCharacters[0],
      }),
      on: {
        ANSWER: [
          {
            guard: { type: 'checkAnswer', params: { fn: markImage } },
            target: 'letterImage',
            actions: [
              'resetCorrectCharacters',
              'previousAnswerCorrect',
              'persistEventData',
            ],
          },
          {
            guard: ({ context }) => context.imageErrors >= 1,
            target: 'letterImage',
            actions: [
              'resetCorrectCharacters',
              'resetImageErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            target: 'image',
            actions: [
              'resetCorrectCharacters',
              'incrementImageErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
        ] as const,
      },
    },

    letterImage: {
      meta: {
        prompt: (ctx: LessonContext, _?: string, answerLetter?: string, exampleNoun?: string) => {
          if (ctx.letterImageErrors === 0) {
            return `Please ask the student what the first sound of ${exampleNoun} is. `;
          }
          if (ctx.letterImageErrors === 1) {
            return `Please break the picture-word down for the student, ask something like 'what is the first sound in ऊन? Is it ऊ.
                  or न ?' (replace ऊन with ${exampleNoun}, and make sure you break this word down into sounds rather than whole syllables). 
                  Have a significant pause between the different letters, so that it sounds more natural. `;
          }
          return `Please tell the student that the correct letter is ${answerLetter} and ask the student to say the letter ${answerLetter}. `;
        },
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
              'resetCorrectCharacters',
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: and([
              'catchNoImageLetters',
              { type: 'checkAnswer', params: { fn: markLetter } }
            ]),
            target: 'letterNoImage',
            actions: [
              'resetCorrectCharacters',
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            actions: [
              'resetCorrectCharacters',
              'resetLetterImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          /* second incorrect & last letter → still advance to word */
          {
            guard: and(['isLastLetter', ({ context }) => context.letterImageErrors >= 2]),
            target: 'word',
            actions: [
              'resetCorrectCharacters',
              'resetLetterImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          /* second incorrect → advance to next letter */
          {
            guard: ({ context }) => context.letterImageErrors >= 2,
            target: 'letter',
            actions: [
              'resetCorrectCharacters',
              'resetLetterImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            target: 'letterImage',
            actions: [
              'resetCorrectCharacters',
              'incrementLetterImageErrors',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
        ] as const,
      },
    },

    /* ───────── letterNoImage ──────── */
    letterNoImage: {
      meta: {
        prompt: (ctx: LessonContext, _?: string, answerLetter?: string, exampleNoun?: string) => {
          console.log('Reached letterNoImage state');
          if (ctx.letterNoImageErrors === 0) {
            return 'Please ask the student to read the letter that they can see on the screen. Do not say any letter in your response. ';
          }
          return `Please tell the student that the correct letter is ${answerLetter} and ask the student to say the letter ${answerLetter}. `;
        },
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
              'identifyCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: and([
              'catchNoImageLetters',
              { type: 'checkAnswer', params: { fn: markLetter } },
            ]),
            target: 'letterNoImage',
            actions: [
              'identifyCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: { type: 'checkAnswer', params: { fn: markLetter } },
            target: 'letter',
            reenter: true,
            actions: [
              'identifyCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerCorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: and(['isLastLetter', ({ context }) => context.letterNoImageErrors >= 2]),
            target: 'word',
            actions: [
              'resetCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: and([
              'catchNoImageLetters',
              ({ context }) => context.letterNoImageErrors >= 2,
            ]),
            target: 'letterNoImage',
            actions: [
              'resetCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: ({ context }) => context.letterNoImageErrors >= 2,
            target: 'letter',
            actions: [
              'resetCorrectCharacters',
              'resetLetterNoImageErrors',
              'previousAnswerIncorrect',
              'dropFirstWrongCharacter',
              'persistEventData',
            ],
          },
          {
            guard: 'catchNoImageLetters',
            target: 'letterNoImage',
            actions: [
              'incrementLetterNoImageErrors',
              'resetCorrectCharacters',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
          {
            target: 'letter',
            actions: [
              'incrementLetterNoImageErrors',
              'resetCorrectCharacters',
              'previousAnswerIncorrect',
              'persistEventData',
            ],
          },
        ] as const,
      },
    },

    /* ───────── COMPLETE ──────── */
    complete: {
      type: 'final',
      meta: {
        prompt: (ctx: LessonContext) =>
          `The student finished the lesson. Please tell them the correct answer was ${ctx.word}. If they got the last answer correct please congratulate them. If they got the last answer wrong, say something like never mind, let us try another word. `,
      },
      entry: assign({
        answer: () => undefined,
      }),
    },
  },
});

export type LessonSnapshot = SnapshotFrom<typeof lessonMachine>;
export type LessonActor = ActorRefFrom<typeof lessonMachine>;
export type LessonContext = {
  word: string;
  correctCharacters: string[];
  wrongCharacters: string[];
  wordErrors: number;
  imageErrors: number;
  letterImageErrors: number;
  letterNoImageErrors: number;
  hint: Hint;
  endMatraHintsGiven: number;
  answer: string | undefined;
  previousAnswerStatus: boolean | null;
  previousCorrectAnswer: string | null;
  previousStudentAnswer: string | null;
};

export const getWord = (actor: LessonActor) => actor.getSnapshot().context.word;

export const getCorrectLetters = (actor: LessonActor) =>
  actor.getSnapshot().context.correctCharacters;

export const getWrongCharacters = (actor: LessonActor) =>
  actor.getSnapshot().context.wrongCharacters;

export const getAnswer = (actor: LessonActor) =>
  actor.getSnapshot().context.answer;

export const getAnswerStatus = (actor: LessonActor) =>
  actor.getSnapshot().context.previousAnswerStatus;

export const getCorrectAnswer = (actor: LessonActor) =>
  actor.getSnapshot().context.previousCorrectAnswer;

export const getStudentAnswer = (actor: LessonActor) =>
  actor.getSnapshot().context.previousStudentAnswer;

export const getPrompt = (actor: LessonActor, word?: string, answerLetter?: string, exampleNoun?: string): string => {
  const snap = actor.getSnapshot();
  const meta = snap.getMeta() as Record<string, { prompt?: string | ((ctx: typeof snap.context, word?: string, answerLetter?: string, exampleNoun?: string) => string) }>;
  const key = `lesson.${snap.value as string}`;

  const previousAnswer =
    snap.context.previousAnswerStatus === null
      ? ''
      : snap.context.previousAnswerStatus
        ? 'The student got the previous answer correct.'
        : 'The student got the previous answer incorrect.';

  let rawPrompt = meta[key]?.prompt ?? '';
  const prompt =
    typeof rawPrompt === 'function'
      ? rawPrompt(snap.context, word, answerLetter, exampleNoun)
      : rawPrompt;


  const rawHint = snap.context.hint;
  const hint =
    typeof rawHint === 'function'
      ? rawHint(snap.context, word, answerLetter, exampleNoun)
      : rawHint;

  return `${previousAnswer} ${prompt} ${hint}`;
};