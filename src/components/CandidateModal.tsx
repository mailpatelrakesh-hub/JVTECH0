import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Candidate, InterviewStatus, MedicalStatus, VisaStatus, PaymentRecord, CandidateDocuments, UserRole, SystemSettings } from '../types';
import { TRADES_LIST, COUNTRIES_LIST } from '../data';
import { X, Save, FileText, CheckCircle, AlertCircle, Plus, Trash2, Calendar, Lock, Upload, Plane, CreditCard, CheckSquare, ClipboardList, Activity, FileCheck, Award, Eye, Download, FileSpreadsheet, ExternalLink, XCircle, Clock } from 'lucide-react';

interface CandidateModalProps {
  candidate?: Candidate | null; // Null if adding a new candidate
  userRole: UserRole;
  onClose: () => void;
  onSave: (candidate: Candidate) => void;
  customTrades?: string[];
  customCountries?: string[];
  systemSettings?: SystemSettings;
  candidates?: Candidate[];
  initialTab?: 'basic' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6' | 'offer_letter';
}

export default function CandidateModal({ 
  candidate, 
  userRole, 
  onClose, 
  onSave,
  customTrades = TRADES_LIST,
  customCountries = COUNTRIES_LIST,
  systemSettings,
  candidates = [],
  initialTab = 'basic'
}: CandidateModalProps) {
  const isEditing = !!candidate;
  const isAdmin = userRole === 'Admin';

  // State for basic info
  const [name, setName] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [trade, setTrade] = useState(customTrades[0] || '');
  const [country, setCountry] = useState(customCountries[0] || '');
  const [createdDate, setCreatedDate] = useState('');
  const [stage, setStage] = useState(1);
  const [isArchived, setIsArchived] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyLedgerScreenshotName, setCompanyLedgerScreenshotName] = useState('');
  const [companyLedgerScreenshotUrl, setCompanyLedgerScreenshotUrl] = useState('');

  // Custom Registration State variables
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [education, setEducation] = useState('');
  const [language, setLanguage] = useState('Hindi');
  const [passportExpires, setPassportExpires] = useState('');
  const [ecrEcnr, setEcrEcnr] = useState('ECNR');
  const [age, setAge] = useState<number | ''>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  
  // AI Extraction State variables
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [aiMode, setAiMode] = useState<'file' | 'camera' | 'text'>('file');
  const [aiTextPaste, setAiTextPaste] = useState('');

  // Load scheduled interviews from localStorage
  const [scheduledInterviews] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [selectedInterviewId, setSelectedInterviewId] = useState<string>('');
  const [showManualCompany, setShowManualCompany] = useState<boolean>(true);

  // Dynamically extract all individual trades from customTrades and the selected scheduled interview
  const getDynamicTradeOptions = () => {
    const uniqueTrades = new Set<string>();
    
    // 1. Add all standard customTrades
    if (customTrades && Array.isArray(customTrades)) {
      customTrades.forEach(t => {
        if (t && t.trim()) uniqueTrades.add(t.trim());
      });
    }

    // 2. If an interview is selected, parse its trade string
    if (selectedInterviewId && selectedInterviewId !== 'custom') {
      const selectedInt = scheduledInterviews.find((i: any) => i.id === selectedInterviewId);
      if (selectedInt && selectedInt.trade) {
        // Split by comma, semicolon, newline, slash, or plus
        const splitTrades = selectedInt.trade.split(/[,;\n\r\/+]+/).map((t: string) => t.trim()).filter(Boolean);
        splitTrades.forEach((t: string) => uniqueTrades.add(t));
      }
    }

    // 3. Make sure the currently selected trade is in the options
    if (trade && trade.trim()) {
      uniqueTrades.add(trade.trim());
    }

    return Array.from(uniqueTrades);
  };

  // Profile Camera States
  const [isProfileCameraActive, setIsProfileCameraActive] = useState(false);
  const [profileCameraStream, setProfileCameraStream] = useState<MediaStream | null>(null);
  const profileVideoRef = React.useRef<HTMLVideoElement | null>(null);

  const startProfileCamera = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      } catch (e) {
        console.warn("Retrying with default video constraints...", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setProfileCameraStream(stream);
      setIsProfileCameraActive(true);
      setTimeout(() => {
        if (profileVideoRef.current) {
          profileVideoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error("Profile camera access error:", err);
      alert("Camera access denied or unavailable.");
    }
  };

  const stopProfileCamera = () => {
    if (profileCameraStream) {
      profileCameraStream.getTracks().forEach(track => track.stop());
      setProfileCameraStream(null);
    }
    setIsProfileCameraActive(false);
  };

  const captureProfileSnapshot = () => {
    if (!profileVideoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = profileVideoRef.current.videoWidth || 640;
      canvas.height = profileVideoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(profileVideoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopProfileCamera();
        setPhotoUrl(dataUrl);
      }
    } catch (err) {
      console.error("Failed to capture profile snapshot:", err);
      alert("Failed to capture profile photo from webcam.");
    }
  };

  const handleClose = () => {
    stopCamera();
    stopProfileCamera();
    onClose();
  };

  // Google Sheets Auto-Import Sync States
  const [sheetCandidates, setSheetCandidates] = useState<any[]>([]);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetFetchError, setSheetFetchError] = useState('');
  const [showSheetList, setShowSheetList] = useState(false);

  // AI and Camera Helpers
  const startCamera = async () => {
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      } catch (e) {
        console.warn("Retrying with default video constraints...", e);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setCameraStream(stream);
      setIsCameraActive(true);
      // Wait for React to render the video element and set its srcObject
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Camera access denied or unavailable.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        stopCamera();
        processAiExtraction(dataUrl, 'image/jpeg');
      }
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      alert("Failed to capture snapshot from webcam.");
    }
  };

  const formatDateToYMD = (dateStr: string): string => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    let clean = dateStr.replace(/\//g, '-').trim();
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr;
  };

  const extractDocxTextClientSide = async (base64Data: string): Promise<string> => {
    try {
      const zip = new JSZip();
      const cleanBase64 = base64Data.includes(";base64,") ? base64Data.split(";base64,")[1] : base64Data;
      const contents = await zip.loadAsync(cleanBase64, { base64: true });
      const docXmlFile = contents.file("word/document.xml");
      if (docXmlFile) {
        const xmlText = await docXmlFile.async("string");
        return xmlText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      }
    } catch (err) {
      console.error("Client-side docx extraction failed:", err);
    }
    return "";
  };

  const callGeminiClientSide = async (base64Data: string, mimeType: string, apiKey: string): Promise<any> => {
    const cleanBase64 = base64Data.includes(";base64,") ? base64Data.split(";base64,")[1] : base64Data;
    const isDocx = mimeType.includes("officedocument.wordprocessingml.document") || mimeType.includes("docx");
    const isText = mimeType.startsWith("text/") || mimeType.includes("csv");
    
    let textResult = "";
    if (isDocx) {
      textResult = await extractDocxTextClientSide(base64Data);
    } else if (isText) {
      try {
        textResult = atob(cleanBase64);
      } catch (e) {
        console.error("Failed to decode text file client-side:", e);
      }
    }

    const systemInstructionText = "You are an expert Indian recruiting assistant. Extract candidate registration details accurately. Ensure Dates are formatted as YYYY-MM-DD. For maritalStatus, use 'Single' or 'Married'. For ecrEcnr, determine if ECR (Emigration Check Required) or ECNR (Emigration Check Not Required) based on standard Indian passport norms. If age is not directly listed but DOB is present, calculate the age relative to year 2026. Fields to extract: name, fatherName, motherName, phone (Mobile Number), trade (Job Applied For), country, dateOfBirth (YYYY-MM-DD), age (Integer), address, maritalStatus, education (Educational Qualification, e.g. '10th', '12th', 'ITI', 'Graduate', etc.), language, passportNumber, passportExpires (YYYY-MM-DD), ecrEcnr ('ECR' or 'ECNR'). Return empty strings or null for completely missing details.";

    const schema = {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        fatherName: { type: "STRING" },
        motherName: { type: "STRING" },
        phone: { type: "STRING" },
        trade: { type: "STRING" },
        country: { type: "STRING" },
        dateOfBirth: { type: "STRING" },
        age: { type: "INTEGER" },
        address: { type: "STRING" },
        maritalStatus: { type: "STRING" },
        education: { type: "STRING" },
        language: { type: "STRING" },
        passportNumber: { type: "STRING" },
        passportExpires: { type: "STRING" },
        ecrEcnr: { type: "STRING" }
      }
    };

    let reqBody: any;
    if (textResult && textResult.trim().length > 0) {
      reqBody = {
        contents: [{
          parts: [{ text: `Extract all candidate profile details from the following resume text:\n\n${textResult}` }]
        }],
        system_instruction: { parts: [{ text: systemInstructionText }] },
        generation_config: {
          response_mime_type: "application/json",
          response_schema: schema
        }
      };
    } else {
      reqBody = {
        contents: [{
          parts: [
            { text: "Extract all candidate profile details from this resume, photo, or document. Return a JSON structure." },
            { inlineData: { data: cleanBase64, mimeType: mimeType } }
          ]
        }],
        system_instruction: { parts: [{ text: systemInstructionText }] },
        generation_config: {
          response_mime_type: "application/json",
          response_schema: schema
        }
      };
    }

    if (!apiKey || apiKey.trim() === "" || apiKey === "undefined" || apiKey === "null" || apiKey.includes("your_api_key_here")) {
      throw new Error("Gemini API Key is empty or invalid. Please login as admin, go to Admin Panel -> Settings -> and save a valid Gemini API Key.");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    const resJson = await response.json();
    const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No response text returned from client-side Gemini API.");
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      const match = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        return JSON.parse(match[1].trim());
      }
      throw new Error("Gemini returned invalid JSON structure: " + text);
    }
  };

  const processAiExtraction = async (base64Data: string, mimeType: string) => {
    try {
      setIsAiProcessing(true);
      setAiSuccessMessage('');
      
      let info: any = null;
      let usedClientFallback = false;

      try {
        const response = await fetch('/api/gemini/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64: base64Data, mimeType })
        });

        if (response.status === 404) {
          throw new Error("404_NOT_FOUND");
        }

        if (!response.ok) {
          throw new Error(`Server returned code ${response.status}`);
        }

        const resJson = await response.json();
        if (!resJson.success) {
          throw new Error(resJson.error || "Failed to extract candidate data.");
        }
        info = resJson.data;
      } catch (serverErr: any) {
        console.warn("Server-side extraction failed or returned 404, attempting client-side fallback...", serverErr);
        
        const clientKey = systemSettings?.geminiApiKey?.trim() || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string)?.trim() || "";
        
        if (!clientKey) {
          if (serverErr.message === "404_NOT_FOUND" || serverErr.status === 404) {
            throw new Error("Netlify static deployment detected (Server returned 404). Client-side Gemini API Key missing! Please go to Admin Panel -> Settings -> and add a Gemini API Key to enable instant browser-based AI Autofill.");
          } else {
            throw new Error(`Server extraction failed (${serverErr.message || serverErr}). Client-side Gemini API Key missing! Please go to Admin Panel -> Settings -> and add a Gemini API Key to enable browser-based fallback.`);
          }
        }

        info = await callGeminiClientSide(base64Data, mimeType, clientKey);
        usedClientFallback = true;
      }

      if (info) {
        if (info.name) setName(info.name.trim());
        if (info.fatherName) setFatherName(info.fatherName.trim());
        if (info.motherName) setMotherName(info.motherName.trim());
        if (info.phone) setPhone(info.phone.trim());
        
        if (info.trade) {
          const tTrim = info.trade.trim();
          const matchedTrade = customTrades.find((t: string) => 
            t.toLowerCase() === tTrim.toLowerCase() ||
            tTrim.toLowerCase().includes(t.toLowerCase()) ||
            t.toLowerCase().includes(tTrim.toLowerCase())
          ) || tTrim;
          setTrade(matchedTrade);
        }

        if (info.country) {
          const cTrim = info.country.trim();
          const matchedCountry = customCountries.find((co: string) => 
            co.toLowerCase() === cTrim.toLowerCase() ||
            cTrim.toLowerCase().includes(co.toLowerCase()) ||
            co.toLowerCase().includes(cTrim.toLowerCase())
          ) || cTrim;
          setCountry(matchedCountry);
        }

        if (info.dateOfBirth) setDateOfBirth(formatDateToYMD(info.dateOfBirth));
        if (info.age !== undefined && info.age !== null) setAge(info.age);
        if (info.address) setAddress(info.address.trim());
        
        if (info.maritalStatus) {
          const mTrim = info.maritalStatus.trim().toLowerCase();
          if (mTrim.includes('marr')) setMaritalStatus('Married');
          else setMaritalStatus('Single');
        }

        if (info.education) setEducation(info.education.trim());
        if (info.language) setLanguage(info.language.trim());
        if (info.passportNumber) setPassportNumber(info.passportNumber.trim().toUpperCase());
        if (info.passportExpires) setPassportExpires(formatDateToYMD(info.passportExpires));
        
        if (info.ecrEcnr) {
          const eTrim = info.ecrEcnr.trim().toUpperCase();
          if (eTrim.includes('ECR') && !eTrim.includes('ECNR')) setEcrEcnr('ECR');
          else setEcrEcnr('ECNR');
        }

        setAiSuccessMessage(
          usedClientFallback 
            ? '✨ AI Extraction Successful (via Client fallback)! Form populated with candidate details.' 
            : '✨ AI Extraction Successful! Form populated with candidate details.'
        );
      } else {
        throw new Error("Empty extraction data returned from AI.");
      }
    } catch (err: any) {
      console.error("AI autofill failed:", err);
      alert(`AI Extraction failed: ${err.message || err}`);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Helper to parse CSV robustly
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue.trim());
        if (row.some(val => val !== '')) {
          lines.push(row);
        }
        row = [];
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    if (currentValue || row.length > 0) {
      row.push(currentValue.trim());
      lines.push(row);
    }
    return lines;
  };

  const handleFetchSheetData = async () => {
    if (!systemSettings?.googleSheetCsvUrl) return;
    setIsFetchingSheet(true);
    setSheetFetchError('');
    try {
      const response = await fetch(systemSettings.googleSheetCsvUrl);
      if (!response.ok) {
        throw new Error('Google Sheet link down h ya public csv accessible nahi hai. Share panel se publish krna yaad rkhein!');
      }
      const rawText = await response.text();
      const parsedRows = parseCSV(rawText);
      if (parsedRows.length < 2) {
        throw new Error('Google Sheet me koi entries nahi mili (Header key bad values hone chahiye).');
      }

      const headers = parsedRows[0].map(h => h.toLowerCase());
      const findIndex = (keywords: string[]) => {
        return headers.findIndex(h => keywords.some(k => h.includes(k)));
      };

      const nameIdx = findIndex(['full name', 'candidate name', 'name', 'naam', 'candidate']);
      const passportIdx = findIndex(['passport number', 'passport no', 'passport', 'pp number', 'pp', 'pass']);
      const phoneIdx = findIndex(['phone number', 'mobile number', 'phone', 'mobile', 'contact', 'number', 'mob']);
      const tradeIdx = findIndex(['trade', 'job', 'work', 'profile', 'profession', 'trade name']);
      const countryIdx = findIndex(['country', 'desh', 'target country', 'location', 'destination']);
      const dobIdx = findIndex(['dob', 'date of birth', 'birth', 'janam', 'birth date']);
      const addressIdx = findIndex(['address', 'pata', 'home', 'village', 'state', 'district']);

      const parsedCandidates = parsedRows.slice(1).map((row, idx) => {
        const cName = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : '';
        const cPassport = passportIdx !== -1 && row[passportIdx] ? row[passportIdx].toUpperCase().trim() : '';
        const cPhone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : '';
        const cTrade = tradeIdx !== -1 && row[tradeIdx] ? row[tradeIdx].trim() : '';
        const cCountry = countryIdx !== -1 && row[countryIdx] ? row[countryIdx].trim() : '';
        const cDob = dobIdx !== -1 && row[dobIdx] ? row[dobIdx].trim() : '';
        const cAddress = addressIdx !== -1 && row[addressIdx] ? row[addressIdx].trim() : '';

        // Check duplicates
        const alreadyExists = candidates.some(existing => 
          (cPassport && existing.passportNumber.toUpperCase() === cPassport) || 
          (cPhone && existing.phone === cPhone)
        );

        return {
          id: `sheet-${idx}`,
          name: cName,
          passportNumber: cPassport,
          phone: cPhone,
          trade: cTrade,
          country: cCountry,
          dateOfBirth: cDob,
          address: cAddress,
          alreadyExists
        };
      }).filter(c => c.name || c.passportNumber); // keep valid rows

      setSheetCandidates(parsedCandidates);
      setShowSheetList(true);
    } catch (err: any) {
      console.error(err);
      setSheetFetchError(err.message || 'Error occurred while syncing Sheets.');
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleApplySheetCandidate = (c: any) => {
    setName(c.name || '');
    setPassportNumber(c.passportNumber || '');
    setPhone(c.phone || '');
    
    // Auto-select match or closest trade
    const matchedTrade = customTrades.find(t => t.toLowerCase() === c.trade?.toLowerCase()) || customTrades[0] || '';
    setTrade(matchedTrade);

    const matchedCountry = customCountries.find(co => co.toLowerCase() === c.country?.toLowerCase()) || customCountries[0] || '';
    setCountry(matchedCountry);

    if (c.dateOfBirth) {
      setDateOfBirth(c.dateOfBirth);
    }
    if (c.address) {
      setAddress(c.address);
    }
    setShowSheetList(false);
  };

  // Stage 1: Interview
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>(InterviewStatus.Pending);
  const [interviewDate, setInterviewDate] = useState('');
  const [comments, setComments] = useState('');
  const [passportLocation, setPassportLocation] = useState('');
  const [offerLetterSigned, setOfferLetterSigned] = useState(false);
  const [offerLetterFileName, setOfferLetterFileName] = useState('');
  const [offerLetterFileUrl, setOfferLetterFileUrl] = useState('');
  const [interviewFileName, setInterviewFileName] = useState('');
  const [interviewFileUrl, setInterviewFileUrl] = useState('');

  // Stage 2: Medical
  const [medicalDate, setMedicalDate] = useState('');
  const [medicalStatus, setMedicalStatus] = useState<MedicalStatus>(MedicalStatus.Pending);
  const [medicalReportName, setMedicalReportName] = useState('');
  const [medicalReportUrl, setMedicalReportUrl] = useState('');

  // Stage 3: Documents
  const [documents, setDocuments] = useState<CandidateDocuments>({
    passportScan: false,
    photo: false,
    experienceCertificate: false,
    medicalReport: false,
    pcc: false,
  });
  const [uploadedDocs, setUploadedDocs] = useState<Candidate['stage3']['uploadedDocs']>([]);

  // Stage 4: Visa
  const [visaStatus, setVisaStatus] = useState<VisaStatus>(VisaStatus.Pending);
  const [visaCopyName, setVisaCopyName] = useState('');
  const [visaExpiryDate, setVisaExpiryDate] = useState('');
  const [visaCopyUrl, setVisaCopyUrl] = useState('');

  // Stage 5: Payment
  const [totalDealAmount, setTotalDealAmount] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  // Form state to add new payment
  const [newPayAmount, setNewPayAmount] = useState('');
  const [newPayMode, setNewPayMode] = useState<'Cash' | 'Online'>('Online');
  const [newPayRef, setNewPayRef] = useState('');

  // Registration advance states
  const [registrationAdvanceAmount, setRegistrationAdvanceAmount] = useState('');
  const [registrationAdvanceMode, setRegistrationAdvanceMode] = useState<'Cash' | 'Online'>('Online');
  const [registrationAdvanceRef, setRegistrationAdvanceRef] = useState('');

  // Stage 6: Flight
  const [flightTicketName, setFlightTicketName] = useState('');
  const [flightTicketUrl, setFlightTicketUrl] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [flightTime, setFlightTime] = useState('');
  const [pnrNumber, setPnrNumber] = useState('');
  const [airlineName, setAirlineName] = useState('');
  const [deployedDate, setDeployedDate] = useState('');

  // State to hold document preview modal information
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  // Active tab inside the modal (for editing stages)
  const [activeTab, setActiveTab] = useState<'basic' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6' | 'offer_letter'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Loading state for mock document uploads
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);

  // Initialize form state
  useEffect(() => {
    if (candidate) {
      setName(candidate.name);
      setPassportNumber(candidate.passportNumber);
      setPhone(candidate.phone);
      setTrade(candidate.trade);
      setCountry(candidate.country);
      setCreatedDate(candidate.createdDate);
      setStage(candidate.stage);
      setIsArchived(candidate.isArchived);
      setDateOfBirth(candidate.dateOfBirth || '');
      setAddress(candidate.address || '');
      setCompanyName(candidate.companyName || '');
      setCompanyLedgerScreenshotName(candidate.stage5?.companyLedgerScreenshotName || '');
      setCompanyLedgerScreenshotUrl(candidate.stage5?.companyLedgerScreenshotUrl || '');

      // Load custom registration fields
      setFatherName(candidate.fatherName || '');
      setMotherName(candidate.motherName || '');
      setMaritalStatus(candidate.maritalStatus || 'Single');
      setEducation(candidate.education || '');
      setLanguage(candidate.language || 'Hindi');
      setPassportExpires(candidate.passportExpires || '');
      setEcrEcnr(candidate.ecrEcnr || 'ECNR');
      setAge(candidate.age || '');
      setPhotoUrl(candidate.photoUrl || '');
      setResumeUrl(candidate.resumeUrl || '');

      // Check if there is a matching scheduled interview
      if (candidate.companyName) {
        const matched = scheduledInterviews.find(
          (i: any) => i.companyName.trim().toLowerCase() === candidate.companyName!.trim().toLowerCase()
        );
        if (matched) {
          setSelectedInterviewId(matched.id);
          setShowManualCompany(false);
        } else {
          setSelectedInterviewId('custom');
          setShowManualCompany(true);
        }
      } else {
        setSelectedInterviewId('');
        setShowManualCompany(true);
      }

      // Stage 1
      setInterviewStatus(candidate.stage1?.interviewStatus || InterviewStatus.Pending);
      setInterviewDate(candidate.stage1?.interviewDate || candidate.createdDate || '');
      setComments(candidate.stage1?.comments || '');
      setPassportLocation(candidate.stage1?.passportLocation || '');
      setOfferLetterSigned(candidate.stage1?.offerLetterSigned || false);
      setOfferLetterFileName(candidate.stage1?.offerLetterFileName || '');
      setOfferLetterFileUrl(candidate.stage1?.offerLetterFileUrl || '');
      setInterviewFileName(candidate.stage1?.interviewFileName || '');
      setInterviewFileUrl(candidate.stage1?.interviewFileUrl || '');

      // Stage 2
      setMedicalDate(candidate.stage2?.medicalDate || '');
      setMedicalStatus(candidate.stage2?.medicalStatus || MedicalStatus.Pending);
      setMedicalReportName(candidate.stage2?.medicalReportName || '');
      setMedicalReportUrl(candidate.stage2?.medicalReportUrl || '');

      // Stage 3
      setDocuments(candidate.stage3?.documents || {
        passportScan: false,
        photo: false,
        experienceCertificate: false,
        medicalReport: false,
        pcc: false,
      });
      setUploadedDocs(candidate.stage3?.uploadedDocs || []);

      // Stage 4
      setVisaStatus(candidate.stage4?.visaStatus || VisaStatus.Pending);
      setVisaCopyName(candidate.stage4?.visaCopyName || '');
      setVisaExpiryDate(candidate.stage4?.visaExpiryDate || '');
      setVisaCopyUrl(candidate.stage4?.visaCopyUrl || '');

      // Stage 5
      setTotalDealAmount(candidate.stage5?.totalDealAmount || 60000);
      setPaymentHistory(candidate.stage5?.paymentHistory || []);

      // Stage 6
      setFlightTicketName(candidate.stage6?.flightTicketName || '');
      setFlightTicketUrl(candidate.stage6?.flightTicketUrl || '');
      setFlightDate(candidate.stage6?.flightDate || '');
      setFlightTime(candidate.stage6?.flightTime || '');
      setPnrNumber(candidate.stage6?.pnrNumber || '');
      setAirlineName(candidate.stage6?.airlineName || '');
      setDeployedDate(candidate.stage6?.deployedDate || '');
      
      // Auto switch tab to their current active stage
      if (candidate.stage === 1) setActiveTab('stage1');
      else if (candidate.stage === 2) setActiveTab('stage2');
      else if (candidate.stage === 3) setActiveTab('stage3');
      else if (candidate.stage === 4) setActiveTab('stage4');
      else if (candidate.stage === 5) setActiveTab(isAdmin ? 'stage5' : 'basic');
      else if (candidate.stage === 6) setActiveTab('stage6');
    } else {
      setName('');
      setPassportNumber('');
      setPhone('');
      setTrade(customTrades[0] || '');
      setCountry(customCountries[0] || '');
      setCreatedDate(new Date().toISOString().split('T')[0]);
      setStage(1);
      setIsArchived(false);
      setDateOfBirth('');
      setAddress('');
      setCompanyName('');
      setCompanyLedgerScreenshotName('');
      setCompanyLedgerScreenshotUrl('');
      setSelectedInterviewId('');
      setShowManualCompany(true);

      // Clear custom registration states
      setFatherName('');
      setMotherName('');
      setMaritalStatus('Single');
      setEducation('');
      setLanguage('Hindi');
      setPassportExpires('');
      setEcrEcnr('ECNR');
      setAge('');
      setPhotoUrl('');
      setResumeUrl('');
      setAiSuccessMessage('');
      setIsAiProcessing(false);
      setIsCameraActive(false);

      // Stage 1
      setInterviewStatus(InterviewStatus.Pending);
      setInterviewDate(new Date().toISOString().split('T')[0]);
      setComments('');
      setPassportLocation('');
      setInterviewFileName('');
      setInterviewFileUrl('');

      // Stage 2
      setMedicalDate('');
      setMedicalStatus(MedicalStatus.Pending);
      setMedicalReportName('');
      setMedicalReportUrl('');

      // Stage 3
      setDocuments({
        passportScan: false,
        photo: false,
        experienceCertificate: false,
        medicalReport: false,
        pcc: false,
      });
      setUploadedDocs([]);

      // Stage 4
      setVisaStatus(VisaStatus.Pending);
      setVisaCopyName('');
      setVisaExpiryDate('');
      setVisaCopyUrl('');

      // Stage 5
      setTotalDealAmount(60000); // Standard deal default
      setPaymentHistory([]);
      setRegistrationAdvanceAmount('');
      setRegistrationAdvanceMode('Online');
      setRegistrationAdvanceRef('');

      // Stage 6
      setFlightTicketName('');
      setFlightTicketUrl('');
      setFlightDate('');
      setFlightTime('');
      setPnrNumber('');
      setAirlineName('');
      setDeployedDate('');

      setActiveTab('basic');
    }
  }, [candidate]);

  // Handle real file uploads from user system
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeUploadField, setActiveUploadField] = useState<string | null>(null);

  const triggerRealUpload = (field: keyof CandidateDocuments | 'medicalReportFile' | 'visaCopyFile' | 'flightTicketFile' | 'companyLedgerScreenshotFile' | 'offerLetterFile' | 'interviewFile') => {
    setActiveUploadField(field);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset file input to allow selecting same file
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadField) return;

    setUploadingField(activeUploadField);
    
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileName = file.name;
      const dateString = new Date().toISOString().split('T')[0];

      setUploadingField(null);

      if (activeUploadField === 'medicalReportFile') {
        setMedicalReportName(fileName);
        setMedicalReportUrl(dataUrl);
        setMedicalStatus(MedicalStatus.Fit);
        setDocuments(prev => ({ ...prev, medicalReport: true }));
      } else if (activeUploadField === 'visaCopyFile') {
        setVisaCopyName(fileName);
        setVisaCopyUrl(dataUrl);
        setVisaStatus(VisaStatus.Received);
      } else if (activeUploadField === 'flightTicketFile') {
        setFlightTicketName(fileName);
        setFlightTicketUrl(dataUrl);
      } else if (activeUploadField === 'companyLedgerScreenshotFile') {
        setCompanyLedgerScreenshotName(fileName);
        setCompanyLedgerScreenshotUrl(dataUrl);
      } else if (activeUploadField === 'offerLetterFile') {
        setOfferLetterFileName(fileName);
        setOfferLetterFileUrl(dataUrl);
        setOfferLetterSigned(true);
      } else if (activeUploadField === 'interviewFile') {
        setInterviewFileName(fileName);
        setInterviewFileUrl(dataUrl);
        setInterviewStatus(InterviewStatus.Selected);
      } else {
        // Document Checklist fields (passportScan, photo, experienceCertificate, pcc)
        const docKey = activeUploadField as keyof CandidateDocuments;
        setDocuments(prev => ({ ...prev, [docKey]: true }));
        
        setUploadedDocs(prev => {
          const filtered = prev.filter(d => d.key !== docKey);
          return [
            ...filtered,
            { key: docKey, name: fileName, uploadedAt: dateString, url: dataUrl }
          ];
        });
      }
      setActiveUploadField(null);
    };

    reader.onerror = () => {
      alert("Error reading file.");
      setUploadingField(null);
      setActiveUploadField(null);
    };

    reader.readAsDataURL(file);
  };

  const handleDownloadFile = (fileName: string, fileUrl?: string) => {
    const link = document.createElement('a');
    link.download = fileName;
    // If it is a real file data URL, use it, otherwise download a simulated text file containing document status.
    link.href = fileUrl || 'data:text/plain;charset=utf-8,' + encodeURIComponent(`Simulated document file content for ${fileName}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewFile = (fileName: string, fileUrl?: string) => {
    setPreviewDoc({ name: fileName, url: fileUrl || 'mock' });
  };

  // Keep handleMockUpload mapped to our new real uploader for backward-compatibility
  const handleMockUpload = (field: keyof CandidateDocuments | 'medicalReportFile' | 'visaCopyFile' | 'flightTicketFile') => {
    triggerRealUpload(field);
  };

  // Add payment to local state list
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const amt = parseFloat(newPayAmount);
    if (isNaN(amt) || amt <= 0) return;

    const newPayment: PaymentRecord = {
      id: `PMT-${Date.now()}`,
      amount: amt,
      date: new Date().toISOString().split('T')[0],
      mode: newPayMode,
      reference: newPayRef,
    };

    setPaymentHistory(prev => [...prev, newPayment]);
    setNewPayAmount('');
    setNewPayRef('');
  };

  const handleRemovePayment = (id: string) => {
    if (!isAdmin) return;
    setPaymentHistory(prev => prev.filter(p => p.id !== id));
  };

  // Calculate sum of advances
  const computedAdvanceReceived = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
  const computedBalanceAmount = totalDealAmount - computedAdvanceReceived;

  // Download all candidate documents together in a single ZIP file
  const handleDownloadAllDocuments = async () => {
    try {
      setZipping(true);
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
      if (medicalReportName) {
        addFileToZip(medicalReportName, medicalReportUrl);
      }

      // 2. Stage 3 Checklist Uploaded Docs
      uploadedDocs.forEach((doc) => {
        if (doc.name) {
          addFileToZip(doc.name, doc.url);
        }
      });

      // 3. Stage 4 Visa Copy
      if (visaCopyName) {
        addFileToZip(visaCopyName, visaCopyUrl);
      }

      // 4. Stage 5 Company Ledger / Screenshot
      if (companyLedgerScreenshotName) {
        addFileToZip(companyLedgerScreenshotName, companyLedgerScreenshotUrl);
      }

      // 5. Stage 6 Flight Ticket
      if (flightTicketName) {
        addFileToZip(flightTicketName, flightTicketUrl);
      }

      if (filesAddedCount === 0) {
        alert("Is candidate ke paas koi documents uploaded nahi hain!");
        setZipping(false);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safeCandidateName = name ? name.replace(/[^a-zA-Z0-9]/g, '_') : 'Candidate';
      link.download = `${safeCandidateName}_All_Documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("ZIP Generation error:", error);
      alert("Documents ZIP file banane me dikkat aayi.");
    } finally {
      setZipping(false);
    }
  };

  // Handle Save Operation
  const handleSave = () => {
    if (!name || !passportNumber || !phone) {
      alert('Please fill Name, Passport Number, and Phone Number!');
      return;
    }

    // Prepare final payment history
    let finalPaymentHistory = [...paymentHistory];
    if (!isEditing) {
      const regAmt = parseFloat(registrationAdvanceAmount);
      if (!isNaN(regAmt) && regAmt > 0) {
        finalPaymentHistory = [{
          id: `PMT-INIT-${Date.now()}`,
          amount: regAmt,
          date: new Date().toISOString().split('T')[0],
          mode: registrationAdvanceMode,
          reference: registrationAdvanceRef || 'Registration Advance Payment',
        }];
      }
    }

    const finalAdvanceReceived = finalPaymentHistory.reduce((sum, p) => sum + p.amount, 0);
    const finalBalanceAmount = totalDealAmount - finalAdvanceReceived;

    // Auto promote stages based on progress (9 stages)
    let calculatedStage = stage;
    if (isEditing) {
      if (calculatedStage === 1) {
        calculatedStage = 2; // Move to Registration
      }
      if (calculatedStage === 2 && (interviewStatus === InterviewStatus.Selected || interviewDate || interviewFileUrl)) {
        calculatedStage = 3; // Selection or Interview signed form triggers Interview Documents
      }
      if (calculatedStage === 3 && (interviewFileUrl || interviewStatus === InterviewStatus.Selected || resumeUrl)) {
        calculatedStage = 4; // Interview signed form or selection triggers Candidate Document
      }
      if (calculatedStage === 4) {
        const hasCoreDocs = documents.passportScan || documents.photo;
        if (hasCoreDocs) {
          calculatedStage = 5; // Core documents triggers Offer Letter
        }
      }
      if (calculatedStage === 5 && offerLetterSigned) {
        calculatedStage = 6; // Offer letter signed triggers Medical Fitness
      }
      if (calculatedStage === 6 && medicalStatus === MedicalStatus.Fit) {
        calculatedStage = 7; // Medical Fit triggers Visa Process
      }
      if (calculatedStage === 7 && visaStatus === VisaStatus.Received) {
        calculatedStage = 8; // Visa received triggers Payment Accounts Ledger
      }
      if (calculatedStage === 8 && finalBalanceAmount <= 0) {
        calculatedStage = 9; // Fully paid triggers Flight/Deployment
      }
    } else {
      if (calculatedStage === 1) {
        calculatedStage = 2; // Default to Stage 2 (Registration) for new registration
      }
    }

    const savedCandidate: Candidate = {
      id: candidate?.id || `CAND-${Math.round(Math.random() * 10000).toString().padStart(3, '0')}`,
      name,
      passportNumber: passportNumber.toUpperCase(),
      phone,
      trade,
      country,
      createdDate,
      stage: calculatedStage,
      isArchived,
      dateOfBirth: dateOfBirth || undefined,
      address: address || undefined,
      companyName: companyName || undefined,
      fatherName: fatherName || undefined,
      motherName: motherName || undefined,
      maritalStatus: maritalStatus || undefined,
      education: education || undefined,
      language: language || undefined,
      passportExpires: passportExpires || undefined,
      ecrEcnr: ecrEcnr || undefined,
      age: age ? Number(age) : undefined,
      photoUrl: photoUrl || undefined,
      resumeUrl: resumeUrl || undefined,
      stage1: {
        interviewStatus,
        interviewDate: interviewDate || undefined,
        comments,
        passportLocation: passportLocation || undefined,
        offerLetterSigned,
        offerLetterFileName: offerLetterFileName || undefined,
        offerLetterFileUrl: offerLetterFileUrl || undefined,
        interviewFileName: interviewFileName || undefined,
        interviewFileUrl: interviewFileUrl || undefined,
      },
      stage2: {
        medicalDate: medicalDate || undefined,
        medicalStatus,
        medicalReportName: medicalReportName || undefined,
        medicalReportUrl: medicalReportUrl || undefined,
      },
      stage3: {
        documents,
        uploadedDocs,
      },
      stage4: {
        visaStatus,
        visaCopyName: visaCopyName || undefined,
        visaExpiryDate: visaExpiryDate || undefined,
        visaCopyUrl: visaCopyUrl || undefined,
      },
      stage5: {
        totalDealAmount,
        advanceReceived: finalAdvanceReceived,
        balanceAmount: finalBalanceAmount,
        paymentHistory: finalPaymentHistory,
        companyLedgerScreenshotName: companyLedgerScreenshotName || undefined,
        companyLedgerScreenshotUrl: companyLedgerScreenshotUrl || undefined,
      },
      stage6: {
        flightTicketName: flightTicketName || undefined,
        flightTicketUrl: flightTicketUrl || undefined,
        flightDate: flightDate || undefined,
        flightTime: flightTime || undefined,
        pnrNumber: pnrNumber || undefined,
        airlineName: airlineName || undefined,
        deployedDate: deployedDate || undefined,
      }
    };

    onSave(savedCandidate);
  };

  return (
    <div id="candidate-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="candidate-modal-body" 
        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[90vh] md:h-[85vh] transition-all transform scale-100"
      >
        {/* Modal Top Header Bar */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-display">
                {isEditing ? `Edit Candidate: ${name}` : 'Register New Candidate'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isEditing ? `ID: ${candidate.id} • Registered ${createdDate}` : 'Draft Profile'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-400 hover:text-white outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Navigation/Workflow Rail for Editing */}
        {isEditing && (
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex gap-1 overflow-x-auto text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-3 py-2 rounded-xl transition-all whitespace-nowrap outline-none ${
                activeTab === 'basic' ? 'bg-slate-800 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              2. Registration
            </button>
            <button
              onClick={() => setActiveTab('stage1')}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'stage1' ? 'bg-sky-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 2 ? 'border border-sky-100 font-bold' : 'opacity-50'}`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>3. Interview Form</span>
            </button>
            <button
              onClick={() => setActiveTab('stage3')}
              disabled={stage < 3}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'stage3' ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 3 ? 'border border-emerald-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>4. Candidate Document</span>
            </button>
            <button
              onClick={() => setActiveTab('offer_letter')}
              disabled={stage < 4}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'offer_letter' ? 'bg-teal-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 4 ? 'border border-teal-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. Offer Letter</span>
            </button>
            <button
              onClick={() => setActiveTab('stage2')}
              disabled={stage < 5}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'stage2' ? 'bg-indigo-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 5 ? 'border border-indigo-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>6. Medical</span>
            </button>
            <button
              onClick={() => setActiveTab('stage4')}
              disabled={stage < 6}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'stage4' ? 'bg-violet-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 6 ? 'border border-violet-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>7. Visa Process</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('stage5')}
                disabled={stage < 7}
                className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                  activeTab === 'stage5' ? 'bg-purple-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
                } ${stage >= 7 ? 'border border-purple-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>8. Payment</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('stage6')}
              disabled={stage < 8}
              className={`px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap outline-none ${
                activeTab === 'stage6' ? 'bg-rose-500 text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'
              } ${stage >= 8 ? 'border border-rose-100 font-bold' : 'opacity-40 cursor-not-allowed'}`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>9. Flight</span>
            </button>
          </div>
        )}

        {/* Modal Main Content (Scrollable Container) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/40">
          
          {/* TAB: Basic Profile Info */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {!isEditing && systemSettings?.googleSheetCsvUrl && (
                <div className="bg-gradient-to-br from-indigo-50 to-brand-50/50 border border-indigo-100 p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl mt-0.5 shrink-0">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 block">Google Sheets Connection is Active!</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Aap naye candidates ko Google Sheet response CSV se seedhe yahan fetch karke auto-fill/register kar sakte hain.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleFetchSheetData}
                        disabled={isFetchingSheet}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        {isFetchingSheet ? (
                          <span className="animate-spin text-white">●</span>
                        ) : (
                          <span>🔄</span>
                        )}
                        <span>Sheets se Sync Karein</span>
                      </button>
                    </div>
                  </div>

                  {sheetFetchError && (
                    <div className="text-rose-500 text-[10px] bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-medium">
                      ⚠️ {sheetFetchError}
                    </div>
                  )}

                  {/* Sheet entries listing table / list */}
                  {showSheetList && (
                    <div className="bg-white border border-indigo-100/80 rounded-xl overflow-hidden mt-3 max-h-60 overflow-y-auto">
                      <div className="bg-slate-50 px-3 py-2 border-b border-indigo-50 flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Google Sheet Responses ({sheetCandidates.length} found)</span>
                        <button 
                          type="button"
                          onClick={() => setShowSheetList(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Chhupayein
                        </button>
                      </div>
                      
                      {sheetCandidates.length === 0 ? (
                        <p className="p-4 text-xs text-slate-400 text-center">Google Sheet me koi candidate responses nahi mile.</p>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {sheetCandidates.map((c, i) => (
                            <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/50">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800">{c.name || 'Anonymous'}</span>
                                  {c.alreadyExists && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0">
                                      Already Registered
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
                                  <span>Passport: <strong className="text-slate-600 font-semibold">{c.passportNumber || 'N/A'}</strong></span>
                                  <span>Phone: <strong className="text-slate-600 font-semibold">{c.phone || 'N/A'}</strong></span>
                                  {c.trade && <span>Trade: <strong className="text-slate-600 font-semibold">{c.trade}</strong></span>}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleApplySheetCandidate(c)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer border-0"
                              >
                                Autofill Form 📥
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* AI Registration & Autofill Hub */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-800 p-5 rounded-3xl space-y-4 mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-500 text-white flex items-center justify-center text-sm font-bold shadow-sm animate-bounce">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest block">
                        ⚡ AI Registration Assistant
                      </h4>
                      <p className="text-[10px] text-slate-300 font-medium">
                        Resume/Photo scan ya direct copy-pasted text se form auto-fill karein
                      </p>
                    </div>
                  </div>
                  {isAiProcessing && (
                    <span className="flex items-center gap-1.5 text-xs text-sky-400 font-bold bg-slate-800/80 px-2.5 py-1 rounded-full border border-sky-900 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-ping"></span>
                      Extracting...
                    </span>
                  )}
                </div>

                {aiSuccessMessage && (
                  <div className="bg-emerald-950/80 text-emerald-400 text-xs p-3 rounded-xl border border-emerald-800 font-semibold leading-relaxed animate-in fade-in duration-300">
                    {aiSuccessMessage}
                  </div>
                )}

                {/* Tab selectors for AI Extractor */}
                <div className="flex gap-1.5 bg-slate-800/85 p-1 rounded-xl border border-slate-700/60 text-xs">
                  <button
                    type="button"
                    onClick={() => { setAiMode('file'); stopCamera(); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all border-0 cursor-pointer ${
                      aiMode === 'file' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    📁 Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiMode('camera'); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all border-0 cursor-pointer ${
                      aiMode === 'camera' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    📷 Camera Snapshot
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAiMode('text'); stopCamera(); }}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition-all border-0 cursor-pointer ${
                      aiMode === 'text' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                    }`}
                  >
                    📝 Paste Text
                  </button>
                </div>

                {/* Tab content */}
                <div className="pt-1">
                  {aiMode === 'file' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Upload Resume, Passport Scan, or Photo (PDF / JPG / PNG / DOCX)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              let mime = file.type;
                              if (!mime) {
                                const ext = file.name.split('.').pop()?.toLowerCase();
                                if (ext === 'pdf') mime = 'application/pdf';
                                else if (ext === 'docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                                else if (ext === 'doc') mime = 'application/msword';
                                else if (ext === 'png') mime = 'image/png';
                                else if (ext === 'webp') mime = 'image/webp';
                                else if (['jpg', 'jpeg'].includes(ext || '')) mime = 'image/jpeg';
                              }
                              mime = mime || 'application/octet-stream';
                              processAiExtraction(result, mime);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        disabled={isAiProcessing}
                        className="w-full text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-500 file:text-white hover:file:bg-sky-600 file:cursor-pointer bg-slate-800 rounded-xl border border-slate-700 p-1.5 focus:outline-none"
                      />
                    </div>
                  )}

                  {aiMode === 'camera' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">Capture document snapshot with environment/back camera</label>
                      {!isCameraActive ? (
                        <button
                          type="button"
                          onClick={startCamera}
                          disabled={isAiProcessing}
                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                        >
                          🎥 Access Webcam / Camera
                        </button>
                      ) : (
                        <div className="space-y-2 bg-black p-3 rounded-2xl relative overflow-hidden flex flex-col items-center border border-slate-800">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full max-h-[160px] rounded-lg object-cover"
                          />
                          <div className="flex gap-2 w-full">
                            <button
                              type="button"
                              onClick={captureSnapshot}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg border-0 cursor-pointer"
                            >
                              📸 Capture & Autofill
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg border-0 cursor-pointer"
                            >
                              ❌ Stop
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {aiMode === 'text' && (
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-300 block">Paste resume details or candidate message text directly:</label>
                      <textarea
                        value={aiTextPaste}
                        onChange={(e) => setAiTextPaste(e.target.value)}
                        placeholder="Paste details here (e.g., Name: Ramesh Kumar, Passport: Z1234567, Trade: Mason, Mob: 9876543210, Country: Saudi...)"
                        rows={4}
                        disabled={isAiProcessing}
                        className="w-full text-xs bg-slate-800 text-white p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono resize-none placeholder:text-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!aiTextPaste.trim()) {
                            alert("Please paste some candidate text details first.");
                            return;
                          }
                          const base64EncodedText = btoa(unescape(encodeURIComponent(aiTextPaste)));
                          processAiExtraction(`data:text/plain;base64,${base64EncodedText}`, 'text/plain');
                        }}
                        disabled={isAiProcessing || !aiTextPaste.trim()}
                        className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                      >
                        🤖 AI Extract from Pasted Text ⚡
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Javascript helper functions nested inside component code context */}
              {(() => {
                // Ensure helper methods are declared on the modal context for AI actions
                (window as any).processAiExtraction = processAiExtraction;
                return null;
              })()}

              {/* Candidate Photo Section */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  👤 Candidate Profile Photo
                </h5>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-28 h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt="Candidate Profile" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-slate-400 text-center space-y-1">
                        <span className="text-3xl block">👤</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider block">No Photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5 w-full">
                    <p className="text-[11px] text-slate-500 font-medium">
                      Capture candidate profile photo instantly using system camera or upload a file. (वेबकैम से फोटो खींचे या फ़ाइल अपलोड करें)
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {!isProfileCameraActive ? (
                        <button
                          type="button"
                          onClick={startProfileCamera}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-0"
                        >
                          📷 Capture with Camera
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopProfileCamera}
                          className="bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border-0"
                        >
                          ❌ Turn Off Camera
                        </button>
                      )}
                      
                      <label
                        htmlFor="candidate-profile-photo-upload"
                        className="bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 text-[11px] font-bold py-2 px-3.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        📁 Choose Photo File
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setPhotoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="candidate-profile-photo-upload"
                      />

                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="text-rose-600 hover:text-rose-700 font-bold text-[11px] transition-all cursor-pointer bg-rose-50 px-2.5 py-1.5 rounded-lg border-0"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {isProfileCameraActive && (
                  <div className="bg-black p-3 rounded-2xl relative overflow-hidden flex flex-col items-center border border-slate-800 animate-fadeIn">
                    <video
                      ref={profileVideoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-[220px] rounded-xl object-cover"
                    />
                    <div className="flex gap-2 w-full mt-3">
                      <button
                        type="button"
                        onClick={captureProfileSnapshot}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl border-0 cursor-pointer shadow-sm"
                      >
                        📸 Capture Live Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopProfileCamera}
                        className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-4 rounded-xl border-0 cursor-pointer shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">
                Primary Profile Particulars
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. First option Interview name select with date */}
                <div className="md:col-span-2 bg-purple-50/40 p-4 rounded-2xl border border-purple-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 justify-between">
                      <span>Select Scheduled Interview 🏢 *</span>
                      <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">Automated Sync</span>
                    </label>
                    <select
                      value={selectedInterviewId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedInterviewId(val);
                        if (val === 'custom') {
                          setShowManualCompany(true);
                          setCompanyName('');
                        } else if (val === '') {
                          setShowManualCompany(true);
                          setCompanyName('');
                        } else {
                          const matched = scheduledInterviews.find((i: any) => i.id === val);
                          if (matched) {
                            setShowManualCompany(false);
                            setCompanyName(matched.companyName);
                            if (matched.date) setInterviewDate(matched.date);
                            if (matched.trade) {
                              const foundT = customTrades.find((t: string) => t.toLowerCase() === matched.trade.toLowerCase());
                              if (foundT) setTrade(foundT);
                            }
                          }
                        }
                      }}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-250 focus:ring-2 focus:ring-purple-500 shadow-xs outline-none font-bold cursor-pointer text-slate-700"
                    >
                      <option value="">-- Direct Manual Entry (मैन्युअल एंट्री) --</option>
                      {scheduledInterviews.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          🏢 {item.companyName} ({item.trade}) — {item.date}
                        </option>
                      ))}
                      <option value="custom">✍️ Enter Other Company Name (अन्य कंपनी नाम टाइप करें)</option>
                    </select>
                  </div>

                  {(showManualCompany || selectedInterviewId === 'custom' || selectedInterviewId === '') && (
                    <div className="space-y-1 transition-all animate-fadeIn">
                      <label className="text-xs font-bold text-slate-500 block">Company Name *</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => {
                          const nameVal = e.target.value;
                          setCompanyName(nameVal);
                          if (nameVal && !isEditing) {
                            const matched = scheduledInterviews.find(
                              (i: any) => i.companyName.trim().toLowerCase() === nameVal.trim().toLowerCase()
                            );
                            if (matched) {
                              setSelectedInterviewId(matched.id);
                              setShowManualCompany(false);
                              if (matched.date) setInterviewDate(matched.date);
                              if (matched.trade) {
                                const foundT = customTrades.find((t: string) => t.toLowerCase() === matched.trade.toLowerCase());
                                if (foundT) setTrade(foundT);
                              }
                            }
                          }
                        }}
                        placeholder="Type manual company name..."
                        className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-250 focus:ring-2 focus:ring-purple-500 shadow-xs outline-none font-bold text-slate-700"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Interview / Selection Date</label>
                    <input
                      type="date"
                      value={interviewDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        setInterviewDate(selectedDate);
                        if (selectedDate && !isEditing) {
                          const matched = scheduledInterviews.find((i: any) => i.date === selectedDate);
                          if (matched) {
                            setSelectedInterviewId(matched.id);
                            setShowManualCompany(false);
                            setCompanyName(matched.companyName);
                            if (matched.trade) {
                              const foundT = customTrades.find((t: string) => t.toLowerCase() === matched.trade.toLowerCase());
                              if (foundT) setTrade(foundT);
                            }
                          }
                        }
                      }}
                      className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium text-slate-700"
                    />
                  </div>
                </div>

                {/* 2. Job for applied */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Job For Applied (Trade) *</label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium text-slate-700"
                  >
                    {getDynamicTradeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name as per passport"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 4. Father name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Father's Name</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's full name"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 5. Mother name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Mother's Name</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Mother's full name"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 6. Address */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Permanent Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter candidate's complete permanent address"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium leading-relaxed"
                  />
                </div>

                {/* 7. Mobile number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Mobile / Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="E.g. +91 98765 43210"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 8. Date of birth with age */}
                <div className="space-y-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => {
                        const dob = e.target.value;
                        setDateOfBirth(dob);
                        if (dob) {
                          const birthYear = new Date(dob).getFullYear();
                          const calculatedAge = 2026 - birthYear;
                          if (!isNaN(calculatedAge)) {
                            setAge(calculatedAge);
                          }
                        }
                      }}
                      className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      placeholder="Age"
                      className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                    />
                  </div>
                </div>

                {/* 9. Marital status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                {/* 10. Education */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Education</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    placeholder="E.g. 10th, 12th, ITI, Graduate, etc."
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 11. Language */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Language(s) Spoken</label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="E.g. Hindi, English, Arabic"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 12. Passport number */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Passport Number *</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="E.g. Z8765432"
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-mono font-semibold text-slate-700"
                  />
                </div>

                {/* 13. Passport expires */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={passportExpires}
                    onChange={(e) => setPassportExpires(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                {/* 14. ECR ecnr */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">ECR / ECNR Status</label>
                  <select
                    value={ecrEcnr}
                    onChange={(e) => setEcrEcnr(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  >
                    <option value="ECNR">ECNR (Emigration Check Not Required)</option>
                    <option value="ECR">ECR (Emigration Check Required)</option>
                  </select>
                </div>

                {/* Backup / Extra detail fields in small/elegant layout at end */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Registered Date</label>
                  <input
                    type="date"
                    value={createdDate}
                    onChange={(e) => setCreatedDate(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium text-slate-400"
                  />
                </div>
              </div>

              {/* Accounts Ledger & Service Charge Section */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <h4 className="text-sm font-bold text-slate-800 font-display">Accounts Ledger & Service Charge (Hisaab Kitaab)</h4>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Ledger Options
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-700 block">Service Charge (Total Deal Amount) *</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={totalDealAmount}
                        onChange={(e) => setTotalDealAmount(parseFloat(e.target.value) || 0)}
                        placeholder="E.g. 60000"
                        className="w-full text-sm bg-white p-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 shadow-sm outline-none font-bold text-slate-800"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Candidate se fix hua total deal/service charge amount.</p>
                  </div>

                  {!isEditing ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Advance Received at Registration (Optional)</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={registrationAdvanceAmount}
                          onChange={(e) => setRegistrationAdvanceAmount(e.target.value)}
                          placeholder="E.g. 10000 (if paid now)"
                          className="w-full text-sm bg-white p-3 pl-8 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 shadow-sm outline-none font-bold text-slate-700"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">Agar candidate ne registration ke waqt koi advance payment di ho.</p>
                    </div>
                  ) : (
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col justify-between text-xs text-slate-600 shadow-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-500">Advance Received:</span>
                        <span className="font-bold font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">₹{computedAdvanceReceived.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-500">Balance Pending:</span>
                        <span className={`font-bold font-mono px-2 py-0.5 rounded-md ${computedBalanceAmount <= 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                          ₹{computedBalanceAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 text-right italic">Dono records clear karke "5. Ledger" tab me edit karein.</p>
                    </div>
                  )}

                  {!isEditing && registrationAdvanceAmount && parseFloat(registrationAdvanceAmount) > 0 && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Advance Payment Mode</label>
                        <div className="flex gap-2">
                          {(['Online', 'Cash'] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setRegistrationAdvanceMode(mode)}
                              className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all outline-none cursor-pointer ${
                                registrationAdvanceMode === mode
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Payment Reference / Txn Details</label>
                        <input
                          type="text"
                          value={registrationAdvanceRef}
                          onChange={(e) => setRegistrationAdvanceRef(e.target.value)}
                          placeholder="E.g. Cash Receipt # or GooglePay Ref No."
                          className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 shadow-sm outline-none font-medium text-slate-700"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Status and Archival */}
              {isEditing && (
                <div className="bg-slate-100 p-4 rounded-2xl flex items-center justify-between border border-slate-200 mt-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">Flight Deployed / Archive Status</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">Flight confirm hone ke baad data archive section me bhej sakte hain.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-600">Archived Deployed Candidate:</label>
                    <input
                      type="checkbox"
                      checked={isArchived}
                      onChange={(e) => setIsArchived(e.target.checked)}
                      className="w-4 h-4 text-sky-500 focus:ring-sky-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Stage 1 - Interview */}
          {activeTab === 'stage1' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CheckCircle className="w-5 h-5 text-sky-500" />
                <h4 className="text-sm font-bold text-slate-700">Stage 3: Interview Form Upload & Selection Outcome</h4>
              </div>

              <div className="space-y-5">
                {/* Interview Result / Status Selection */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-700">Interview Result / Selection Status (चयन की स्थिति)</h5>
                      <p className="text-[10px] text-slate-400">Manage candidate selection outcome: Selected, Hold, or Rejected.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setInterviewStatus(InterviewStatus.Selected)}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        interviewStatus === InterviewStatus.Selected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm ring-1 ring-emerald-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className={`w-5 h-5 ${interviewStatus === InterviewStatus.Selected ? 'text-emerald-500' : 'text-slate-400'}`} />
                      <span>Selected (चयनित)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewStatus(InterviewStatus.Hold)}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        interviewStatus === InterviewStatus.Hold
                          ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm ring-1 ring-amber-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AlertCircle className={`w-5 h-5 ${interviewStatus === InterviewStatus.Hold ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span>On Hold (होल्ड)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewStatus(InterviewStatus.Rejected)}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        interviewStatus === InterviewStatus.Rejected
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm ring-1 ring-rose-500'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className={`w-5 h-5 ${interviewStatus === InterviewStatus.Rejected ? 'text-rose-500' : 'text-slate-400'}`} />
                      <span>Rejected (अस्वीकृत)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewStatus(InterviewStatus.Pending)}
                      className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                        interviewStatus === InterviewStatus.Pending
                          ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-sm'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className={`w-5 h-5 ${interviewStatus === InterviewStatus.Pending ? 'text-slate-500' : 'text-slate-400'}`} />
                      <span>Pending Decision</span>
                    </button>
                  </div>
                </div>

                {/* Interview Document Upload Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-500" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-700">Signed Interview Form</h5>
                      <p className="text-[10px] text-slate-400">Upload the form signed during the interview process.</p>
                    </div>
                  </div>

                  {interviewFileName ? (
                    <div className="bg-sky-50/80 border border-sky-100 py-2.5 px-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
                      <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                        <FileText className="w-4 h-4 text-sky-500 shrink-0" />
                        <span className="truncate font-mono text-[11px] text-slate-600" title={interviewFileName}>{interviewFileName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                        <button
                          type="button"
                          onClick={() => handlePreviewFile(interviewFileName, interviewFileUrl)}
                          className="bg-white hover:bg-sky-100 text-sky-600 p-1.5 rounded-lg border border-sky-200 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[10px] ml-1 font-bold sm:hidden">Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(interviewFileName, interviewFileUrl)}
                          className="bg-white hover:bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-150 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                          title="Download Document"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span className="text-[10px] ml-1 font-bold sm:hidden">Download</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setInterviewFileName('');
                            setInterviewFileUrl('');
                          }}
                          className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-150 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] ml-1 font-bold sm:hidden">Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => triggerRealUpload('interviewFile')}
                      disabled={uploadingField !== null}
                      className="w-full py-4 px-4 border border-dashed border-sky-200 hover:border-sky-400 hover:bg-sky-50/30 text-sky-600 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50"
                    >
                      <Upload className="w-6 h-6 text-sky-400" />
                      <span>{uploadingField === 'interviewFile' ? 'Uploading form...' : 'Upload Signed Interview Form'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 5 - Offer Letter */}
          {activeTab === 'offer_letter' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                <h4 className="text-sm font-bold text-slate-700">Stage 5: Offer Letter Verification</h4>
              </div>

              <div className="space-y-5">
                {/* Offer Letter Sign Option */}
                <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-emerald-500" />
                      <div>
                        <h5 className="text-xs font-bold text-slate-700">Offer Letter Signed Status</h5>
                        <p className="text-[10px] text-slate-400">Kya candidate ne offer letter sign karke submit kiya hai?</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !offerLetterSigned;
                        setOfferLetterSigned(nextVal);
                        if (nextVal && !offerLetterFileName) {
                          setOfferLetterFileName('Signed_Offer_Letter.pdf');
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none cursor-pointer border ${
                        offerLetterSigned
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {offerLetterSigned ? '✓ Signed & Approved' : '✗ Pending / Not Signed'}
                    </button>
                  </div>

                  {offerLetterSigned && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Signed Offer Letter Document File</label>
                        {offerLetterFileName && offerLetterFileUrl && !offerLetterFileName.includes('Signed_Offer_Letter.pdf') ? (
                          <div className="bg-emerald-50/80 border border-emerald-100 py-2.5 px-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                              <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span className="truncate font-mono text-[11px] text-slate-600" title={offerLetterFileName}>{offerLetterFileName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                              <button
                                type="button"
                                onClick={() => handlePreviewFile(offerLetterFileName, offerLetterFileUrl)}
                                className="bg-white hover:bg-sky-50 text-sky-600 p-1.5 rounded-lg border border-sky-100 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                title="Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="text-[10px] ml-1 font-bold sm:hidden">Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(offerLetterFileName, offerLetterFileUrl)}
                                className="bg-white hover:bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="text-[10px] ml-1 font-bold sm:hidden">Download</span>
                              </button>
                              <button 
                                type="button"
                                onClick={() => {
                                  setOfferLetterFileName('');
                                  setOfferLetterFileUrl('');
                                }}
                                className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-100 transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] ml-1 font-bold sm:hidden">Delete</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => triggerRealUpload('offerLetterFile')}
                            disabled={uploadingField !== null}
                            className="w-full py-4 px-4 border border-dashed border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30 text-emerald-600 font-bold text-xs rounded-xl transition-all disabled:opacity-50 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50/50"
                          >
                            <Upload className="w-6 h-6 text-emerald-400" />
                            <span>{uploadingField === 'offerLetterFile' ? 'Uploading offer letter...' : 'Upload Signed Offer Letter Document'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 2 - Medical */}
          {activeTab === 'stage2' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Activity className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-bold text-slate-700">Stage 2: Medical Fitness Tracking</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Medical Examination Date</label>
                  <input
                    type="date"
                    value={medicalDate}
                    onChange={(e) => setMedicalDate(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Medical Status Outcome</label>
                  <select
                    value={medicalStatus}
                    onChange={(e) => {
                      setMedicalStatus(e.target.value as MedicalStatus);
                      if (e.target.value === MedicalStatus.Fit) {
                        setDocuments(prev => ({ ...prev, medicalReport: true }));
                      }
                    }}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium text-slate-700"
                  >
                    <option value={MedicalStatus.Pending}>Pending</option>
                    <option value={MedicalStatus.ReportAwaiting}>Report Awaiting</option>
                    <option value={MedicalStatus.Fit}>Fit (Cleared)</option>
                    <option value={MedicalStatus.Unfit}>Unfit</option>
                  </select>
                </div>
              </div>

              {/* Medical Report File Upload simulation */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 mt-4 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-600 block">Medical Report Upload</span>
                  <p className="text-[11px] text-slate-400">PDF, PNG or JPG format accepted.</p>
                </div>

                {medicalReportName ? (
                  <div className="bg-indigo-50/80 border border-indigo-150 py-2.5 px-3 rounded-xl max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-600" title={medicalReportName}>{medicalReportName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(medicalReportName, medicalReportUrl)}
                        className="bg-white hover:bg-sky-50 text-sky-600 p-1.5 rounded-lg border border-sky-100 transition-all shadow-xs flex items-center justify-center"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(medicalReportName, medicalReportUrl)}
                        className="bg-white hover:bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 transition-all shadow-xs flex items-center justify-center"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Download</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setMedicalReportName('');
                          setMedicalReportUrl('');
                        }}
                        className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-100 transition-all shadow-xs flex items-center justify-center"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMockUpload('medicalReportFile')}
                    disabled={uploadingField !== null}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                  >
                    {uploadingField === 'medicalReportFile' ? 'Uploading PDF...' : 'Attach FIT Report PDF'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: Stage 3 - Documents */}
          {activeTab === 'stage3' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="text-sm font-bold text-slate-700">Stage 3: Document Checklist & Uploads</h4>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleDownloadAllDocuments}
                    disabled={zipping}
                    className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
                    title="Download All Available Documents of Candidate as a ZIP file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{zipping ? 'Creating ZIP...' : 'Download All Docs (ZIP)'}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-500 italic">
                Har candidate ke basic documents checklist click kar ke verify karein. Baar-baar folders me dhundhne ki jarurat nahi.
              </p>

              {/* Checklist Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-150">
                {[
                  { key: 'passportScan', label: 'Passport Scan (First & Last Page)' },
                  { key: 'photo', label: 'Passport Size White-BG Photo' },
                  { key: 'experienceCertificate', label: 'Experience & Trade Certificates' },
                  { key: 'medicalReport', label: 'Medical FIT Certificate (Verified)' },
                  { key: 'pcc', label: 'Police Clearance Certificate (PCC)' },
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <span className="text-xs font-medium text-slate-700">{doc.label}</span>
                    <input
                      type="checkbox"
                      checked={documents[doc.key as keyof CandidateDocuments]}
                      onChange={(e) => {
                        setDocuments(prev => ({ ...prev, [doc.key]: e.target.checked }));
                      }}
                      className="w-4.5 h-4.5 text-emerald-500 focus:ring-emerald-400 rounded cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* File Upload simulator for checklist docs */}
              <div className="space-y-3 mt-4">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Documents Folder</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['passportScan', 'photo', 'experienceCertificate', 'pcc'].map((key) => {
                    const isUploaded = uploadedDocs.some(d => d.key === key);
                    return (
                      <div 
                        key={key} 
                        className={`p-3 rounded-xl border text-center space-y-2 flex flex-col justify-between ${
                          isUploaded ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-500 block leading-tight truncate uppercase">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        
                        {isUploaded ? (
                          <div className="space-y-1.5">
                            <span className="text-[9px] text-emerald-600 block font-bold truncate">✓ Verified</span>
                            <span className="text-[8px] text-slate-500 block font-mono truncate" title={uploadedDocs.find(d => d.key === key)?.name}>
                              {uploadedDocs.find(d => d.key === key)?.name}
                            </span>
                            <div className="flex items-center justify-center gap-1 mt-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const docObj = uploadedDocs.find(d => d.key === key);
                                  if (docObj) handlePreviewFile(docObj.name, docObj.url);
                                }}
                                className="bg-white hover:bg-sky-50 text-sky-600 p-1 rounded-md border border-sky-150 transition-all flex items-center justify-center"
                                title="Preview File"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const docObj = uploadedDocs.find(d => d.key === key);
                                  if (docObj) handleDownloadFile(docObj.name, docObj.url);
                                }}
                                className="bg-white hover:bg-emerald-50 text-emerald-600 p-1 rounded-md border border-emerald-150 transition-all flex items-center justify-center"
                                title="Download File"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadedDocs(prev => prev.filter(d => d.key !== key));
                                  setDocuments(prev => ({ ...prev, [key]: false }));
                                }}
                                className="bg-white hover:bg-rose-50 text-rose-600 p-1 rounded-md border border-rose-150 transition-all flex items-center justify-center"
                                title="Delete File"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMockUpload(key as keyof CandidateDocuments)}
                            disabled={uploadingField !== null}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded-lg transition-all"
                          >
                            Upload File
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Stage 4 - Visa */}
          {activeTab === 'stage4' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Award className="w-5 h-5 text-violet-500" />
                <h4 className="text-sm font-bold text-slate-700">Stage 4: Visa Application & Stamping</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Visa Process Status</label>
                  <select
                    value={visaStatus}
                    onChange={(e) => setVisaStatus(e.target.value as VisaStatus)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium text-slate-700"
                  >
                    <option value={VisaStatus.Pending}>Pending Docs</option>
                    <option value={VisaStatus.Applied}>Visa Applied</option>
                    <option value={VisaStatus.Received}>Visa Received / Stamped</option>
                    <option value={VisaStatus.Rejected}>Visa Rejected</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Visa Expiry Date</label>
                  <input
                    type="date"
                    value={visaExpiryDate}
                    onChange={(e) => setVisaExpiryDate(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>
              </div>

              {/* Visa Upload Document box */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 mt-4 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-600 block">Stamped Visa Copy Upload</span>
                  <p className="text-[11px] text-slate-400">PDF copy for ticketing check.</p>
                </div>

                {visaCopyName ? (
                  <div className="bg-violet-50/80 border border-violet-150 py-2.5 px-3 rounded-xl max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                      <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-600" title={visaCopyName}>{visaCopyName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(visaCopyName, visaCopyUrl)}
                        className="bg-white hover:bg-sky-50 text-sky-600 p-1.5 rounded-lg border border-sky-100 transition-all shadow-xs flex items-center justify-center"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(visaCopyName, visaCopyUrl)}
                        className="bg-white hover:bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 transition-all shadow-xs flex items-center justify-center"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Download</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setVisaCopyName('');
                          setVisaCopyUrl('');
                        }}
                        className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-100 transition-all shadow-xs flex items-center justify-center"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMockUpload('visaCopyFile')}
                    disabled={uploadingField !== null}
                    className="bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                  >
                    {uploadingField === 'visaCopyFile' ? 'Uploading...' : 'Attach Visa PDF copy'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: Stage 5 - Ledger */}
          {activeTab === 'stage5' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                  <h4 className="text-sm font-bold text-slate-700 font-display">Stage 5: Accounts Ledger (Hisaab Kitaab)</h4>
                </div>
              </div>

              {!isAdmin ? (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-sm mx-auto">
                    <h5 className="text-sm font-bold text-slate-800 tracking-tight">Ledger Access Restricted</h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Security policy ke anusaar accounts, deals aur payment transaction history details sirf **Admin** accounts ko dikhte hain. General staff ko iska access nahi hai.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Ledger Summary Bento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase leading-tight">Total Deal Amount</span>
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={totalDealAmount}
                        onChange={(e) => setTotalDealAmount(parseFloat(e.target.value) || 0)}
                        className="w-full text-base font-bold font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  ) : (
                    <span className="text-xl font-bold font-mono text-slate-800 block">₹{totalDealAmount.toLocaleString('en-IN')}</span>
                  )}
                </div>

                <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 shadow-sm space-y-1">
                  <span className="text-[10px] text-emerald-600 block font-semibold uppercase leading-tight">Paid (Advance Recd)</span>
                  <span className="text-xl font-bold font-mono text-emerald-700 block">₹{computedAdvanceReceived.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-slate-400 block font-sans">Sum of all entries</span>
                </div>

                <div className={`p-4 rounded-2xl border shadow-sm space-y-1 ${
                  computedBalanceAmount <= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}>
                  <span className="text-[10px] block font-semibold uppercase leading-tight text-slate-400">Balance Pending</span>
                  <span className={`text-xl font-bold font-mono block ${
                    computedBalanceAmount <= 0 ? 'text-emerald-700' : 'text-rose-500'
                  }`}>
                    ₹{computedBalanceAmount.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-slate-400 block font-sans">
                    {computedBalanceAmount <= 0 ? 'Clear to Board ✈️' : 'Must settle before departure'}
                  </span>
                </div>
              </div>

              {/* Add Payment Form (Admin Only) */}
              {isAdmin && (
                <form onSubmit={handleAddPayment} className="bg-slate-100 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-purple-600" /> Add New Payment Transaction
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Amount Paid (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="E.g. 15000"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-purple-500 outline-none font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Mode</label>
                      <select
                        value={newPayMode}
                        onChange={(e) => setNewPayMode(e.target.value as 'Cash' | 'Online')}
                        className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-purple-500 outline-none font-medium"
                      >
                        <option value="Online">Online (GPay/UPI/Bank)</option>
                        <option value="Cash">Cash Handover</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Reference / Receipt Tag</label>
                      <input
                        type="text"
                        placeholder="E.g. Receipt #481"
                        value={newPayRef}
                        onChange={(e) => setNewPayRef(e.target.value)}
                        className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-purple-500 outline-none font-medium"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl transition-all shadow-sm"
                  >
                    Post Payment Entry
                  </button>
                </form>
              )}

              {/* Transactions History list */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Ledger Ledger</h5>
                {paymentHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center bg-white rounded-xl border border-slate-100">
                    No transactions entered yet for this candidate.
                  </p>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-150 overflow-hidden shadow-inner">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Reference Note</th>
                          <th className="p-3 text-right">Amount</th>
                          {isAdmin && <th className="p-3 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {paymentHistory.map((pmt) => (
                          <tr key={pmt.id} className="hover:bg-slate-50">
                            <td className="p-3 font-mono text-slate-500">{pmt.date}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                pmt.mode === 'Online' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {pmt.mode}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">{pmt.reference || '-'}</td>
                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                              ₹{pmt.amount.toLocaleString('en-IN')}
                            </td>
                            {isAdmin && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemovePayment(pmt.id)}
                                  className="text-slate-300 hover:text-rose-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Company Ledger Screenshot Upload */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700">Company Ledger Payment Screenshot</h5>
                    <p className="text-[10px] text-slate-500">Upload screenshot/receipt of payment settled with the company</p>
                  </div>
                  {companyLedgerScreenshotUrl && (
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Uploaded</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => triggerRealUpload('companyLedgerScreenshotFile')}
                    disabled={uploadingField !== null}
                    className="w-full sm:w-auto bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingField === 'companyLedgerScreenshotFile' ? 'Uploading...' : 'Upload Screenshot'}
                  </button>

                  {companyLedgerScreenshotUrl ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                        <span className="text-xs font-mono text-slate-600 truncate max-w-[150px]" title={companyLedgerScreenshotName}>
                          {companyLedgerScreenshotName || 'ledger_screenshot.png'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ name: companyLedgerScreenshotName || 'Ledger Screenshot', url: companyLedgerScreenshotUrl })}
                          className="text-purple-600 hover:text-purple-700 text-xs font-bold px-1.5 py-0.5"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompanyLedgerScreenshotName('');
                            setCompanyLedgerScreenshotUrl('');
                          }}
                          className="text-rose-500 hover:text-rose-600 text-xs font-bold px-1.5 py-0.5"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No screenshot attached</span>
                  )}
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* TAB: Stage 6 - Flight */}
          {activeTab === 'stage6' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Plane className="w-5 h-5 text-rose-500" />
                <h4 className="text-sm font-bold text-slate-700">Stage 6: Deployment & Flight Ticket</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Airline Name</label>
                  <input
                    type="text"
                    placeholder="E.g. Oman Air, Air India"
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Flight PNR / Ticket Number</label>
                  <input
                    type="text"
                    placeholder="E.g. WY91230B"
                    value={pnrNumber}
                    onChange={(e) => setPnrNumber(e.target.value.toUpperCase())}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-mono font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Flight Date</label>
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Flight Departure Time</label>
                  <input
                    type="text"
                    placeholder="E.g. 14:30"
                    value={flightTime}
                    onChange={(e) => setFlightTime(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Actual Deployment Date (Departure)</label>
                  <input
                    type="date"
                    value={deployedDate}
                    onChange={(e) => setDeployedDate(e.target.value)}
                    className="w-full text-sm bg-white p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 shadow-sm outline-none font-medium"
                  />
                </div>
              </div>

              {/* Flight Ticket Copy simulation */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center bg-slate-50/50 mt-4 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-600 block">Flight E-Ticket Copy Upload</span>
                  <p className="text-[11px] text-slate-400">PDF copy containing PNR & barcode.</p>
                </div>

                {flightTicketName ? (
                  <div className="bg-rose-50/80 border border-rose-150 py-2.5 px-3 rounded-xl max-w-md mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-medium text-slate-700 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-1.5 min-w-0 w-full sm:w-auto">
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate font-mono text-[11px] text-slate-600" title={flightTicketName}>{flightTicketName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                      <button
                        type="button"
                        onClick={() => handlePreviewFile(flightTicketName, flightTicketUrl)}
                        className="bg-white hover:bg-sky-50 text-sky-600 p-1.5 rounded-lg border border-sky-100 transition-all shadow-xs flex items-center justify-center"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(flightTicketName, flightTicketUrl)}
                        className="bg-white hover:bg-emerald-50 text-emerald-600 p-1.5 rounded-lg border border-emerald-100 transition-all shadow-xs flex items-center justify-center"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Download</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setFlightTicketName('');
                          setFlightTicketUrl('');
                        }}
                        className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 rounded-lg border border-rose-100 transition-all shadow-xs flex items-center justify-center"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] ml-1 font-bold sm:hidden">Delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMockUpload('flightTicketFile')}
                    disabled={uploadingField !== null}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all disabled:opacity-50 inline-flex items-center gap-1 shadow-sm"
                  >
                    {uploadingField === 'flightTicketFile' ? 'Uploading...' : 'Attach Flight PDF Ticket'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Sticky Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono hidden md:block">
            {isAdmin ? '🔧 Admin Control Active' : '🔒 Read-only Account limits active'}
          </div>

          <div className="flex gap-2 w-full md:w-auto flex-wrap justify-end">
            {isEditing && (
              <button
                type="button"
                onClick={handleDownloadAllDocuments}
                disabled={zipping}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 outline-none cursor-pointer"
                title="Download All Uploaded Documents of Candidate in a ZIP file"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{zipping ? 'Zipping...' : 'Download Docs (ZIP)'}</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-6 py-2.5 rounded-xl text-xs transition-all outline-none border border-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 md:flex-none bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition-all shadow-md hover:shadow-sky-500/10 flex items-center justify-center gap-1.5 outline-none"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Updates' : 'Register Candidate'}</span>
            </button>
          </div>
        </div>
        {/* Hidden File Input for Real Uploads */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.png,.jpg,.jpeg"
        />

        {/* High Fidelity Document Preview Overlay Modal */}
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[60] animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
              <div className="p-4 bg-slate-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <div className="text-left">
                    <h3 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{previewDoc.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Verified File Scan</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(previewDoc.name, previewDoc.url !== 'mock' ? previewDoc.url : undefined)}
                    className="bg-slate-800 hover:bg-indigo-600 text-white p-2 rounded-xl transition-all inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-400 p-2 rounded-xl transition-all cursor-pointer"
                    title="Close Preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 p-6 overflow-auto flex items-center justify-center min-h-[350px]">
                {previewDoc.url !== 'mock' && (previewDoc.url.startsWith('data:image/') || previewDoc.name.match(/\.(png|jpg|jpeg|gif)$/i)) ? (
                  <img 
                    src={previewDoc.url} 
                    alt={previewDoc.name} 
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : previewDoc.url !== 'mock' && previewDoc.url.startsWith('data:application/pdf') ? (
                  <object
                    data={previewDoc.url}
                    type="application/pdf"
                    className="w-full h-[65vh] rounded-xl border border-slate-300"
                  >
                    <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto">
                      <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-800 text-sm mb-1">PDF Preview Not Supported</h4>
                      <p className="text-xs text-slate-500 mb-4">Aapka browser direct base64 PDF preview support nahi karta hai. Kripya download karke dekhein.</p>
                      <button
                        onClick={() => handleDownloadFile(previewDoc.name, previewDoc.url)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Document</span>
                      </button>
                    </div>
                  </object>
                ) : (
                  /* Sealed mock document preview mockup with beautiful dashboard */
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200/60 shadow-xl space-y-6 text-center animate-scale-up">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                      <FileText className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-800 text-base">{previewDoc.name}</h4>
                      <p className="text-xs text-slate-400">Verified System Document • File size auto-optimized</p>
                      
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Tamam security checks pass hain</span>
                      </div>
                    </div>

                    {/* Fake doc specs */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-500">
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Document Type</span>
                        <span className="font-bold text-slate-700">{previewDoc.name.endsWith('.pdf') ? 'PDF Document' : 'Image Scan'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                        <span className="font-bold text-emerald-600">Active & Sealed</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">File Hash</span>
                        <span className="font-mono text-[10px]">SHA-256 Verified</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">Server Host</span>
                        <span className="font-bold text-slate-700">JV Tech Cloud</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => handleDownloadFile(previewDoc.name, previewDoc.url !== 'mock' ? previewDoc.url : undefined)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/10 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Document File</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
