'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
import { BookUser, Loader2, Send, Info } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';

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
    const [applicationStatus, setApplicationStatus] = useState<'not_applied' | 'pending' | 'author'>('not_applied');
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            portfolio: "",
            motivation: "",
        },
    });

    useEffect(() => {
        if (user && firestore) {
            // Pre-fill form
            form.reset({
                name: user.displayName || '',
                email: user.email || '',
                portfolio: '',
                motivation: '',
            });

            // Check application status
            const checkStatus = async () => {
                const userDocRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().role === 'penulis') {
                    setApplicationStatus('author');
                    setIsLoadingStatus(false);
                    return;
                }

                const requestsRef = collection(firestore, 'authorRequests');
                const q = query(requestsRef, where('userId', '==', user.uid), where('status', '==', 'pending'));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setApplicationStatus('pending');
                }
                setIsLoadingStatus(false);
            };

            checkStatus();
        } else if (!isUserLoading) {
            setIsLoadingStatus(false);
        }
    }, [user, firestore, form, isUserLoading]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!firestore || !user) return;
        setIsSubmitting(true);
        try {
            const requestData = {
                ...values,
                userId: user.uid,
                status: 'pending' as const,
                requestedAt: serverTimestamp(),
            };
            await addDoc(collection(firestore, 'authorRequests'), requestData);
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
    
    if (isUserLoading || isLoadingStatus) {
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
            <div className="max-w-2xl mx-auto">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                            <BookUser className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="font-headline text-2xl">Anda Sudah Menjadi Penulis</CardTitle>
                        <CardDescription>
                            Anda sudah menjadi bagian dari tim penulis kami. Mulailah menulis cerita Anda!
                        </CardDescription>
                    </CardHeader>
                </Card>
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
