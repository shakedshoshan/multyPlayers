'use server';

/**
 * @fileOverview An AI agent that improves the game categories based on player responses and success rates.
 *
 * - adaptCategory - A function that takes a category and player data, and suggests an improved category.
 * - AdaptCategoryInput - The input type for the adaptCategory function.
 * - AdaptCategoryOutput - The return type for the adaptCategory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptCategoryInputSchema = z.object({
  category: z.string().describe('The current category used in the game.'),
  playerResponses: z
    .array(z.string())
    .describe('An array of player responses to the category.'),
  successRate: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'The success rate for the category (0 = no one matched, 1 = everyone matched).' 
    ),
});
export type AdaptCategoryInput = z.infer<typeof AdaptCategoryInputSchema>;

const AdaptCategoryOutputSchema = z.object({
  improvedCategory: z
    .string()
    .describe(
      'A new or modified category that is more challenging and tailored to the players.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the category adaptation, explaining how it addresses previous responses and success rates.'
    ),
});
export type AdaptCategoryOutput = z.infer<typeof AdaptCategoryOutputSchema>;

export async function adaptCategory(
  input: AdaptCategoryInput
): Promise<AdaptCategoryOutput> {
  return adaptCategoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptCategoryPrompt',
  input: {schema: AdaptCategoryInputSchema},
  output: {schema: AdaptCategoryOutputSchema},
  prompt: `You are an expert game designer specializing in creating engaging and challenging categories for a word association game.

You are provided with the current category, player responses to that category, and the success rate (the proportion of players who gave the same answer).

Your goal is to adapt the category to make it more interesting and better tailored to the players.

If the success rate is high (e.g., above 0.75), make the category more challenging. This could involve making it more specific, using more obscure topics, or requiring more creative thinking.
If the success rate is low (e.g., below 0.25), make the category easier. This could involve making it more general, using more common topics, or providing clearer guidance.

Consider the player responses when adapting the category. If players are consistently misinterpreting the category, clarify the instructions or rephrase the question.

Category: {{{category}}}
Player Responses: {{#each playerResponses}}{{{this}}}, {{/each}}
Success Rate: {{{successRate}}}

Based on this information, suggest an improved category and explain your reasoning.

Improved Category: 
Reasoning: `,
});

const adaptCategoryFlow = ai.defineFlow(
  {
    name: 'adaptCategoryFlow',
    inputSchema: AdaptCategoryInputSchema,
    outputSchema: AdaptCategoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
