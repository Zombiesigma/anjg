import { initializeFirebase } from '@/firebase';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import type { Book as AppBook } from '@/lib/types';

// This function is designed to be run on the server.
export async function getBookById(bookId: string): Promise<AppBook | null> {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      console.error('Firestore not initialized on the server.');
      return null;
    }
    const bookRef = doc(firestore, 'books', bookId);
    const bookSnap = await getDoc(bookRef);

    if (!bookSnap.exists()) {
      return null;
    }

    const bookData = bookSnap.data() as DocumentData;
    // Ensure book is published, otherwise don't generate metadata
    if (bookData.status !== 'published') {
        return null;
    }

    return { id: bookSnap.id, ...bookData } as AppBook;
  } catch (error) {
    console.error(`Error fetching book ${bookId} on server:`, error);
    return null;
  }
}

    