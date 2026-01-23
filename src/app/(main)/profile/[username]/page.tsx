import { users, books } from '@/lib/placeholder-data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookCard } from '@/components/BookCard';
import { UserPlus, MessageCircle, Edit } from 'lucide-react';

export default function ProfilePage({ params }: { params: { username: string } }) {
  const user = users.find((u) => u.username === params.username);
  const currentUser = users[0]; // Assuming current logged in user
  const isOwnProfile = user?.id === currentUser.id;

  if (!user) {
    notFound();
  }

  const userBooks = books.filter(book => book.author.id === user.id);
  const favoriteBooks = books.slice(0, 3); // Mock favorites

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-accent/20" />
        <CardContent className="p-4 md:p-6 -mt-16 md:-mt-24">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={user.avatarUrl} alt={user.name} data-ai-hint="potret orang" />
                    <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <h1 className="text-3xl font-bold font-headline">{user.name}</h1>
                        <Badge variant={user.role === 'penulis' ? 'default' : 'secondary'} className="capitalize">{user.role}</Badge>
                    </div>
                    <p className="text-muted-foreground">@{user.username}</p>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile ? (
                        <Button><Edit className="mr-2 h-4 w-4"/> Edit Profil</Button>
                    ) : (
                        <>
                            <Button><UserPlus className="mr-2 h-4 w-4"/> Ikuti</Button>
                            <Button variant="outline"><MessageCircle className="mr-2 h-4 w-4"/> Pesan</Button>
                        </>
                    )}
                </div>
            </div>
            <p className="mt-4 text-center md:text-left max-w-2xl">{user.bio}</p>
            <div className="flex justify-center md:justify-start gap-6 mt-4 pt-4 border-t">
                <div className="text-center">
                    <p className="font-bold text-lg">{user.role === 'penulis' ? userBooks.length : favoriteBooks.length}</p>
                    <p className="text-sm text-muted-foreground">Buku</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">{new Intl.NumberFormat('id-ID').format(user.followers)}</p>
                    <p className="text-sm text-muted-foreground">Pengikut</p>
                </div>
                 <div className="text-center">
                    <p className="font-bold text-lg">{new Intl.NumberFormat('id-ID').format(user.following)}</p>
                    <p className="text-sm text-muted-foreground">Mengikuti</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={user.role === 'penulis' ? 'my-books' : 'favorites'}>
        <TabsList>
            {user.role === 'penulis' && <TabsTrigger value="my-books">Buku Saya</TabsTrigger>}
            <TabsTrigger value="favorites">Favorit</TabsTrigger>
        </TabsList>
        {user.role === 'penulis' && (
            <TabsContent value="my-books">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {userBooks.map(book => <BookCard key={book.id} book={book} />)}
                </div>
                {userBooks.length === 0 && <p className="text-muted-foreground text-center py-8">Penulis ini belum menerbitkan buku apa pun.</p>}
            </TabsContent>
        )}
        <TabsContent value="favorites">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {favoriteBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
