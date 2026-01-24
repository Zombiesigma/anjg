'use client';

import { useMemo, useState } from "react";
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, doc, writeBatch, updateDoc } from 'firebase/firestore';
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
import { Loader2 } from "lucide-react";
import type { AuthorRequest } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const authorRequestsQuery = useMemo(() => (
    firestore ? query(collection(firestore, 'authorRequests')) : null
  ), [firestore]);
  
  const { data: authorRequests, isLoading } = useCollection<AuthorRequest>(authorRequestsQuery);

  const pendingRequests = useMemo(() => 
    authorRequests?.filter(req => req.status === 'pending') || [], 
    [authorRequests]
  );
  
  const handleApprove = async (request: AuthorRequest) => {
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

  const handleReject = async (request: AuthorRequest) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Dasbor Admin</h1>
        <p className="text-muted-foreground">Kelola data aplikasi dan permintaan pengguna Anda.</p>
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
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && pendingRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Tidak ada permintaan.
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && pendingRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell>{request.name}</TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell><Badge variant="secondary">{request.status}</Badge></TableCell>
                      <TableCell>{request.requestedAt?.toDate().toLocaleDateString('id-ID')}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApprove(request)}
                          disabled={processingId === request.id}
                        >
                          {processingId === request.id && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                          Setujui
                        </Button>
                         <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleReject(request)}
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
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Tidak ada unggahan.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
