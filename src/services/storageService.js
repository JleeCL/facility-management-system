// storageService.js

import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Storage
const storage = getStorage(app);

// Function to upload a file
export const uploadFile = async (file) => {
  const storageRef = ref(storage, 'uploads/' + file.name);
  try {
    await uploadBytes(storageRef, file);
    console.log('Uploaded a file!');
    return getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
};

// Function to get a file download URL
export const getFileURL = async (fileName) => {
  const fileRef = ref(storage, 'uploads/' + fileName);
  try {
    const url = await getDownloadURL(fileRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
  }
};
