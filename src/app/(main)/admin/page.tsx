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
  { id: 1, name: "Budi Santoso", email: "budi.s@example.com", status: "Pending", date: "2023-10-26" },
  { id: 2, name: "Citra Lestari", email: "citra.l@example.com", status: "Pending", date: "2023-10-25" },
]

const bookUploads = [
  { id: 1, title: "Journey to the West", author: "Wu Cheng'en", status: "Pending", date: "2023-10-26" },
  { id: 2, title: "The Three-Body Problem", author: "Cixin Liu", status: "Approved", date: "2023-10-24" },
  { id: 3, title: "Klara and the Sun", author: "Kazuo Ishiguro", status: "Pending", date: "2023-10-26" },
]

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your application data and user requests.</p>
      </div>
      <Tabs defaultValue="authors">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="authors">Author Requests</TabsTrigger>
          <TabsTrigger value="books">Book Uploads</TabsTrigger>
        </TabsList>
        <TabsContent value="authors">
          <Card>
            <CardHeader>
              <CardTitle>Author Requests</CardTitle>
              <CardDescription>
                Review and approve or reject requests to become an author.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authorRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>
                        <Badge variant={req.status === "Pending" ? "secondary" : "default"}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{req.date}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
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
              <CardTitle>New Book Uploads</CardTitle>
              <CardDescription>
                Review and approve new books uploaded by authors.
              </CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookUploads.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                         <Badge variant={book.status === "Pending" ? "secondary" : "default"}>
                          {book.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{book.date}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline">Preview</Button>
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
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
