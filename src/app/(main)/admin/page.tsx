'use client';

import { useMemo, useState, useEffect } from "react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc, where, orderBy, limit, deleteDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Users, 
  ShieldCheck, 
  BookUser, 
  BookCopy, 
  Megaphone, 
  TrendingUp, 
  LayoutDashboard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trash2, 
  Eye, 
  Flame, 
  Sparkles,
  ChevronRight,
  MoreHorizontal,
  PenTool
} from "lucide-react";
import type { AuthorRequest, Book, User, Story } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Queries
  const authorRequestsQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'authorRequests'), where('status', '==', 'pending'), orderBy('requestedAt', 'desc')) : null
  ), [firestore]);
  const { data: authorRequests, isLoading: areAuthorRequestsLoading } = useCollection<AuthorRequest>(authorRequestsQuery);
  
  const pendingBooksQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'books'), where('status', '==', 'pending_review'), orderBy('createdAt', 'desc')) : null
  ), [firestore]);
  const { data: pendingBooks, isLoading: areBooksLoading } = useCollection<Book>(pendingBooksQuery);
  
  const usersQuery = useMemo(() => (
    firestore ? collection(firestore, 'users') : null
  ), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const storiesQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'stories'), orderBy('createdAt', 'desc'), limit(50)) : null
  ), [firestore]);
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

  const handleRejectAuthor = async (request: AuthorRequest) => {
    if (!firestore) return;
    setProcessingId(request.id);
    try {
      const requestRef = doc(firestore, 'authorRequests', request.id);
      await updateDoc(requestRef, { status: 'rejected' });
      toast({ title: "Permintaan Ditolak", description: `Lamaran dari ${request.name} telah ditolak.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menolak" });
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

  const handleRejectBook = async (bookId: string, bookTitle: string) => {
    if (!firestore) return;
    setProcessingId(bookId);
    try {
      const bookRef = doc(firestore, 'books', bookId);
      await updateDoc(bookRef, { status: 'rejected' });
      toast({ title: "Buku Ditolak", description: `"${bookTitle}" telah dikembalikan ke draf.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Gagal Menolak" });
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

  const StatCard = ({ title, value, icon: Icon, color, href }: any) => (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
        <Link href={href}>
            <Card className="relative overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm group cursor-pointer">
                <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</CardTitle>
                    <Icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity", color.replace('bg-', 'text-'))} />
                </CardHeader>
                <CardContent>
                    {areUsersLoading ? <Skeleton className="h-8 w-16" /> : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black tracking-tighter">{value}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">JIWA</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    </motion.div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck className="h-3 w-3" /> Area Otoritas Tertinggi
          </div>
          <h1 className="text-4xl font-headline font-black tracking-tight">Dasbor <span className="text-primary italic">Pusat</span></h1>
          <p className="text-muted-foreground mt-2 font-medium">Kelola ekosistem, moderasi konten, dan pantau pertumbuhan Elitera.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="rounded-full font-bold shadow-sm" asChild>
                <Link href="/admin/broadcast">
                    <Megaphone className="mr-2 h-4 w-4 text-orange-500" /> Kirim Pengumuman
                </Link>
            </Button>
            <Button className="rounded-full font-bold shadow-lg shadow-primary/20" asChild>
                <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" /> Kelola Pengguna
                </Link>
            </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Pengguna" value={stats.total} icon={Users} color="bg-blue-500" href="/admin/users" />
        <StatCard title="Penulis Verifikasi" value={stats.penulis} icon={BookUser} color="bg-emerald-500" href="/admin/users?role=penulis" />
        <StatCard title="Pembaca Aktif" value={stats.pembaca} icon={BookCopy} color="bg-indigo-500" href="/admin/users?role=pembaca" />
        <StatCard title="Tim Moderator" value={stats.admins} icon={ShieldCheck} color="bg-rose-500" href="/admin/users?role=admin" />
      </div>

      {/* Moderation Tabs */}
      <Tabs defaultValue="authors" className="space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
            <TabsList className="bg-muted/50 p-1 rounded-full h-auto">
                <TabsTrigger value="authors" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Penulis {authorRequests && authorRequests.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{authorRequests.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="books" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Moderasi Buku {pendingBooks && pendingBooks.length > 0 && <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingBooks.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="stories" className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-bold transition-all">
                    Story Aktif
                </TabsTrigger>
            </TabsList>
            <div className="hidden md:flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                <Clock className="h-3 w-3" /> Terakhir Sinkronisasi: Baru saja
            </div>
        </div>

        <AnimatePresence mode="wait">
            {/* Authors Moderation */}
            <TabsContent value="authors">
                <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <PenTool className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Permintaan Penulis</CardTitle>
                                <CardDescription className="font-medium">Tinjau portofolio dan motivasi calon penulis baru.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Kandidat</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Detail Kontak</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Waktu Ajukan</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Opsi Moderasi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areAuthorRequestsLoading ? (
                                    Array.from({length: 3}).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5}><Skeleton className="h-16 w-full rounded-xl" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : authorRequests?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <CheckCircle2 className="h-12 w-12" />
                                                <p className="font-headline text-xl font-bold">Semua Bersih!</p>
                                                <p className="text-xs font-medium max-w-[200px]">Belum ada permintaan penulis baru yang menunggu tinjauan.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : authorRequests?.map(request => (
                                    <TableRow key={request.id} className="hover:bg-muted/30 transition-colors group">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="space-y-0.5">
                                                    <p className="font-black text-sm">{request.name}</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">ID: {request.userId.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs font-medium">{request.email}</p>
                                            {request.portfolio && (
                                                <a href={request.portfolio} target="_blank" className="text-[10px] text-primary hover:underline font-bold">Lihat Portofolio</a>
                                            )}
                                        </TableCell>
                                        <TableCell><Badge variant="outline" className="rounded-full bg-orange-500/5 text-orange-600 border-orange-200 uppercase text-[9px] font-black">{request.status}</Badge></TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground">{request.requestedAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell className="text-right px-8 space-x-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleApproveAuthor(request)}
                                                disabled={processingId === request.id}
                                                className="rounded-full px-4 h-9 font-bold bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {processingId === request.id ? <Loader2 className="h-3 w-3 animate-spin"/> : <CheckCircle2 className="mr-2 h-3.5 w-3.5"/>}
                                                Setujui
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleRejectAuthor(request)}
                                                disabled={processingId === request.id}
                                                className="rounded-full px-4 h-9 font-bold border-2 text-rose-600 hover:bg-rose-50 border-rose-100"
                                            >
                                                Tolak
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Books Moderation */}
            <TabsContent value="books">
                <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <BookCopy className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Kurasi Karya</CardTitle>
                                <CardDescription className="font-medium">Tinjau konten buku sebelum dipublikasikan secara publik.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Informasi Karya</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Pujangga</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Waktu Diajukan</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Kontrol Kualitas</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areBooksLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                                ) : pendingBooks?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Sparkles className="h-12 w-12" />
                                                <p className="font-headline text-xl font-bold">Rak Buku Rapi!</p>
                                                <p className="text-xs font-medium max-w-[200px]">Tidak ada buku yang menunggu antrean moderasi.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : pendingBooks?.map(book => (
                                    <TableRow key={book.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-14 w-10 relative overflow-hidden rounded shadow-sm shrink-0">
                                                    <AvatarImage src={book.coverUrl} className="object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <Link href={`/books/${book.id}`} target="_blank" className="font-black text-sm hover:text-primary transition-colors truncate block">
                                                        {book.title}
                                                    </Link>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{book.genre}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={book.authorAvatarUrl} />
                                                    <AvatarFallback>{book.authorName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-bold">{book.authorName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium text-muted-foreground">{book.createdAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                                        <TableCell className="text-right px-8 space-x-2">
                                            <Button 
                                                size="sm" 
                                                onClick={() => handleApproveBook(book.id, book.title)}
                                                disabled={processingId === book.id}
                                                className="rounded-full px-4 h-9 font-bold bg-primary shadow-lg shadow-primary/20"
                                            >
                                                Terbitkan
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleRejectBook(book.id, book.title)}
                                                disabled={processingId === book.id}
                                                className="rounded-full px-4 h-9 font-bold border-2"
                                            >
                                                Tolak
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Stories Moderation */}
            <TabsContent value="stories">
                <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b p-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-white text-primary shadow-sm">
                                <Flame className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-headline font-black">Pantauan Story Aktif</CardTitle>
                                <CardDescription className="font-medium">Awasi konten sementara (24 jam) yang sedang beredar.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/10">
                                <TableRow>
                                    <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Pengguna</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Tipe & Konten</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Statistik</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest">Aksi Moderator</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {areStoriesLoading ? (
                                    <TableRow><TableCell colSpan={4}><Skeleton className="h-20 w-full" /></TableCell></TableRow>
                                ) : activeStories?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <Flame className="h-12 w-12" />
                                                <p className="font-headline text-xl font-bold">Hening...</p>
                                                <p className="text-xs font-medium max-w-[200px]">Belum ada cerita aktif saat ini.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : activeStories?.map(story => (
                                    <TableRow key={story.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-primary/10">
                                                    <AvatarImage src={story.authorAvatarUrl} />
                                                    <AvatarFallback>{story.authorName?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm truncate">{story.authorName}</p>
                                                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">@{story.authorRole}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Badge variant="secondary" className="rounded-full text-[9px] font-black uppercase">{story.type}</Badge>
                                                <p className="text-xs font-medium truncate max-w-[200px] italic text-muted-foreground">"{story.content || 'Konten Gambar'}"</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                    <Eye className="h-3 w-3 text-blue-500" /> {story.viewCount}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                    <Flame className="h-3 w-3 text-orange-500" /> {story.likes}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                onClick={() => handleDeleteStory(story.id)}
                                                disabled={processingId === story.id}
                                                className="h-9 w-9 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                {processingId === story.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                                            </Button>
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

      {/* Platform Health / Maintenance Area */}
      <div className="grid md:grid-cols-12 gap-8">
          <Card className="md:col-span-8 border-none shadow-2xl rounded-[2.5rem] bg-indigo-950 text-white overflow-hidden relative">
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <CardHeader className="p-8 md:p-10 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-headline font-black flex items-center gap-3">
                            <TrendingUp className="h-6 w-6 text-indigo-400" /> Analitik Pertumbuhan
                        </CardTitle>
                        <CardDescription className="text-indigo-200/60 font-medium">Performa platform dalam 30 hari terakhir.</CardDescription>
                    </div>
                    <Badge className="bg-white/10 text-white border-white/20">LIVE</Badge>
                  </div>
              </CardHeader>
              <CardContent className="p-8 md:p-10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Interaksi Baru</p>
                          <p className="text-3xl font-black">+142%</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-400 w-[70%]" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Retensi Pujangga</p>
                          <p className="text-3xl font-black">88%</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-400 w-[88%]" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Waktu Baca</p>
                          <p className="text-3xl font-black">12.4m</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-orange-400 w-[55%]" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300/50">Stabilitas Sesi</p>
                          <p className="text-3xl font-black">99.9%</p>
                          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-sky-400 w-[99%]" />
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <div className="md:col-span-4 space-y-6">
              <Card className="border-none shadow-xl rounded-[2rem] bg-orange-500 text-white group overflow-hidden">
                  <Link href="/admin/broadcast">
                    <CardHeader className="p-6 border-b border-white/10 relative z-10">
                        <div className="flex items-center justify-between">
                            <Megaphone className="h-8 w-8 text-white/40 group-hover:scale-110 transition-transform" />
                            <ChevronRight className="h-5 w-5 text-white/40 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 relative z-10">
                        <h4 className="font-headline text-xl font-black">Kirim Siaran</h4>
                        <p className="text-xs text-white/70 font-medium mt-1">Sampaikan kabar penting ke seluruh ekosistem Elitera secara instan.</p>
                    </CardContent>
                    <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  </Link>
              </Card>

              <Card className="border-none shadow-xl rounded-[2rem] bg-card/50 backdrop-blur-sm p-6 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Kesehatan Sistem</span>
                  </div>
                  <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Database Cloud</span>
                          <span className="text-emerald-600">Optimal</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Auth Service</span>
                          <span className="text-emerald-600">Terhubung</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-muted-foreground">Media Storage</span>
                          <span className="text-emerald-600">Aktif</span>
                      </div>
                  </div>
              </Card>
          </div>
      </div>
    </div>
  )
}
