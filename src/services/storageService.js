import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

export const uploadImage = async (file, path) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const uploadMultipleImages = async (files, reportId, type) => {
  const urls = await Promise.all(
    Array.from(files).map((file, i) => {
      const ext = file.name.split('.').pop();
      const path = `reports/${reportId}/${type}_${Date.now()}_${i}.${ext}`;
      return uploadImage(file, path);
    })
  );
  return urls;
};
