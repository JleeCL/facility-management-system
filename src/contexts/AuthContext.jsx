import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(timeout);
      setCurrentUser(user);
      try {
        if (user) {
          // Retry once — registration may not have written the Firestore doc yet
          let snap = await getDoc(doc(db, 'users', user.uid));
          if (!snap.exists()) {
            await new Promise((r) => setTimeout(r, 1500));
            snap = await getDoc(doc(db, 'users', user.uid));
          }
          setUserProfile(snap.exists() ? snap.data() : null);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => { clearTimeout(timeout); unsubscribe(); };
  }, []);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
      setUserProfile(snap.exists() ? snap.data() : null);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
