'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { books, bookContentSample } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Sun, Moon, Text, Menu } from 'lucide-react';
import Link from 'next/link';

export default function ReadPage({ params }: { params: { id: string } }) {
  const [isMounted, setIsMounted] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(document.documentElement.classList.contains('dark') || prefersDark);
  }, []);

  const book = books.find((b) => b.id === params.id);

  if (!book) {
    notFound();
  }

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(prev => !prev);
  };
  
  if (!isMounted) {
    return null; // or a loading skeleton
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
          <div dangerouslySetInnerHTML={{ __html: bookContentSample.replace(/\n/g, '<br/>') }}/>
        </article>
      </div>
    </div>
  );
}
