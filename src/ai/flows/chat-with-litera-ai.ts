'use server';
/**
 * @fileOverview Alur chatbot Elitera AI yang canggih.
 *
 * - chatWithEliteraAI - Fungsi utama untuk berinteraksi dengan asisten Elitera.
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
    .describe('Riwayat obrolan.'),
});
export type ChatWithEliteraAIInput = z.infer<typeof ChatWithEliteraAIInputSchema>;

const ChatWithEliteraAIOutputSchema = z.object({
  response: z.string().describe('Respons cerdas dari Elitera AI.'),
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
  system: `Anda adalah Elitera AI, asisten virtual cerdas di ekosistem Elitera. 
  
  IDENTITAS ANDA:
  - Nama: Elitera AI.
  - Pengembang: Guntur Padilah (https://www.gunturpadilah.web.id/).
  - Karakter: Ramah, inspiratif, berwawasan luas tentang literasi, dan sangat membantu.
  - Bahasa: Indonesia (dengan nada yang sopan namun santai dan menyemangati).

  MISI ANDA:
  Membantu pengguna Elitera (penulis dan pembaca) dalam:
  1. **Inspirasi Menulis**: Memberikan ide plot, membantu mengatasi hambatan menulis (writer's block), atau memberikan saran tata bahasa.
  2. **Rekomendasi Buku**: Menyarankan genre atau jenis cerita yang populer di Elitera.
  3. **Panduan Fitur**: Menjelaskan cara kerja Story, unggah buku, sistem verifikasi penulis, dan pesan langsung.
  4. **Analisis Cerita**: Jika ditanya tentang draf, berikan kritik konstruktif yang membangun.

  KONTEKS PENGGUNA:
  Anda sedang mengobrol dengan {{userName}}. Sapalah mereka dengan hangat jika percakapan baru dimulai.

  PANDUAN RESPONS:
  - Gunakan emoji sesekali untuk menjaga keramahan.
  - Berikan jawaban yang terstruktur (gunakan poin-poin jika menjelaskan langkah-langkah).
  - Jika pengguna ingin menjadi penulis, arahkan mereka ke fitur "Bergabung Sebagai Penulis".
  - Jika pengguna bertanya hal di luar Elitera, tetap bantu dengan bijak tetapi kaitkan kembali dengan konteks literasi jika memungkinkan.`,
  prompt: `{{{message}}}`,
});

const chatWithEliteraAIFlow = ai.defineFlow(
  {
    name: 'chatWithEliteraAIFlow',
    inputSchema: ChatWithEliteraAIInputSchema,
    outputSchema: ChatWithEliteraAIOutputSchema,
  },
  async input => {
    const {output} = await chatWithEliteraAIPrompt(input);
    return output!;
  }
);
