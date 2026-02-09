'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Github, Globe, Mail, Phone, Send, Sparkles, BookOpen, Users, Heart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const devPortfolio = "https://www.gunturpadilah.web.id/";
const devImage = "https://www.gunturpadilah.web.id/pp.jpg";
const devName = "Guntur Padilah";
const devBio = "Seorang antusias literasi dan pengembang full-stack yang berdedikasi menciptakan ruang digital inklusif.";

const technologies = [
    { title: "Next.js 15", desc: "Framework web modern, kecepatan luar biasa dan optimasi SEO.", icon: "https://svgl.app/library/nextjs_icon_dark.svg" },
    { title: "Firebase", desc: "Infrastruktur Cloud Google yang menjaga keamanan dan sinkronisasi data.", icon: "https://svgl.app/library/firebase.svg" },
    { title: "Tailwind CSS", desc: "Sistem desain utilitas untuk antarmuka yang presisi dan responsif.", icon: "https://svgl.app/library/tailwindcss.svg" },
    { title: "Google Genkit", desc: "Mesin AI cerdas di balik Elitera AI untuk diskusi kreatif.", icon: "https://avatars.githubusercontent.com/u/161543431?s=200&v=4" }
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-32 relative overflow-x-hidden w-full px-1 md:px-0">
      {/* Decorative Background - Properly Scaled */}
      <div className="absolute top-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-primary/5 rounded-full blur-[80px] md:blur-[120px] -z-10 pointer-events-none" />
      
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-6 md:space-y-8 py-8 md:py-12"
      >
        <div className="flex justify-center mb-4 md:mb-6">
            <div className="relative p-3 md:p-4 rounded-[1.75rem] md:rounded-[2rem] bg-white dark:bg-zinc-900 shadow-2xl shadow-primary/10 group overflow-hidden border border-border/50">
                <Logo className="w-14 h-14 md:w-20 md:h-20 transition-transform duration-500 group-hover:scale-110" />
            </div>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                <Sparkles className="h-3 w-3" /> Jembatan Pujangga Modern
            </div>
            <h1 className="text-3xl md:text-7xl font-headline font-black text-foreground leading-[1.1] tracking-tight">
                Misi Kami Adalah <span className="text-primary italic underline decoration-primary/10">Menghubungkan.</span>
            </h1>
            <p className="text-sm md:text-xl text-muted-foreground leading-relaxed font-medium italic px-2">
                "Di Elitera, kami percaya setiap orang memiliki cerita yang layak untuk didengar."
            </p>
        </div>
      </motion.section>

      {/* Stats/Values Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-4">
        {[
            { icon: BookOpen, title: "Akses Gratis", desc: "Membaca dan menulis karya tanpa batasan biaya langganan." },
            { icon: Users, title: "Komunitas", desc: "Ruang diskusi real-time yang mempererat ikatan antar pujangga." },
            { icon: Heart, title: "Inspirasi", desc: "Fitur Story dan AI Assistant yang terus memicu kreativitas harian." }
        ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm rounded-[2rem] p-6 md:p-8 h-full flex flex-col items-center text-center group hover:-translate-y-1 transition-all border border-white/10">
                    <div className="p-4 rounded-2xl bg-primary/5 text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-white shadow-inner">
                        <item.icon className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-xs md:text-sm font-medium">{item.desc}</p>
                </Card>
            </motion.div>
        ))}
      </section>

      {/* Developer Section */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="space-y-8 md:space-y-10 px-4">
        <div className="flex items-center gap-4">
            <h2 className="text-lg md:text-3xl font-headline font-black tracking-tight whitespace-nowrap">Sosok di Balik <span className="text-primary">Layar</span></h2>
            <div className="h-px bg-border flex-1" />
        </div>

        <Card className="overflow-hidden border-none shadow-2xl rounded-[2.25rem] md:rounded-[2.5rem] bg-zinc-900 text-white group border border-white/5">
            <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative h-[280px] md:h-auto overflow-hidden">
                    <Image src={devImage} alt={devName} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:hidden" />
                </div>
                <div className="md:w-2/3 p-8 md:p-16 space-y-6 flex flex-col justify-center">
                    <div className="space-y-3">
                        <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-primary">Full-stack Developer</div>
                        <h3 className="text-2xl md:text-4xl font-headline font-black tracking-tight">{devName}</h3>
                        <p className="text-sm md:text-xl text-zinc-400 font-medium italic leading-relaxed">"{devBio}"</p>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <a href={devPortfolio} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                            <Button className="w-full rounded-xl px-6 h-11 font-black bg-white text-zinc-900 hover:bg-zinc-200 text-xs uppercase tracking-widest">Portofolio</Button>
                        </a>
                        <a href="https://github.com/Zombiesigma" target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none">
                            <Button variant="outline" className="w-full rounded-xl px-6 h-11 font-black border-zinc-700 hover:bg-white/5 text-xs uppercase tracking-widest text-white">GitHub</Button>
                        </a>
                    </div>
                </div>
            </div>
        </Card>
      </motion.section>

      {/* Technology Section */}
      <section className="space-y-10 md:space-y-12 px-4">
        <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-headline font-black tracking-tight">Keajaiban di Balik <span className="text-primary italic underline decoration-primary/10">Kata</span></h2>
            <p className="text-muted-foreground text-xs md:text-sm max-w-xl mx-auto font-medium">Dibangun dengan pondasi teknologi mutakhir untuk performa terbaik.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {technologies.map((tech, i) => (
                <Card key={i} className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[1.5rem] p-5 md:p-6 hover:shadow-xl transition-all text-center border border-white/5 group">
                    <div className="h-8 w-8 md:h-10 md:w-10 relative mb-4 mx-auto grayscale group-hover:grayscale-0 transition-all duration-500">
                        <Image src={tech.icon} alt={tech.title} fill className="object-contain" />
                    </div>
                    <h4 className="font-black text-[11px] md:text-sm mb-1 uppercase tracking-tight">{tech.title}</h4>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground leading-tight font-medium">{tech.desc}</p>
                </Card>
            ))}
        </div>
      </section>

      {/* Download Section */}
      <section className="px-4">
        <Card className="bg-primary/5 border-primary/10 p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-6 md:space-y-8 shadow-inner overflow-hidden relative border">
            <div className="absolute top-[-20%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-4">
                <div className="bg-primary/10 p-3 rounded-2xl w-fit mx-auto mb-4 md:mb-6">
                    <Logo className="h-10 w-10 md:h-12 md:w-12 grayscale opacity-50" />
                </div>
                <h4 className="font-black text-2xl md:text-4xl font-headline leading-tight">Bawa Elitera di <br/> <span className="text-primary italic">Genggaman.</span></h4>
                <p className="text-xs md:text-lg text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">Unduh aplikasi Android untuk pengalaman yang lebih cepat, navigasi gestur, dan notifikasi instan.</p>
                <div className="pt-6 max-w-xs mx-auto">
                    <a href="https://raw.githubusercontent.com/Zombiesigma/elitera-asset/main/elitera.apk" download>
                        <Button className="w-full rounded-2xl font-black h-14 md:h-16 shadow-xl shadow-primary/20 text-xs md:text-sm uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-95">
                            Unduh Elitera.apk <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </a>
                </div>
            </div>
        </Card>
      </section>
    </div>
  );
}
