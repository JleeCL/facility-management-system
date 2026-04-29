import {
  collection, addDoc, doc, updateDoc, writeBatch, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const createNotification = async ({ userId, type, reportId, message }) => {
  await addDoc(collection(db, 'notifications'), {
    userId,
    type,
    reportId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const getUserNotifications = async (userId) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const markAsRead = (notificationId) =>
  updateDoc(doc(db, 'notifications', notificationId), { read: true });

export const markAllAsRead = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
};
