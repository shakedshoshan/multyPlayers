'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a list of random words for the Elias game.
 *
 * - generateWords - Generates a list of random words.
 * - GenerateWordsInput - The input type for the generateWords function.
 * - GenerateWordsOutput - The return type for the generateWords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWordsInputSchema = z.object({
  previousWords: z
    .array(z.string())
    .describe('An array of previously used words to avoid repetition.'),
  language: z.string().describe('The language for the words. Should be a two-letter ISO 639-1 code.'),
  count: z.number().describe('The number of words to generate.'),
});
export type GenerateWordsInput = z.infer<typeof GenerateWordsInputSchema>;

const GenerateWordsOutputSchema = z.object({
  words: z
    .array(z.string())
    .describe('A list of random, common, guessable words.'),
});
export type GenerateWordsOutput = z.infer<typeof GenerateWordsOutputSchema>;

export async function generateWords(input: GenerateWordsInput): Promise<GenerateWordsOutput> {
  return generateWordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'wordGenerationPrompt',
  input: {schema: GenerateWordsInputSchema},
  output: {schema: GenerateWordsOutputSchema},
  prompt: `You are a word generator for a party game where one player has to describe a word to their partner without saying the word itself.

Generate a list of {{count}} common, guessable nouns or concepts in the specified language. The words should be relatively easy to describe and guess.

Do not include any proper nouns (like names of people, places, or brands).
Do not repeat any of the previously used words.

Language: {{language}}
Previously used words: {{#if previousWords}}{{#each previousWords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Please generate {{count}} new, unique words.
`,
});

const generateWordsFlow = ai.defineFlow(
  {
    name: 'generateWordsFlow',
    inputSchema: GenerateWordsInputSchema,
    outputSchema: GenerateWordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
