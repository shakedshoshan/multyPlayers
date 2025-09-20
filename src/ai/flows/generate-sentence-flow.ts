'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating sentence templates for the Wordplay game.
 *
 * - generateSentence - Generates a sentence with a single blank.
 * - GenerateSentenceInput - The input type for the generateSentence function.
 * - GenerateSentenceOutput - The return type for the generateSentence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSentenceInputSchema = z.object({
  previousTemplates: z
    .array(z.string())
    .describe('An array of previously used sentence templates to avoid repetition.'),
  language: z.string().describe('The language for the category. Should be a two-letter ISO 639-1 code.'),
});
export type GenerateSentenceInput = z.infer<typeof GenerateSentenceInputSchema>;

const GenerateSentenceOutputSchema = z.object({
  template: z
    .string()
    .describe('A sentence template with a single placeholder for a word, like "[blank]".'),
});
export type GenerateSentenceOutput = z.infer<typeof GenerateSentenceOutputSchema>;

export async function generateSentence(input: GenerateSentenceInput): Promise<GenerateSentenceOutput> {
  return generateSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sentenceGenerationPrompt',
  input: {schema: GenerateSentenceInputSchema},
  output: {schema: GenerateSentenceOutputSchema},
  prompt: `You are a creative game assistant for a word game called Wordplay. Your task is to generate a simple sentence template with a single blank for another player to fill in, in the specified language.

The blank must be represented as: [blank]

The sentence should be funny, quirky, or interesting to encourage creative and humorous responses. It should be a complete sentence with only ONE blank.

Language: {{language}}

Do not repeat any of these previously used templates: {{#if previousTemplates}}{{#each previousTemplates}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Example of a good template: "My pet [blank] is an amazing dancer."
Another good example: "I secretly wish I was a [blank]."
Another good example: "The quick brown fox jumps over the lazy [blank]."

Please generate a new, unique sentence template.
`,
});

const generateSentenceFlow = ai.defineFlow(
  {
    name: 'generateSentenceFlow',
    inputSchema: GenerateSentenceInputSchema,
    outputSchema: GenerateSentenceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
