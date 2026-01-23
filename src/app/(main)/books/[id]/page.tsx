import Image from 'next/image';
import Link from 'next/link';
import { books, users, comments } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Eye, Download, BookOpen, Send, MessageCircle } from 'lucide-react';

export default function BookDetailsPage({ params }: { params: { id: string } }) {
  const book = books.find((b) => b.id === params.id);
  const currentUser = users[0];

  if (!book) {
    notFound();
  }

  const getImageHint = (url: string) => {
    const image = PlaceHolderImages.find(img => img.imageUrl === url);
    return image ? image.imageHint : 'book cover';
  }

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="overflow-hidden sticky top-20">
            <div className="aspect-[2/3] relative">
              <Image
                src={book.coverUrl}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
                data-ai-hint={getImageHint(book.coverUrl)}
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm text-center">
                <div className="flex flex-col items-center gap-1">
                    <Eye className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{new Intl.NumberFormat().format(book.viewCount)}</span>
                    <span className="text-xs text-muted-foreground">Views</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <Download className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{new Intl.NumberFormat().format(book.downloadCount)}</span>
                    <span className="text-xs text-muted-foreground">Downloads</span>
                </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2 space-y-6">
          <div>
            <Badge>{book.genre}</Badge>
            <h1 className="text-4xl font-headline font-bold mt-2">{book.title}</h1>
            <div className="flex items-center gap-2 mt-4">
              <Avatar>
                <AvatarImage src={book.author.avatarUrl} alt={book.author.name} data-ai-hint="person portrait"/>
                <AvatarFallback>{book.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-medium">by {book.author.name}</span>
            </div>
          </div>
          <div className="space-y-4">
              <h2 className="text-xl font-headline font-semibold">Synopsis</h2>
              <p className="text-muted-foreground leading-relaxed">{book.synopsis}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href={`/books/${book.id}/read`} className="flex-1">
                <Button size="lg" className="w-full"><BookOpen className="mr-2 h-5 w-5"/> Baca Sekarang</Button>
            </Link>
            <Button size="lg" variant="outline" className="flex-1"><Download className="mr-2 h-5 w-5"/> Download eBook</Button>
          </div>

          <Separator className="my-8" />

          <div className="space-y-6">
            <h2 className="text-2xl font-headline font-bold flex items-center gap-2"><MessageCircle/> Komentar</h2>
            <div className="flex items-start gap-3">
              <Avatar>
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} data-ai-hint="man portrait"/>
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="w-full relative">
                <Textarea placeholder="Add a comment..." className="w-full pr-12"/>
                <Button size="icon" className="absolute top-2 right-2 h-8 w-8"><Send className="h-4 w-4"/></Button>
              </div>
            </div>
            
            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex items-start gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={comment.user.avatarUrl} alt={comment.user.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="bg-muted p-3 rounded-lg rounded-tl-none">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-semibold text-sm">{comment.user.name}</span>
                                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                                </div>
                                <p className="text-sm mt-1">{comment.text}</p>
                            </div>
                             {comment.replies.map(reply => (
                                <div key={reply.id} className="flex items-start gap-3 mt-4">
                                     <Avatar className="h-8 w-8">
                                        <AvatarImage src={reply.user.avatarUrl} alt={reply.user.name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{reply.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                     <div className="flex-1">
                                        <div className="bg-card border p-3 rounded-lg rounded-tl-none">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold text-sm">{reply.user.name}</span>
                                                <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                                            </div>
                                            <p className="text-sm mt-1">{reply.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
