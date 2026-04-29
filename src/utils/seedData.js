import {
  collection, addDoc, writeBatch, doc, setDoc, Timestamp,
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const daysAgo = (n) => Timestamp.fromDate(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

const DEMO_USERS = [
  { id: 'demo-user-001', name: 'Ahmad Farid', email: 'ahmad.farid@fms.com', role: 'user', daysAgo: 30 },
  { id: 'demo-user-002', name: 'Siti Nurbaya', email: 'siti.nurbaya@fms.com', role: 'user', daysAgo: 25 },
  { id: 'demo-user-003', name: 'Rajesh Kumar', email: 'rajesh.kumar@fms.com', role: 'user', daysAgo: 20 },
  { id: 'demo-user-004', name: 'Mei Ling Tan', email: 'meiling.tan@fms.com', role: 'user', daysAgo: 18 },
  { id: 'demo-user-005', name: 'Daniel Lim', email: 'daniel.lim@fms.com', role: 'user', daysAgo: 15 },
  { id: 'demo-user-006', name: 'Priya Sharma', email: 'priya.sharma@fms.com', role: 'user', daysAgo: 12 },
  { id: 'demo-user-007', name: 'Aziz Kamaruddin', email: 'aziz.kamaruddin@fms.com', role: 'user', daysAgo: 10 },
  { id: 'demo-user-008', name: 'Rachel Wong', email: 'rachel.wong@fms.com', role: 'user', daysAgo: 7 },
  { id: 'demo-mgr-001', name: 'Hafiz Norzaidi', email: 'hafiz.norzaidi@fms.com', role: 'facility_manager', daysAgo: 60 },
  { id: 'demo-mgr-002', name: 'Susan Chong', email: 'susan.chong@fms.com', role: 'facility_manager', daysAgo: 45 },
  { id: 'demo-mgr-003', name: 'Ramesh Pillai', email: 'ramesh.pillai@fms.com', role: 'facility_manager', daysAgo: 30 },
];

export const cleanupDemoUsers = async () => {
  const batch = writeBatch(db);
  for (const u of DEMO_USERS) {
    batch.delete(doc(db, 'users', u.id));
  }
  await batch.commit();
  return DEMO_USERS.length;
};

export const seedDemoUsers = async () => {
  const batch = writeBatch(db);
  for (const u of DEMO_USERS) {
    const ref = doc(db, 'users', u.id);
    batch.set(ref, {
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: daysAgo(u.daysAgo),
    });
  }
  await batch.commit();
  return DEMO_USERS.length;
};

const REPORTS = [
  { building: 'Block A', floor: 'Ground Floor', room: 'Room 101', description: 'Ceiling light flickering and making buzzing noise. Affects whole room.', status: 'pending', daysAgo: 2 },
  { building: 'Block A', floor: 'Ground Floor', room: 'Room 103', description: 'Air conditioning unit not cooling. Temperature remains high even at max setting.', status: 'pending', daysAgo: 1 },
  { building: 'Block A', floor: 'First Floor', room: 'Room 112', description: 'Water leaking from ceiling near the projector. Risk of electrical damage.', status: 'in_progress', daysAgo: 5 },
  { building: 'Block A', floor: 'First Floor', room: 'Toilet A1', description: 'Toilet flush broken, water running continuously. Causing water wastage.', status: 'resolved', daysAgo: 10 },
  { building: 'Block A', floor: 'Second Floor', room: 'Room 201', description: 'Power socket beside whiteboard not working. Students unable to charge laptops.', status: 'closed', daysAgo: 20 },
  { building: 'Block B', floor: 'Ground Floor', room: 'Lobby', description: 'Main entrance automatic door sensor not working. Door remains closed.', status: 'in_progress', daysAgo: 3 },
  { building: 'Block B', floor: 'Ground Floor', room: 'Room B01', description: 'Projector screen jammed halfway and won\'t retract fully.', status: 'pending', daysAgo: 1 },
  { building: 'Block B', floor: 'First Floor', room: 'Room B11', description: 'Broken window latch — window cannot be secured properly. Safety concern.', status: 'resolved', daysAgo: 14 },
  { building: 'Block B', floor: 'First Floor', room: 'Room B12', description: 'Whiteboard surface badly worn, markers leave no visible marks.', status: 'closed', daysAgo: 25 },
  { building: 'Block B', floor: 'Second Floor', room: 'Computer Lab 2', description: '6 computers not powering on. Students unable to complete assignments.', status: 'in_progress', daysAgo: 4 },
  { building: 'Block C', floor: 'Ground Floor', room: 'Cafeteria', description: 'Hot water dispenser leaking from base. Floor is wet and slippery.', status: 'resolved', daysAgo: 8 },
  { building: 'Block C', floor: 'Ground Floor', room: 'Room C02', description: 'Foul smell from drainage pipe under sink. Getting worse each day.', status: 'pending', daysAgo: 2 },
  { building: 'Block C', floor: 'First Floor', room: 'Room C11', description: 'Door lock is faulty — door cannot be locked from inside or outside.', status: 'in_progress', daysAgo: 6 },
  { building: 'Block C', floor: 'Second Floor', room: 'Room C21', description: 'Network switch offline, no internet connectivity in this room.', status: 'resolved', daysAgo: 12 },
  { building: 'Admin Block', floor: 'Ground Floor', room: 'Reception', description: 'Printer paper jam alarm going off repeatedly. Printer is unusable.', status: 'closed', daysAgo: 18 },
  { building: 'Admin Block', floor: 'First Floor', room: 'Finance Office', description: 'Air vent making loud rattling noise during operation. Very disruptive.', status: 'pending', daysAgo: 3 },
  { building: 'Admin Block', floor: 'First Floor', room: 'Meeting Room 1', description: 'TV remote and HDMI input not working. Unable to present to visitors.', status: 'in_progress', daysAgo: 2 },
  { building: 'Library', floor: 'Ground Floor', room: 'Reading Hall', description: 'Multiple ceiling lights blown. Reading area too dim for study.', status: 'resolved', daysAgo: 9 },
  { building: 'Library', floor: 'Ground Floor', room: 'Server Room', description: 'Server room temperature alarm triggered. Cooling system may be failing.', status: 'closed', daysAgo: 22 },
  { building: 'Library', floor: 'First Floor', room: 'Study Pods', description: 'USB charging ports at 4 study pods not working. Students complaining.', status: 'pending', daysAgo: 1 },
];

export const seedDemoData = async (currentUserId, currentUserName) => {
  const batch = writeBatch(db);
  const reportIds = [];

  // 1. Create all reports
  for (const r of REPORTS) {
    const ref = doc(collection(db, 'reports'));
    reportIds.push({ id: ref.id, status: r.status, description: r.description });
    batch.set(ref, {
      userId: currentUserId,
      location: { building: r.building, floor: r.floor, room: r.room },
      description: r.description,
      status: r.status,
      beforePhotoURLs: [],
      assignedManagerId: r.status !== 'pending' ? currentUserId : null,
      createdAt: daysAgo(r.daysAgo),
      updatedAt: daysAgo(Math.max(0, r.daysAgo - 1)),
    });
  }

  await batch.commit();

  // 2. Status logs for non-pending reports
  const logBatch = writeBatch(db);
  for (const { id, status } of reportIds) {
    if (status === 'pending') continue;

    // Always log in_progress first
    const logRef1 = doc(collection(db, 'statusLogs'));
    logBatch.set(logRef1, {
      reportId: id,
      status: 'in_progress',
      updatedBy: currentUserId,
      updatedByName: currentUserName,
      timestamp: daysAgo(2),
    });

    if (status === 'resolved' || status === 'closed') {
      const logRef2 = doc(collection(db, 'statusLogs'));
      logBatch.set(logRef2, {
        reportId: id,
        status: 'resolved',
        updatedBy: currentUserId,
        updatedByName: currentUserName,
        timestamp: daysAgo(1),
      });
    }

    if (status === 'closed') {
      const logRef3 = doc(collection(db, 'statusLogs'));
      logBatch.set(logRef3, {
        reportId: id,
        status: 'closed',
        updatedBy: currentUserId,
        updatedByName: currentUserName,
        timestamp: daysAgo(0),
      });
    }
  }
  await logBatch.commit();

  // 3. Resolutions for resolved/closed reports
  const resBatch = writeBatch(db);
  const resolutionMessages = [
    'Issue identified and repaired by maintenance team. Tested and confirmed working.',
    'Replacement parts installed. Full functionality restored.',
    'Root cause found and fixed. Area cleaned and inspected.',
    'Technician attended and resolved. Follow-up check scheduled.',
    'Temporary fix applied. Permanent solution pending procurement.',
  ];

  let msgIdx = 0;
  for (const { id, status } of reportIds) {
    if (status !== 'resolved' && status !== 'closed') continue;
    const resRef = doc(collection(db, 'resolutions'));
    resBatch.set(resRef, {
      reportId: id,
      managerId: currentUserId,
      description: resolutionMessages[msgIdx % resolutionMessages.length],
      afterPhotoURLs: [],
      resolvedAt: daysAgo(1),
    });
    msgIdx++;
  }
  await resBatch.commit();

  return REPORTS.length;
};
