'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc, useCollection } from '@/firebase';
import { collection, serverTimestamp, doc, writeBatch, getDocs, query, where, orderBy } from 'firebase/firestore';
import type { AuthorRequest, User as AppUser, Book } from '@/lib/types';
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
import { BookUser, Loader2, Send, Info, Users, BookOpen, Star, Sparkles, ChevronRight, PenTool, CheckCircle2 } from "lucide-react";
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
        firestore ? query(collection(firestore, 'users'), orderBy('displayName', 'asc')) : null
    ), [firestore]);
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
            <div className="space-y-16 pb-20">
                {/* Hero Section */}
                <div className="text-center space-y-6 max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Sparkles className="h-3.5 w-3.5" /> Komunitas Elitera
                        </div>
                        <h1 className="text-4xl md:text-6xl font-headline font-black text-foreground tracking-tight leading-tight">
                            Temui Para <span className="text-primary italic">Pujangga</span> Modern
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground leading-relaxed font-medium">
                            Jelajahi profil para penulis berbakat yang membentuk semesta literasi digital kami. Ikuti mereka untuk mendapatkan pembaruan karya terbaru.
                        </p>
                    </motion.div>
                </div>

                {areUsersLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({length: 6}).map((_, i) => (
                             <Card key={i} className="overflow-hidden rounded-[2.5rem] border-none shadow-xl">
                                <Skeleton className="h-24 w-full bg-muted" />
                                <div className="p-8 pt-0 -mt-12 text-center flex flex-col items-center">
                                    <Skeleton className="w-28 h-28 rounded-full border-4 border-background mb-4 shadow-xl"/>
                                    <Skeleton className="h-6 w-3/4 mb-2 rounded-full"/>
                                    <Skeleton className="h-4 w-1/2 rounded-full"/>
                                    <Skeleton className="h-20 w-full mt-8 rounded-2xl"/>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {authors?.map((author, index) => (
                            <motion.div
                                key={author.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Link href={`/profile/${author.username}`} className="block group h-full">
                                    <Card className="relative overflow-hidden rounded-[2.5rem] border-2 border-transparent transition-all duration-500 h-full group-hover:border-primary/30 group-hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent group-hover:h-36 transition-all duration-500" />
                                        
                                        <CardContent className="relative z-10 p-8 text-center flex flex-col items-center h-full">
                                            <div className="relative mb-6">
                                                <Avatar className="w-28 h-28 md:w-32 md:h-32 border-4 border-background shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ring-1 ring-border/50">
                                                    <AvatarImage src={author.photoURL} alt={author.displayName} className="object-cover" />
                                                    <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                                                        {author.displayName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {(author.role === 'admin' || author.role === 'penulis') && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full shadow-lg ring-4 ring-background">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-headline text-2xl font-black text-foreground group-hover:text-primary transition-colors duration-300">{author.displayName}</h3>
                                                <p className="text-[10px] font-black text-muted-foreground tracking-[0.2em] uppercase">@{author.username}</p>
                                            </div>
                                            
                                            <div className="my-6 w-12 h-1 bg-primary/10 rounded-full group-hover:w-24 transition-all duration-500" />

                                            <p className="text-sm text-muted-foreground/80 leading-relaxed italic line-clamp-3 mb-8 px-2 font-medium">
                                                {author.bio || `Pujangga inspiratif di komunitas Elitera yang berbagi cerita lewat kata.`}
                                            </p>
                                            
                                            <div className="mt-auto pt-6 border-t border-border/50 grid grid-cols-2 gap-8 w-full">
                                                <div className="text-center space-y-1">
                                                    <p className="font-black text-xl text-primary">{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(author.followers)}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-tighter text-muted-foreground opacity-60">
                                                        <Users className="h-2.5 w-2.5" /> Pengikut
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-1">
                                                    <p className="font-black text-xl text-accent">{author.following}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-tighter text-muted-foreground opacity-60">
                                                        <BookOpen className="h-2.5 w-2.5" /> Mengikuti
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        
                                        <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <ChevronRight className="h-6 w-6 text-primary/40" />
                                        </div>
                                    </Card>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>
        )
    }

     if (applicationStatus === 'pending') {
        return (
            <div className="max-w-2xl mx-auto py-20">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Card className="text-center rounded-[3rem] border-none shadow-2xl p-10 bg-card/50 backdrop-blur-md overflow-hidden relative">
                        {/* Decorative background element */}
                        <div className="absolute top-[-10%] right-[-10%] p-10 opacity-5 pointer-events-none">
                            <PenTool className="h-64 w-64 rotate-12 text-primary" />
                        </div>
                        
                        <CardHeader className="relative z-10">
                            <div className="mx-auto bg-accent/10 p-6 rounded-full w-fit mb-8 animate-pulse shadow-[0_0_40px_rgba(var(--accent),0.2)]">
                                <Info className="h-12 w-12 text-accent" />
                            </div>
                            <CardTitle className="font-headline text-4xl font-black mb-4 leading-tight">Lamaran Anda Sedang <span className="text-accent italic">Ditinjau</span></CardTitle>
                            <CardDescription className="text-lg leading-relaxed text-muted-foreground font-medium max-w-md mx-auto">
                                Terima kasih atas antusiasme Anda! Tim kurasi kami sedang meninjau profil dan motivasi Anda. Kami akan segera menghubungi Anda melalui notifikasi aplikasi.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center relative z-10 mt-8">
                            <Button asChild variant="outline" className="rounded-full px-10 h-14 font-black border-2 transition-all hover:bg-muted/50 active:scale-95">
                                <Link href="/">Kembali Menjelajah</Link>
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
