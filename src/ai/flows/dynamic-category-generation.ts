'use server';

/**
 * @fileOverview This file defines a Genkit flow for dynamically generating game categories.
 *
 * The flow uses an LLM to create unique and interesting categories for each round of the game, 
 * ensuring that the game remains engaging and unpredictable for the players.
 *
 * - generateCategory - A function that generates a category based on previous categories and success rates.
 * - CategoryGenerationInput - The input type for the generateCategory function.
 * - CategoryGenerationOutput - The return type for the generateCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategoryGenerationInputSchema = z.object({
  previousCategories: z
    .array(z.string())
    .describe('An array of previously used categories.'),
  successRate: z
    .number()
    .describe(
      'The success rate of previous rounds (0 to 1), where 1 is 100% success.'
    ),
});
export type CategoryGenerationInput = z.infer<typeof CategoryGenerationInputSchema>;

const CategoryGenerationOutputSchema = z.object({
  category: z
    .string()
    .describe('A new and interesting category for the game round.'),
});
export type CategoryGenerationOutput = z.infer<typeof CategoryGenerationOutputSchema>;

export async function generateCategory(input: CategoryGenerationInput): Promise<CategoryGenerationOutput> {
  return generateCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categoryGenerationPrompt',
  input: {schema: CategoryGenerationInputSchema},
  output: {schema: CategoryGenerationOutputSchema},
  prompt: `You are a game category generator. Your goal is to generate unique and interesting categories for a game where players have to guess the same answer.

  The game has had these previous categories: {{previousCategories}}
  The success rate of the players has been {{successRate}}.

  Generate a new category that is both challenging and fun, taking into account the previous categories and success rate to avoid repetition and adjust difficulty.
`,
});

const generateCategoryFlow = ai.defineFlow(
  {
    name: 'generateCategoryFlow',
    inputSchema: CategoryGenerationInputSchema,
    outputSchema: CategoryGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
