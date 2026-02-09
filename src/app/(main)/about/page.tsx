'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { Github, Globe, Mail, Phone, Send, Sparkles, BookOpen, Users, Heart, ArrowRight, Zap, ShieldCheck, Smartphone, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const devPortfolio = "https://www.gunturpadilah.web.id/";
const devImage = "https://www.gunturpadilah.web.id/pp.jpg";
const devName = "Guntur P.";
const devBio = "Seorang antusias literasi dan pengembang tumpukan penuh (full-stack) yang berdedikasi menciptakan ruang digital yang inklusif bagi semua orang untuk berkarya.";

const technologies = [
    { 
        title: "Next.js 15", 
        desc: "Framework web masa depan yang menjamin kecepatan akses luar biasa dan optimasi SEO terbaik.",
        icon: "https://svgl.app/library/nextjs_icon_dark.svg",
    },
    { 
        title: "Firebase", 
        desc: "Infrastruktur Cloud dari Google yang menjaga keamanan akun dan sinkronisasi data real-time.",
        icon: "https://svgl.app/library/firebase.svg",
    },
    { 
        title: "Firebase Studio", 
        desc: "Lingkungan pengembangan mutakhir untuk iterasi produk yang sangat cepat dan terintegrasi.",
        icon: "https://svgl.app/library/firebase.svg",
    },
    { 
        title: "Expo Native", 
        desc: "Teknologi inti aplikasi mobile kami, menghadirkan performa native yang mulus di Android & iOS.",
        icon: "https://svgl.app/library/expo.svg",
    },
    { 
        title: "Tailwind CSS", 
        desc: "Sistem desain utilitas untuk menciptakan antarmuka yang modern, presisi, dan responsif.",
        icon: "https://svgl.app/library/tailwindcss.svg",
    },
    { 
        title: "Shadcn UI", 
        desc: "Koleksi komponen visual berkualitas tinggi untuk pengalaman pengguna yang premium dan konsisten.",
        icon: "https://svgl.app/library/shadcnui.svg",
    },
    { 
        title: "Google Genkit", 
        desc: "Mesin kecerdasan buatan di balik Elitera AI, dirancang untuk diskusi kreatif yang cerdas.",
        icon: "https://avatars.githubusercontent.com/u/161543431?s=200&v=4",
    },
    { 
        title: "Sentuhan AI", 
        desc: "Aplikasi ini dibangun dengan kolaborasi asisten AI untuk efisiensi kode dan ideasi puitis.",
        icon: "https://svgl.app/library/anthropic.svg",
    }
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-24 pb-32 relative">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-40 left-0 w-72 h-72 bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 py-12"
      >
        <div className="flex justify-center mb-6">
            <div className="relative p-4 rounded-[2rem] bg-white shadow-2xl shadow-primary/10 group overflow-hidden">
                <Logo className="w-20 h-20 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]"
            >
                <Sparkles className="h-3.5 w-3.5" /> Jembatan Pujangga Modern
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-headline font-black text-foreground leading-tight tracking-tight">
                Misi Kami Adalah <span className="text-primary italic">Menghubungkan.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium italic">
                "Di Elitera, kami percaya setiap orang memiliki cerita yang layak untuk didengar. Kami membangun panggung digital di mana kata-kata menemukan rumahnya dan penulis menemukan pembacanya."
            </p>
        </div>
      </motion.section>

      {/* Stats/Values Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
            { icon: BookOpen, title: "Akses Gratis", desc: "Membaca dan menulis karya tanpa batasan biaya, untuk literasi yang merata." },
            { icon: Users, title: "Komunitas Dinamis", desc: "Ruang diskusi real-time yang mempererat ikatan antara pembaca dan penulis." },
            { icon: Heart, title: "Ruang Inspirasi", desc: "Fitur Story dan AI Assistant yang dirancang untuk memicu kreativitas setiap hari." }
        ].map((item, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
            >
                <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm rounded-[2rem] p-8 h-full flex flex-col items-center text-center group hover:-translate-y-2 transition-all duration-500">
                    <div className="p-4 rounded-2xl bg-primary/5 text-primary mb-6 transition-colors group-hover:bg-primary group-hover:text-white">
                        <item.icon className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </Card>
            </motion.div>
        ))}
      </section>

      {/* Developer Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-10"
      >
        <div className="flex items-center gap-4 px-4">
            <h2 className="text-3xl font-headline font-black tracking-tight">Sosok di Balik <span className="text-primary">Layar</span></h2>
            <div className="h-px bg-border flex-1" />
        </div>

        <Card className="overflow-hidden border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] bg-zinc-900 text-white group">
            <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 relative h-[400px] md:h-auto overflow-hidden">
                    <Image 
                        src={devImage} 
                        alt={devName} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110" 
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-900 via-transparent to-transparent opacity-60" />
                </div>
                <div className="md:w-2/3 p-10 md:p-16 space-y-8 flex flex-col justify-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-4xl font-headline font-black tracking-tight">{devName}</h3>
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <p className="text-xl text-zinc-400 font-medium leading-relaxed italic">
                            "{devBio}"
                        </p>
                    </div>

                    <div className="flex wrap gap-4">
                        <a href={devPortfolio} target="_blank" rel="noopener noreferrer">
                            <Button className="rounded-full px-8 h-12 font-bold bg-white text-zinc-900 hover:bg-zinc-200">
                                <Globe className="mr-2 h-4 w-4" /> Portofolio
                            </Button>
                        </a>
                        <a href="https://github.com/Guntur-s" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="rounded-full px-8 h-12 font-bold border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600">
                                <Github className="mr-2 h-4 w-4" /> GitHub
                            </Button>
                        </a>
                    </div>
                </div>
            </div>
        </Card>
      </motion.section>

      {/* Technology Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="space-y-12"
      >
        <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black tracking-tight">Keajaiban di Balik <span className="text-primary italic">Kata</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
                Elitera dibangun dengan kejujuran menggunakan pondasi teknologi mutakhir untuk memastikan setiap imajinasi tersimpan abadi dan aman.
            </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologies.map((tech, i) => (
                <Card key={i} className="border-none shadow-lg bg-card/50 backdrop-blur-sm rounded-[2rem] p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="h-12 w-12 relative mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                        <Image 
                            src={tech.icon} 
                            alt={tech.title} 
                            fill 
                            className="object-contain"
                        />
                    </div>
                    <h4 className="font-black text-lg mb-2">{tech.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">{tech.desc}</p>
                </Card>
            ))}
        </div>
      </motion.section>

      {/* Contact Section */}
      <section className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-8 pt-6">
            <div className="space-y-4">
                <h2 className="text-4xl font-headline font-black leading-tight">Terhubung <br/> Dengan <span className="text-primary underline decoration-primary/20">Komunitas</span></h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Punya ide fitur menarik, menemukan kendala, atau hanya ingin menyapa? Kami selalu terbuka untuk diskusi hangat.
                </p>
            </div>

            <div className="space-y-6">
                <a href="mailto:gunturfadilah140@gmail.com" className="flex items-center gap-4 group p-4 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5">
                    <div className="bg-primary/10 p-3 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Email</p>
                        <p className="font-bold truncate text-sm">gunturfadilah140@gmail.com</p>
                    </div>
                </a>
                
                <a href="https://wa.me/6285655548656" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 group p-4 rounded-2xl transition-all hover:bg-white hover:shadow-xl hover:shadow-primary/5">
                    <div className="bg-green-500/10 p-3 rounded-xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                        <Phone className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">WhatsApp</p>
                        <p className="font-bold truncate text-sm">0856 5554 8656</p>
                    </div>
                </a>

                <div className="pt-6">
                    <Card className="bg-primary/5 border-primary/10 p-8 rounded-[2rem] text-center space-y-4">
                        <h4 className="font-black text-lg">Bawa Elitera di Genggaman</h4>
                        <p className="text-sm text-muted-foreground">Unduh aplikasi Android yang dibangun dengan <strong>Expo Native</strong> untuk pengalaman yang lebih cepat dan notifikasi instan.</p>
                        <Button className="w-full rounded-xl font-bold shadow-lg shadow-primary/20">
                            Unduh Elitera.apk <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Card>
                </div>
            </div>
        </div>

        <div className="lg:col-span-7">
            <Card className="rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
                <CardHeader className="p-8 border-b bg-muted/20">
                    <CardTitle className="text-2xl font-headline font-black flex items-center gap-3">
                        <Send className="h-6 w-6 text-primary" /> Kirim Umpan Balik
                    </CardTitle>
                    <CardDescription className="text-sm font-medium">Masukan Anda membantu Elitera menjadi lebih baik setiap harinya.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form className="space-y-6" action="https://wa.me/6285655548656" target="_blank">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-bold text-xs uppercase tracking-widest ml-1">Nama Anda</Label>
                                <Input id="name" name="name" placeholder="Siapa nama Anda?" className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest ml-1">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="anda@contoh.com" className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback" className="font-bold text-xs uppercase tracking-widest ml-1">Pesan atau Saran</Label>
                            <Textarea id="feedback" name="text" placeholder="Bagikan pemikiran Anda dengan kami..." rows={6} className="rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 resize-none py-4" required />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 transition-all active:scale-95 group">
                            Kirim ke WhatsApp <Send className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
}
