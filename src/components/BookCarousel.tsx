'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { BookCard } from "@/components/BookCard";
import type { Book } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface BookCarouselProps {
  title: string;
  books: Book[] | null;
  isLoading: boolean;
}

export function BookCarousel({ title, books, isLoading }: BookCarouselProps) {
  return (
    <section>
      <h2 className="text-2xl font-headline font-bold mb-4">{title}</h2>
      {isLoading && (
        <div className="flex space-x-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2 w-[180px] flex-shrink-0">
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="h-5 w-3/4 mt-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      )}
      {!isLoading && books && books.length > 0 && (
        <Carousel
          opts={{
            align: "start",
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {books.map((book) => (
              <CarouselItem key={book.id} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 pl-4">
                <BookCard book={book} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      )}
      {!isLoading && (!books || books.length === 0) && (
        <div className="text-center text-muted-foreground py-8 col-span-full">
          <p>Belum ada buku untuk ditampilkan di bagian ini.</p>
        </div>
      )}
    </section>
  );
}
