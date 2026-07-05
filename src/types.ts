export enum InterviewStatus {
  Selected = 'Selected',
  Rejected = 'Rejected',
  Hold = 'Hold',
  Pending = 'Pending',
}

export enum MedicalStatus {
  Fit = 'Fit',
  Unfit = 'Unfit',
  ReportAwaiting = 'Report Awaiting',
  Pending = 'Pending',
}

export enum VisaStatus {
  Applied = 'Applied',
  Received = 'Received',
  Rejected = 'Rejected',
  Pending = 'Pending',
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  mode: 'Cash' | 'Online';
  reference?: string;
}

export interface CandidateDocuments {
  passportScan: boolean;
  photo: boolean;
  experienceCertificate: boolean;
  medicalReport: boolean;
  pcc: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  passportNumber: string;
  phone: string;
  trade: string; // Electrician, Welder, Mason, Plumber, Driver, etc.
  country: string; // Saudi Arabia, UAE, Qatar, Oman, Kuwait, etc.
  createdDate: string;
  stage: number; // 1 to 8
  isArchived: boolean;
  dateOfBirth?: string;
  address?: string;
  companyName?: string; // Company Name for placement
  
  // Custom Registration Fields
  fatherName?: string;
  motherName?: string;
  maritalStatus?: string;
  education?: string;
  language?: string;
  passportExpires?: string;
  ecrEcnr?: string;
  age?: number;
  photoUrl?: string;
  resumeUrl?: string;
  jobForApplied?: string;
  interviewNameWithDate?: string;
  
  // Stage 1: Registration & Interview
  stage1: {
    interviewStatus: InterviewStatus;
    interviewDate?: string; // Date when interview happened
    comments?: string;
    passportLocation?: string; // Physical location of the passport (e.g., Office, Embassy, Candidate, Agent)
    offerLetterSigned?: boolean;
    offerLetterFileName?: string;
    offerLetterFileUrl?: string;
    interviewFileName?: string;
    interviewFileUrl?: string;
  };

  // Stage 2: Medical Tracking
  stage2: {
    medicalDate?: string;
    medicalStatus: MedicalStatus;
    medicalReportName?: string;
    medicalReportUrl?: string;
  };

  // Stage 3: Document Collection
  stage3: {
    documents: CandidateDocuments;
    uploadedDocs: Array<{
      key: keyof CandidateDocuments;
      name: string;
      uploadedAt: string;
      url?: string;
    }>;
  };

  // Stage 4: Visa Process
  stage4: {
    visaStatus: VisaStatus;
    visaCopyName?: string;
    visaExpiryDate?: string;
    visaCopyUrl?: string;
  };

  // Stage 5: Payment Ledger
  stage5: {
    totalDealAmount: number;
    advanceReceived: number;
    balanceAmount: number; // totalDealAmount - advanceReceived
    paymentHistory: PaymentRecord[];
    companyLedgerScreenshotName?: string;
    companyLedgerScreenshotUrl?: string;
  };

  // Stage 6: Deployment & Flight
  stage6: {
    flightTicketName?: string;
    flightTicketUrl?: string;
    flightDate?: string;
    flightTime?: string;
    pnrNumber?: string;
    airlineName?: string;
    deployedDate?: string;
  };
}

export type UserRole = 'Admin' | 'Staff';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  password?: string;
  lastActive: string;
  status: 'Active' | 'Suspended';
  avatarName?: string;
  photoUrl?: string;
}

export interface SystemSettings {
  portalName: string;
  portalSubtitle: string;
  locationDetails: string;
  supportContact: string;
  supportHelpText: string;
  logoTextPrimary: string;
  logoTextSecondary: string;
  logoTextLocation: string;
  heroImageUrl: string;
  isRegistrationOpen: boolean;
  isSmsAlertsActive: boolean;
  backupFrequency: string;
  customTrades: string[];
  customCountries: string[];
  googleSheetCsvUrl?: string;
  logoImageUrl?: string;
  geminiApiKey?: string;
}

export interface CRMStats {
  totalRegistered: number;
  selectedToday: number;
  fitMedical: number;
  visaReceived: number;
  totalDue: number;
  totalCollected: number;
  deployedCount: number;
}

export interface ScheduledInterview {
  id: string;
  date: string;
  companyName: string;
  trade: string;
  country?: string;
  mode: string;
  venue: string;
  description?: string;
}

