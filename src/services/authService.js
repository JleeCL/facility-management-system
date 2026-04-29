import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword as createSecondaryUser, signInWithEmailAndPassword as signInSecondary, updateProfile as updateSecondaryProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, firebaseConfig } from './firebaseConfig';

export const registerUser = async ({ name, email, password, role }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  });
  return user;
};

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserRole = (uid, role) =>
  updateDoc(doc(db, 'users', uid), { role });

// ── Admin CRUD helpers ──────────────────────────────────────────────────────

// Get or create a secondary Firebase app so creating a user doesn't sign out admin
const getSecondaryApp = () => {
  const existing = getApps().find((a) => a.name === 'adminHelper');
  return existing || initializeApp(firebaseConfig, 'adminHelper');
};

export const adminCreateUser = async ({ name, email, password, role }) => {
  const secondaryAuth = getSecondaryAuth(getSecondaryApp());

  const writeUserDoc = async (uid) => {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { name, role, status: 'active' });
    } else {
      await setDoc(ref, { name, email, role, status: 'active', createdAt: serverTimestamp() });
    }
    return uid;
  };

  try {
    const { user } = await createSecondaryUser(secondaryAuth, email, password);
    await updateSecondaryProfile(user, { displayName: name });
    await writeUserDoc(user.uid);
    await secondaryAuth.signOut();
    return user.uid;
  } catch (err) {
    await secondaryAuth.signOut().catch(() => {});

    if (err.code === 'auth/email-already-in-use') {
      // Auth account already exists (soft-deleted or previously hard-deleted).
      // Sign in via secondary auth to recover the existing UID.
      let cred;
      try {
        cred = await signInSecondary(secondaryAuth, email, password);
      } catch {
        // Password mismatch — the account exists with a different password.
        throw Object.assign(new Error('This email already exists. If you recently deleted this user, please wait a moment and try again, or use a different email.'), { code: 'auth/email-already-in-use' });
      }
      const uid = cred.user.uid;
      await writeUserDoc(uid);
      await secondaryAuth.signOut();
      return uid;
    }

    throw err;
  }
};

export const adminUpdateUser = async (uid, { name, role }) => {
  await updateDoc(doc(db, 'users', uid), { name, role });
};

export const adminDeleteUser = async (uid) => {
  // Soft-delete: mark inactive so the Firebase Auth account UID is preserved.
  // (Client SDK cannot delete other users' Auth accounts.)
  await updateDoc(doc(db, 'users', uid), { status: 'inactive' });
};

const DEMO_ACCOUNTS = [
  { name: 'Admin User', email: 'admin@fms.com', password: 'Admin123!', role: 'admin' },
  { name: 'Facility Manager', email: 'manager@fms.com', password: 'Manager123!', role: 'facility_manager' },
  { name: 'Demo User', email: 'user@fms.com', password: 'User1234!', role: 'user' },
];

export const seedDemoAccounts = async () => {
  const results = [];
  for (const account of DEMO_ACCOUNTS) {
    try {
      await registerUser(account);
      results.push({ email: account.email, status: 'created' });
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        results.push({ email: account.email, status: 'already exists' });
      } else {
        results.push({ email: account.email, status: `error: ${err.code}` });
      }
    }
  }
  return results;
};
