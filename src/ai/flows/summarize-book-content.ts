'use server';

/**
 * @fileOverview A flow that summarizes book content using the Gemini API.
 *
 * - summarizeBookContent - A function that summarizes the content of a book.
 * - SummarizeBookContentInput - The input type for the summarizeBookContent function.
 * - SummarizeBookContentOutput - The return type for the summarizeBookContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeBookContentInputSchema = z.object({
  bookContent: z
    .string()
    .describe('The content of the book to be summarized.'),
});
export type SummarizeBookContentInput = z.infer<typeof SummarizeBookContentInputSchema>;

const SummarizeBookContentOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the book content.'),
});
export type SummarizeBookContentOutput = z.infer<typeof SummarizeBookContentOutputSchema>;

export async function summarizeBookContent(
  input: SummarizeBookContentInput
): Promise<SummarizeBookContentOutput> {
  return summarizeBookContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeBookContentPrompt',
  input: {schema: SummarizeBookContentInputSchema},
  output: {schema: SummarizeBookContentOutputSchema},
  prompt: `Summarize the following book content in a concise manner:\n\n{{{bookContent}}}`,
});

const summarizeBookContentFlow = ai.defineFlow(
  {
    name: 'summarizeBookContentFlow',
    inputSchema: SummarizeBookContentInputSchema,
    outputSchema: SummarizeBookContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
