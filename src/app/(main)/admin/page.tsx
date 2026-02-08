'use client';

import { useMemo, useState, useEffect } from "react";
import { useFirestore, useCollection, useUser, useDoc } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc, where, orderBy, limit, deleteDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  BookUser, 
  BookCopy, 
  Megaphone, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  Flame, 
  Sparkles,
  ChevronRight,
  PenTool,
  Activity,
  ShieldAlert
} from "lucide-react";
import type { AuthorRequest, Book, User as AppUser, Story } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Profile check for Admin role
  const { data: adminProfile, isLoading: isAdminChecking } = useDoc<AppUser>(
    (firestore && currentUser) ? doc(firestore, 'users', currentUser.uid) : null
  );

  const isAdmin = adminProfile?.role === 'admin';

  // Queries - Protected by isAdmin check to prevent early permission errors
  const authorRequestsQuery = useMemo(() => (
    (firestore && isAdmin) ? query(collection(firestore, 'authorRequests'), where('status', '==', 'pending'), orderBy('requestedAt', 'desc')) : null
  ), [firestore, isAdmin]);
  const { data: authorRequests, isLoading: areAuthorRequestsLoading } = useCollection<AuthorRequest>(authorRequestsQuery);
  
  const pendingBooksQuery = useMemo(() => (
    (firestore && isAdmin) ? query(collection(firestore, 'books'), where('status', '==', 'pending_review'), orderBy('createdAt', 'desc')) : null
  ), [firestore, isAdmin]);
  const { data: pendingBooks, isLoading: areBooksLoading } = useCollection<Book>(pendingBooksQuery);
  
  const usersQuery = useMemo(() => (
    (firestore && isAdmin) ? collection(firestore, 'users') : null
  ), [firestore, isAdmin]);
  const { data: users, isLoading: areUsersLoading } = useCollection<AppUser>(usersQuery);

  const storiesQuery = useMemo(() => (
    (firestore && isAdmin) ? query(collection(firestore, 'stories'), orderBy('createdAt', 'desc'), limit(50)) : null
  ), [firestore, isAdmin]);
  const { data: activeStories, isLoading: areStoriesLoading } = useCollection<Story>(storiesQuery);

  const stats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, penulis: 0, pembaca: 0 };
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      penulis: users.filter(u => u.role === 'penulis').length,
      pembaca: users.filter(u => u.role === 'pembaca').length,
    }
  }, [users]);

  // Actions
  const handleApproveAuthor = async (request: AuthorRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);
    try {
      const batch = writeBatch(firestore);
      const requestRef = doc(firestore, 'authorRequests', request.id);
      batch.update(requestRef, { status: 'approved' });
      const userRef = doc(firestore, 'users', request.userId);
      batch.update(userRef, { role: 'penulis' });
      await batch.commit();
      toast({ variant: 'success', title: "Penulis Disetujui", description: `${request.name} sekarang adalah seorang penulis resmi.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menyetujui" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleApproveBook = async (bookId: string, bookTitle: string) => {
    if (!firestore) return;
    setProcessingId(bookId);
    try {
      const bookRef = doc(firestore, 'books', bookId);
      await updateDoc(bookRef, { status: 'published' });
      toast({ variant: 'success', title: "Buku Disetujui", description: `"${bookTitle}" telah diterbitkan.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menyetujui" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!firestore) return;
    setProcessingId(storyId);
    try {
      await deleteDoc(doc(firestore, 'stories', storyId));
      toast({ variant: 'success', title: "Cerita Dihapus", description: "Momen telah dihapus dari platform." });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menghapus" });
    } finally {
      setProcessingId(null);
    }
  };

  if (isAdminChecking) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold uppercase tracking-widest">Verifikasi Otoritas...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="p-6 bg-destructive/10 rounded-full w-fit mx-auto">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-3xl font-headline font-black">Akses Terbatas</h1>
        <p className="text-muted-foreground">Anda tidak memiliki izin untuk mengakses area kontrol pusat.</p>
        <Button asChild rounded-full>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck className="h-3 w-3" /> Dashboard Otoritas Elitera
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tight leading-none">
            Pusat <span className="text-primary italic">Kendali</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Monitoring ekosistem, moderasi karya, dan manajemen pujangga.</p>
        </motion.div>
        
        <div className="flex gap-2">
            <Button variant="outline" className="rounded-full font-bold shadow-sm h-12 px-6" asChild>
                <Link href="/admin/broadcast">
                    <Megaphone className="mr-2 h-4 w-4 text-orange-500" /> Siaran
                </Link>
            </Button>
            <Button className="rounded-full font-bold shadow-lg shadow-primary/20 h-12 px-6" asChild>
                <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" /> Manajemen Anggota
                </Link>
            </Button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Main Stats Card */}
        <Card className="md:col-span-8 border-none shadow-2xl rounded-[2.5rem] bg-indigo-950 text-white overflow-hidden relative group">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <CardHeader className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-headline font-black flex items-center gap-3">
                            <Activity className="h-6 w-6 text-indigo-400" /> Total Anggota Terdaftar
                        </CardTitle>
                        <CardDescription className="text-indigo-200/60 font-medium">Distribusi peran di seluruh platform Elitera.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Live Sync</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Total Jiwa</p>
                        <p className="text-4xl font-black">{areUsersLoading ? '...' : stats.total}</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Pujangga</p>
                        <p className="text-4xl font-black">{areUsersLoading ? '...' : stats.penulis}</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.penulis/stats.total)*100}%` }} className="h-full bg-emerald-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Pembaca</p>
                        <p className="text-4xl font-black">{areUsersLoading ? '...' : stats.pembaca}</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.pembaca/stats.total)*100}%` }} className="h-full bg-blue-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Tim Moderator</p>
                        <p className="text-4xl font-black">{areUsersLoading ? '...' : stats.admins}</p>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.admins/stats.total)*100}%` }} className="h-full bg-rose-400" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Small Action Card */}
        <Card className="md:col-span-4 border-none shadow-xl rounded-[2.5rem] bg-card p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute bottom-[-20%] right-[-10%] p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-40 w-40 text-primary" />
            </div>
            <div className="space-y-4 relative z-10">
                <div className="p-3 rounded-2xl bg-primary/5 text-primary w-fit">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold font-headline">Status Sistem</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Database Core</span>
                        <span className="text-emerald-600">Terhubung</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Auth Security</span>
                        <span className="text-emerald-600">Optimal</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-muted-foreground">Media Storage</span>
                        <span className="text-emerald-600">Aktif</span>
                    </div>
                </div>
            </div>
            <Button variant="ghost" className="w-full mt-6 rounded-xl font-bold bg-muted/50 group-hover:bg-primary group-hover:text-white transition-all">
                Cek Log Sistem <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
        </Card>
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="authors" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
            <TabsList className="bg-muted/50 p-1 rounded-full h-auto">
                <TabsTrigger value="authors" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Calon Penulis {authorRequests && authorRequests.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{authorRequests.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="books" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Moderasi Buku {pendingBooks && pendingBooks.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingBooks.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="stories" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Story Aktif
                </TabsTrigger>
            </TabsList>
        </div>

        <AnimatePresence mode="wait">
            <TabsContent value="authors" key="tab-authors">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <PenTool className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Permintaan Penulis</CardTitle>
                                <CardDescription className="font-medium">Tinjau portofolio calon pujangga baru.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Kandidat</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Kontak</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Waktu</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areAuthorRequestsLoading ? (
                                    <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                                ) : authorRequests?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <CheckCircle2 className="h-12 w-12" />
                                                <p className="font-headline text-xl font-bold">Semua Bersih!</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : authorRequests?.map(request => (
                                    <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8 py-6 font-bold">{request.name}</TableCell>
                                        <TableCell>
                                            <p className="text-xs font-medium">{request.email}</p>
                                            {request.portfolio && <a href={request.portfolio} target="_blank" className="text-[10px] text-primary font-bold hover:underline">Portofolio</a>}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground">{request.requestedAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell className="text-right px-8 space-x-2">
                                            <Button size="sm" onClick={() => handleApproveAuthor(request)} disabled={!!processingId} className="rounded-full bg-emerald-600 hover:bg-emerald-700">Setujui</Button>
                                            <Button variant="outline" size="sm" className="rounded-full border-rose-100 text-rose-600 hover:bg-rose-50">Tolak</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="books" key="tab-books">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <BookCopy className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Moderasi Buku</CardTitle>
                                <CardDescription className="font-medium">Kurasi kualitas karya sebelum dipublikasikan.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Informasi Karya</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Pujangga</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Kontrol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areBooksLoading ? (
                                    <TableRow><TableCell colSpan={3} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                                ) : pendingBooks?.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 font-bold">Tidak ada antrean.</TableCell></TableRow>
                                ) : pendingBooks?.map(book => (
                                    <TableRow key={book.id}>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-8 bg-muted rounded shadow-sm overflow-hidden shrink-0">
                                                    <AvatarImage src={book.coverUrl} className="object-cover h-full w-full" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-sm truncate">{book.title}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{book.genre}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-xs">{book.authorName}</TableCell>
                                        <TableCell className="text-right px-8 space-x-2">
                                            <Button size="sm" onClick={() => handleApproveBook(book.id, book.title)} disabled={!!processingId} className="rounded-full">Terbitkan</Button>
                                            <Button variant="outline" size="sm" className="rounded-full">Tinjau</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="stories" key="tab-stories">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <Flame className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Story Aktif</CardTitle>
                                <CardDescription className="font-medium">Pantau konten sementara yang sedang beredar.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">User</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Konten</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Moderasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areStoriesLoading ? (
                                    <TableRow><TableCell colSpan={3} className="h-32 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                                ) : activeStories?.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 font-bold">Hening...</TableCell></TableRow>
                                ) : activeStories?.map(story => (
                                    <TableRow key={story.id}>
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={story.authorAvatarUrl} />
                                                    <AvatarFallback>{story.authorName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <p className="font-bold text-xs">{story.authorName}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs italic truncate max-w-[200px]">"{story.content || 'Konten Media'}"</TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStory(story.id)} className="text-rose-500 rounded-full hover:bg-rose-50"><Trash2 className="h-4 w-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}