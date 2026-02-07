'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, User as UserIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from '@/components/ui/skeleton';
import { uploadFile } from '@/lib/uploader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File Terlalu Besar',
        description: 'Maksimal ukuran foto adalah 2MB.',
      });
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      profileForm.setValue('photoURL', url);
      toast({
        title: "Foto Berhasil Diunggah",
        description: "Klik simpan untuk menerapkan perubahan profil Anda.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Upload Gagal",
        description: "Gagal mengunggah foto. Silakan coba lagi.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  async function onProfileSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!userProfileRef || !currentUser || !firestore) return;
    setIsSavingProfile(true);
    try {
      // 1. Perbarui profil di Firebase Auth
      await updateProfile(currentUser, {
        displayName: values.displayName,
        photoURL: values.photoURL,
      });

      // 2. Siapkan batch untuk sinkronisasi data
      const batch = writeBatch(firestore);

      // 3. Perbarui dokumen profil utama
      batch.update(userProfileRef, {
        username: values.username,
        displayName: values.displayName,
        bio: values.bio,
        photoURL: values.photoURL,
      });

      // 4. Sinkronisasi ke Buku yang ditulis pengguna
      const booksQuery = query(collection(firestore, 'books'), where('authorId', '==', currentUser.uid));
      const booksSnap = await getDocs(booksQuery);
      booksSnap.forEach((bookDoc) => {
        batch.update(bookDoc.ref, {
          authorName: values.displayName,
          authorAvatarUrl: values.photoURL,
        });
      });

      // 5. Sinkronisasi ke Story yang aktif
      const storiesQuery = query(collection(firestore, 'stories'), where('authorId', '==', currentUser.uid));
      const storiesSnap = await getDocs(storiesQuery);
      storiesSnap.forEach((storyDoc) => {
        batch.update(storyDoc.ref, {
          authorName: values.displayName,
          authorAvatarUrl: values.photoURL,
        });
      });

      // 6. Sinkronisasi ke Pesan/Obrolan
      const chatsQuery = query(collection(firestore, 'chats'), where('participantUids', 'array-contains', currentUser.uid));
      const chatsSnap = await getDocs(chatsQuery);
      chatsSnap.forEach((chatDoc) => {
        const chatData = chatDoc.data();
        const updatedParticipants = chatData.participants.map((p: any) => {
          if (p.uid === currentUser.uid) {
            return { 
              ...p, 
              displayName: values.displayName, 
              photoURL: values.photoURL, 
              username: values.username 
            };
          }
          return p;
        });
        batch.update(chatDoc.ref, { participants: updatedParticipants });
      });

      // 7. Eksekusi semua pembaruan secara atomik
      await batch.commit();

      toast({
        title: "Profil Diperbarui",
        description: "Perubahan Anda telah disinkronkan ke semua karya dan pesan Anda.",
      });
    } catch (error) {
      console.error("Error updating profile: ", error);
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyinkronkan data profil Anda.",
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
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-20 w-full" /></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-24 w-24 border-2 border-muted">
                      <AvatarImage src={profileForm.watch('photoURL')} />
                      <AvatarFallback><UserIcon className="h-12 w-12 text-muted-foreground" /></AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Unggah Foto Baru
                      </Button>
                      <p className="text-xs text-muted-foreground">Format JPG, PNG atau WebP. Maks 2MB.</p>
                      <input 
                        id="photo-upload" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </div>
                  </div>

                  <FormField control={profileForm.control} name="username" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Pengguna</FormLabel>
                        <FormControl><Input placeholder="@guntur" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl><Input placeholder="Guntur Padilah" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="photoURL" render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Foto Profil</FormLabel>
                        <FormControl><Input placeholder="https://contoh.com/gambar.jpg" {...field} /></FormControl>
                        <FormDescription>Anda dapat memasukkan URL langsung atau mengunggah file di atas.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={profileForm.control} name="bio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl><Textarea placeholder="Pengembang Aplikasi Elitera." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSavingProfile || isLoading || isUploading}>
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
