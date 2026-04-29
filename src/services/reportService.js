import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createNotification } from './notificationService';
import { createStatusLog } from './statusLogService';

export const createReport = async (userId, data) => {
  const ref = await addDoc(collection(db, 'reports'), {
    userId,
    location: data.location,
    description: data.description,
    status: 'pending',
    beforePhotoURLs: data.beforePhotoURLs || [],
    assignedManagerId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const getReportById = async (id) => {
  const snap = await getDoc(doc(db, 'reports', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getReportsByUser = async (userId) => {
  const q = query(
    collection(db, 'reports'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

export const getAllReports = async (filters = {}) => {
  let q = query(collection(db, 'reports'));
  if (filters.status) {
    q = query(collection(db, 'reports'), where('status', '==', filters.status));
  }
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
};

export const updateReport = async (id, data) => {
  await updateDoc(doc(db, 'reports', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteReport = async (id) => {
  await deleteDoc(doc(db, 'reports', id));
};

export const updateReportStatus = async (reportId, newStatus, updatedBy, updatedByName) => {
  const reportRef = doc(db, 'reports', reportId);

  // Fetch current status before overwriting (for the audit log)
  const currentSnap = await getDoc(reportRef);
  const previousStatus = currentSnap.exists() ? currentSnap.data().status : null;

  await updateDoc(reportRef, { status: newStatus, updatedAt: serverTimestamp() });

  await createStatusLog({ reportId, previousStatus, status: newStatus, updatedBy, updatedByName });

  // Fetch report to notify owner
  const snap = await getDoc(reportRef);
  if (snap.exists()) {
    const report = snap.data();
    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    await createNotification({
      userId: report.userId,
      type: 'status_update',
      reportId,
      message: `Your report "${report.description.slice(0, 60)}..." status changed to ${statusLabels[newStatus] || newStatus}.`,
    });
  }
};
