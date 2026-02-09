
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { AuthorRequest, User as AppUser } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { BookUser, Loader2, Send, Info, Users, BookOpen, Star, Sparkles, ChevronRight, PenTool, CheckCircle2, Clock, ShieldCheck, ClipboardCheck, ArrowRight } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  email: z.string().email({ message: "Email tidak valid." }),
  portfolio: z.string().url({ message: "URL portofolio tidak valid." }).optional().or(z.literal('')),
  motivation: z.string().min(20, { message: "Motivasi minimal 20 karakter." }),
});

export default function JoinAuthorPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [applicationStatus, setApplicationStatus] = useState<'loading' | 'not_applied' | 'pending' | 'author'>('loading');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            portfolio: "",
            motivation: "",
        },
    });

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<AppUser>(
      (firestore && user) ? doc(firestore, 'users', user.uid) : null
    );

    const authorRequestsQuery = useMemo(() => (
      (firestore && user) ? query(collection(firestore, 'authorRequests'), where('userId', '==', user.uid)) : null
    ), [firestore, user]);
    const { data: pendingRequests, isLoading: areRequestsLoading } = useCollection<AuthorRequest>(authorRequestsQuery);
    
    const usersQuery = useMemo(() => (
        (firestore && user) ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null
    ), [firestore, user]);
    const { data: allUsers, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);
    
    const authors = useMemo(() => (
      allUsers?.filter(u => u.role === 'penulis' || u.role === 'admin')
    ), [allUsers]);

    useEffect(() => {
      if (isUserLoading || isProfileLoading || areRequestsLoading) {
          setApplicationStatus('loading');
          return;
      }

      if (user && userProfile) {
          form.reset({
              name: user.displayName || '',
              email: user.email || '',
          });

          if (userProfile.role === 'penulis' || userProfile.role === 'admin') {
              setApplicationStatus('author');
          } else if (pendingRequests && pendingRequests.find(r => r.status === 'pending')) {
              setApplicationStatus('pending');
          } else {
              setApplicationStatus('not_applied');
          }
      } else if (!isUserLoading) {
          setApplicationStatus('not_applied');
      }
    }, [user, isUserLoading, userProfile, isProfileLoading, pendingRequests, areRequestsLoading, form]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);

            const requestRef = doc(collection(firestore, 'authorRequests'));
            const requestData = {
                ...values,
                portfolio: values.portfolio || '',
                userId: user.uid,
                status: 'pending' as const,
                requestedAt: serverTimestamp(),
            };
            batch.set(requestRef, requestData);

            const adminsQuery = query(collection(firestore, 'users'), where('role', '==', 'admin'));
            const adminSnapshot = await getDocs(adminsQuery);

            if (!adminSnapshot.empty) {
                const notificationData = {
                    type: 'author_request' as const,
                    text: `${values.name} telah meminta untuk menjadi penulis.`,
                    link: `/admin`,
                    actor: {
                        uid: user.uid,
                        displayName: user.displayName!,
                        photoURL: user.photoURL!,
                    },
                    read: false,
                    createdAt: serverTimestamp(),
                };
                
                adminSnapshot.forEach(adminDoc => {
                    const adminId = adminDoc.id;
                    const notificationRef = doc(collection(firestore, `users/${adminId}/notifications`));
                    batch.set(notificationRef, notificationData);
                });
            }
            
            await batch.commit();

            toast({
                variant: 'success',
                title: "Lamaran Terkirim",
                description: "Terima kasih! Kami akan meninjau lamaran Anda segera.",
            });
            setApplicationStatus('pending');
        } catch (error) {
            console.error("Error submitting application:", error);
            toast({
                variant: "destructive",
                title: "Gagal Mengirim Lamaran",
                description: "Terjadi kesalahan. Silakan coba lagi.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (applicationStatus === 'loading') {
        return (
             <div className="max-w-4xl mx-auto space-y-8 py-12">
                <div className="text-center space-y-4">
                    <Skeleton className="h-12 w-64 mx-auto rounded-full" />
                    <Skeleton className="h-4 w-96 mx-auto rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-80 flex flex-col items-center justify-center space-y-6 rounded-[2.5rem] border-none shadow-xl">
                            <Skeleton className="h-24 w-24 rounded-full" />
                            <div className="space-y-2 w-full px-10">
                                <Skeleton className="h-4 w-full rounded-full" />
                                <Skeleton className="h-3 w-2/3 mx-auto rounded-full" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    if (applicationStatus === 'author') {
         return (
            <div className="space-y-16 pb-20 relative">
                {/* Background Decorations */}
                <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-40 right-[-50px] w-80 h-80 bg-accent/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto pt-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.25em] mb-6">
                            <Sparkles className="h-3.5 w-3.5" /> Jajaran Pujangga Elitera
                        </div>
                        <h1 className="text-4xl md:text-6xl font-headline font-black text-foreground tracking-tight leading-tight">
                            Temui Para <span className="text-primary italic underline decoration-primary/20">Pujangga</span> Modern
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground leading-relaxed font-medium italic">
                            "Mereka adalah arsitek imajinasi yang membangun dunia lewat kata-kata. Jelajahi, ikuti, dan biarkan inspirasi mereka mengalir ke dalam harimu."
                        </p>
                    </motion.div>
                </div>

                {areUsersLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        {Array.from({length: 6}).map((_, i) => (
                             <Card key={i} className="overflow-hidden rounded-[2.5rem] border-none shadow-xl bg-card/50">
                                <Skeleton className="h-32 w-full bg-muted/50" />
                                <div className="p-8 pt-0 -mt-16 text-center flex flex-col items-center">
                                    <Skeleton className="w-32 h-32 rounded-full border-4 border-background mb-4 shadow-2xl"/>
                                    <Skeleton className="h-6 w-3/4 mb-2 rounded-full"/>
                                    <Skeleton className="h-4 w-1/2 rounded-full"/>
                                    <div className="grid grid-cols-2 gap-4 w-full mt-10">
                                        <Skeleton className="h-12 rounded-2xl"/>
                                        <Skeleton className="h-12 rounded-2xl"/>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                            show: { transition: { staggerChildren: 0.1 } }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-2"
                    >
                        {authors?.map((author) => (
                            <motion.div
                                key={author.id}
                                variants={{
                                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                                    show: { opacity: 1, y: 0, scale: 1 }
                                }}
                            >
                                <Link href={`/profile/${author.username}`} className="block group h-full">
                                    <Card className={cn(
                                        "relative overflow-hidden rounded-[3rem] border-none transition-all duration-500 h-full shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] group-hover:-translate-y-2 bg-card/50 backdrop-blur-xl border border-white/10",
                                        author.uid === user?.uid && "ring-2 ring-primary/20"
                                    )}>
                                        {/* Dynamic Header Gradient */}
                                        <div className="absolute top-0 left-0 w-full h-36 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent group-hover:h-44 transition-all duration-700" />
                                        
                                        <CardContent className="relative z-10 p-8 pt-12 text-center flex flex-col items-center h-full">
                                            <div className="relative mb-8">
                                                {/* Animated Circle Background */}
                                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                                
                                                <Avatar className="w-32 h-32 md:w-36 md:h-36 border-4 border-background shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 ring-1 ring-border/50">
                                                    <AvatarImage src={author.photoURL} alt={author.displayName} className="object-cover" />
                                                    <AvatarFallback className="text-4xl font-black bg-primary/5 text-primary italic">
                                                        {author.displayName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                
                                                {/* Official Badge with Glow */}
                                                <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2.5 rounded-full shadow-xl ring-4 ring-background z-20">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                </div>
                                                
                                                {author.status === 'online' && (
                                                    <span className="absolute top-2 right-2 block h-5 w-5 rounded-full bg-green-500 border-4 border-background shadow-lg z-20 animate-pulse" />
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="font-headline text-3xl font-black text-foreground group-hover:text-primary transition-colors duration-300 tracking-tight">{author.displayName}</h3>
                                                <div className="flex items-center justify-center gap-2">
                                                    <p className="text-[10px] font-black text-muted-foreground/60 tracking-[0.2em] uppercase">@{author.username}</p>
                                                    {author.uid === user?.uid && (
                                                        <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Anda</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="my-8 w-16 h-1 bg-primary/10 rounded-full group-hover:w-32 transition-all duration-700 ease-out" />

                                            <p className="text-base text-muted-foreground/80 leading-relaxed italic line-clamp-3 mb-10 px-4 font-medium min-h-[4.5rem]">
                                                {author.bio || `Seorang penjelajah kata di Elitera yang percaya bahwa setiap cerita memiliki keajaibannya sendiri.`}
                                            </p>
                                            
                                            <div className="mt-auto pt-8 border-t border-border/50 grid grid-cols-2 gap-10 w-full relative">
                                                <div className="text-center space-y-1 group/stat">
                                                    <p className="font-black text-2xl text-primary tracking-tighter transition-transform group-hover/stat:scale-110">{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(author.followers)}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-50">
                                                        <Users className="h-3 w-3" /> Pengikut
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-1 group/stat">
                                                    <p className="font-black text-2xl text-accent tracking-tighter transition-transform group-hover/stat:scale-110">{author.following}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-muted-foreground opacity-50">
                                                        <BookOpen className="h-3 w-3" /> Mengikuti
                                                    </div>
                                                </div>
                                                
                                                {/* Separator Line */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-px bg-border/50 mt-4" />
                                            </div>
                                        </CardContent>
                                        
                                        {/* Bottom Action Hint */}
                                        <div className="absolute bottom-6 right-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Lihat Profil</span>
                                            <ChevronRight className="h-5 w-5 text-primary/40" />
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                
                {/* Join Community CTA */}
                {!isProfileLoading && userProfile?.role === 'pembaca' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-20 pt-16 border-t border-border/50 text-center space-y-8"
                    >
                        <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 max-w-xl mx-auto shadow-inner">
                            <h4 className="text-2xl font-headline font-black mb-3">Siap Menjadi Bagian Dari Mereka?</h4>
                            <p className="text-muted-foreground font-medium text-sm leading-relaxed mb-8">
                                Bergabunglah bersama para pujangga di atas dan mulai bangun duniamu sendiri.
                            </p>
                            <Button 
                                onClick={() => setApplicationStatus('not_applied')}
                                size="lg" 
                                className="rounded-2xl px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            >
                                Mulai Perjalanan Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        )
    }

     if (applicationStatus === 'pending') {
        return (
            <div className="max-w-4xl mx-auto py-12 md:py-20 relative">
                {/* Decorative Background */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

                <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Card className="text-center rounded-[3rem] border-none shadow-[0_40px_100px_-15px_rgba(0,0,0,0.1)] bg-card/50 backdrop-blur-xl overflow-hidden relative border border-white/20">
                        <CardHeader className="pt-16 pb-10 px-10 relative z-10">
                            <div className="mx-auto relative mb-10">
                                <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                <div className="relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl text-accent w-fit mx-auto border border-accent/10">
                                    <Clock className="h-16 w-16 animate-[spin_10s_linear_infinite]" />
                                </div>
                            </div>
                            <CardTitle className="font-headline text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight">
                                Permohonan Sedang <br/> <span className="text-accent italic underline decoration-accent/20">Ditinjau.</span>
                            </CardTitle>
                            <CardDescription className="text-lg md:text-xl leading-relaxed text-muted-foreground font-medium max-w-2xl mx-auto italic">
                                "Sabar adalah kunci dari setiap karya agung. Tim kurasi kami sedang menelaah gairah sastra yang Anda kirimkan."
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-10 pb-16 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-4">
                                {[
                                    { icon: ShieldCheck, label: "Verifikasi Profil", status: "Selesai", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { icon: ClipboardCheck, label: "Kurasi Portofolio", status: "Berlangsung", color: "text-accent", bg: "bg-accent/10", active: true },
                                    { icon: Star, label: "Keputusan Akhir", status: "Menunggu", color: "text-muted-foreground", bg: "bg-muted" },
                                ].map((step, i) => (
                                    <div key={i} className={cn(
                                        "p-6 rounded-3xl border border-border/50 flex flex-col items-center gap-3 transition-all duration-500",
                                        step.active ? "bg-white dark:bg-zinc-800 shadow-xl scale-105 border-accent/20" : "bg-muted/30 opacity-60"
                                    )}>
                                        <div className={cn("p-3 rounded-2xl", step.bg, step.color)}>
                                            <step.icon className="h-6 w-6" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-black text-xs uppercase tracking-widest mb-1">{step.label}</p>
                                            <p className={cn("text-[10px] font-bold uppercase", step.color)}>{step.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 p-6 rounded-3xl bg-primary/5 border border-primary/10 max-w-2xl mx-auto flex items-start gap-4 text-left">
                                <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Kami biasanya membutuhkan waktu <strong>1-3 hari kerja</strong> untuk memberikan keputusan. Anda akan menerima notifikasi instan segera setelah tim kami memberikan persetujuan.
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 relative z-10 px-10 pb-16">
                            <Button asChild size="lg" className="rounded-full px-10 h-14 font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 w-full sm:w-auto">
                                <Link href="/"><BookOpen className="mr-2 h-5 w-5" /> Jelajahi Buku Lain</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="rounded-full px-10 h-14 font-black border-2 transition-all hover:bg-muted/50 w-full sm:w-auto">
                                <Link href="/ai"><Sparkles className="mr-2 h-5 w-5 text-primary" /> Tanya Elitera AI</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        )
    }

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="grid lg:grid-cols-12 gap-16 items-start">
        {/* Left Side: Info */}
        <div className="lg:col-span-5 space-y-10">
            <div className="space-y-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                        <PenTool className="h-3 w-3" /> Karir Penulis
                    </div>
                    <h1 className="text-4xl md:text-5xl font-headline font-black leading-[1.1] tracking-tight text-foreground">
                        Mulai Perjalanan <br/> <span className="text-primary italic underline decoration-primary/20">Sastramu</span> Anda
                    </h1>
                    <p className="mt-6 text-lg text-muted-foreground leading-relaxed font-medium">
                        Bergabunglah dengan komunitas pujangga modern dan mulai bagikan dunia imajinasi Anda kepada pembaca global di Elitera.
                    </p>
                </motion.div>
            </div>

            <div className="space-y-8">
                {[
                    { icon: BookOpen, title: "Publikasi Tanpa Batas", desc: "Unggah karya Anda tanpa biaya sepeser pun dan jangkau audiens yang tepat.", color: "text-blue-500" },
                    { icon: Users, title: "Bangun Komunitas", desc: "Terhubung langsung dengan pembaca setia melalui pesan dan cerita singkat.", color: "text-green-500" },
                    { icon: Star, title: "Reputasi & Verifikasi", desc: "Dapatkan lencana penulis resmi dan tingkatkan otoritas Anda di dunia literasi.", color: "text-orange-500" }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (i * 0.1) }}
                        className="flex gap-5 items-start group"
                    >
                        <div className={cn("p-3.5 rounded-2xl shrink-0 bg-white shadow-xl shadow-primary/5 transition-transform group-hover:scale-110 duration-300", item.color)}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-black text-lg group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
            >
                <Card className="rounded-[3rem] border-none shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] bg-card overflow-hidden">
                    <CardHeader className="bg-primary/5 p-8 md:p-10 border-b border-primary/10">
                        <div className="flex items-center gap-5">
                            <div className="bg-white p-4 rounded-[1.5rem] shadow-xl text-primary">
                                <BookUser className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Formulir Pujangga</CardTitle>
                                <CardDescription className="font-bold uppercase tracking-[0.2em] text-[10px] text-primary/60 mt-1">Lengkapi data diri untuk kurasi</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="p-8 md:p-10 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Nama Lengkap</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Guntur Padilah" {...field} className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 font-bold px-5" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Email Resmi</FormLabel>
                                                <FormControl>
                                                    <Input type="email" {...field} readOnly className="h-14 rounded-2xl bg-muted/50 border-none cursor-not-allowed opacity-70 px-5 font-bold" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="portfolio"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Portofolio / Tautan Karya (Opsional)</FormLabel>
                                            <FormControl>
                                                <div className="relative group">
                                                    <Input placeholder="https://karyasaya.com" {...field} className="h-14 rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 px-5 font-bold" />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-[10px] font-bold text-muted-foreground/60 ml-1 uppercase tracking-tighter">Tautkan tulisan atau blog yang pernah Anda publikasikan.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="motivation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-black text-xs uppercase tracking-widest ml-1">Apa visi Anda bergabung di Elitera?</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Ceritakan gairah menulis Anda dan apa yang ingin Anda capai..." 
                                                    rows={6} 
                                                    {...field} 
                                                    className="rounded-[2rem] bg-muted/30 border-none focus-visible:ring-primary/20 resize-none py-5 px-6 font-medium text-base leading-relaxed"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="p-8 md:p-10 pt-0">
                                <Button type="submit" className="w-full h-16 rounded-[1.5rem] font-black text-base shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group overflow-hidden relative" disabled={isSubmitting}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-3 h-6 w-6 animate-spin"/> Sedang Mengirim...</>
                                    ) : (
                                        <><Send className="mr-3 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"/> Ajukan Lamaran Penulis</>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </motion.div>
        </div>
      </div>
    </div>
  )
}
