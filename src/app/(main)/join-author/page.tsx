'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, serverTimestamp, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { BookUser, Loader2, Send, Info, Users, UserCheck } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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

    const pendingRequestQuery = useMemo(() => (
        (firestore && user) 
        ? query(collection(firestore, 'authorRequests'), where('userId', '==', user.uid), where('status', '==', 'pending')) 
        : null
    ), [firestore, user]);
    const { data: pendingRequests, isLoading: isRequestsLoading } = useCollection<AuthorRequest>(pendingRequestQuery);
    
    // Fetch authors only when the current user is an author or admin
    const authorsQuery = useMemo(() => {
        if (!firestore || applicationStatus !== 'author') return null;
        return query(collection(firestore, 'users'), where('role', '==', 'penulis'), where('displayName', 'asc'));
    }, [firestore, applicationStatus]);
    const { data: authors, isLoading: areAuthorsLoading } = useCollection<AppUser>(authorsQuery);

    useEffect(() => {
      if (isUserLoading || isProfileLoading || isRequestsLoading) {
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
          } else if (pendingRequests && pendingRequests.length > 0) {
              setApplicationStatus('pending');
          } else {
              setApplicationStatus('not_applied');
          }
      } else if (!isUserLoading) {
          setApplicationStatus('not_applied');
      }
    }, [user, isUserLoading, userProfile, isProfileLoading, pendingRequests, isRequestsLoading, form]);


    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        try {
            const batch = writeBatch(firestore);

            const requestRef = doc(collection(firestore, 'authorRequests'));
            const requestData = {
                ...values,
                userId: user.uid,
                status: 'pending' as const,
                requestedAt: serverTimestamp(),
            };
            batch.set(requestRef, requestData);

            // Find all admins and create notifications
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
             <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <Skeleton className="h-14 w-14 rounded-full mx-auto" />
                        <Skeleton className="h-8 w-48 mx-auto mt-4" />
                        <Skeleton className="h-4 w-80 mx-auto mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                </Card>
            </div>
        )
    }

    if (applicationStatus === 'author') {
         return (
            <div className="space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-headline font-bold text-primary">Temui Para Penulis Kami</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Jelajahi profil para penulis berbakat yang membentuk komunitas Litera.</p>
                </div>
                {areAuthorsLoading ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({length: 6}).map((_, i) => (
                             <Card key={i}>
                                <CardContent className="p-6 text-center flex flex-col items-center">
                                    <Skeleton className="w-24 h-24 rounded-full mb-4"/>
                                    <Skeleton className="h-6 w-3/4 mb-1"/>
                                    <Skeleton className="h-4 w-1/2"/>
                                    <Skeleton className="h-4 w-full mt-4"/>
                                    <Skeleton className="h-4 w-5/6 mt-1"/>
                                </CardContent>
                                <CardFooter className="flex justify-around bg-muted/50 p-4">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-8 w-16" />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {authors?.map(author => (
                            <Link href={`/profile/${author.username}`} key={author.id}>
                                <Card className="hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                                    <CardContent className="p-6 text-center flex flex-col items-center flex-grow">
                                        <Avatar className="w-24 h-24 mb-4 border-4 border-primary/20">
                                            <AvatarImage src={author.photoURL} alt={author.displayName} />
                                            <AvatarFallback>{author.displayName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <h3 className="font-headline text-xl font-bold">{author.displayName}</h3>
                                        <p className="text-sm text-muted-foreground">@{author.username}</p>
                                        <p className="mt-4 text-sm text-muted-foreground text-center flex-grow">{author.bio}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-around bg-muted/50 p-4 mt-auto">
                                        <div className="text-center flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground"/>
                                            <div>
                                                <p className="font-bold">{new Intl.NumberFormat('id-ID').format(author.followers)}</p>
                                                <p className="text-xs text-muted-foreground -mt-1">Pengikut</p>
                                            </div>
                                        </div>
                                        <div className="text-center flex items-center gap-2">
                                            <UserCheck className="h-4 w-4 text-muted-foreground"/>
                                            <div>
                                                <p className="font-bold">{new Intl.NumberFormat('id-ID').format(author.following)}</p>
                                                <p className="text-xs text-muted-foreground -mt-1">Mengikuti</p>
                                            </div>
                                        </div>
                                    </CardFooter>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        )
    }

     if (applicationStatus === 'pending') {
        return (
            <div className="max-w-2xl mx-auto">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4">
                            <Info className="h-8 w-8 text-accent-foreground" />
                        </div>
                        <CardTitle className="font-headline text-2xl">Lamaran Sedang Ditinjau</CardTitle>
                        <CardDescription>
                            Anda sudah mengirimkan lamaran. Terima kasih atas kesabaran Anda saat kami meninjaunya.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                        <BookUser className="h-8 w-8 text-primary" />
                    </div>
                <CardTitle className="text-3xl font-headline mt-4">Menjadi Penulis</CardTitle>
                <CardDescription>
                    Bagikan cerita Anda kepada dunia. Isi formulir di bawah ini untuk mendaftar.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nama Lengkap</FormLabel>
                                <FormControl>
                                    <Input placeholder="cth., Guntur Padilah" {...field} />
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
                                <FormLabel>Alamat Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="anda@contoh.com" {...field} readOnly />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="portfolio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Portofolio/Situs Web (Opsional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://portofolio-anda.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="motivation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Mengapa Anda ingin menjadi penulis di Litera?</FormLabel>
                                <FormControl>
                                <Textarea id="motivation" placeholder="Ceritakan tentang hasrat menulis Anda dan apa yang Anda rencanakan untuk diterbitkan..." rows={5} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
                <CardFooter>
                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    <Send className="mr-2 h-4 w-4"/> Kirim Lamaran
                </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  )
}
