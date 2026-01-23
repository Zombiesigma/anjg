import { initializeFirebase } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const { auth, firestore } = initializeFirebase();
const provider = new GoogleAuthProvider();

async function createUserProfile(user: User) {
  const userDocRef = doc(firestore, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'pembaca', // default role
      username: user.email?.split('@')[0] || user.uid,
      bio: 'Pengguna baru Litera',
      followers: 0,
      following: 0,
    });
  }
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    // Generate a default photoURL
    const photoURL = `https://api.dicebear.com/8.x/identicon/svg?seed=${user.uid}`;
    await updateProfile(user, { displayName, photoURL });
    
    // Create a new user object to pass to createUserProfile
    const userWithProfile = {
      ...user,
      displayName: displayName,
      photoURL: photoURL
    };

    await createUserProfile(userWithProfile);
    return { user: userWithProfile };
  } catch (error) {
    return { error };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error) {
    return { error };
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    await createUserProfile(user);
    return { user };
  } catch (error) {
    return { error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
}
