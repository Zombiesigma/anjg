'use client';

import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  PenTool, 
  Users, 
  Sparkles, 
  Bot, 
  ShieldCheck, 
  HelpCircle,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Lock,
  Layers,
  Zap,
  Star
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function GuidePage() {
  const sections = [
    {
      id: "reader",
      icon: BookOpen,
      title: "Panduan Untuk Pembaca",
      description: "Jelajahi ribuan imajinasi dengan kenyamanan maksimal.",
      color: "text-blue-500",
      bg: "bg-blue-500/5",
      content: [
        { 
          q: "Bagaimana cara menemukan karya yang tepat?", 
          a: "Gunakan fitur 'Eksplorasi' di Beranda untuk melihat tren mingguan, atau gunakan bilah pencarian cerdas di bagian atas. Anda bisa mencari berdasarkan judul, genre (seperti Fantasi, Novel, atau Pengembangan Diri), atau langsung mencari nama pujangga favorit Anda." 
        },
        { 
          q: "Personalisasi pengalaman membaca", 
          a: "Saat berada di dalam halaman baca, klik ikon 'Gear' atau 'Settings' di header. Anda dapat menyesuaikan ukuran huruf agar nyaman di mata dan beralih antara Mode Terang atau Mode Gelap untuk pengalaman membaca yang lebih imersif di malam hari." 
        },
        { 
          q: "Sistem Favorit & Koleksi", 
          a: "Menekan ikon 'Hati' pada detail buku tidak hanya memberikan apresiasi kepada penulis, tetapi juga menyimpan buku tersebut ke dalam tab 'Favorit' di profil Anda. Ini memudahkan Anda untuk melanjutkan bacaan kapan saja tanpa harus mencari ulang." 
        },
        { 
          q: "Berinteraksi di kolom komentar", 
          a: "Elitera mendukung format Markdown sederhana di komentar. Gunakan **tebal** untuk penekanan atau > untuk mengutip bagian favorit dari bab tersebut. Pastikan ulasan Anda membangun dan menghargai jerih payah sang pujangga." 
        }
      ]
    },
    {
      id: "author",
      icon: PenTool,
      title: "Karir Sebagai Penulis",
      description: "Dari draf pertama hingga menjadi pujangga ternama.",
      color: "text-orange-500",
      bg: "bg-orange-500/5",
      content: [
        { 
          q: "Langkah menjadi Penulis Terverifikasi", 
          a: "Kunjungi halaman 'Daftar Penulis', lengkapi formulir dengan motivasi dan tautkan portofolio karya Anda (bisa berupa blog pribadi atau tulisan di platform lain). Tim kurasi kami akan meninjau kualitas narasi Anda dalam 1-3 hari kerja sebelum memberikan lencana penulis resmi." 
        },
        { 
          q: "Manajemen Draf & Bab", 
          a: "Setelah menjadi penulis, Anda dapat membuat buku baru. Setiap buku dimulai sebagai 'Draf' yang hanya bisa dilihat oleh Anda. Anda dapat menyusun bab demi bab secara bertahap. Gunakan fitur 'Auto-save' kami yang menyimpan progres tulisan Anda setiap 15 detik." 
        },
        { 
          q: "Proses Publikasi & Moderasi", 
          a: "Setelah draf selesai, klik tombol 'Publikasi'. Karya Anda akan masuk ke antrean moderasi. Admin Elitera akan memastikan konten tidak melanggar kebijakan komunitas. Setelah disetujui, buku Anda akan tampil secara publik dan pengikut Anda akan mendapatkan notifikasi instan." 
        },
        { 
          q: "Memperbarui Karya yang Sudah Terbit", 
          a: "Anda tetap bisa menambah bab atau mengedit isi buku setelah terbit. Namun, perubahan signifikan pada identitas buku (seperti judul atau sampul) mungkin akan memicu peninjauan ulang singkat untuk menjaga integritas data." 
        }
      ]
    },
    {
      id: "social",
      icon: Users,
      title: "Interaksi Sosial & Momen",
      description: "Membangun jalinan antar penikmat sastra.",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      content: [
        { 
          q: "Fitur Story (Momen Elitera)", 
          a: "Story adalah tempat untuk membagikan pemikiran singkat, progres menulis, atau kutipan harian. Momen ini hanya bertahan selama 24 jam. Pujangga terverifikasi akan mendapatkan lingkaran gradien berwarna pada avatar mereka sebagai tanda adanya momen aktif." 
        },
        { 
          q: "Pesan Langsung & Diskusi Privat", 
          a: "Gunakan fitur Pesan untuk berdiskusi lebih mendalam tentang ide cerita secara pribadi. Anda bahkan bisa membagikan kartu buku langsung ke dalam obrolan agar rekan bicara Anda bisa langsung membacanya." 
        },
        { 
          q: "Sistem Pengikut (Following)", 
          a: "Dengan mengikuti seorang pujangga, Anda memastikan tidak akan ketinggalan karya terbaru mereka. Anda akan mendapatkan notifikasi prioritas setiap kali mereka menerbitkan bab baru atau membuat story." 
        }
      ]
    },
    {
      id: "ai",
      icon: Bot,
      title: "Elitera AI Intelligence",
      description: "Asisten kreatif di ujung jari Anda.",
      color: "text-primary",
      bg: "bg-primary/5",
      content: [
        { 
          q: "Apa yang bisa dilakukan Elitera AI?", 
          a: "AI kami dilatih untuk memahami konteks literasi. Ia bisa membantu Anda menyusun kerangka plot, memberikan saran sinonim kata, mengatasi writer's block, hingga menjelaskan cara kerja fitur-fitur teknis di aplikasi Elitera." 
        },
        { 
          q: "Etika penggunaan AI dalam menulis", 
          a: "Kami menyarankan penggunaan AI sebagai rekan diskusi (sparring partner) kreatif. Elitera menghargai keaslian suara penulis. Gunakan AI untuk memperkaya ide, namun biarkan 'jiwa' dan emosi tulisan tetap murni berasal dari jemari Anda." 
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-32">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-10"
      >
        <div className="mx-auto relative mb-6">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-2xl text-primary w-fit mx-auto ring-1 ring-primary/10">
                <HelpCircle className="h-12 w-12" />
            </div>
        </div>
        <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-tight">
                Pusat <span className="text-primary italic underline decoration-primary/20">Bantuan</span> Elitera
            </h1>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto text-lg leading-relaxed">
                Segala hal yang perlu Anda ketahui untuk menavigasi semesta literasi digital modern kami secara profesional.
            </p>
        </div>
      </motion.section>

      {/* Quick Stats/Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        {[
            { icon: ShieldCheck, label: "Keamanan Komunitas", desc: "Moderasi 24/7 untuk menjaga kualitas karya.", color: "text-emerald-500" },
            { icon: Smartphone, label: "Akses Mobile", desc: "Optimal di genggaman untuk bacaan tanpa batas.", color: "text-blue-500" },
            { icon: CheckCircle2, label: "Sistem Verifikasi", desc: "Pengakuan resmi bagi pujangga berbakat.", color: "text-orange-500" }
        ].map((stat, i) => (
            <Card key={i} className="border-none shadow-xl bg-card/50 backdrop-blur-sm rounded-[2rem] p-8 flex flex-col items-center text-center gap-4 group hover:-translate-y-1 transition-all duration-300">
                <div className={cn("p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-inner group-hover:scale-110 transition-transform", stat.color)}>
                    <stat.icon className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{stat.label}</p>
                    <p className="text-sm font-bold leading-relaxed">{stat.desc}</p>
                </div>
            </Card>
        ))}
      </div>

      {/* Main Accordion Guide */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 px-4">
            <h2 className="text-2xl font-headline font-black tracking-tight">Kategori <span className="text-primary">Panduan</span></h2>
            <div className="h-px bg-border flex-1" />
        </div>

        <div className="grid gap-8">
            {sections.map((section, idx) => (
            <motion.div 
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
            >
                <Card className="border-none shadow-2xl overflow-hidden rounded-[2.5rem] bg-card/50 backdrop-blur-md border border-white/10">
                    <CardHeader className="pb-4 bg-muted/20 border-b">
                        <div className="flex items-center gap-5">
                            <div className={cn("p-4 rounded-[1.5rem] shadow-xl", section.bg, section.color)}>
                                <section.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-2xl font-black">{section.title}</CardTitle>
                                <CardDescription className="font-medium text-sm mt-1">{section.description}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 md:p-10">
                        <Accordion type="single" collapsible className="w-full">
                            {section.content.map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border-b-border/30 last:border-0 py-2">
                                    <AccordionTrigger className="text-left font-black text-base md:text-lg hover:no-underline group py-4">
                                        <span className="group-hover:text-primary transition-colors flex items-center gap-3">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/30 group-hover:bg-primary transition-colors" />
                                            {item.q}
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground leading-relaxed text-base font-medium pt-2 pb-6 pl-4 md:pl-6 border-l-2 border-primary/10 ml-0.5 italic">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            </motion.div>
            ))}
        </div>
      </section>

      {/* Help Footer */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <Card className="bg-zinc-900 text-white border-none rounded-[3rem] p-10 md:p-16 text-center space-y-10 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
                <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl w-fit mx-auto mb-6">
                    <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-headline text-3xl md:text-4xl font-black">Masih Punya Pertanyaan?</h3>
                <p className="text-zinc-400 max-w-xl mx-auto text-lg font-medium">Tim moderasi dan asisten AI kami selalu siap sedia membantu perjalanan sastra Anda.</p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild size="lg" variant="outline" className="rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest border-white/20 hover:bg-white/10 hover:border-white/40 w-full sm:w-auto text-white">
                    <a href="/about"><Users className="mr-2 h-5 w-5" /> Hubungi Tim</a>
                </Button>
                <Button asChild size="lg" className="rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto bg-primary">
                    <a href="/ai"><Sparkles className="mr-2 h-5 w-5" /> Tanya Elitera AI</a>
                </Button>
            </div>
        </Card>
      </motion.div>
    </div>
  );
}