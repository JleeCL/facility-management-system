import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const createStatusLog = async ({ reportId, previousStatus, status, updatedBy, updatedByName }) => {
  await addDoc(collection(db, 'statusLogs'), {
    reportId,
    previousStatus: previousStatus || null,
    status,
    updatedBy,
    updatedByName,
    timestamp: serverTimestamp(),
  });
};

// Fetch latest status log for each of a list of reportIds (for AllIssues view)
export const getLatestStatusLogsForReports = async (reportIds) => {
  if (!reportIds.length) return {};
  // Firestore 'in' supports max 30 at a time
  const chunks = [];
  for (let i = 0; i < reportIds.length; i += 30) chunks.push(reportIds.slice(i, i + 30));
  const allDocs = [];
  for (const chunk of chunks) {
    const q = query(collection(db, 'statusLogs'), where('reportId', 'in', chunk));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => allDocs.push({ id: d.id, ...d.data() }));
  }
  // Group by reportId, keep latest by timestamp
  const map = {};
  allDocs.forEach((log) => {
    const prev = map[log.reportId];
    if (!prev || (log.timestamp?.seconds || 0) > (prev.timestamp?.seconds || 0)) {
      map[log.reportId] = log;
    }
  });
  return map;
};

export const getStatusLogsByReport = async (reportId) => {
  try {
    const q = query(
      collection(db, 'statusLogs'),
      where('reportId', '==', reportId),
      orderBy('timestamp', 'asc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // Fallback without orderBy if composite index doesn't exist yet
    const q = query(collection(db, 'statusLogs'), where('reportId', '==', reportId));
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
  }
};
