import {
  collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const createResolution = async ({ reportId, managerId, description, afterPhotoURLs }) => {
  const ref = await addDoc(collection(db, 'resolutions'), {
    reportId,
    managerId,
    description,
    afterPhotoURLs: afterPhotoURLs || [],
    resolvedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getResolutionByReportId = async (reportId) => {
  const q = query(collection(db, 'resolutions'), where('reportId', '==', reportId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

export const updateResolution = async (id, data) => {
  await updateDoc(doc(db, 'resolutions', id), {
    ...data,
    resolvedAt: serverTimestamp(),
  });
};
