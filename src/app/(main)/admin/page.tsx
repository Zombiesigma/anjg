'use client';

import { useMemo, useState } from "react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc, where } from 'firebase/firestore';
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
import { Loader2, Users, ShieldCheck, BookUser, BookCopy } from "lucide-react";
import type { AuthorRequest, Book, User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const authorRequestsQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'authorRequests'), where('status', '==', 'pending')) : null
  ), [firestore]);
  
  const { data: authorRequests, isLoading: areAuthorRequestsLoading } = useCollection<AuthorRequest>(authorRequestsQuery);
  
  const pendingBooksQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'books'), where('status', '==', 'pending_review')) : null
  ), [firestore]);

  const { data: pendingBooks, isLoading: areBooksLoading } = useCollection<Book>(pendingBooksQuery);
  
  const usersQuery = useMemo(() => (
    firestore ? collection(firestore, 'users') : null
  ), [firestore]);
  const { data: users, isLoading: areUsersLoading } = useCollection<User>(usersQuery);

  const userStats = useMemo(() => {
    if (!users) return { total: 0, admins: 0, penulis: 0, pembaca: 0 };
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      penulis: users.filter(u => u.role === 'penulis').length,
      pembaca: users.filter(u => u.role === 'pembaca').length,
    }
  }, [users]);


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
      
      toast({ title: "Penulis Disetujui", description: `${request.name} sekarang adalah seorang penulis.` });
    } catch (error) {
      console.error("Error approving author:", error);
      toast({ variant: "destructive", title: "Gagal Menyetujui", description: "Terjadi kesalahan." });
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
      console.error("Error rejecting author:", error);
      toast({ variant: "destructive", title: "Gagal Menolak", description: "Terjadi kesalahan." });
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
      toast({ title: "Buku Disetujui", description: `"${bookTitle}" telah diterbitkan.` });
    } catch (error) {
      console.error("Error approving book:", error);
      toast({ variant: "destructive", title: "Gagal Menyetujui", description: "Terjadi kesalahan." });
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
      toast({ title: "Buku Ditolak", description: `"${bookTitle}" telah ditolak dan dikembalikan ke draf.` });
    } catch (error) {
      console.error("Error rejecting book:", error);
      toast({ variant: "destructive", title: "Gagal Menolak", description: "Terjadi kesalahan." });
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Dasbor Admin</h1>
        <p className="text-muted-foreground">Kelola data aplikasi dan permintaan pengguna Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {areUsersLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{userStats.total}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {areUsersLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{userStats.admins}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penulis</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {areUsersLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{userStats.penulis}</div>}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pembaca</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {areUsersLoading ? <Skeleton className="h-8 w-1/2"/> : <div className="text-2xl font-bold">{userStats.pembaca}</div>}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="authors">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="authors">Permintaan Penulis</TabsTrigger>
          <TabsTrigger value="books">Unggahan Buku</TabsTrigger>
        </TabsList>
        <TabsContent value="authors">
          <Card>
            <CardHeader>
              <CardTitle>Permintaan Penulis</CardTitle>
              <CardDescription>
                Tinjau dan setujui atau tolak permintaan untuk menjadi penulis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areAuthorRequestsLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!areAuthorRequestsLoading && authorRequests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Tidak ada permintaan.
                      </TableCell>
                    </TableRow>
                  )}
                  {!areAuthorRequestsLoading && authorRequests?.map(request => (
                    <TableRow key={request.id}>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell><Badge variant="secondary">{request.status}</Badge></TableCell>
                      <TableCell>{request.requestedAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveAuthor(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Setujui
                        </Button>
                         <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleRejectAuthor(request)}
                          disabled={processingId === request.id}
                        >
                           {processingId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
        <TabsContent value="books">
          <Card>
            <CardHeader>
              <CardTitle>Unggahan Buku Baru</CardTitle>
              <CardDescription>
                Tinjau dan setujui buku-buku baru yang diunggah oleh penulis.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Penulis</TableHead>
                    <TableHead>Diajukan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {areBooksLoading && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!areBooksLoading && pendingBooks?.length === 0 && (
                     <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Tidak ada buku yang menunggu tinjauan.
                      </TableCell>
                    </TableRow>
                  )}
                  {!areBooksLoading && pendingBooks?.map(book => (
                    <TableRow key={book.id}>
                        <TableCell className="font-medium">
                            <Link href={`/books/${book.id}`} className="hover:underline" target="_blank">
                                {book.title}
                            </Link>
                        </TableCell>
                        <TableCell>{book.authorName}</TableCell>
                        <TableCell>{book.createdAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="text-right space-x-2">
                           <Button 
                            size="sm" 
                            onClick={() => handleApproveBook(book.id, book.title)}
                            disabled={processingId === book.id}
                           >
                            {processingId === book.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Setujui
                           </Button>
                           <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRejectBook(book.id, book.title)}
                            disabled={processingId === book.id}
                           >
                             {processingId === book.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
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
      </Tabs>
    </div>
  )
}
