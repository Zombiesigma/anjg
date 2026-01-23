'use server';
/**
 * @fileOverview Alur chatbot Litera AI.
 *
 * - chatWithLiteraAI - Fungsi yang menangani proses obrolan dengan Litera AI.
 * - ChatWithLiteraAIInput - Tipe input untuk fungsi chatWithLiteraAI.
 * - ChatWithLiteraAIOutput - Tipe kembalian untuk fungsi chatWithLiteraAI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithLiteraAIInputSchema = z.object({
  message: z.string().describe('Pesan dari pengguna.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().describe('Riwayat obrolan antara pengguna dan asisten.'),
});
export type ChatWithLiteraAIInput = z.infer<typeof ChatWithLiteraAIInputSchema>;

const ChatWithLiteraAIOutputSchema = z.object({
  response: z.string().describe('Respons dari Litera AI.'),
});
export type ChatWithLiteraAIOutput = z.infer<typeof ChatWithLiteraAIOutputSchema>;

export async function chatWithLiteraAI(input: ChatWithLiteraAIInput): Promise<ChatWithLiteraAIOutput> {
  return chatWithLiteraAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatWithLiteraAIPrompt',
  input: {schema: ChatWithLiteraAIInputSchema},
  output: {schema: ChatWithLiteraAIOutputSchema},
  prompt: `Anda adalah Litera AI, asisten AI yang membantu untuk platform Litera.

  Tujuan Anda adalah membantu pengguna dengan penulisan, penelitian, dan menjelajahi rekomendasi buku dalam platform Litera.
  Pertahankan nada yang ramah dan menarik.

  {{#if chatHistory}}
  Berikut adalah riwayat obrolan:
  {{#each chatHistory}}
  {{#if isUser}}Pengguna: {{content}}{{/if}}
  {{#if isAssistant}}Litera AI: {{content}}{{/if}}
  {{/each}}
  {{/if}}

  Pengguna: {{{message}}}
  Litera AI: `,
});

const chatWithLiteraAIFlow = ai.defineFlow(
  {
    name: 'chatWithLiteraAIFlow',
    inputSchema: ChatWithLiteraAIInputSchema,
    outputSchema: ChatWithLiteraAIOutputSchema,
  },
  async input => {
    const transformedInput = {
      ...input,
      chatHistory: input.chatHistory?.map((item) => ({
        ...item,
        isUser: item.role === 'user',
        isAssistant: item.role === 'assistant',
      })),
    };
    const {output} = await prompt(transformedInput);
    return output!;
  }
);
