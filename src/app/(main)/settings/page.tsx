'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { User } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';

const profileFormSchema = z.object({
  username: z.string().min(3, { message: "Nama pengguna minimal 3 karakter." }).regex(/^[a-zA-Z0-9_]+$/, 'Hanya boleh berisi huruf, angka, dan garis bawah.'),
  displayName: z.string().min(3, { message: "Nama lengkap minimal 3 karakter." }),
  photoURL: z.string().url({ message: "URL foto profil tidak valid." }).optional().or(z.literal('')),
  bio: z.string().max(160, { message: "Bio tidak boleh lebih dari 160 karakter." }).optional(),
});

const notificationFormSchema = z.object({
  onNewFollower: z.boolean().default(true),
  onBookComment: z.boolean().default(true),
  onBookFavorite: z.boolean().default(true),
  onStoryComment: z.boolean().default(true),
});


export default function SettingsPage() {
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [theme, setTheme] = useState('system');

  const userProfileRef = (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      displayName: '',
      photoURL: '',
      bio: '',
    },
  });

  const notificationForm = useForm<z.infer<typeof notificationFormSchema>>({
    resolver: zodResolver(notificationFormSchema),
  });

  useEffect(() => {
    const localTheme = localStorage.getItem('theme') || 'system';
    handleThemeChange(localTheme, false);
  }, []);
  
  const handleThemeChange = (value: string, showToast = true) => {
    setTheme(value);
    localStorage.setItem('theme', value);
    if (value === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (value === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', systemIsDark);
    }
    if (showToast) {
        toast({ title: "Tema diubah", description: `Tema telah diatur ke ${value}.`});
    }
  };

  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        username: userProfile.username,
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL || '',
        bio: userProfile.bio || '',
      });
      notificationForm.reset({
        onNewFollower: userProfile.notificationPreferences?.onNewFollower ?? true,
        onBookComment: userProfile.notificationPreferences?.onBookComment ?? true,
        onBookFavorite: userProfile.notificationPreferences?.onBookFavorite ?? true,
        onStoryComment: userProfile.notificationPreferences?.onStoryComment ?? true,
      });
    }
  }, [userProfile, profileForm, notificationForm]);

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userProfileRef || !currentUser) return;
    setIsSavingProfile(true);
    try {
      await updateProfile(currentUser, {
        displayName: values.displayName,
        photoURL: values.photoURL,
      });
      await updateDoc(userProfileRef, {
        username: values.username,
        displayName: values.displayName,
        bio: values.bio,
        photoURL: values.photoURL,
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
        description: "Nama pengguna tersebut mungkin sudah digunakan atau URL tidak valid.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function onNotificationSubmit(values: z.infer<typeof notificationFormSchema>) {
    if (!userProfileRef) return;
    setIsSavingNotifications(true);
    try {
        await updateDoc(userProfileRef, { notificationPreferences: values });
        toast({ title: "Preferensi Notifikasi Diperbarui" });
    } catch (error) {
        console.error("Error updating notification preferences: ", error);
        toast({ variant: "destructive", title: "Gagal Menyimpan Preferensi" });
    } finally {
        setIsSavingNotifications(false);
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
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>Beginilah cara orang lain akan melihat Anda di situs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-20 w-full" /></div>
                </div>
              ) : (
                <>
                  <FormField control={profileForm.control} name="username" render={({ field }) => (
                      <FormItem>
                        <Label>Nama Pengguna</Label>
                        <FormControl><Input placeholder="@guntur" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                      <FormItem>
                        <Label>Nama Lengkap</Label>
                        <FormControl><Input placeholder="Guntur Padilah" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="photoURL" render={({ field }) => (
                      <FormItem>
                        <Label>URL Foto Profil</Label>
                        <FormControl><Input placeholder="https://contoh.com/gambar.jpg" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <Label>Bio</Label>
                        <FormControl><Textarea placeholder="Pengembang Aplikasi Litera." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSavingProfile || isLoading}>
                {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Perubahan Profil
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Sesuaikan tampilan aplikasi. Perubahan diterapkan secara instan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
              <span>Tema</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Pilih tema terang, gelap, atau bawaan sistem.
              </span>
            </Label>
            <Select value={theme} onValueChange={handleThemeChange}>
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
        </CardContent>
      </Card>

      <Card>
        <Form {...notificationForm}>
          <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
            <CardHeader>
              <CardTitle>Notifikasi</CardTitle>
              <CardDescription>Pilih notifikasi yang ingin Anda terima.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {isLoading ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between"><div className='space-y-1'><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div><Skeleton className="h-6 w-11" /></div>
                        <div className="flex items-center justify-between"><div className='space-y-1'><Skeleton className="h-5 w-32"/><Skeleton className="h-4 w-64"/></div><Skeleton className="h-6 w-11" /></div>
                    </div>
                ) : (
                    <>
                        <FormField control={notificationForm.control} name="onNewFollower" render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel>Pengikut Baru</FormLabel>
                                    <p className="text-sm text-muted-foreground">Saat seseorang mulai mengikuti Anda.</p>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="onBookComment" render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel>Komentar Buku</FormLabel>
                                    <p className="text-sm text-muted-foreground">Saat seseorang mengomentari buku Anda.</p>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="onBookFavorite" render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel>Favorit Baru</FormLabel>
                                    <p className="text-sm text-muted-foreground">Saat seseorang memfavoritkan buku Anda.</p>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                        <FormField control={notificationForm.control} name="onStoryComment" render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <FormLabel>Komentar Cerita</FormLabel>
                                    <p className="text-sm text-muted-foreground">Saat seseorang mengomentari cerita Anda.</p>
                                </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )}/>
                    </>
                )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSavingNotifications || isLoading}>
                {isSavingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan Preferensi Notifikasi
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
