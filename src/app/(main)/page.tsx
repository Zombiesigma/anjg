import { books } from '@/lib/placeholder-data';
import { BookCard } from '@/components/BookCard';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-headline font-bold text-primary">Jelajahi Dunia</h1>
        <p className="text-lg text-muted-foreground mt-2">Temukan buku favorit Anda berikutnya dari koleksi kami yang luas.</p>
      </div>
      <section>
        <h2 className="text-2xl font-headline font-bold mb-4">Populer Saat Ini</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>
    </div>
  );
}
