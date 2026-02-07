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
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <Skeleton className="h-12 w-64 mx-auto" />
                    <Skeleton className="h-4 w-96 mx-auto" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="h-64 flex flex-col items-center justify-center space-y-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
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
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
                            <Sparkles className="h-3.5 w-3.5" /> Komunitas Elitera
                        </div>
                        <h1 className="text-4xl md:text-6xl font-headline font-black text-foreground tracking-tight">
                            Temui Para <span className="text-primary">Pujangga</span> Modern
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                            Jelajahi profil para penulis berbakat yang membentuk semesta literasi digital kami. Ikuti mereka untuk mendapatkan pembaruan karya terbaru.
                        </p>
                    </motion.div>
                </div>

                {areUsersLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({length: 6}).map((_, i) => (
                             <Card key={i} className="overflow-hidden rounded-3xl border-none shadow-xl">
                                <Skeleton className="h-24 w-full bg-muted" />
                                <div className="p-6 pt-0 -mt-12 text-center flex flex-col items-center">
                                    <Skeleton className="w-24 h-24 rounded-full border-4 border-background mb-4"/>
                                    <Skeleton className="h-6 w-3/4 mb-2"/>
                                    <Skeleton className="h-4 w-1/2"/>
                                    <Skeleton className="h-20 w-full mt-6 rounded-xl"/>
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
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link href={`/profile/${author.username}`} className="block group h-full">
                                    <Card className="relative overflow-hidden rounded-[2.5rem] border-2 border-transparent transition-all duration-500 h-full group-hover:border-primary/30 group-hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] group-hover:-translate-y-2 bg-card/50 backdrop-blur-sm">
                                        {/* Background Decoration */}
                                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent group-hover:h-32 transition-all duration-500" />
                                        
                                        <CardContent className="relative z-10 p-8 text-center flex flex-col items-center h-full">
                                            <div className="relative mb-6">
                                                <Avatar className="w-28 h-28 border-4 border-background shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ring-1 ring-border/50">
                                                    <AvatarImage src={author.photoURL} alt={author.displayName} className="object-cover" />
                                                    <AvatarFallback className="text-3xl font-black bg-primary/5 text-primary">
                                                        {author.displayName.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {author.role === 'admin' && (
                                                    <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg ring-2 ring-background">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="font-headline text-2xl font-black text-foreground group-hover:text-primary transition-colors duration-300">{author.displayName}</h3>
                                                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">@{author.username}</p>
                                            </div>
                                            
                                            <div className="my-6 w-12 h-1 bg-primary/10 rounded-full group-hover:w-20 transition-all duration-500" />

                                            <p className="text-sm text-muted-foreground/80 leading-relaxed italic line-clamp-3 mb-8 px-2">
                                                {author.bio || `Pujangga inspiratif di komunitas Elitera yang berbagi cerita lewat kata.`}
                                            </p>
                                            
                                            <div className="mt-auto pt-6 border-t border-border/50 grid grid-cols-2 gap-8 w-full">
                                                <div className="text-center space-y-1">
                                                    <p className="font-black text-xl text-primary">{new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(author.followers)}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-tighter text-muted-foreground">
                                                        <Users className="h-2.5 w-2.5" /> Pengikut
                                                    </div>
                                                </div>
                                                <div className="text-center space-y-1">
                                                    <p className="font-black text-xl text-accent">{author.following}</p>
                                                    <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-black tracking-tighter text-muted-foreground">
                                                        <BookOpen className="h-2.5 w-2.5" /> Mengikuti
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        
                                        <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-4 group-hover:translate-x-0">
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
                        <div className="absolute top-0 right-0 p-10 opacity-5">
                            <PenTool className="h-64 w-64 rotate-12" />
                        </div>
                        <CardHeader className="relative z-10">
                            <div className="mx-auto bg-accent/10 p-6 rounded-full w-fit mb-8 animate-pulse">
                                <Info className="h-12 w-12 text-accent" />
                            </div>
                            <CardTitle className="font-headline text-4xl font-black mb-4">Lamaran Anda Sedang <span className="text-accent">Ditinjau</span></CardTitle>
                            <CardDescription className="text-lg leading-relaxed text-muted-foreground">
                                Terima kasih atas antusiasme Anda! Tim kurasi kami sedang meninjau portofolio dan motivasi Anda. Kami akan segera menghubungi Anda melalui notifikasi aplikasi.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-center relative z-10 mt-8">
                            <Button asChild variant="outline" className="rounded-full px-10 h-14 font-bold border-2">
                                <Link href="/">Kembali Menjelajah</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        )
    }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Side: Info */}
        <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-headline font-black leading-tight">Mulai Karir <span className="text-primary underline decoration-primary/20">Menulis</span> Anda</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                    Bergabunglah dengan ribuan penulis inspiratif lainnya dan mulai bagikan dunia imajinasi Anda kepada pembaca global di Elitera.
                </p>
            </div>

            <div className="space-y-6">
                {[
                    { icon: BookOpen, title: "Publikasi Gratis", desc: "Unggah karya Anda tanpa biaya sepeser pun." },
                    { icon: Users, title: "Bangun Komunitas", desc: "Terhubung langsung dengan pembaca setia Anda." },
                    { icon: Star, title: "Reputasi Penulis", desc: "Dapatkan lencana penulis dan verifikasi profil." }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-4 items-start"
                    >
                        <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
                            <item.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-base">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-7">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
                    <CardHeader className="bg-primary/5 p-8 border-b border-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-3 rounded-2xl shadow-sm">
                                <BookUser className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Formulir Pujangga</CardTitle>
                                <CardDescription className="font-bold uppercase tracking-widest text-[10px] text-primary/60">Lengkapi data diri Anda</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <CardContent className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Nama Lengkap</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Guntur Padilah" {...field} className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20" />
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
                                                <FormLabel className="font-bold">Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" {...field} readOnly className="h-12 rounded-xl bg-muted/50 border-none cursor-not-allowed opacity-70" />
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
                                            <FormLabel className="font-bold">Portofolio / Blog (Opsional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://karyasaya.com" {...field} className="h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary/20" />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">Tautkan tulisan yang pernah Anda publikasikan sebelumnya.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="motivation"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Mengapa Anda ingin menulis di Elitera?</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Ceritakan gairah menulis Anda..." 
                                                    rows={5} 
                                                    {...field} 
                                                    className="rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20 resize-none py-4"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter className="p-8 pt-0">
                                <Button type="submit" className="w-full h-14 rounded-2xl font-black text-base shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Mengirim...</>
                                    ) : (
                                        <><Send className="mr-2 h-5 w-5"/> Ajukan Lamaran Penulis</>
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
