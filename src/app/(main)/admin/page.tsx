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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Placeholder data
const authorRequests = [
  { id: 1, name: "Budi Santoso", email: "budi.s@example.com", status: "Menunggu", date: "2023-10-26" },
  { id: 2, name: "Citra Lestari", email: "citra.l@example.com", status: "Menunggu", date: "2023-10-25" },
]

const bookUploads = [
  { id: 1, title: "Journey to the West", author: "Wu Cheng'en", status: "Menunggu", date: "2023-10-26" },
  { id: 2, title: "The Three-Body Problem", author: "Cixin Liu", status: "Disetujui", date: "2023-10-24" },
  { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", status: "Menunggu", date: "2023-10-26" },
]

export default function AdminPage() {
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
                  {authorRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>
                        <Badge variant={req.status === "Menunggu" ? "secondary" : "default"}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">Lihat</Button>
                        <Button size="sm">Setujui</Button>
                        <Button size="sm" variant="destructive">Tolak</Button>
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
                  {bookUploads.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                         <Badge variant={book.status === "Menunggu" ? "secondary" : "default"}>
                          {book.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{book.date}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">Pratinjau</Button>
                        <Button size="sm">Setujui</Button>
                        <Button size="sm" variant="destructive">Tolak</Button>
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
