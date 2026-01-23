'use server';
/**
 * @fileOverview A Litera AI chatbot flow.
 *
 * - chatWithLiteraAI - A function that handles the chat with Litera AI process.
 * - ChatWithLiteraAIInput - The input type for the chatWithLiteraAI function.
 * - ChatWithLiteraAIOutput - The return type for the chatWithLiteraAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithLiteraAIInputSchema = z.object({
  message: z.string().describe('The message from the user.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('The chat history between the user and the assistant.'),
});
export type ChatWithLiteraAIInput = z.infer<typeof ChatWithLiteraAIInputSchema>;

const ChatWithLiteraAIOutputSchema = z.object({
  response: z.string().describe('The response from Litera AI.'),
});
export type ChatWithLiteraAIOutput = z.infer<typeof ChatWithLiteraAIOutputSchema>;

export async function chatWithLiteraAI(input: ChatWithLiteraAIInput): Promise<ChatWithLiteraAIOutput> {
  return chatWithLiteraAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithLiteraAIPrompt',
  input: {schema: ChatWithLiteraAIInputSchema},
  output: {schema: ChatWithLiteraAIOutputSchema},
  prompt: `You are Litera AI, a helpful AI assistant for the LiteraVerse platform.

  Your purpose is to assist users with writing, research, and exploring book recommendations within the LiteraVerse platform.
  Maintain a friendly and engaging tone.

  {% if chatHistory %}
  Here is the chat history:
  {{#each chatHistory}}
  {{#if (eq role \"user\")}}User: {{content}}{{/if}}
  {{#if (eq role \"assistant\")}}Litera AI: {{content}}{{/if}}
  {{/each}}
  {% endif %}

  User: {{{message}}}
  Litera AI: `,
});

const chatWithLiteraAIFlow = ai.defineFlow(
  {
    name: 'chatWithLiteraAIFlow',
    inputSchema: ChatWithLiteraAIInputSchema,
    outputSchema: ChatWithLiteraAIOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
