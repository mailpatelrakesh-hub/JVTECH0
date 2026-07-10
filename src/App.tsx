import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { Candidate, UserRole, InterviewStatus, MedicalStatus, VisaStatus, SystemSettings, StaffUser, ScheduledInterview } from './types';
import { INITIAL_CANDIDATES, TRADES_LIST, COUNTRIES_LIST } from './data';
import DashboardStats from './components/DashboardStats';
import CandidateLookup from './components/CandidateLookup';
import CandidateModal from './components/CandidateModal';
import MockWhatsAppModal from './components/MockWhatsAppModal';
import InterviewRegistry from './components/InterviewRegistry';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import CompanyLedgerView from './components/CompanyLedgerView';
import Logo from './components/Logo';
import DocumentHub from './components/DocumentHub';
import { 
  saveCandidateToCloud, 
  deleteCandidateFromCloud, 
  loadCandidatesFromCloud, 
  saveSettingsToCloud, 
  loadSettingsFromCloud, 
  saveUserToCloud, 
  loadUsersFromCloud, 
  saveInterviewToCloud, 
  deleteInterviewFromCloud, 
  loadInterviewsFromCloud, 
  seedCloudFromLocal,
  deleteUserFromCloud,
  db
} from './firebase';

import { onSnapshot, collection, doc } from 'firebase/firestore';

import { 
  Users, UserPlus, Search, Shield, Filter, RotateCcw, 
  MessageSquare, FileEdit, Trash2, Globe, Archive, 
  Sparkles, Download, Upload, Info, HeartHandshake,
  LayoutDashboard, Compass, Lock, CheckCircle2, ChevronRight, HelpCircle,
  Calendar, Award, LogOut, Settings, Building, Briefcase, ExternalLink,
  FolderDown, FileCheck
} from 'lucide-react';

