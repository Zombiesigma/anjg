'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import type { User as AppUser } from '@/lib/types';

const storySchema = z.object({
  content: z.string().min(3, "Cerita minimal 3 karakter.").max(280, "Cerita maksimal 280 karakter."),
});

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: AppUser | null;
}

export function CreateStoryModal({ isOpen, onClose, currentUserProfile }: CreateStoryModalProps) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof storySchema>>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      content: "",
    },
  });

  async function onSubmit(values: z.infer<typeof storySchema>) {
    if (!firestore || !currentUser || !currentUserProfile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Tidak dapat membuat cerita.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const storyData = {
        authorId: currentUser.uid,
        authorName: currentUser.displayName,
        authorAvatarUrl: currentUser.photoURL,
        content: values.content,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(firestore, 'stories'), storyData);
      toast({ title: "Cerita Diterbitkan!", description: "Cerita Anda akan terlihat selama 24 jam." });
      form.reset();
      onClose();
    } catch (error) {
      console.error("Error creating story:", error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menerbitkan cerita.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Cerita Baru</DialogTitle>
          <DialogDescription>
            Bagikan pembaruan singkat dengan pengikut Anda. Cerita akan hilang setelah 24 jam.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Konten Cerita</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Apa yang sedang Anda pikirkan?"
                      className="min-h-[120px] text-lg"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Plus className="mr-2" />}
                Terbitkan Cerita
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
