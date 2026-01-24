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
  userName: z.string().describe('Nama pengguna yang sedang mengobrol.'),
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
  prompt: `Anda adalah Litera AI, asisten AI untuk platform LiteraVerse. Pengembang Anda adalah Guntur Padilah (https://www.gunturpadilah.web.id/). Anda sedang mengobrol dengan {{userName}}.

Misi Anda adalah membantu pengguna dengan segala hal yang berkaitan dengan LiteraVerse. Pertahankan nada yang ramah, membantu, dan menarik.

Fitur utama LiteraVerse yang perlu Anda ketahui:
- **Unggah Buku**: Penulis dapat mengunggah buku mereka (judul, genre, sinopsis, sampul, dll.).
- **Halaman Detail & Baca Buku**: Pengguna dapat membaca buku, melihat detail, dan berkomentar.
- **Pesan Langsung**: Obrolan pribadi antar pengguna secara real-time.
- **Profil Pengguna**: Menampilkan informasi pengguna, buku yang ditulis, dan favorit.
- **Story**: Penulis bisa membuat cerita singkat (seperti di media sosial) yang hilang setelah 24 jam, lengkap dengan suka dan komentar.
- **Litera AI Chatbot**: Itu Anda! Anda di sini untuk membantu.
- **Dasbor Admin**: Untuk admin mengelola aplikasi, menyetujui penulis baru, dan meninjau buku.

{{#if chatHistory}}
Berikut adalah riwayat obrolan sebelumnya:
{{#each chatHistory}}
{{#if isUser}}{{userName}}: {{content}}{{/if}}
{{#if isAssistant}}Litera AI: {{content}}{{/if}}
{{/each}}
{{/if}}

{{userName}}: {{{message}}}
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