export default function App() {
  // System Settings State loaded dynamically
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const defaultSettings: SystemSettings = {
      portalName: 'JV TECH TEST AND TRAINING CENTER, KUSHINAGAR',
      portalSubtitle: 'Secure CRM & Recruitment System',
      locationDetails: 'Kushinagar, Uttar Pradesh',
      supportContact: '+91 98765 43210',
      supportHelpText: 'Agar is information me koi gadbadi dikhe, ya koi update chahiye, toh turant hamare JV TECH TEST AND TRAINING CENTER, KUSHINAGAR office phone number par ya WhatsApp par consult karein. Passport details match hona anivary hai.',
      logoTextPrimary: 'JV TECH',
      logoTextSecondary: 'Test & Training Center',
      logoTextLocation: 'Kushinagar',
      heroImageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      isRegistrationOpen: true,
      isSmsAlertsActive: true,
      backupFrequency: 'Daily Auto',
      customTrades: [
        'Electrician',
        'Industrial Welder',
        'Pipe Fitter',
        'Plumber',
        'Mason',
        'Heavy Driver',
        'HVAC Technician',
        'Scaffolder',
        'General Helper',
      ],
      customCountries: [
        'Saudi Arabia',
        'United Arab Emirates',
        'Qatar',
        'Oman',
        'Kuwait',
        'Bahrain',
      ],
      geminiApiKey: ''
    };

    try {
      const stored = localStorage.getItem('JV_TECH_CRM_SYSTEM_SETTINGS');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error(e);
    }
    return defaultSettings;
  });

  const handleUpdateSystemSettings = (newSettings: SystemSettings) => {
    setSystemSettings(newSettings);
    localStorage.setItem('JV_TECH_CRM_SYSTEM_SETTINGS', JSON.stringify(newSettings));
    saveSettingsToCloud(newSettings); // Cloud sync
    // Dispatch custom event so that Logo.tsx can update in real-time
    window.dispatchEvent(new CustomEvent('crm-settings-updated'));
    triggerToast('System settings and website visual options updated successfully!');
  };

  // System Users State
  const [systemUsers, setSystemUsers] = useState<StaffUser[]>(() => {
    const defaultUsers: StaffUser[] = [
      { id: '1', name: 'Rakesh Patel (Admin)', username: '9519761108', role: 'Admin', password: 'Rakesh@1811', lastActive: 'Active Now', status: 'Active' },
      { id: '2', name: 'Office Desk Operator', username: 'staff', role: 'Staff', password: 'staff123', lastActive: '2 mins ago', status: 'Active' },
      { id: '3', name: 'Counselor Kavita', username: 'kavita', role: 'Staff', password: 'staff123', lastActive: '1 hour ago', status: 'Active' },
      { id: '4', name: 'Sub-Agent Mahesh', username: 'mahesh', role: 'Staff', password: 'staff123', lastActive: '2 days ago', status: 'Suspended' },
    ];
    try {
      const stored = localStorage.getItem('JV_TECH_CRM_SYSTEM_USERS');
      if (stored) {
        const parsed = JSON.parse(stored) as StaffUser[];
        // Check if there is an admin with 'admin' or old username and ensure '9519761108' with 'Rakesh@1811' is present
        const hasSpecificAdmin = parsed.some(u => u.username === '9519761108' && u.password === 'Rakesh@1811');
        if (!hasSpecificAdmin) {
          // Migrate old admins or prepend new admin
          const filtered = parsed.filter(u => u.username !== 'admin' && u.username !== '9519761108');
          filtered.unshift({ id: '1', name: 'Rakesh Patel (Admin)', username: '9519761108', role: 'Admin', password: 'Rakesh@1811', lastActive: 'Active Now', status: 'Active' });
          localStorage.setItem('JV_TECH_CRM_SYSTEM_USERS', JSON.stringify(filtered));
          return filtered;
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return defaultUsers;
  });

  const handleUpdateSystemUsers = async (newUsers: StaffUser[]) => {
    // Find if any user was deleted
    const deletedUsers = systemUsers.filter(prev => !newUsers.some(curr => curr.id === prev.id));
    // Find added or modified users
    const updatedOrAddedUsers = newUsers.filter(curr => {
      const prev = systemUsers.find(p => p.id === curr.id);
      return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
    });

    setSystemUsers(newUsers);
    localStorage.setItem('JV_TECH_CRM_SYSTEM_USERS', JSON.stringify(newUsers));

    // Delete removed users from cloud
    for (const user of deletedUsers) {
      await deleteUserFromCloud(user.id);
    }

    // Cloud sync only added/updated users
    for (const user of updatedOrAddedUsers) {
      await saveUserToCloud(user);
    }
  };

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('JV_TECH_CRM_IS_LOGGED_IN') === 'true';
  });
  const [loggedInUser, setLoggedInUser] = useState<string>(() => {
    return localStorage.getItem('JV_TECH_CRM_LOGGED_IN_USER') || '';
  });

  // State for active view (Office Portal vs Candidate self-lookup vs Interview list vs Admin Panel)
  const [activePortal, setActivePortal] = useState<'office' | 'candidate' | 'interviews' | 'adminPanel' | 'companyLedger' | 'documentHub'>(() => {
    const validPortals = ['office', 'candidate', 'interviews', 'adminPanel', 'companyLedger', 'documentHub'];
    const hash = window.location.hash.replace('#', '');
    if (validPortals.includes(hash)) {
      return hash as any;
    }
    return (localStorage.getItem('JV_TECH_CRM_ACTIVE_PORTAL') as any) || 'office';
  });
  
  // State for Role-based Access Control
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem('JV_TECH_CRM_USER_ROLE') as UserRole) || 'Admin';
  });

  // Candidate DB State
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>(() => {
    try {
      const saved = localStorage.getItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  const handleUpdateScheduledInterviews = async (newInterviews: ScheduledInterview[]) => {
    // Find if any interview was deleted
    const deletedInterviews = scheduledInterviews.filter(prev => !newInterviews.some(curr => curr.id === prev.id));
    // Find added or modified interviews
    const updatedOrAddedInterviews = newInterviews.filter(curr => {
      const prev = scheduledInterviews.find(p => p.id === curr.id);
      return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
    });

    setScheduledInterviews(newInterviews);
    localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(newInterviews));

    // Delete removed interviews from cloud
    for (const item of deletedInterviews) {
      await deleteInterviewFromCloud(item.id);
    }

    // Cloud sync only added/updated interviews
    for (const item of updatedOrAddedInterviews) {
      await saveInterviewToCloud(item);
    }
  };


  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterviewName, setSelectedInterviewName] = useState<string>('All');
  const [selectedInterviewDate, setSelectedInterviewDate] = useState<string>('All');
  const [selectedStage, setSelectedStage] = useState<string>('All'); // 'All' or '1' - '6' or 'Archived'

  // Modals Toggles State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<'basic' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6' | 'offer_letter'>('basic');
  const [whatsappCandidate, setWhatsappCandidate] = useState<Candidate | null>(null);

  // Success message toast simulation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Date selection for bulk documents download
  const [bulkDownloadDate, setBulkDownloadDate] = useState<string>('');

  // Initialize candidates database and fetch cloud Firestore updates with real-time sync
  useEffect(() => {
    // 1. Instantly load local cache for offline-first responsiveness
    const savedCandidates = localStorage.getItem('JV_TECH_CRM_CANDIDATES');
    let currentLocalCandidates = INITIAL_CANDIDATES;
    if (savedCandidates) {
      try {
        currentLocalCandidates = JSON.parse(savedCandidates);
        setCandidates(currentLocalCandidates);
      } catch (e) {
        console.error('Error parsing candidates from localStorage.', e);
        setCandidates(INITIAL_CANDIDATES);
      }
    } else {
      setCandidates(INITIAL_CANDIDATES);
    }
    setLoading(false);

    // 2. Setup real-time listeners for instant cross-device updates
    let isSubscribed = true;
    let unsubCandidates: (() => void) | undefined;
    let unsubSettings: (() => void) | undefined;
    let unsubUsers: (() => void) | undefined;
    let unsubInterviews: (() => void) | undefined;

    const setupListeners = () => {
      if (!isSubscribed) return;

      console.log("Setting up real-time Firestore synchronization listeners...");

      // A. Candidates real-time listener
      unsubCandidates = onSnapshot(collection(db, "candidates"), (snapshot) => {
        const list: Candidate[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Candidate);
        });
        console.log(`Real-time Candidates Update: Synced ${list.length} candidates.`);
        setCandidates(list);
        localStorage.setItem('JV_TECH_CRM_CANDIDATES', JSON.stringify(list));
      }, (error) => {
        console.error("Candidates real-time listener failed:", error);
      });

      // B. System Settings real-time listener
      unsubSettings = onSnapshot(doc(db, "settings", "systemSettings"), (docSnap) => {
        if (docSnap.exists()) {
          const settings = docSnap.data() as SystemSettings;
          console.log("Real-time System Settings Update received.");
          setSystemSettings(settings);
          localStorage.setItem('JV_TECH_CRM_SYSTEM_SETTINGS', JSON.stringify(settings));
        }
      }, (error) => {
        console.error("Settings real-time listener failed:", error);
      });

      // C. Staff Users real-time listener
      unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const list: StaffUser[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as StaffUser);
        });
        if (list.length > 0) {
          console.log(`Real-time Staff Users Update: Synced ${list.length} users.`);
          setSystemUsers(list);
          localStorage.setItem('JV_TECH_CRM_SYSTEM_USERS', JSON.stringify(list));
        }
      }, (error) => {
        console.error("Users real-time listener failed:", error);
      });

      // D. Scheduled Interviews real-time listener
      unsubInterviews = onSnapshot(collection(db, "interviews"), (snapshot) => {
        const list: ScheduledInterview[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ScheduledInterview);
        });
        console.log(`Real-time Scheduled Interviews Update: Synced ${list.length} interviews.`);
        setScheduledInterviews(list);
        localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(list));
      }, (error) => {
        console.error("Interviews real-time listener failed:", error);
      });
    };

    const syncCloudData = async () => {
      try {
        console.log("Checking if Firestore database needs seeding...");
        const cloudSettings = await loadSettingsFromCloud();

        if (!cloudSettings) {
          // BRAND NEW DATABASE - Seed everything to cloud first
          console.log("Cloud settings empty. Seeding default initial state to cloud...");
          await saveSettingsToCloud(systemSettings);

          const candidatesToSeed = currentLocalCandidates.length > 0 ? currentLocalCandidates : INITIAL_CANDIDATES;
          for (const cand of candidatesToSeed) {
            await saveCandidateToCloud(cand);
          }

          for (const u of systemUsers) {
            await saveUserToCloud(u);
          }

          for (const i of scheduledInterviews) {
            await saveInterviewToCloud(i);
          }
          console.log("Cloud database seeding finished successfully.");
        }

        // Setup real-time listeners
        setupListeners();
      } catch (err) {
        console.error("Firestore initialization/sync failed:", err);
        // Fallback to setting up real-time listeners anyway
        setupListeners();
      }
    };

    syncCloudData();

    return () => {
      isSubscribed = false;
      if (unsubCandidates) unsubCandidates();
      if (unsubSettings) unsubSettings();
      if (unsubUsers) unsubUsers();
      if (unsubInterviews) unsubInterviews();
    };
  }, []);

  // Hash Routing and Session persistence listeners
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validPortals = ['office', 'candidate', 'interviews', 'adminPanel', 'companyLedger'];
      if (validPortals.includes(hash)) {
        setActivePortal(hash as any);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Check initial hash on load
    const initialHash = window.location.hash.replace('#', '');
    const validPortals = ['office', 'candidate', 'interviews', 'adminPanel', 'companyLedger'];
    if (validPortals.includes(initialHash)) {
      setActivePortal(initialHash as any);
    } else {
      window.location.hash = activePortal;
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Sync activePortal with window.location.hash and localStorage
  useEffect(() => {
    if (window.location.hash.replace('#', '') !== activePortal) {
      window.location.hash = activePortal;
    }
    localStorage.setItem('JV_TECH_CRM_ACTIVE_PORTAL', activePortal);
  }, [activePortal]);

  // Protect Admin Panel access
  useEffect(() => {
    if (activePortal === 'adminPanel' && isLoggedIn && userRole !== 'Admin') {
      setActivePortal('office');
    }
  }, [activePortal, isLoggedIn, userRole]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLoginSuccess = (name: string, role: UserRole) => {
    setIsLoggedIn(true);
    setLoggedInUser(name);
    setUserRole(role);
    localStorage.setItem('JV_TECH_CRM_IS_LOGGED_IN', 'true');
    localStorage.setItem('JV_TECH_CRM_LOGGED_IN_USER', name);
    localStorage.setItem('JV_TECH_CRM_USER_ROLE', role);
    
    // Auto-restore target portal if they had a hash, or default to office
    const validPortals = ['office', 'candidate', 'interviews', 'adminPanel', 'companyLedger'];
    const hash = window.location.hash.replace('#', '');
    if (validPortals.includes(hash)) {
      if (hash === 'adminPanel' && role !== 'Admin') {
        setActivePortal('office');
      } else {
        setActivePortal(hash as any);
      }
    } else {
      setActivePortal('office');
    }
    triggerToast(`Switched to active session: ${name} (${role})`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setLoggedInUser('');
    localStorage.removeItem('JV_TECH_CRM_IS_LOGGED_IN');
    localStorage.removeItem('JV_TECH_CRM_LOGGED_IN_USER');
    localStorage.removeItem('JV_TECH_CRM_USER_ROLE');
    localStorage.removeItem('JV_TECH_CRM_ACTIVE_PORTAL');
    setActivePortal('office');
    window.location.hash = 'office';
    triggerToast('Secure session closed. Terminated safely.');
  };

  // Download all candidate documents together in a single ZIP file directly from dashboard row
  const handleDownloadAllDocsDirectly = async (cand: Candidate) => {
    try {
      const zip = new JSZip();
      let filesAddedCount = 0;

      const addFileToZip = (fileName: string, fileUrl?: string) => {
        if (!fileName) return;
        
        if (fileUrl && fileUrl.startsWith('data:')) {
          const base64Index = fileUrl.indexOf(';base64,');
          if (base64Index !== -1) {
            const base64Data = fileUrl.substring(base64Index + 8);
            zip.file(fileName, base64Data, { base64: true });
            filesAddedCount++;
          } else {
            const plainIndex = fileUrl.indexOf(',');
            const textData = decodeURIComponent(fileUrl.substring(plainIndex + 1));
            zip.file(fileName, textData);
            filesAddedCount++;
          }
        } else {
          // Fallback or simulated file
          zip.file(fileName, `Simulated document file content for ${fileName}`);
          filesAddedCount++;
        }
      };

      // 1. Stage 2 Medical Report
      if (cand.stage2?.medicalReportName) {
        addFileToZip(cand.stage2.medicalReportName, cand.stage2.medicalReportUrl);
      }

      // 2. Stage 3 Checklist Uploaded Docs
      if (cand.stage3?.uploadedDocs) {
        cand.stage3.uploadedDocs.forEach((doc) => {
          if (doc.name) {
            addFileToZip(doc.name, doc.url);
          }
        });
      }

      // 3. Stage 4 Visa Copy
      if (cand.stage4?.visaCopyName) {
        addFileToZip(cand.stage4.visaCopyName, cand.stage4.visaCopyUrl);
      }

      // 4. Stage 5 Company Ledger Screenshot
      if (cand.stage5?.companyLedgerScreenshotName) {
        addFileToZip(cand.stage5.companyLedgerScreenshotName, cand.stage5.companyLedgerScreenshotUrl);
      }

      // 5. Stage 6 Flight Ticket
      if (cand.stage6?.flightTicketName) {
        addFileToZip(cand.stage6.flightTicketName, cand.stage6.flightTicketUrl);
      }

      if (filesAddedCount === 0) {
        alert(`${cand.name} ke paas filhal koi uploaded documents nahi hain!`);
        return;
      }

      triggerToast(`Creating ZIP archive for ${cand.name}...`);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safeCandidateName = cand.name ? cand.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Candidate';
      link.download = `${safeCandidateName}_All_Documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Successfully downloaded ZIP containing ${filesAddedCount} documents!`);
    } catch (error) {
      console.error("ZIP Generation error:", error);
      alert("Documents ZIP compilation error occurred.");
    }
  };

  // Download all documents of all selected candidates on a selected date, categorized by candidate folders
  const handleBulkDownloadDocsByDate = async (targetDate: string) => {
    if (!targetDate) {
      alert("Please select a date first!");
      return;
    }

    const selectedOnDate = candidates.filter(c => 
      c.stage1?.interviewStatus === InterviewStatus.Selected && 
      c.stage1?.interviewDate === targetDate
    );

    if (selectedOnDate.length === 0) {
      alert(`${targetDate} ko koi bhi Selected candidate nahi mila.`);
      return;
    }

    try {
      const zip = new JSZip();
      let totalFilesCount = 0;
      triggerToast(`Compiling documents for ${selectedOnDate.length} selected candidates...`);

      const addFileToZipInFolder = (folderName: string, fileName: string, fileUrl?: string) => {
        if (!fileName) return;
        
        const candidateFolder = zip.folder(folderName);
        if (!candidateFolder) return;

        if (fileUrl && fileUrl.startsWith('data:')) {
          const base64Index = fileUrl.indexOf(';base64,');
          if (base64Index !== -1) {
            const base64Data = fileUrl.substring(base64Index + 8);
            candidateFolder.file(fileName, base64Data, { base64: true });
            totalFilesCount++;
          } else {
            const plainIndex = fileUrl.indexOf(',');
            const textData = decodeURIComponent(fileUrl.substring(plainIndex + 1));
            candidateFolder.file(fileName, textData);
            totalFilesCount++;
          }
        } else {
          // Fallback or simulated file
          candidateFolder.file(fileName, `Simulated document file content for ${fileName}`);
          totalFilesCount++;
        }
      };

      selectedOnDate.forEach((cand) => {
        // Safe candidate folder name to avoid ZIP corruption
        const safeCandidateFolderName = `${cand.name ? cand.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Candidate'}_${cand.passportNumber || 'NoPassport'}`;

        // 1. Stage 2 Medical Report
        if (cand.stage2?.medicalReportName) {
          addFileToZipInFolder(safeCandidateFolderName, cand.stage2.medicalReportName, cand.stage2.medicalReportUrl);
        }

        // 2. Stage 3 Checklist Uploaded Docs
        if (cand.stage3?.uploadedDocs) {
          cand.stage3.uploadedDocs.forEach((doc) => {
            if (doc.name) {
              addFileToZipInFolder(safeCandidateFolderName, doc.name, doc.url);
            }
          });
        }

        // 3. Stage 4 Visa Copy
        if (cand.stage4?.visaCopyName) {
          addFileToZipInFolder(safeCandidateFolderName, cand.stage4.visaCopyName, cand.stage4.visaCopyUrl);
        }

        // 4. Stage 5 Company Ledger Screenshot
        if (cand.stage5?.companyLedgerScreenshotName) {
          addFileToZipInFolder(safeCandidateFolderName, cand.stage5.companyLedgerScreenshotName, cand.stage5.companyLedgerScreenshotUrl);
        }

        // 5. Stage 6 Flight Ticket
        if (cand.stage6?.flightTicketName) {
          addFileToZipInFolder(safeCandidateFolderName, cand.stage6.flightTicketName, cand.stage6.flightTicketUrl);
        }
      });

      if (totalFilesCount === 0) {
        alert("In selected candidates ke paas filhal koi uploaded documents nahi hain.");
        return;
      }

      triggerToast(`Creating bulk ZIP archive for ${selectedOnDate.length} candidates...`);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Selected_Candidates_Docs_${targetDate.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Successfully downloaded ZIP containing ${totalFilesCount} documents for ${selectedOnDate.length} candidates!`);
    } catch (err) {
      console.error("Bulk ZIP generation error:", err);
      alert("Documents compilation failed.");
    }
  };

  // Sync state helper
  const saveToDB = async (updatedList: Candidate[]) => {
    // Find candidates that were deleted
    const deletedCandidates = candidates.filter(prev => !updatedList.some(curr => curr.id === prev.id));
    // Find candidates that are new or actually modified
    const updatedOrNewCandidates = updatedList.filter(curr => {
      const prev = candidates.find(p => p.id === curr.id);
      return !prev || JSON.stringify(prev) !== JSON.stringify(curr);
    });

    setCandidates(updatedList);
    localStorage.setItem('JV_TECH_CRM_CANDIDATES', JSON.stringify(updatedList));

    // Delete removed candidates from cloud
    for (const cand of deletedCandidates) {
      await deleteCandidateFromCloud(cand.id);
    }

    // Cloud sync only added/modified candidates
    for (const cand of updatedOrNewCandidates) {
      await saveCandidateToCloud(cand);
    }
  };

  // Add/Edit Save Handler
  const handleSaveCandidate = (candidateToSave: Candidate) => {
    const exists = candidates.some((c) => c.id === candidateToSave.id);
    let updated: Candidate[];
    if (exists) {
      updated = candidates.map((c) => (c.id === candidateToSave.id ? candidateToSave : c));
      triggerToast(`Candidate ${candidateToSave.name} updated successfully!`);
    } else {
      updated = [candidateToSave, ...candidates];
      triggerToast(`Candidate ${candidateToSave.name} registered successfully in system!`);
    }
    saveToDB(updated);
    setIsModalOpen(false);
    setSelectedCandidate(null);
  };

  // Delete Handler (Admin & Staff)
  const handleDeleteCandidate = async (id: string, name: string) => {
    if (window.confirm(`Kya aap sach me candidate "${name}" ka record delete karna chahte hain? Warning: Ye action permanently delete ho jayega!`)) {
      const updated = candidates.filter((c) => c.id !== id);
      await saveToDB(updated);
      triggerToast(`Candidate "${name}" ka record safaltapoorvak delete ho gaya.`);
    }
  };

  // Quick Action: Mark Complete / Promote Candidate to next Stage
  const handleQuickPromote = (id: string) => {
    const updated = candidates.map((c) => {
      if (c.id === id) {
        let nextStage = c.stage;
        let updateStage1 = { ...c.stage1 };
        let updateStage2 = { ...c.stage2 };
        let updateStage4 = { ...c.stage4 };

        if (c.stage === 1) {
          nextStage = 2;
        } else if (c.stage === 2) {
          nextStage = 3;
        } else if (c.stage === 3) {
          nextStage = 4;
        } else if (c.stage === 4) {
          nextStage = 5;
        } else if (c.stage === 5) {
          nextStage = 6;
          updateStage1.offerLetterSigned = true;
        } else if (c.stage === 6) {
          nextStage = 7;
          updateStage2.medicalStatus = MedicalStatus.Fit;
        } else if (c.stage === 7) {
          nextStage = 8;
          updateStage4.visaStatus = VisaStatus.Received;
        } else if (c.stage === 8) {
          nextStage = 9;
        }

        return {
          ...c,
          stage: nextStage,
          stage1: updateStage1,
          stage2: updateStage2,
          stage4: updateStage4,
        };
      }
      return c;
    });
    saveToDB(updated);
    triggerToast('Candidate promoted to next workflow stage!');
  };

  // Database Backup Actions (Durable JSON export/import)
  const handleExportDatabase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(candidates, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `JV_Tech_CRM_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    triggerToast('JSON Database backup downloaded successfully!');
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].passportNumber || parsed[0].name)) {
            
            // Ask user whether they want to MERGE/APPEND or OVERWRITE
            const userChoice = window.confirm(
              `Database file successfully loaded with ${parsed.length} candidates.\n\n` +
              `• Click [OK] to MERGE & APPEND (Updates duplicate candidates matching by Passport Number and adds all new candidates to the current registry).\n\n` +
              `• Click [Cancel] to OVERWRITE (Replaces the entire current database list with this file's records).`
            );

            if (userChoice) {
              // Merge algorithm based on passport number (case insensitive)
              const currentList = [...candidates];
              let addedCount = 0;
              let updatedCount = 0;

              parsed.forEach((newCand: Candidate) => {
                const normalizedPassport = (newCand.passportNumber || '').trim().toUpperCase();
                const existingIndex = currentList.findIndex(
                  (c) => c.passportNumber.trim().toUpperCase() === normalizedPassport
                );

                if (existingIndex > -1) {
                  // Merge properties, giving precedence to imported ones
                  currentList[existingIndex] = {
                    ...currentList[existingIndex],
                    ...newCand,
                    // Preserve ID to prevent broken links
                    id: currentList[existingIndex].id
                  };
                  updatedCount++;
                } else {
                  // Generate new id if not present
                  const candidateToAppend = {
                    ...newCand,
                    id: newCand.id || `CAND-${Math.round(Math.random() * 10000).toString().padStart(4, '0')}`,
                    passportNumber: normalizedPassport
                  };
                  currentList.push(candidateToAppend);
                  addedCount++;
                }
              });

              saveToDB(currentList);
              triggerToast(`Bulk Import complete: ${addedCount} new added, ${updatedCount} existing candidates updated!`);
            } else {
              // Direct replacement
              saveToDB(parsed);
              triggerToast(`Successfully restored database with ${parsed.length} candidate files!`);
            }
          } else {
            alert('Format Error: File structure must be a list of Candidate objects!');
          }
        } catch (err) {
          alert('Parsing Error: Failed to read backup JSON file.');
        }
      };
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedInterviewName('All');
    setSelectedInterviewDate('All');
    setSelectedStage('All');
  };

  // Unique Interview Names (Client / Company) from candidate profiles
  const uniqueInterviewNames = useMemo(() => {
    const namesSet = new Set<string>();
    candidates.forEach((c) => {
      const name = c.companyName?.trim();
      if (name) {
        namesSet.add(name);
      }
    });
    return Array.from(namesSet).sort();
  }, [candidates]);

  // Unique Interview Dates from candidate profiles
  const uniqueInterviewDates = useMemo(() => {
    const datesSet = new Set<string>();
    candidates.forEach((c) => {
      const date = c.stage1?.interviewDate || c.createdDate;
      if (date) {
        datesSet.add(date);
      }
    });
    return Array.from(datesSet).sort((a, b) => b.localeCompare(a));
  }, [candidates]);

  // Filter candidates list for table
  const filteredCandidates = candidates.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.trade || '').toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q);

    const matchesInterviewName = selectedInterviewName === 'All' || (c.companyName || '').trim() === selectedInterviewName;
    const matchesInterviewDate = selectedInterviewDate === 'All' || (c.stage1?.interviewDate || c.createdDate) === selectedInterviewDate;

    let matchesStage = true;
    if (selectedStage === 'Archived') {
      matchesStage = c.isArchived === true;
    } else if (selectedStage === 'All') {
      matchesStage = c.isArchived === false; // Active dashboard hides archived by default
    } else {
      matchesStage = c.stage.toString() === selectedStage && c.isArchived === false;
    }

    return matchesSearch && matchesInterviewName && matchesInterviewDate && matchesStage;
  });

  const getStageLabel = (stageNum: number) => {
    switch (stageNum) {
      case 1: return '1. All File Workplace';
      case 2: return '2. Registration';
      case 3: return '3. Interview Documents';
      case 4: return '4. Candidate Document';
      case 5: return '5. Offer Letter';
      case 6: return '6. Medical';
      case 7: return '7. Visa Process';
      case 8: return '8. Payment';
      case 9: return '9. Flight';
      default: return 'Deployed';
    }
  };

  // Dynamic selection dates extraction for bulk download
  const uniqueSelectionDates: string[] = Array.from(
    new Set<string>(
      candidates
        .filter((c) => c.stage1?.interviewStatus === InterviewStatus.Selected && c.stage1?.interviewDate)
        .map((c) => c.stage1.interviewDate as string)
    )
  ).sort((a: string, b: string) => b.localeCompare(a));

  const effectiveDownloadDate = bulkDownloadDate || (uniqueSelectionDates[0] || '');

  const selectedCandidatesOnDate = candidates.filter((c) => 
    c.stage1?.interviewStatus === InterviewStatus.Selected && 
    c.stage1?.interviewDate === effectiveDownloadDate
  );

  // Render login screen early if not authenticated
  if (!isLoggedIn) {
    if (activePortal === 'candidate') {
      return (
        <div className="min-h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between">
          {toastMessage && (
            <div id="crm-toast" className="fixed bottom-5 right-5 z-50 bg-slate-950 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold">{toastMessage}</span>
            </div>
          )}
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <CandidateLookup candidates={candidates} onBackToLogin={() => setActivePortal('office')} />
          </div>
        </div>
      );
    }

    return (
      <>
        {toastMessage && (
          <div id="crm-toast" className="fixed bottom-5 right-5 z-50 bg-slate-950 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}
        <LoginPage 
          onLoginSuccess={handleLoginSuccess} 
          onCandidateBypass={() => setActivePortal('candidate')} 
          systemSettings={systemSettings}
          systemUsers={systemUsers}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden antialiased">
      
      {/* Toast Notification Popups */}
      {toastMessage && (
        <div id="crm-toast" className="fixed bottom-5 right-5 z-50 bg-slate-950 border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex h-full shrink-0">
        <div className="p-5 border-b border-slate-100">
          <Logo size="sm" />
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <div className="px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Main Menu</div>
          <button 
            onClick={() => setActivePortal('office')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
              activePortal === 'office'
                ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            <span>Dashboard Panel</span>
          </button>
          
          <button 
            onClick={() => setActivePortal('candidate')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
              activePortal === 'candidate'
                ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Compass className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            <span>Candidate Lookup</span>
          </button>

          <button 
            onClick={() => setActivePortal('interviews')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
              activePortal === 'interviews'
                ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            <span>Interview & Selection</span>
          </button>

          <button 
            onClick={() => setActivePortal('companyLedger')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
              activePortal === 'companyLedger'
                ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Building className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            <span>Company Ledgers</span>
          </button>

          <button 
            onClick={() => setActivePortal('documentHub')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
              activePortal === 'documentHub'
                ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <FolderDown className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
            <span>Document Hub</span>
          </button>

          {userRole === 'Admin' && (
            <button 
              onClick={() => setActivePortal('adminPanel')}
              className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-all text-sm font-semibold cursor-pointer ${
                activePortal === 'adminPanel'
                  ? 'bg-brand-50 text-brand-700 border-r-4 border-brand-500'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              <span>Admin Controls</span>
            </button>
          )}
        </nav>
        
        {/* User Card */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-250 flex items-center justify-center text-lg shrink-0 shadow-xs overflow-hidden">
              {(() => {
                const matched = systemUsers.find(u => u.name === loggedInUser || u.username === loggedInUser);
                if (matched?.photoUrl) {
                  return <img src={matched.photoUrl} alt={matched.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
                }
                return matched?.avatarName ? matched.avatarName.split(' ')[0] : (userRole === 'Admin' ? '🤵‍♂️' : '👤');
              })()}
            </div>
            <div className="text-xs overflow-hidden leading-tight">
              <p className="font-bold text-slate-800 truncate" title={loggedInUser || 'Admin User'}>{loggedInUser || 'Admin User'}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                  userRole === 'Admin' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  {userRole}
                </span>
                {(() => {
                  const matched = systemUsers.find(u => u.name === loggedInUser || u.username === loggedInUser);
                  if (matched?.avatarName) {
                    const label = matched.avatarName.substring(matched.avatarName.indexOf(' ') + 1);
                    return <span className="text-[8px] text-slate-400 font-bold truncate max-w-[45px]" title={label}>{label}</span>;
                  }
                  return null;
                })()}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-lg transition-colors cursor-pointer"
            title="Secure Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Header Brand Toggle */}
            <div className="md:hidden">
              <Logo size="sm" />
            </div>
            
            <h1 className="hidden md:block text-lg font-bold text-slate-800 tracking-tight font-display">
              {activePortal === 'office' ? 'Recruitment Workflow Dashboard' : 
               activePortal === 'interviews' ? 'Interview & Selection Registry' : 
               activePortal === 'companyLedger' ? 'Company Ledgers & Placements' :
               activePortal === 'documentHub' ? 'Document & List Center' :
               activePortal === 'adminPanel' ? 'Admin Controls & Parameters' : 'Candidate Status Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switchers for mobile view */}
            <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActivePortal('office')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activePortal === 'office' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                CRM
              </button>
              <button
                onClick={() => setActivePortal('interviews')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activePortal === 'interviews' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Interview
              </button>
              {userRole === 'Admin' && (
                <button
                  onClick={() => setActivePortal('adminPanel')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    activePortal === 'adminPanel' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Admin
                </button>
              )}
              <button
                onClick={() => setActivePortal('candidate')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  activePortal === 'candidate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Lookup
              </button>
            </div>

            {/* Quick Search inside Header for CRM */}
            {activePortal === 'office' && (
              <div className="relative hidden sm:block">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="w-4 h-4 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search Passport/Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-100 border border-transparent focus:bg-white focus:border-slate-200 focus:ring-1 focus:ring-brand-500 rounded-lg py-1.5 pl-9 pr-4 text-xs w-56 transition-all outline-none text-slate-700 font-medium"
                />
              </div>
            )}

            {/* Main Action Register Trigger Button */}
            {activePortal === 'office' && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setSelectedCandidate(null);
                    setModalInitialTab('basic');
                    setIsModalOpen(true);
                  }}
                  className="bg-brand-500 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm hover:bg-brand-600 transition-all outline-none flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ New Registration</span>
                </button>
              </div>
            )}

            {/* Session logout button right in header */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              title="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Portal Routing and content insertion */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
            <span className="animate-spin text-2xl font-bold mr-2">●</span> Loading candidates...
          </div>
        ) : activePortal === 'candidate' ? (
          /* Public Lookup View */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <CandidateLookup 
              candidates={candidates} 
              systemSettings={systemSettings}
            />
          </div>
        ) : activePortal === 'interviews' ? (
          /* Interview & Selection Registry View */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <InterviewRegistry 
              candidates={candidates} 
              customTrades={systemSettings.customTrades}
              systemSettings={systemSettings}
              onUpdateSystemSettings={handleUpdateSystemSettings}
              scheduledInterviews={scheduledInterviews}
              onUpdateScheduledInterviews={handleUpdateScheduledInterviews}
              onEditCandidate={(cand) => {
                setSelectedCandidate(cand);
                setModalInitialTab('basic');
                setIsModalOpen(true);
              }} 
              onDeleteCandidate={handleDeleteCandidate}
              onSaveCandidate={handleSaveCandidate}
            />
          </div>
        ) : activePortal === 'companyLedger' ? (
          /* Company Ledger Placements View */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <CompanyLedgerView 
              candidates={candidates}
              userRole={userRole}
              onEditCandidate={(cand) => {
                setSelectedCandidate(cand);
                setModalInitialTab('basic');
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : activePortal === 'documentHub' ? (
          /* Secure Document Hub */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <DocumentHub 
              candidates={candidates}
              triggerToast={triggerToast}
              onEditCandidate={(cand) => {
                setSelectedCandidate(cand);
                setModalInitialTab('basic');
                setIsModalOpen(true);
              }}
            />
          </div>
        ) : activePortal === 'adminPanel' && userRole === 'Admin' ? (
          /* Secure Admin Panel */
          <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
            <AdminPanel 
              candidates={candidates}
              systemSettings={systemSettings}
              onUpdateSystemSettings={handleUpdateSystemSettings}
              onImportDatabase={handleImportDatabase}
              onExportDatabase={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(candidates, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href",     dataStr);
                downloadAnchor.setAttribute("download", `JV_Tech_CRM_Backup_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
                triggerToast('Database Backup file downloaded successfully.');
              }}
              onUpdateCandidatesList={saveToDB}
              triggerToast={triggerToast}
              systemUsers={systemUsers}
              onUpdateSystemUsers={handleUpdateSystemUsers}
            />
          </div>
        ) : (
          /* Main Dashboard Content Layout */
          <div className="flex-1 flex flex-col space-y-6 p-6 md:p-8 max-w-7xl w-full mx-auto">
            
            {/* Welcome Greeting Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👋</span>
                  <h2 className="text-lg md:text-xl font-black tracking-tight font-display">
                    Welcome Back, <span className="text-brand-400 font-extrabold">{loggedInUser || 'Rakesh Patel'}</span>!
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-xl shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-xl overflow-hidden shrink-0">
                  {(() => {
                    const matched = systemUsers.find(u => u.name === loggedInUser || u.username === loggedInUser);
                    if (matched?.photoUrl) {
                      return <img src={matched.photoUrl} alt={matched.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />;
                    }
                    return matched?.avatarName ? matched.avatarName.split(' ')[0] : '🤵‍♂️';
                  })()}
                </div>
                <div className="text-left font-mono">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Session</span>
                  <strong className="block text-xs text-emerald-400 font-extrabold uppercase mt-0.5">{userRole} ACCESS</strong>
                </div>
              </div>
            </div>

            {/* Top Stat widgets */}
            <DashboardStats candidates={candidates} userRole={userRole} />

            {/* Date-wise Selection Bulk Documents Downloader */}
            <div id="bulk-downloader-card" className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-extrabold text-slate-800 text-sm tracking-tight font-display uppercase">
                      Date-wise Selection Bulk Documents Downloader
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                    Ek particular date par select hue sabhi candidates ke documents unke naam ke folders me ek sath single ZIP file me download karein.
                  </p>
                </div>
                
                {/* Date Controls */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Registered Selection Dates</span>
                    <select
                      value={bulkDownloadDate || (uniqueSelectionDates[0] || '')}
                      onChange={(e) => setBulkDownloadDate(e.target.value)}
                      className="bg-white px-3 py-1.5 rounded-xl border border-slate-250 text-xs font-bold text-slate-700 outline-none hover:bg-slate-50 focus:ring-1 focus:ring-brand-500 min-w-[200px]"
                    >
                      <option value="">-- Choose Selection Date --</option>
                      {uniqueSelectionDates.map((dateStr) => (
                        <option key={dateStr} value={dateStr}>
                          {new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} ({dateStr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Or Enter/Pick Date</span>
                    <input
                      type="date"
                      value={bulkDownloadDate}
                      onChange={(e) => setBulkDownloadDate(e.target.value)}
                      className="bg-white px-3 py-1 bg-white rounded-xl border border-slate-250 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-brand-500 h-[34px]"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Actions Row */}
              {effectiveDownloadDate && (
                <div className="bg-slate-100/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200/60">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Selected Date:</span>
                      <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                        {effectiveDownloadDate}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        selectedCandidatesOnDate.length > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        🎯 {selectedCandidatesOnDate.length} Selected Candidates Found
                      </span>
                    </div>
                    {selectedCandidatesOnDate.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Candidates List:</span>
                        {selectedCandidatesOnDate.map((c) => (
                          <span key={c.id} className="text-xs bg-white border border-slate-200 px-2.5 py-0.5 rounded-lg text-slate-700 font-bold shadow-2xs">
                            🤵‍♂️ {c.name} ({c.passportNumber})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-semibold">
                        ⚠️ Is date par koi bhi selected candidate registered nahi hai. Kripya list me se registered selection date choose karein.
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleBulkDownloadDocsByDate(effectiveDownloadDate)}
                    disabled={selectedCandidatesOnDate.length === 0}
                    className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs transition-all outline-none cursor-pointer shrink-0 ${
                      selectedCandidatesOnDate.length > 0
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 shadow-emerald-200/30'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All Documents ({selectedCandidatesOnDate.length} Candidates)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Horizontal Workflow Stages Progress Filter */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block pl-1">
                Recruitment Lifecycle Pipeline Stages (8 Stages Workflow Filters)
              </span>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 flex gap-1 overflow-x-auto scrollbar-thin">
                <button
                  onClick={() => setSelectedStage('All')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === 'All'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75">Workspace</span>
                  <span className="text-xs font-semibold">All Candidates</span>
                </button>
                <button
                  onClick={() => setSelectedStage('1')}
                  className={`flex-1 min-w-[135px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '1'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 1</span>
                  <span className="text-xs font-semibold whitespace-nowrap">All File Workplace</span>
                </button>
                <button
                  onClick={() => setSelectedStage('2')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '2'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 2</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Registration</span>
                </button>
                <button
                  onClick={() => setSelectedStage('3')}
                  className={`flex-1 min-w-[130px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '3'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 3</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Interview Docs</span>
                </button>
                <button
                  onClick={() => setSelectedStage('4')}
                  className={`flex-1 min-w-[130px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '4'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 4</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Candidate Doc</span>
                </button>
                <button
                  onClick={() => setSelectedStage('5')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '5'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 5</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Offer Letter</span>
                </button>
                <button
                  onClick={() => setSelectedStage('6')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '6'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 6</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Medical</span>
                </button>
                <button
                  onClick={() => setSelectedStage('7')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '7'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 7</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Visa Process</span>
                </button>
                <button
                  onClick={() => setSelectedStage('8')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '8'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 8</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Payment</span>
                </button>
                <button
                  onClick={() => setSelectedStage('9')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === '9'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75 font-mono">Stage 9</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Flight</span>
                </button>
                <button
                  onClick={() => setSelectedStage('Archived')}
                  className={`flex-1 min-w-[110px] py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                    selectedStage === 'Archived'
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-[9px] uppercase font-bold opacity-75">📂 Archived</span>
                  <span className="text-xs font-semibold whitespace-nowrap">Completed</span>
                </button>
              </div>
            </div>

            {/* Master Candidate Grid List Panel */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Filter Sub Bar panel */}
              <div className="bg-slate-50/80 border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight font-display">
                    {selectedStage === 'All' ? 'Active Worklist Master' : `Filtered List: ${getStageLabel(selectedStage === 'Archived' ? 9 : Number(selectedStage))}`}
                  </h3>
                  <p className="text-xs text-slate-400">Showing {filteredCandidates.length} filtered candidate records from system database.</p>
                </div>
                
                {/* Advanced filter dropdowns row */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Unified Search input - visible on both mobile and desktop inside the filter bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search candidate, passport, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-slate-250 text-xs font-semibold focus:ring-1 focus:ring-brand-500 outline-none text-slate-700"
                    />
                  </div>

                  {/* Interview Name Filter */}
                  <select
                    value={selectedInterviewName}
                    onChange={(e) => setSelectedInterviewName(e.target.value)}
                    className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option value="All">All Interviews (सभी इंटरव्यू)</option>
                    {uniqueInterviewNames.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>

                  {/* Interview Date Filter */}
                  <select
                    value={selectedInterviewDate}
                    onChange={(e) => setSelectedInterviewDate(e.target.value)}
                    className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 outline-none hover:bg-slate-50 cursor-pointer"
                  >
                    <option value="All">All Interview Dates (सभी तारीखें)</option>
                    {uniqueInterviewDates.map((date) => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>

                  {/* Reset Filters button */}
                  {(searchQuery || selectedInterviewName !== 'All' || selectedInterviewDate !== 'All' || selectedStage !== 'All') && (
                    <button
                      onClick={handleResetFilters}
                      className="text-xs text-slate-500 hover:text-brand-500 font-bold px-2 py-1.5 rounded-lg border border-slate-200 bg-white flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}

                  <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                  {/* DB Backup Utilities */}
                  <button
                    onClick={handleExportDatabase}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all outline-none"
                    title="Export backup"
                  >
                    <Download className="w-3 h-3" />
                    <span className="hidden sm:inline">Backup</span>
                  </button>
                  
                  <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span className="hidden sm:inline">Import</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleImportDatabase} 
                    />
                  </label>
                </div>
              </div>

              {/* Responsive Content Table */}
              <div className="overflow-x-auto">
                {filteredCandidates.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-3">
                    <Users className="w-12 h-12 text-slate-300" />
                    <p className="text-sm font-semibold">Koi matches nahi mile records me.</p>
                    <button 
                      onClick={handleResetFilters} 
                      className="text-xs text-brand-500 font-bold underline hover:text-brand-600"
                    >
                      Filters clear karein
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-semibold text-slate-400 bg-slate-50 border-b border-slate-200 uppercase">
                        <th className="px-6 py-3">Candidate Particulars</th>
                        <th className="px-6 py-3">Trade / Destination</th>
                        <th className="px-6 py-3">Workflow Status Stage</th>
                        <th className="px-6 py-3">Stage Checklist</th>
                        {userRole === 'Admin' && <th className="px-6 py-3 text-right">Ledger (Hisaab)</th>}
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 bg-white">
                      {filteredCandidates.map((cand) => {
                        const docCount = Object.values(cand.stage3?.documents || {}).filter(Boolean).length;
                        const outstanding = (cand.stage5?.totalDealAmount || 0) - (cand.stage5?.advanceReceived || 0);

                        return (
                          <tr key={cand.id} className="hover:bg-slate-50/50 group transition-all">
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-900 group-hover:text-brand-500 transition-colors block text-sm leading-tight">
                                {cand.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                                <span className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">{cand.id}</span>
                                <span>• Passport: <strong className="text-slate-600">{cand.passportNumber}</strong></span>
                              </div>
                              {cand.stage1?.passportLocation && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100 max-w-[210px] truncate" title={`Passport Location: ${cand.stage1.passportLocation}`}>
                                    📍 Passport: {cand.stage1.passportLocation}
                                  </span>
                                </div>
                              )}
                            </td>
                            
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-700 block text-xs">{cand.trade}</span>
                              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5 mt-0.5">
                                <Globe className="w-3 h-3 text-slate-300" /> {cand.country}
                              </span>
                              {cand.companyName && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                                    🏢 {cand.companyName}
                                  </span>
                                </div>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${
                                    cand.stage === 1 ? 'bg-brand-500' :
                                    cand.stage === 2 ? 'bg-sky-500' :
                                    cand.stage === 3 ? 'bg-indigo-500' :
                                    cand.stage === 4 ? 'bg-purple-500' :
                                    cand.stage === 5 ? 'bg-pink-500' :
                                    cand.stage === 6 ? 'bg-amber-500' :
                                    cand.stage === 7 ? 'bg-violet-500' :
                                    cand.stage === 8 ? 'bg-rose-500' : 'bg-emerald-600'
                                  }`} />
                                  <span className="font-semibold text-slate-700 text-xs">
                                    {getStageLabel(cand.stage)}
                                  </span>
                                </div>
                                <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-500 rounded-full" 
                                    style={{ width: `${(cand.stage / 9) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4 font-mono text-[11px] text-slate-500">
                              <div className="flex flex-col gap-1.5 items-start">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  docCount === 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {docCount}/5 Documents
                                </span>
                                <button
                                  onClick={() => handleDownloadAllDocsDirectly(cand)}
                                  className="text-[9px] text-brand-500 font-extrabold hover:text-brand-600 flex items-center gap-1 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer transition-colors w-full justify-center"
                                  title="Download All Available Docs as a single ZIP archive"
                                >
                                  <Download className="w-2.5 h-2.5 text-brand-500" />
                                  <span>Download All</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCandidate(cand);
                                    setModalInitialTab('stage1');
                                    setIsModalOpen(true);
                                  }}
                                  className="text-[9px] text-indigo-600 font-extrabold hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 border border-indigo-200/60 px-1.5 py-1 rounded hover:bg-indigo-100 cursor-pointer transition-colors w-full justify-center"
                                  title="Upload & manage candidate's interview documents / इंटरव्यू डाक्यूमेंट्स"
                                >
                                  <FileCheck className="w-2.5 h-2.5 text-indigo-500" />
                                  <span>Interview Docs</span>
                                </button>
                              </div>
                            </td>

                            {userRole === 'Admin' && (
                              <td className="px-6 py-4 text-right font-mono text-xs">
                                <span className="text-slate-600 block">Deal: ₹{(cand.stage5?.totalDealAmount || 0).toLocaleString('en-IN')}</span>
                                <span className={`text-[10px] font-bold block mt-0.5 ${
                                  outstanding <= 0 ? 'text-emerald-600' : 'text-rose-500'
                                }`}>
                                  {outstanding <= 0 ? 'Cleared ✓' : `Due: ₹${outstanding.toLocaleString('en-IN')}`}
                                </span>
                              </td>
                            )}

                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Quick Promo action button */}
                                {cand.stage < 6 && !cand.isArchived && (
                                  <button
                                    onClick={() => handleQuickPromote(cand.id)}
                                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                                    title="Promote to Next Stage"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}

                                {/* WhatsApp Status */}
                                <button
                                  onClick={() => setWhatsappCandidate(cand)}
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200/50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Send WhatsApp Update"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span className="hidden lg:inline">WhatsApp</span>
                                </button>

                                {/* Edit profile details */}
                                <button
                                  onClick={() => {
                                    setSelectedCandidate(cand);
                                    setModalInitialTab('basic');
                                    setIsModalOpen(true);
                                  }}
                                  className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200/50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Edit full profile"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                 {/* Interview Documents quick access */}
                                 <button
                                   onClick={() => {
                                     setSelectedCandidate(cand);
                                     setModalInitialTab('stage1');
                                     setIsModalOpen(true);
                                   }}
                                   className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200/50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                   title="Manage Interview Documents / इंटरव्यू डाक्यूमेंट्स"
                                 >
                                   <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                                   <span className="hidden xl:inline">Interview Docs</span>
                                 </button>

                                {/* Delete profile entry */}
                                <button
                                  onClick={() => handleDeleteCandidate(cand.id, cand.name)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Delete Candidate"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Pagination/Footer inside table card */}
              <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Showing {filteredCandidates.length} of {candidates.length} candidate files</span>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-all cursor-not-allowed">Previous</button>
                  <button className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 transition-all cursor-not-allowed">Next</button>
                </div>
              </div>
            </div>

            {/* Informational Guidelines Card */}
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 flex items-start gap-4">
              <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider font-display">JV TECH KUSHINAGAR Workflow Operations Manual</h3>
                <p className="text-xs text-brand-600 leading-relaxed">
                  Is Custom CRM Portal me **6 logical Stage Filters** diye gaye hain: Interview, Medical, Documents Checklist, Visa Stamping, Payment Accounts Ledger, aur Deployment/Flight Tickets. Kisi candidate ko update karne ke liye uske *Full Profile Edit* (pencil button) par click karein. Backup database files (JSON export/import) ko regular intervals par download karna anivary hai, jisse data safe rahe.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Shared Footer block */}
        <footer className="bg-white border-t border-slate-200 mt-auto py-6 shrink-0">
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center space-y-2">
            <p className="text-xs text-slate-400 font-mono">
              © 2026 JV TECH TEST AND TRAINING CENTER, KUSHINAGAR. Customized CRM Platform version 2.4.0.
            </p>
            <div className="flex justify-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Durable Cloud Architecture</span>
              <span>•</span>
              <span>Secure Encryption Ledger</span>
              <span>•</span>
              <span>WhatsApp Sandbox active</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Main Candidate Details Add/Edit Modal */}
      {isModalOpen && (
        <CandidateModal
          candidate={selectedCandidate}
          userRole={userRole}
          customTrades={systemSettings.customTrades}
          customCountries={systemSettings.customCountries}
          systemSettings={systemSettings}
          candidates={candidates}
          initialTab={modalInitialTab}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCandidate(null);
          }}
          onSave={handleSaveCandidate}
        />
      )}

      {/* WhatsApp Message Sandbox Modal */}
      {whatsappCandidate && (
        <MockWhatsAppModal
          candidate={whatsappCandidate}
          onClose={() => setWhatsappCandidate(null)}
        />
      )}
    </div>
  );
}
