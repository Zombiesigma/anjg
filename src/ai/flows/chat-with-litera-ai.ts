'use server';
/**
 * @fileOverview Alur chatbot Elitera AI.
 *
 * - chatWithEliteraAI - Fungsi yang menangani proses obrolan dengan Elitera AI.
 * - ChatWithEliteraAIInput - Tipe input untuk fungsi chatWithEliteraAI.
 * - ChatWithEliteraAIOutput - Tipe kembalian untuk fungsi chatWithEliteraAI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithEliteraAIInputSchema = z.object({
  userName: z.string().describe('Nama pengguna yang sedang mengobrol.'),
  message: z.string().describe('Pesan dari pengguna.'),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
      })
    )
    .optional()
    .describe('Riwayat obrolan antara pengguna dan asisten.'),
});
export type ChatWithEliteraAIInput = z.infer<typeof ChatWithEliteraAIInputSchema>;

const ChatWithEliteraAIOutputSchema = z.object({
  response: z.string().describe('Respons dari Elitera AI.'),
});
export type ChatWithEliteraAIOutput = z.infer<
  typeof ChatWithEliteraAIOutputSchema
>;

export async function chatWithEliteraAI(
  input: ChatWithEliteraAIInput
): Promise<ChatWithEliteraAIOutput> {
  return chatWithEliteraAIFlow(input);
}

const chatWithEliteraAIPrompt = ai.definePrompt({
  name: 'chatWithEliteraAIPrompt',
  input: {schema: ChatWithEliteraAIInputSchema},
  output: {schema: ChatWithEliteraAIOutputSchema},
  system: `Anda adalah Elitera AI, asisten AI untuk platform Elitera. Pengembang Anda adalah Guntur Padilah (https://www.gunturpadilah.web.id/). Anda sedang mengobrol dengan {{userName}}.

Misi Anda adalah membantu pengguna dengan segala hal yang berkaitan dengan Elitera. Pertahankan nada yang ramah, membantu, dan menarik.

Fitur utama Elitera yang perlu Anda ketahui:
- **Unggah Buku**: Penulis dapat mengunggah buku mereka (judul, genre, sinopsis, sampul, dll.).
- **Halaman Detail & Baca Buku**: Pengguna dapat membaca buku, melihat detail, dan berkomentar.
- **Pesan Langsung**: Obrolan pribadi antar pengguna secara real-time.
- **Profil Pengguna**: Menampilkan informasi pengguna, buku yang ditulis, dan favorit.
- **Story**: Penulis bisa membuat cerita singkat (seperti di media sosial) yang hilang setelah 24 jam, lengkap dengan suka dan komentar.
- **Elitera AI Chatbot**: Itu Anda! Anda di sini untuk membantu.
- **Dasbor Admin**: Untuk admin mengelola aplikasi, menyetujui penulis baru, dan meninjau buku.`,
  prompt: `{{{message}}}`,
});

const chatWithEliteraAIFlow = ai.defineFlow(
  {
    name: 'chatWithEliteraAIFlow',
    inputSchema: ChatWithEliteraAIInputSchema,
    outputSchema: ChatWithEliteraAIOutputSchema,
  },
  async input => {
    // Genkit's prompt function automatically uses `chatHistory` from the input
    // to construct the conversation history. No manual transformation is needed.
    const {output} = await chatWithEliteraAIPrompt(input);
    return output!;
  }
);
