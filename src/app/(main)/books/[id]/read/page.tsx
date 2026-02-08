'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Sun, Moon, Text, Menu, Settings, ChevronsUp, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Book, Chapter } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ReadPage() {
  const params = useParams<{ id: string }>();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [isDark, setIsDark] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSheetOpen) {
        const timer = setTimeout(() => {
            document.body.style.pointerEvents = '';
        }, 300);
        return () => clearTimeout(timer);
    }
  }, [isSheetOpen]);

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
    const theme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
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
          setShowScrollToTop(scrollTop > 500);
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
  }, [isMounted]);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const scrollToChapter = (chapterId: string) => {
    const chapterElement = document.getElementById(`chapter-${chapterId}`);
    if (chapterElement && scrollContainerRef.current) {
        const offset = 100;
        const bodyRect = scrollContainerRef.current.getBoundingClientRect().top;
        const elementRect = chapterElement.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition + scrollContainerRef.current.scrollTop - offset;

        scrollContainerRef.current.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
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
        onClick={() => {
            scrollToChapter(chapter.id);
            if(props.onClick) props.onClick(null as any);
        }}
        className="w-full text-left px-6 py-4 hover:bg-accent/50 transition-all flex items-center gap-4 text-sm group"
      >
        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {String(chapter.order).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-foreground font-medium truncate block">{chapter.title}</span>
        </div>
      </button>
  );

  const ChapterList = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className='flex flex-col h-full bg-card/30'>
      {inSheet ? (
        <SheetHeader className="p-6 border-b shrink-0 text-left space-y-1">
          <SheetTitle className="font-headline text-2xl font-bold truncate text-primary">{book.title}</SheetTitle>
          <SheetDescription className="text-xs uppercase tracking-widest font-bold">Daftar Isi</SheetDescription>
        </SheetHeader>
      ) : (
        <div className="p-6 border-b shrink-0 text-left space-y-1 bg-background/50">
          <h2 className="font-headline text-xl font-bold truncate text-primary leading-tight">{book.title}</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">Daftar Isi</p>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        {areChaptersLoading && (
          <div className="p-6 space-y-4">
            {Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
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
          <div className="flex flex-col items-center justify-center p-12 text-center space-y-2 opacity-50">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
              <p className='text-xs font-medium'>Belum ada bab.</p>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <div className="flex h-screen -mt-14 -mx-4 md:-mx-6 bg-background selection:bg-primary/20">
      <aside className="hidden md:block md:w-72 lg:w-80 border-r flex-shrink-0 shadow-sm z-20">
          <ChapterList />
      </aside>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="flex items-center justify-between px-4 h-14 border-b sticky top-14 bg-background/95 backdrop-blur-md z-30 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Link href={`/books/${book.id}`}>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
             <div className="md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                    side="left" 
                    className="w-[85%] max-w-sm p-0 flex flex-col"
                    onCloseAutoFocus={(e) => {
                        e.preventDefault();
                        document.body.style.pointerEvents = '';
                    }}
                >
                  <ChapterList inSheet />
                </SheetContent>
              </Sheet>
            </div>
            <div className="flex flex-col min-w-0">
                <h1 className="font-headline text-sm font-bold truncate text-primary leading-none">{book.title}</h1>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">oleh {book.authorName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                    <Settings className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-6 shadow-2xl rounded-2xl" align="end">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferensi Baca</Label>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium">Ukuran Teks</span>
                            <span className="bg-muted px-2 py-0.5 rounded font-mono font-bold">{fontSize}px</span>
                        </div>
                        <div className="flex items-center gap-4 py-2">
                            <Text className="h-3 w-3 text-muted-foreground"/>
                            <Slider 
                                defaultValue={[fontSize]} 
                                max={32} 
                                min={14} 
                                step={1} 
                                className="w-full"
                                onValueChange={(value) => setFontSize(value[0])}
                            />
                            <Text className="h-6 w-6 text-muted-foreground"/>
                        </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">Mode Gelap</span>
                        <span className="text-[10px] text-muted-foreground">Kurangi kelelahan mata</span>
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className={cn("rounded-full transition-all duration-500", isDark ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary")} 
                        onClick={toggleTheme}
                    >
                        {isDark ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        <Progress value={readingProgress} className="w-full h-0.5 rounded-none bg-muted z-30" />
        
        <div 
            ref={scrollContainerRef} 
            className="flex-1 overflow-y-auto relative bg-background/50 custom-scrollbar scroll-smooth"
        >
          <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
            <header className="mb-20 text-center space-y-4">
                <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full mb-8" />
                <h1 className="font-headline text-4xl md:text-6xl font-black text-foreground leading-tight">{book.title}</h1>
                <p className="text-muted-foreground font-medium tracking-widest uppercase text-xs">Karya {book.authorName}</p>
            </header>

            <article 
                className="prose prose-zinc dark:prose-invert max-w-none transition-all duration-300 prose-headings:font-headline prose-p:leading-relaxed prose-blockquote:border-primary/20 prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-lg"
                style={{ fontSize: `${fontSize}px` }}
            >
                {areChaptersLoading ? (
                    <div className="space-y-12">
                        {Array.from({length: 3}).map((_, i) => (
                            <div key={i} className="space-y-6">
                                <Skeleton className="h-12 w-2/3 rounded-lg" />
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-11/12" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-4/5" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : chapters && chapters.length > 0 ? (
                    chapters.map((chapter, chapterIndex) => (
                        <React.Fragment key={chapter.id}>
                            <section id={`chapter-${chapter.id}`} className="scroll-m-32 mb-24 md:mb-32">
                                <div className="flex items-center gap-4 mb-10 group">
                                    <span className="font-mono text-xs font-bold text-primary/40 group-hover:text-primary transition-colors">
                                        {String(chapter.order).padStart(2, '0')}
                                    </span>
                                    <h2 className="font-headline text-3xl md:text-4xl font-bold m-0 border-none">{chapter.title}</h2>
                                </div>
                                
                                <div className="markdown-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {chapter.content}
                                    </ReactMarkdown>
                                </div>
                                
                                {chapterIndex < chapters.length - 1 ? (
                                    <div className="flex items-center justify-center py-20 opacity-20 select-none pointer-events-none">
                                        <div className="h-px w-full bg-foreground flex-1" />
                                        <div className="px-4 flex gap-1">
                                            {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-foreground" />)}
                                        </div>
                                        <div className="h-px w-full bg-foreground flex-1" />
                                    </div>
                                ) : (
                                    <div className="mt-32 p-12 rounded-3xl bg-muted/30 border border-border/50 text-center space-y-6">
                                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                            <BookOpen className="text-primary h-8 w-8" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-headline text-2xl font-bold italic">Tamat</h3>
                                            <p className="text-sm text-muted-foreground max-w-xs mx-auto">Anda telah menyelesaikan semua bab yang tersedia. Berikan komentar atau favoritkan buku ini jika Anda menyukainya!</p>
                                        </div>
                                        <Button asChild variant="outline" className="rounded-full px-8">
                                            <Link href={`/books/${book.id}`}>Kembali ke Detail Buku</Link>
                                        </Button>
                                    </div>
                                )}
                            </section>
                        </React.Fragment>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="bg-muted p-10 rounded-full animate-pulse">
                            <BookOpen className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="font-headline text-3xl font-bold">Sedang Disusun...</h2>
                            <p className="text-muted-foreground">Penulis belum menerbitkan bab apa pun. Nantikan segera!</p>
                        </div>
                        <Button asChild variant="ghost">
                            <Link href={`/books/${book.id}`}><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
                        </Button>
                    </div>
                )}
            </article>
          </div>
        </div>

        <AnimatePresence>
            {showScrollToTop && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    className="absolute bottom-8 right-8 z-40"
                >
                    <Button 
                        variant="primary" 
                        size="icon" 
                        className="rounded-full h-12 w-12 shadow-2xl hover:-translate-y-1 transition-transform"
                        onClick={scrollToTop}
                    >
                        <ChevronsUp className="h-6 w-6 text-white"/>
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
        }
        .markdown-content p:first-of-type::first-letter {
            font-size: 3rem;
            line-height: 1;
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            float: left;
            margin-right: 0.5rem;
            color: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}

function ReadPageSkeleton() {
  return (
     <div className="flex h-screen -mt-14 -mx-4 md:-mx-6 bg-background animate-pulse">
        <aside className="hidden md:block w-72 lg:w-80 border-r flex-shrink-0 p-6 space-y-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <div className="space-y-4 pt-10">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-full rounded" />
                    </div>
                ))}
            </div>
        </aside>

        <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-between px-4 h-14 border-b">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-20" />
                    </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
            </header>
             <Skeleton className="h-0.5 w-full" />
            <div className="flex-1 overflow-y-auto p-12">
                <div className="max-w-2xl mx-auto space-y-16">
                    <div className="text-center space-y-4">
                        <Skeleton className="h-16 w-3/4 mx-auto" />
                        <Skeleton className="h-4 w-1/4 mx-auto" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-8 w-1/3" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}