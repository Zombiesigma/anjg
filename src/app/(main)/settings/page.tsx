'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  username: z.string().min(3, { message: "Nama pengguna minimal 3 karakter." }).regex(/^[a-zA-Z0-9_]+$/, 'Hanya boleh berisi huruf, angka, dan garis bawah.'),
  displayName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  bio: z.string().max(160, { message: "Bio tidak boleh lebih dari 160 karakter." }).optional(),
});

export default function SettingsPage() {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const userProfileRef = (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      displayName: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        username: userProfile.username,
        displayName: userProfile.displayName,
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile, form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userProfileRef) return;
    setIsSaving(true);
    try {
      await updateDoc(userProfileRef, {
        username: values.username,
        displayName: values.displayName,
        bio: values.bio,
      });
      toast({
        title: "Profil Diperbarui",
        description: "Perubahan profil Anda telah disimpan.",
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat memperbarui profil Anda.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = isUserLoading || isProfileLoading;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
       <div>
        <h1 className="text-3xl font-headline font-bold">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola akun dan preferensi tampilan Anda.</p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Beginilah cara orang lain akan melihat Anda di situs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nama Pengguna</Label>
                        <FormControl>
                          <Input placeholder="@guntur" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nama Lengkap</Label>
                        <FormControl>
                          <Input placeholder="Guntur Padilah" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Bio</Label>
                        <FormControl>
                          <Textarea placeholder="Pengembang Aplikasi Litera." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSaving || isLoading}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Sesuaikan tampilan aplikasi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
              <span>Tema</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Pilih tema pilihan Anda.
              </span>
            </Label>
            <Select defaultValue="system">
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tema" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="light">Terang</SelectItem>
                    <SelectItem value="dark">Gelap</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                </SelectContent>
            </Select>
          </div>
           <div className="flex items-center justify-between">
            <Label htmlFor="dense-mode" className="flex flex-col space-y-1">
              <span>Tampilan Ringkas</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Tampilkan konten secara lebih ringkas.
              </span>
            </Label>
            <Switch id="dense-mode" />
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button>Simpan Preferensi</Button>
        </CardFooter>
      </Card>

    </div>
  );
}
