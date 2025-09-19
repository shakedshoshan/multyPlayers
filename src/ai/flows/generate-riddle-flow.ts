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
    .describe('A broad category for the secret word (e.g., "Fruits", "Countries", "Car Brands").'),
  secretWord: z
    .string()
    .describe('A specific word within the generated category (e.g., "Apple", "Canada", "Toyota").'),
});
export type GenerateRiddleOutput = z.infer<typeof GenerateRiddleOutputSchema>;

export async function generateRiddle(input: GenerateRiddleInput): Promise<GenerateRiddleOutput> {
  return generateRiddleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'riddleGenerationPrompt',
  input: {schema: GenerateRiddleInputSchema},
  output: {schema: GenerateRiddleOutputSchema},
  prompt: `You are a game master for a social deduction game called "The Impostor's Riddle."
Your task is to generate a secret word and a corresponding category.

The category should be general enough for multiple items to fit within it.
The secret word should be a common, well-known item within that category.

Avoid words that are too obscure or too simple. The goal is to create a fun challenge for players trying to identify an impostor who only knows the category.

Previously used words: {{#if previousWords}}{{#each previousWords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Please generate a new, unique category and secret word.
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
