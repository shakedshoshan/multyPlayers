'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a category and a secret word for The Impostor's Riddle game.
 *
 * - generateRiddle - Generates a category and a related secret word.
 * - GenerateRiddleInput - The input type for the generateRiddle function.
 * - GenerateRiddleOutput - The return type for the generateRiddle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRiddleInputSchema = z.object({
  previousWords: z
    .array(z.string())
    .describe('An array of previously used secret words to avoid repetition.'),
});
export type GenerateRiddleInput = z.infer<typeof GenerateRiddleInputSchema>;

const GenerateRiddleOutputSchema = z.object({
  category: z
    .string()
    .describe('A broad category for the secret word (e.g., "Musical Instrument", "Country", "Car Brand"). This is a hint about the secret word.'),
  secretWord: z
    .string()
    .describe('A specific, common word within the generated category (e.g., "Guitar", "Canada", "Toyota").'),
});
export type GenerateRiddleOutput = z.infer<typeof GenerateRiddleOutputSchema>;

export async function generateRiddle(input: GenerateRiddleInput): Promise<GenerateRiddleOutput> {
  return generateRiddleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riddleGenerationPrompt',
  input: {schema: GenerateRiddleInputSchema},
  output: {schema: GenerateRiddleOutputSchema},
  prompt: `You are a game master for a social deduction game. Your task is to generate a secret word and a corresponding category that acts as a hint.

Here are the rules:
1.  The CATEGORY must be a broad topic (e.g., "Musical Instruments", "A type of fruit", "Something in a kitchen").
2.  The SECRET WORD must be a common, well-known item that fits within that category (e.g., for "Musical Instruments", the secret word could be "Guitar" or "Piano").
3.  Do NOT repeat any of the previously used words.

Previously used words: {{#if previousWords}}{{#each previousWords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Please generate a new, unique category and secret word based on these rules.
`,
});

const generateRiddleFlow = ai.defineFlow(
  {
    name: 'generateRiddleFlow',
    inputSchema: GenerateRiddleInputSchema,
    outputSchema: GenerateRiddleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
