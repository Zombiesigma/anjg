import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Download } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type BookCardProps = {
  book: Book;
};

const getImageHint = (url: string) => {
    const image = PlaceHolderImages.find(img => img.imageUrl === url);
    return image ? image.imageHint : 'sampul buku';
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-[2/3] relative">
          <Image
            src={book.coverUrl}
            alt={`Sampul ${book.title}`}
            fill
            className="object-cover"
            data-ai-hint={getImageHint(book.coverUrl)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="font-headline text-lg font-bold leading-tight group-hover:text-primary transition-colors truncate">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={book.author.avatarUrl} alt={book.author.name} data-ai-hint="potret orang"/>
              <AvatarFallback>{book.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground truncate">{book.author.name}</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t flex-grow items-end">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{new Intl.NumberFormat('id-ID').format(book.viewCount)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Download className="h-4 w-4" />
              <span>{new Intl.NumberFormat('id-ID').format(book.downloadCount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
