'use client';

import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BookOpen, 
  PenTool, 
  Users, 
  Sparkles, 
  Bot, 
  ShieldCheck, 
  HelpCircle,
  MessageCircle,
  Smartphone
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GuidePage() {
  const sections = [
    {
      id: "reader",
      icon: BookOpen,
      title: "Menjadi Pembaca",
      color: "text-blue-500",
      bg: "bg-blue-500/5",
      content: [
        { q: "Bagaimana cara mulai membaca?", a: "Cari buku melalui fitur pencarian atau jelajahi genre di Beranda. Klik sampul buku untuk melihat detail, lalu tekan 'Mulai Membaca'." },
        { q: "Apa itu Buku Favorit?", a: "Klik ikon hati pada detail buku untuk menyimpannya ke koleksi favorit Anda. Anda bisa mengaksesnya kembali melalui tab 'Favorit' di profil Anda." },
        { q: "Cara memberikan ulasan?", a: "Di bagian bawah setiap buku terdapat kolom komentar. Gunakan Markdown seperti **tebal** atau _miring_ untuk mempercantik ulasan Anda." }
      ]
    },
    {
      id: "author",
      icon: PenTool,
      title: "Karir Sebagai Penulis",
      color: "text-orange-500",
      bg: "bg-orange-500/5",
      content: [
        { q: "Bagaimana cara menjadi penulis?", a: "Masuk ke menu 'Daftar Penulis', lengkapi formulir aplikasi dan portofolio Anda. Tim kami akan meninjau lamaran Anda dalam 1-3 hari kerja." },
        { q: "Cara mengunggah buku baru?", a: "Setelah akun Anda diverifikasi, tombol 'Unggah' akan muncul di navigasi bawah. Anda bisa mengisi judul, genre, sinopsis, dan sampul sebelum mulai menulis bab." },
        { q: "Apa itu status Draf vs Terbit?", a: "Buku baru akan berstatus 'Draf'. Setelah Anda selesai menulis dan menekan 'Publikasi', buku akan dikirim ke moderator untuk ditinjau sebelum tampil secara publik." }
      ]
    },
    {
      id: "social",
      icon: Users,
      title: "Interaksi & Story",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      content: [
        { q: "Apa itu fitur Story?", a: "Fitur untuk berbagi momen singkat berupa teks. Story akan hilang otomatis setelah 24 jam. Gunakan gradien warna-warni untuk menarik perhatian pembaca." },
        { q: "Bagaimana cara kirim pesan?", a: "Kunjungi profil pengguna lain, lalu klik tombol 'Pesan'. Anda bisa berdiskusi secara pribadi tentang karya atau ide cerita." },
        { q: "Mengikuti pengguna lain?", a: "Klik 'Ikuti' pada profil pujangga favorit Anda untuk mendapatkan notifikasi saat mereka merilis karya atau membuat momen baru." }
      ]
    },
    {
      id: "ai",
      icon: Bot,
      title: "Elitera AI Intelligence",
      color: "text-primary",
      bg: "bg-primary/5",
      content: [
        { q: "Apa kegunaan Elitera AI?", a: "Asisten cerdas kami dapat membantu Anda mengatasi writer's block, memberikan ide plot, menyarankan perbaikan tata bahasa, atau menjelaskan fitur aplikasi." },
        { q: "Apakah AI bisa menuliskan buku saya?", a: "Elitera AI dirancang sebagai asisten kreatif, bukan pengganti penulis. Gunakan ia untuk berdiskusi ide, namun biarkan jiwa tulisan tetap berasal dari imajinasi Anda." }
      ]
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-24">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 pt-6"
      >
        <div className="mx-auto bg-primary/10 p-4 rounded-[2rem] w-fit mb-4">
            <HelpCircle className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-headline font-black tracking-tight leading-tight">
            Pusat <span className="text-primary italic">Bantuan</span> & Panduan
        </h1>
        <p className="text-muted-foreground font-medium max-w-sm mx-auto">
            Segala hal yang perlu Anda ketahui untuk menjelajahi semesta literasi digital Elitera.
        </p>
      </motion.section>

      {/* Quick Stats/Info */}
      <div className="grid grid-cols-2 gap-4 px-2">
        <Card className="border-none shadow-sm bg-card/50 rounded-3xl p-6 flex flex-col items-center text-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Komunitas Aman</p>
            <p className="text-xs font-bold leading-relaxed">Moderasi karya & perlindungan privasi 24/7.</p>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 rounded-3xl p-6 flex flex-col items-center text-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Optimasi Mobile</p>
            <p className="text-xs font-bold leading-relaxed">Pengalaman membaca terbaik di genggaman.</p>
        </Card>
      </div>

      {/* Accordion Guide */}
      <section className="space-y-6">
        {sections.map((section, idx) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="border-none shadow-md overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border/20">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2.5 rounded-2xl", section.bg, section.color)}>
                            <section.icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="font-headline text-xl font-bold">{section.title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {section.content.map((item, i) => (
                            <AccordionItem key={i} value={`item-${i}`} className="border-b-border/30 last:border-0">
                                <AccordionTrigger className="text-left font-bold text-sm hover:no-underline group">
                                    <span className="group-hover:text-primary transition-colors">{item.q}</span>
                                </AccordionTrigger>
                                <AccordionContent className="text-muted-foreground leading-relaxed text-sm italic font-medium pt-1 pb-4">
                                    {item.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Footer Support */}
      <Card className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 text-center space-y-6">
        <div className="space-y-2">
            <h3 className="font-headline text-xl font-black">Masih Punya Pertanyaan?</h3>
            <p className="text-sm text-muted-foreground font-medium">Tim Elitera selalu siap membantu Anda menemukan jawaban.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/about" className="w-full sm:w-auto">
                <div className="bg-white dark:bg-zinc-900 border-2 px-8 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-sm hover:bg-muted/50 transition-all">
                    <MessageCircle className="h-4 w-4" /> Hubungi Kami
                </div>
            </a>
            <a href="/ai" className="w-full sm:w-auto">
                <div className="bg-primary text-white px-8 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    <Sparkles className="h-4 w-4" /> Tanya Elitera AI
                </div>
            </a>
        </div>
      </Card>
    </div>
  );
}
