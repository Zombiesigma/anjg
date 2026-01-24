import Link from 'next/link';
import Image from 'next/image';
import type { Book } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Layers, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';

type BookCardProps = {
  book: Book;
};

export function BookCard({ book }: BookCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Link href={`/books/${book.id}`} className="group">
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col">
        <div className="aspect-[2/3] relative">
          <Image
            src={book.coverUrl}
            alt={`Sampul ${book.title}`}
            fill
            className="object-cover bg-muted"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        </div>
        <CardContent className="p-3 flex flex-col flex-grow">
          <h3 className="font-headline text-base font-bold leading-tight group-hover:text-primary transition-colors truncate">
            {book.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Avatar className="h-5 w-5">
              <AvatarImage src={book.authorAvatarUrl} alt={book.authorName} />
              <AvatarFallback>{book.authorName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground truncate">{book.authorName}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-3 border-t flex-grow items-end">
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{isMounted ? new Intl.NumberFormat('id-ID').format(book.viewCount) : '...'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              <span>{isMounted ? new Intl.NumberFormat('id-ID').format(book.favoriteCount) : '...'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span>{isMounted ? book.chapterCount ?? 0 : '...'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
