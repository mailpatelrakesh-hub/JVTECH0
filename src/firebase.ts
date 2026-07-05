import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";
import { Candidate, SystemSettings, StaffUser, ScheduledInterview } from "./types";

// Firebase Applet Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQcURoMuOTlq_31wymebkoy8bTu7HSxDo",
  authDomain: "balmy-sorter-vwjkk.firebaseapp.com",
  projectId: "balmy-sorter-vwjkk",
  storageBucket: "balmy-sorter-vwjkk.firebasestorage.app",
  messagingSenderId: "711264923288",
  appId: "1:711264923288:web:68e4cffeb09afc429f2aed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific Database ID
export const db = getFirestore(app, "ai-studio-jvtechcrmportal-180ee165-d359-49f9-b5c8-2b3e9aa4ece3");

// Helper: Save all candidates to Firestore in a batch (or individual calls)
export async function saveCandidateToCloud(candidate: Candidate) {
  try {
    const docRef = doc(db, "candidates", candidate.id);
    await setDoc(docRef, candidate);
    console.log(`Cloud synced: Candidate ${candidate.id}`);
  } catch (error) {
    console.error("Failed to sync candidate to cloud:", error);
  }
}

// Helper: Delete candidate from Firestore
export async function deleteCandidateFromCloud(id: string) {
  try {
    const docRef = doc(db, "candidates", id);
    await deleteDoc(docRef);
    console.log(`Cloud deleted: Candidate ${id}`);
  } catch (error) {
    console.error("Failed to delete candidate from cloud:", error);
  }
}

// Helper: Load all candidates from Firestore
export async function loadCandidatesFromCloud(): Promise<Candidate[] | null> {
  try {
    const colRef = collection(db, "candidates");
    const snapshot = await getDocs(colRef);
    const list: Candidate[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Candidate);
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    console.error("Failed to load candidates from cloud:", error);
    return null;
  }
}

// Helper: Save System Settings to Firestore
export async function saveSettingsToCloud(settings: SystemSettings) {
  try {
    const docRef = doc(db, "settings", "systemSettings");
    await setDoc(docRef, settings);
    console.log("Cloud synced: System Settings");
  } catch (error) {
    console.error("Failed to sync settings to cloud:", error);
  }
}

// Helper: Load System Settings from Firestore
export async function loadSettingsFromCloud(): Promise<SystemSettings | null> {
  try {
    const docRef = doc(db, "settings", "systemSettings");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data() as SystemSettings;
    }
    return null;
  } catch (error) {
    console.error("Failed to load settings from cloud:", error);
    return null;
  }
}

// Helper: Save all staff users
export async function saveUserToCloud(user: StaffUser) {
  try {
    const docRef = doc(db, "users", user.id);
    await setDoc(docRef, user);
    console.log(`Cloud synced: User ${user.id}`);
  } catch (error) {
    console.error("Failed to sync user to cloud:", error);
  }
}

// Helper: Load all staff users
export async function loadUsersFromCloud(): Promise<StaffUser[] | null> {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const list: StaffUser[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as StaffUser);
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    console.error("Failed to load users from cloud:", error);
    return null;
  }
}

// Helper: Save scheduled interview to Firestore
export async function saveInterviewToCloud(interview: ScheduledInterview) {
  try {
    const docRef = doc(db, "interviews", interview.id);
    await setDoc(docRef, interview);
    console.log(`Cloud synced: Interview ${interview.id}`);
  } catch (error) {
    console.error("Failed to sync interview to cloud:", error);
  }
}

// Helper: Delete scheduled interview from Firestore
export async function deleteInterviewFromCloud(id: string) {
  try {
    const docRef = doc(db, "interviews", id);
    await deleteDoc(docRef);
    console.log(`Cloud deleted: Interview ${id}`);
  } catch (error) {
    console.error("Failed to delete interview from cloud:", error);
  }
}

// Helper: Load all scheduled interviews
export async function loadInterviewsFromCloud(): Promise<ScheduledInterview[] | null> {
  try {
    const colRef = collection(db, "interviews");
    const snapshot = await getDocs(colRef);
    const list: ScheduledInterview[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ScheduledInterview);
    });
    return list.length > 0 ? list : null;
  } catch (error) {
    console.error("Failed to load interviews from cloud:", error);
    return null;
  }
}

// Seed helper: Seeds Cloud database from local default/mock state if cloud is empty
export async function seedCloudFromLocal(
  localCandidates: Candidate[], 
  localSettings: SystemSettings, 
  localUsers: StaffUser[],
  localInterviews: ScheduledInterview[]
) {
  try {
    console.log("Seeding cloud database with initial data...");
    
    // Seed settings
    await saveSettingsToCloud(localSettings);

    // Seed candidates
    for (const cand of localCandidates) {
      await saveCandidateToCloud(cand);
    }

    // Seed users
    for (const user of localUsers) {
      await saveUserToCloud(user);
    }

    // Seed interviews
    for (const interview of localInterviews) {
      await saveInterviewToCloud(interview);
    }

    console.log("Seeding to Cloud database finished successfully!");
  } catch (error) {
    console.error("Failed to seed cloud database:", error);
  }
}
