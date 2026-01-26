'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sun, Moon, Text, Menu, Settings, ChevronsUp } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Book, Chapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import React from 'react';

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isDark, setIsDark] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const bookRef = useMemo(() => (
    firestore ? doc(firestore, 'books', params.id) : null
  ), [firestore, params.id]);
  const { data: book, isLoading: isBookLoading } = useDoc<Book>(bookRef);

  const chaptersQuery = useMemo(() => (
    firestore 
      ? query(collection(firestore, 'books', params.id, 'chapters'), orderBy('order', 'asc')) 
      : null
  ), [firestore, params.id]);
  const { data: chapters, isLoading: areChaptersLoading } = useCollection<Chapter>(chaptersQuery);

  useEffect(() => {
    setIsMounted(true);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && prefersDark)) {
        document.documentElement.classList.add('dark');
        setIsDark(true);
    } else {
        document.documentElement.classList.remove('dark');
        setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const totalScrollableHeight = scrollHeight - clientHeight;
      if (totalScrollableHeight > 0) {
          const progress = (scrollTop / totalScrollableHeight) * 100;
          setReadingProgress(progress);
          setShowScrollToTop(scrollTop > 300);
      } else {
          setReadingProgress(100);
          setShowScrollToTop(false);
      }
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const scrollToChapter = (chapterId: string) => {
    const chapterElement = document.getElementById(`chapter-${chapterId}`);
    chapterElement?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (isBookLoading || !isMounted) {
    return <ReadPageSkeleton />;
  }
  
  if (!book) {
    notFound();
  }

  const ChapterItem = ({ chapter, ...props }: { chapter: Chapter } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
      <button
        {...props}
        onClick={() => scrollToChapter(chapter.id)}
        className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start gap-4 text-sm"
      >
        <span className="font-mono text-muted-foreground pt-0.5">{String(chapter.order).padStart(2, '0')}</span>
        <div className="flex-1">
          <span className="text-foreground">{chapter.title}</span>
        </div>
      </button>
  );

  const ChapterList = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className='flex flex-col h-full'>
      <SheetHeader className="p-4 border-b shrink-0 text-left space-y-1">
        <SheetTitle className="font-headline text-xl font-bold truncate">{book.title}</SheetTitle>
        <SheetDescription>Daftar Isi</SheetDescription>
      </SheetHeader>
      <nav className="flex-1 overflow-y-auto divide-y divide-border/50">
        {areChaptersLoading && (
          <div className="p-4 space-y-2">
            {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
          </div>
        )}
        {!areChaptersLoading && chapters?.map((chapter) =>
          inSheet ? (
            <SheetClose asChild key={chapter.id}>
              <ChapterItem chapter={chapter} />
            </SheetClose>
          ) : (
            <ChapterItem key={chapter.id} chapter={chapter} />
          )
        )}
        {!areChaptersLoading && chapters?.length === 0 && (
          <p className='p-4 text-sm text-muted-foreground text-center'>Buku ini belum memiliki bab.</p>
        )}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen -mt-14 -mx-4 md:-mx-6 bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block md:w-64 lg:w-72 border-r flex-shrink-0">
          <ChapterList />
      </aside>

      <div className="flex-1 flex flex-col relative">
        <header className="flex items-center justify-between p-2 border-b sticky top-14 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={`/books/${book.id}`}>
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
             <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80%] max-w-sm p-0 flex flex-col">
                  <ChapterList inSheet />
                </SheetContent>
              </Sheet>
            </div>
            <h1 className="font-headline text-lg truncate hidden sm:block">{book.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon"><Settings className="h-5 w-5"/></Button>
              </PopoverTrigger>
              <PopoverContent className="w-60" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font-size-slider">Ukuran Font</Label>
                    <div className="flex items-center gap-4">
                      <Text className="h-4 w-4 text-muted-foreground"/>
                      <Slider 
                          id="font-size-slider"
                          defaultValue={[fontSize]} 
                          max={32} 
                          min={12} 
                          step={1} 
                          className="w-full"
                          onValueChange={(value) => setFontSize(value[0])}
                      />
                       <Text className="h-6 w-6 text-muted-foreground"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Mode Malam</Label>
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                        {isDark ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <Progress value={readingProgress} className="w-full h-1 rounded-none"/>
        
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
          <article 
            className="prose prose-lg dark:prose-invert max-w-3xl mx-auto p-4 md:p-8" 
            style={{ fontSize: `${fontSize}px`}}
          >
            {areChaptersLoading ? (
                <div className="space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
            ) : chapters && chapters.length > 0 ? (
                 chapters.map((chapter, chapterIndex) => (
                    <React.Fragment key={chapter.id}>
                        <section id={`chapter-${chapter.id}`} className="scroll-m-20">
                            <h2 className="font-headline">{chapter.title}</h2>
                            {chapter.content.split('\n').filter(p => p.trim() !== '').map((paragraph, pIndex) => (
                                <p key={pIndex}>{paragraph}</p>
                            ))}
                        </section>
                        {chapterIndex < chapters.length - 1 && (
                            <hr className="my-12 md:my-16 border-border/50" />
                        )}
                    </React.Fragment>
                ))
            ) : (
                <>
                  <h1 className="font-headline">{book.title}</h1>
                  <p className="lead">Buku ini belum memiliki bab apa pun.</p>
                  <p>Penulis sedang mengerjakannya. Kembali lagi nanti!</p>
                </>
            )}
          </article>
        </div>
         {showScrollToTop && (
            <Button 
                variant="secondary" 
                size="icon" 
                className="rounded-full absolute bottom-6 right-6 shadow-lg"
                onClick={scrollToTop}
            >
                <ChevronsUp className="h-5 w-5"/>
            </Button>
        )}
      </div>
    </div>
  );
}

function ReadPageSkeleton() {
  return (
     <div className="flex h-screen -mt-14 -mx-4 md:-mx-6 bg-background animate-pulse">
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden md:block w-64 lg:w-72 border-r flex-shrink-0 p-2 space-y-2">
            <div className="p-2 border-b">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
        </aside>

        <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-6 w-48 hidden sm:block" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                </div>
            </header>
             <Skeleton className="h-1 w-full" />
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
                <Skeleton className="h-12 w-3/4" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-3 pt-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
                </div>
            </div>
        </div>
    </div>
  )
}
