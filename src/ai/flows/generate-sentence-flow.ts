'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating sentence templates for the Wordplay game.
 *
 * - generateSentence - Generates a sentence with blanks for parts of speech.
 * - GenerateSentenceInput - The input type for the generateSentence function.
 * - GenerateSentenceOutput - The return type for the generateSentence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSentenceInputSchema = z.object({
  previousTemplates: z
    .array(z.string())
    .describe('An array of previously used sentence templates to avoid repetition.'),
});
export type GenerateSentenceInput = z.infer<typeof GenerateSentenceInputSchema>;

const GenerateSentenceOutputSchema = z.object({
  template: z
    .string()
    .describe('A sentence template with placeholders for parts of speech, like "[noun]", "[verb]", "[adjective]", "[adverb]", or "[plural noun]".'),
});
export type GenerateSentenceOutput = z.infer<typeof GenerateSentenceOutputSchema>;

export async function generateSentence(input: GenerateSentenceInput): Promise<GenerateSentenceOutput> {
  return generateSentenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sentenceGenerationPrompt',
  input: {schema: GenerateSentenceInputSchema},
  output: {schema: GenerateSentenceOutputSchema},
  prompt: `You are a creative game assistant for a word game called Wordplay. Your task is to generate a simple sentence template with blanks for other players to fill in.

The blanks must be one of the following parts of speech:
- [noun]
- [verb]
- [adjective]
- [adverb]
- [plural noun]

The sentence should have between 3 and 5 blanks. The template should be funny, quirky, or interesting to encourage creative and humorous responses.

Do not repeat any of these previously used templates: {{#if previousTemplates}}{{#each previousTemplates}}"{{this}}"{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

Example of a good template: "My [adjective] [noun] always [verb]s too [adverb] near the [plural noun]."
Another good example: "Why did the [noun] [verb] the [adjective] [plural noun]?"

Please generate a new, unique sentence template.
`,
});

const generateSentenceFlow = ai.defineFlow(
  {
    name: 'generateSentenceFlow',
    inputSchema: GenerateSentenceInputSchema,
    outputSchema: GenerateSONTENTS_HEREutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
