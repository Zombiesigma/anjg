'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { bookContentSample } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Sun, Moon, Text, Menu } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Book } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isDark, setIsDark] = useState(false);

  const bookRef = firestore ? doc(firestore, 'books', params.id) : null;
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  useEffect(() => {
    setIsMounted(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(document.documentElement.classList.contains('dark') || prefersDark);
  }, []);


  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(prev => !prev);
  };
  
  if (isBookLoading || !isMounted) {
    return <ReadPageSkeleton />;
  }
  
  if (!book) {
    notFound();
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 bg-background">
      <header className="flex items-center justify-between p-2 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Link href={`/books/${book.id}`}>
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-headline text-lg truncate">{book.title}</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className="items-center gap-2 hidden md:flex">
                <Text className="h-5 w-5 text-muted-foreground"/>
                <Slider 
                    defaultValue={[fontSize]} 
                    max={32} 
                    min={12} 
                    step={1} 
                    className="w-24"
                    onValueChange={(value) => setFontSize(value[0])}
                />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDark ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
            </Button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <article 
          className="prose dark:prose-invert max-w-3xl mx-auto p-4 md:p-8" 
          style={{ fontSize: `${fontSize}px`}}
        >
          <h1 className="font-headline">{book.title}</h1>
          <p className="lead">{book.synopsis}</p>
          <div dangerouslySetInnerHTML={{ __html: (book.content || bookContentSample).replace(/\n/g, '<br/>') }}/>
        </article>
      </div>
    </div>
  );
}

function ReadPageSkeleton() {
  return (
     <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-2px)] -mt-6 -mx-4 md:-mx-6 bg-background animate-pulse">
      <header className="flex items-center justify-between p-2 border-b">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <div className="items-center gap-2 hidden md:flex">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-10 rounded-lg md:hidden" />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
         <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
         </div>
      </div>
    </div>
  )
}
