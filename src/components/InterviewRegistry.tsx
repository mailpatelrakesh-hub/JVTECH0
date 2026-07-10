import React, { useState } from 'react';
import JSZip from 'jszip';
import { Candidate, InterviewStatus, CandidateDocuments, SystemSettings, ScheduledInterview } from '../types';
import { TRADES_LIST, COUNTRIES_LIST } from '../data';
import { 
  Calendar, CheckCircle, XCircle, AlertCircle, MessageSquare, 
  Search, Filter, Award, Briefcase, Globe, User, Clock, 
  ChevronRight, ClipboardList, Send, Sparkles, Phone, ShieldCheck,
  Trash2, FileCheck, Plus, X, ChevronDown, UserPlus, FileText,
  Download, FolderDown
} from 'lucide-react';

interface InterviewRegistryProps {
  candidates: Candidate[];
  onEditCandidate: (candidate: Candidate) => void;
  onDeleteCandidate?: (id: string, name: string) => void;
  customTrades?: string[];
  onSaveCandidate?: (candidate: Candidate) => void;
  systemSettings?: SystemSettings;
  onUpdateSystemSettings?: (newSettings: SystemSettings) => void;
  scheduledInterviews?: ScheduledInterview[];
  onUpdateScheduledInterviews?: (newInterviews: ScheduledInterview[]) => void;
}


const isCompanyOrDateMatch = (cand: Candidate, interview: ScheduledInterview) => {
  // 1. Direct date match is the strongest signal
  if (cand.stage1?.interviewDate === interview.date) {
    return true;
  }

  if (!cand.companyName || !interview.companyName) return false;

  // 2. Clean and compare whole strings (lowercase, alphanumeric only)
  const cleanStr = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cCleanAll = cleanStr(cand.companyName);
  const iCleanAll = cleanStr(interview.companyName);

  if (cCleanAll.includes(iCleanAll) || iCleanAll.includes(cCleanAll)) {
    return true;
  }

  // 3. Word-by-word fuzzy overlap
  const getWords = (str: string) => {
    const stopWords = ['co', 'company', 'ltd', 'limited', 'corporation', 'corp', 'group', 'sbg', 'contracting', 'inc', 'incorporated', 'dairy', 'engineering', 'and', 'partners', 'services'];
    return str
      .toLowerCase()
      .replace(/[-.,()/[\]]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stopWords.includes(w));
  };

  const cWords = getWords(cand.companyName);
  const iWords = getWords(interview.companyName);

  // If they share any key word, or if a word is a substring of another word
  for (const cw of cWords) {
    for (const iw of iWords) {
      if (cw === iw || cw.includes(iw) || iw.includes(cw)) {
        return true;
      }
      // Handle common spelling/variation prefixes like ladin vs laden, marai vs almarai
      if (cw.substring(0, 4) === iw.substring(0, 4)) {
        return true;
      }
    }
  }

  return false;
};

export default function InterviewRegistry({ 
  candidates, 
  onEditCandidate,
  onDeleteCandidate,
  customTrades = TRADES_LIST,
  onSaveCandidate,
  systemSettings,
  onUpdateSystemSettings,
  scheduledInterviews: propsScheduledInterviews,
  onUpdateScheduledInterviews
}: InterviewRegistryProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortByDate, setSortByDate] = useState<'desc' | 'asc'>('desc');

  // Scheduled Interviews state with localStorage persistence as fallback
  const [localScheduledInterviews, setLocalScheduledInterviews] = useState<ScheduledInterview[]>(() => {
    const saved = localStorage.getItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    // Default seed interviews based on real system dates and future slots
    const initial: ScheduledInterview[] = [
      {
        id: 'INT-001',
        date: '2026-07-05',
        companyName: 'Almarai Dairy Co.',
        trade: 'Heavy Truck Driver & Dispatcher',
        mode: 'Client Direct Interview',
        venue: 'JV Tech Head Office Delhi',
        description: 'Large-scale recruitment drive for experienced heavy drivers with valid GCC licenses.'
      },
      {
        id: 'INT-002',
        date: '2026-07-12',
        companyName: 'Bin Laden Group (SBG)',
        trade: 'Industrial Electrician & Instrument Tech',
        mode: 'Zoom Online Screening',
        venue: 'JV Tech Interview Room A',
        description: 'Video interviews for infrastructure refinery projects in Makkah and Madinah.'
      },
      {
        id: 'INT-003',
        date: '2026-06-25',
        companyName: 'Al-Yamama Contracting',
        trade: 'Ductman, Insulator, Welder',
        mode: 'Direct Client Interview',
        venue: 'JV Tech Trade Test Center',
        description: 'Completed direct client selection and trade test for Jubail petrochemical projects.'
      },
      {
        id: 'INT-004',
        date: '2026-06-20',
        companyName: 'Nasser S. Al-Hajri Corporation (NSH)',
        trade: 'Pipe Fitter & Tig/Arc Welder',
        mode: 'Office Screening & Trade Test',
        venue: 'JV Tech Test Center Shop 3',
        description: 'Selection process completed for refinery construction turnaround project.'
      },
      {
        id: 'INT-005',
        date: '2026-06-28',
        companyName: 'Nesma & Partners',
        trade: 'Scaffolder & Rigger',
        mode: 'Client Representative Selection',
        venue: 'Anuptech Delhi Office',
        description: 'Selection and physical verification drive completed for safety-critical industrial jobs.'
      },
      {
        id: 'INT-006',
        date: '2026-06-15',
        companyName: 'Nesma & Partners',
        trade: 'Mechanical Helper & Technician',
        mode: 'Office Screening',
        venue: 'JV Tech Trade Test Center',
        description: 'Primary screening of helpers and supervisors for civil construction project.'
      },
      {
        id: 'INT-007',
        date: '2026-06-22',
        companyName: 'Sinopec Engineering',
        trade: 'Structural Fabricator & Fitter',
        mode: 'Direct Client Interview',
        venue: 'JV Tech Trade Test Center',
        description: 'Practical fabrication trade test with Chinese delegates.'
      }
    ];

    localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(initial));
    return initial;
  });

  const scheduledInterviews = propsScheduledInterviews || localScheduledInterviews;
  const setScheduledInterviews = (updated: ScheduledInterview[]) => {
    if (onUpdateScheduledInterviews) {
      onUpdateScheduledInterviews(updated);
    } else {
      setLocalScheduledInterviews(updated);
      localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(updated));
    }
  };

  // Selected completed / scheduled interview ID for the dynamic drill-down view
  const [selectedInterviewId, setSelectedInterviewId] = useState<string>('All');

  // Multi-select for bulk document downloads
  const [selectedCandIds, setSelectedCandIds] = useState<string[]>([]);
  const [selectedDocTypes, setSelectedDocTypes] = useState<string[]>(['passportScan', 'photo']);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Single candidate document list collector
  const getCandidateDocuments = (c: Candidate) => {
    const docsList: Array<{
      id: string;
      label: string;
      fileName: string;
      fileUrl?: string;
      uploaded: boolean;
    }> = [];

    // 1. Passport Scan
    const passScan = c.stage3?.uploadedDocs?.find(d => d.key === 'passportScan');
    docsList.push({
      id: 'passportScan',
      label: 'Passport Scan',
      fileName: passScan?.name || (c.stage3?.documents?.passportScan ? 'Passport_Scan.pdf' : ''),
      fileUrl: passScan?.url,
      uploaded: !!(passScan || c.stage3?.documents?.passportScan)
    });

    // 2. Photo
    const photo = c.stage3?.uploadedDocs?.find(d => d.key === 'photo');
    docsList.push({
      id: 'photo',
      label: 'Passport Size Photo',
      fileName: photo?.name || (c.stage3?.documents?.photo ? 'Photo.jpg' : ''),
      fileUrl: photo?.url,
      uploaded: !!(photo || c.stage3?.documents?.photo)
    });

    // 3. Experience Certificate
    const expCert = c.stage3?.uploadedDocs?.find(d => d.key === 'experienceCertificate');
    docsList.push({
      id: 'experienceCertificate',
      label: 'Experience Certificate',
      fileName: expCert?.name || (c.stage3?.documents?.experienceCertificate ? 'Experience_Certificate.pdf' : ''),
      fileUrl: expCert?.url,
      uploaded: !!(expCert || c.stage3?.documents?.experienceCertificate)
    });

    // 4. Medical Report
    docsList.push({
      id: 'medicalReport',
      label: 'Medical Report',
      fileName: c.stage2?.medicalReportName || '',
      fileUrl: c.stage2?.medicalReportUrl,
      uploaded: !!c.stage2?.medicalReportName
    });

    // 5. PCC
    const pcc = c.stage3?.uploadedDocs?.find(d => d.key === 'pcc');
    docsList.push({
      id: 'pcc',
      label: 'Police Clearance (PCC)',
      fileName: pcc?.name || (c.stage3?.documents?.pcc ? 'PCC_Report.pdf' : ''),
      fileUrl: pcc?.url,
      uploaded: !!(pcc || c.stage3?.documents?.pcc)
    });

    // 6. Visa Copy
    docsList.push({
      id: 'visaCopy',
      label: 'Visa Copy / Approval',
      fileName: c.stage4?.visaCopyName || '',
      fileUrl: c.stage4?.visaCopyUrl,
      uploaded: !!c.stage4?.visaCopyName
    });

    // 7. Flight Ticket
    docsList.push({
      id: 'flightTicket',
      label: 'Flight Ticket & PNR',
      fileName: c.stage6?.flightTicketName || '',
      fileUrl: c.stage6?.flightTicketUrl,
      uploaded: !!c.stage6?.flightTicketName
    });

    // 8. Offer Letter
    docsList.push({
      id: 'offerLetter',
      label: 'Signed Offer Letter',
      fileName: c.stage1?.offerLetterFileName || '',
      fileUrl: c.stage1?.offerLetterFileUrl,
      uploaded: !!c.stage1?.offerLetterSigned
    });

    return docsList;
  };

  const handleDownloadSelectedDocs = async () => {
    if (selectedCandIds.length === 0) {
      alert('Kripya kam se kam ek candidate select karein.');
      return;
    }
    if (selectedDocTypes.length === 0) {
      alert('Kripya download karne ke liye kam se kam ek document type select karein.');
      return;
    }

    setIsBulkDownloading(true);
    try {
      const zip = new JSZip();
      let totalFilesAdded = 0;

      const selectedCandidates = candidates.filter(c => selectedCandIds.includes(c.id));

      selectedCandidates.forEach(cand => {
        const candidateFolder = zip.folder(cand.name.replace(/[^a-zA-Z0-9 ]/g, ''));
        if (!candidateFolder) return;

        const docs = getCandidateDocuments(cand);
        docs.forEach(doc => {
          if (!selectedDocTypes.includes(doc.id)) return;
          if (!doc.uploaded) return;

          const name = doc.fileName || `${doc.id}.pdf`;
          const url = doc.fileUrl;

          if (url && url.startsWith('data:')) {
            const base64Index = url.indexOf(';base64,');
            if (base64Index !== -1) {
              candidateFolder.file(name, url.substring(base64Index + 8), { base64: true });
              totalFilesAdded++;
            } else {
              const plainIndex = url.indexOf(',');
              candidateFolder.file(name, decodeURIComponent(url.substring(plainIndex + 1)));
              totalFilesAdded++;
            }
          } else {
            candidateFolder.file(name, `Simulated document file content for ${name}`);
            totalFilesAdded++;
          }
        });
      });

      if (totalFilesAdded === 0) {
        alert('Chuney gaye candidates ke paas chuney gaye document types me se koi uploaded documents nahi hain.');
        setIsBulkDownloading(false);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Bulk_Candidates_Docs_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert('ZIP packet generate karne me koi error aayi.');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleToggleSelectCandidate = (id: string) => {
    setSelectedCandIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Active Selected Interview details & associated candidates lookup
  const selectedInterview = scheduledInterviews.find(i => i.id === selectedInterviewId);

  // Candidates belonging to the selected interview session
  const activeCandidates = selectedInterview
    ? candidates.filter(c => isCompanyOrDateMatch(c, selectedInterview))
    : candidates;

  const driveCandidates = activeCandidates; // Keep compatibility with existing code

  // Schedule Interview modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Form fields for Scheduling a new interview day (NO candidate details required!)
  const [newInterviewDate, setNewInterviewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newTrade, setNewTrade] = useState<string>('');
  const [newCountry, setNewCountry] = useState<string>(COUNTRIES_LIST[0] || 'Saudi Arabia');
  const [newInterviewMode, setNewInterviewMode] = useState<string>('Client Direct Interview');
  const [newVenue, setNewVenue] = useState<string>('JV Tech Delhi Office');
  const [newDescription, setNewDescription] = useState<string>('');

  // AI Demand Letter Scanner States
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [aiScanError, setAiScanError] = useState<string>('');
  const [aiScanSuccess, setAiScanSuccess] = useState<string>('');

  // Auto-reset scan status on modal toggle
  React.useEffect(() => {
    if (!isScheduleModalOpen) {
      setAiScanError('');
      setAiScanSuccess('');
      setIsAiScanning(false);
    }
  }, [isScheduleModalOpen]);

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

  const callGeminiDemandClientSide = async (base64Data: string, mimeType: string, apiKey: string): Promise<any> => {
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

    const systemInstructionText = "You are an expert Indian recruiting assistant. Extract scheduled client interview details from the uploaded job demand letter, advertisement, or photo. Fields to extract:\n1. date: The interview/selection date if mentioned (format as YYYY-MM-DD. If only month/day or relative date is mentioned, assume year 2026. If no date is found, leave null or empty).\n2. companyName: The hiring company/employer name (e.g. 'Bin Laden Group', 'Almarai', etc.).\n3. trade: Extract EVERY SINGLE job trade/profile mentioned in the document or image. Do NOT omit, combine, or summarize any trade under any circumstance, even if there are 50+ different job profiles listed (e.g. 'Civil Engineer, Pipe Fitter, Welder, Electrician, Plumber, Mason, rigger, driver, laborer...'). Return all of them as a complete, comma-separated string of the trades.\n4. country: The country where the jobs are located. Check if it matches or can be mapped to one of these common ones: 'Saudi Arabia', 'Qatar', 'UAE', 'Oman', 'Kuwait', 'Bahrain', 'Russia', 'Croatia', 'Europe', 'Singapore', 'Romania'. If not, return the matched country name. Return empty strings or null for completely missing details.";

    const schema = {
      type: "OBJECT",
      properties: {
        date: { type: "STRING" },
        companyName: { type: "STRING" },
        trade: { type: "STRING" },
        country: { type: "STRING" }
      }
    };

    let reqBody: any;
    if (textResult && textResult.trim().length > 0) {
      reqBody = {
        contents: [{
          parts: [{ text: `Extract scheduled client interview details from the following job demand or advertisement text:\n\n${textResult}` }]
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
            { text: "Extract scheduled client interview details from this job demand letter, advertisement, or photo. Return a JSON structure with date, companyName, trade, and country." },
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

    const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting client-side Gemini demand extraction with model: ${modelName}`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          let isModelNotFoundError = response.status === 404 || errorText.toLowerCase().includes("not found") || errorText.toLowerCase().includes("unsupported");
          
          if (isModelNotFoundError) {
            console.warn(`Model ${modelName} returned 404/not-found. Trying next model...`);
            lastError = new Error(`Model ${modelName} not found: ${errorText}`);
            continue;
          } else {
            throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
          }
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
      } catch (err: any) {
        lastError = err;
        console.error(`Error with model ${modelName} during client-side demand extraction:`, err);
        // If it's a critical error (like auth or invalid key), don't loop, fail fast
        const errStr = String(err.message || err).toLowerCase();
        if (errStr.includes("api_key_invalid") || errStr.includes("key is invalid") || errStr.includes("400") || errStr.includes("403")) {
          throw err;
        }
      }
    }

    // If we finished the loop without a successful return, throw a helpful detailed message
    const lastErrorMessage = lastError ? (lastError.message || String(lastError)) : "All models failed";
    if (lastErrorMessage.includes("404") || lastErrorMessage.toLowerCase().includes("not found")) {
      throw new Error(
        `Gemini API returned 404: The model was not found or your API key does not support it.\n\n` +
        `💡 SOLUTIONS:\n` +
        `1. If your API key was created in Google Cloud Console (GCP), please go to GCP API Library and enable the "Generative Language API" for your project.\n` +
        `2. Highly Recommended: Get a 100% FREE Gemini API Key from Google AI Studio (https://aistudio.google.com/) which works instantly out of the box!`
      );
    } else {
      throw new Error(`Gemini client-side demand extraction failed: ${lastErrorMessage}`);
    }
  };

  const handleDemandPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiScanning(true);
    setAiScanError('');
    setAiScanSuccess('');

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        let info: any = null;
        let usedClientFallback = false;

        try {
          const response = await fetch('/api/gemini/extract-demand', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Gemini-API-Key': systemSettings?.geminiApiKey || ''
            },
            body: JSON.stringify({ base64: base64Data, mimeType: file.type })
          });

          if (response.status === 404) {
            throw new Error("404_NOT_FOUND");
          }

          if (!response.ok) {
            throw new Error(`Server returned code ${response.status}`);
          }

          const resJson = await response.json();
          if (!resJson.success) {
            throw new Error(resJson.error || "Failed to extract demand details.");
          }
          info = resJson.data;
        } catch (serverErr: any) {
          console.warn("Server-side demand extraction failed or returned 404, attempting client-side fallback...", serverErr);
          
          const clientKey = systemSettings?.geminiApiKey?.trim() || ((import.meta as any).env?.VITE_GEMINI_API_KEY as string)?.trim() || "";
          
          if (!clientKey) {
            if (serverErr.message === "404_NOT_FOUND" || serverErr.status === 404) {
              throw new Error("Netlify static deployment detected (Server returned 404). Client-side Gemini API Key missing! Please go to Admin Panel -> Settings -> and add a Gemini API Key to enable instant browser-based AI demand letter scanning.");
            } else {
              throw new Error(`Server scanning failed (${serverErr.message || serverErr}). Client-side Gemini API Key missing! Please go to Admin Panel -> Settings -> and add a Gemini API Key to enable browser-based fallback.`);
            }
          }

          info = await callGeminiDemandClientSide(base64Data, file.type, clientKey);
          usedClientFallback = true;
        }

        if (info) {
          if (info.date) {
            setNewInterviewDate(info.date);
          }
          if (info.companyName) {
            setNewCompanyName(info.companyName);
          }
          if (info.trade) {
            setNewTrade(info.trade);
          }
          if (info.country) {
            const cTrim = info.country.trim();
            const matchedCountry = COUNTRIES_LIST.find((co: string) => 
              co.toLowerCase() === cTrim.toLowerCase() ||
              cTrim.toLowerCase().includes(co.toLowerCase()) ||
              co.toLowerCase().includes(cTrim.toLowerCase())
            ) || cTrim;
            setNewCountry(matchedCountry);
          }
          setAiScanSuccess(
            usedClientFallback 
              ? '✨ AI Scanner: Details auto-populated successfully (via Client fallback)! (Company, Date, Trades, Country)' 
              : 'AI Scanner: Details auto-populated successfully! (Company, Date, Trades, Country)'
          );
        } else {
          setAiScanError('Could not read any specific details from the document.');
        }
      } catch (err: any) {
        console.error("Demand Scanner Error:", err);
        setAiScanError(err.message || 'Error occurred while scanning document.');
      } finally {
        setIsAiScanning(false);
      }
    };

    reader.onerror = () => {
      setAiScanError('FileReader failed to read document.');
      setIsAiScanning(false);
    };

    reader.readAsDataURL(file);
  };

  // Stats Calculations from active candidate list
  const interviewCandidates = activeCandidates.filter(c => c.stage1.interviewStatus !== undefined);
  const totalInterviews = interviewCandidates.length;
  const totalSelected = activeCandidates.filter(c => c.stage1.interviewStatus === InterviewStatus.Selected).length;
  const totalHold = activeCandidates.filter(c => c.stage1.interviewStatus === InterviewStatus.Hold).length;
  const totalRejected = activeCandidates.filter(c => c.stage1.interviewStatus === InterviewStatus.Rejected).length;

  // Filter & Sort Logic for General Table
  const filteredList = activeCandidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.passportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    const matchesTrade = selectedTrade === 'All' || c.trade === selectedTrade;
    
    let matchesStatus = true;
    if (activeTab === 'selected') {
      matchesStatus = c.stage1.interviewStatus === InterviewStatus.Selected;
    } else {
      matchesStatus = selectedStatus === 'All' || c.stage1.interviewStatus === selectedStatus;
    }

    // Filter candidates by selected interview/company from the dropdown
    let matchesSelectedInterview = true;
    if (selectedInterviewId !== 'All' && selectedInterview) {
      matchesSelectedInterview = isCompanyOrDateMatch(c, selectedInterview);
    }

    return matchesSearch && matchesTrade && matchesStatus && matchesSelectedInterview;
  }).sort((a, b) => {
    const dateA = a.stage1.interviewDate || a.createdDate || '1970-01-01';
    const dateB = b.stage1.interviewDate || b.createdDate || '1970-01-01';
    
    if (sortByDate === 'desc') {
      return dateB.localeCompare(dateA);
    } else {
      return dateA.localeCompare(dateB);
    }
  });

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case InterviewStatus.Selected:
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Selected</span>
          </span>
        );
      case InterviewStatus.Rejected:
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case InterviewStatus.Hold:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>On Hold</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'Not Scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Handle scheduling a new interview date
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterviewDate || !newCompanyName.trim() || !newTrade.trim()) {
      alert("Kripya sabhi jaruri details fill karein (Date, Company Name, Trade).");
      return;
    }

    const newInterview: ScheduledInterview = {
      id: `INT-${Math.floor(100000 + Math.random() * 900000)}`,
      date: newInterviewDate,
      companyName: newCompanyName,
      trade: newTrade,
      country: newCountry,
      mode: newInterviewMode,
      venue: newVenue || 'JV Tech Delhi Office',
      description: newDescription
    };

    // Add new trade(s) and country to system settings dynamically if not already present
    if (systemSettings && onUpdateSystemSettings) {
      let updatedTrades = [...systemSettings.customTrades];
      let updatedCountries = [...systemSettings.customCountries];
      let changed = false;

      // Clean and split trades
      if (newTrade && newTrade.trim()) {
        const splitTrades = newTrade.split(',').map(t => t.trim()).filter(Boolean);
        splitTrades.forEach(t => {
          if (!updatedTrades.some(existing => existing.toLowerCase() === t.toLowerCase())) {
            updatedTrades.push(t);
            changed = true;
          }
        });
      }

      // Clean and add country
      if (newCountry && newCountry.trim()) {
        const trimmedCountry = newCountry.trim();
        if (!updatedCountries.some(existing => existing.toLowerCase() === trimmedCountry.toLowerCase())) {
          updatedCountries.push(trimmedCountry);
          changed = true;
        }
      }

      if (changed) {
        onUpdateSystemSettings({
          ...systemSettings,
          customTrades: updatedTrades,
          customCountries: updatedCountries
        });
      }
    }

    const updated = [...scheduledInterviews, newInterview];
    setScheduledInterviews(updated);
    localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(updated));

    setIsScheduleModalOpen(false);

    // Reset Form
    setNewCompanyName('');
    setNewTrade('');
    setNewCountry(COUNTRIES_LIST[0] || 'Saudi Arabia');
    setNewDescription('');
    setNewVenue('JV Tech Delhi Office');
    setNewInterviewMode('Client Direct Interview');

    alert(`Interview Scheduled Successfully for ${newCompanyName} on ${newInterviewDate}!`);
  };

  // Handle deleting a scheduled interview slot
  const handleDeleteScheduledInterview = (id: string, name: string) => {
    if (confirm(`Kya aap "${name}" interview date slot ko delete karna chahte hain?`)) {
      const updated = scheduledInterviews.filter(item => item.id !== id);
      setScheduledInterviews(updated);
      localStorage.setItem('JV_TECH_CRM_SCHEDULED_INTERVIEWS', JSON.stringify(updated));
      if (selectedInterviewId === id) {
        setSelectedInterviewId('All');
      }
    }
  };

  return (
    <div id="interview-registry-container" className="space-y-6">
      
      {/* Dynamic Header Banner with Sunset Aircraft overlay and Schedule Action */}
      <div className="bg-brand-dark text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 min-h-[180px]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80" 
            alt="Corporate Interview & Selections"
            className="w-full h-full object-cover object-center opacity-25 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-700/50" />
        </div>
        
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
            <span>JV Tech Selection Board</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-brand-100">
            Interview Schedule & Selections Registry
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
            Sabhi client interviews ki dates schedule karein aur select hue candidates ke details live monitor karein. Kis din kaun sa interview hoga uski poori suchi.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg transition-all cursor-pointer transform hover:scale-105"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span>+ Schedule Interview Date</span>
          </button>
        </div>
      </div>

      {/* Stats Board Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-500 border border-brand-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Conducted</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono leading-tight">{totalInterviews}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block font-bold uppercase tracking-wider">Selected List</span>
            <span className="text-2xl font-extrabold text-emerald-700 font-mono leading-tight">{totalSelected}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-amber-500 block font-bold uppercase tracking-wider">Standby / Hold</span>
            <span className="text-2xl font-extrabold text-amber-700 font-mono leading-tight">{totalHold}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 border border-rose-100">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-rose-500 block font-bold uppercase tracking-wider">Rejected Files</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono leading-tight">{totalRejected}</span>
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal Backdrop */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-brand-dark text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-extrabold font-display text-sm md:text-base text-brand-100">Schedule Interview Date</h3>
                  <p className="text-[10px] text-slate-300 font-medium">Add interview date and client details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-300 hover:text-white hover:bg-white/10 transition-all p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

             {/* Modal Body */}
            <form onSubmit={handleSaveSchedule} className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* AI Demand Letter/Photo Scanner */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-950 font-display">AI Demand Letter & Photo Scanner (स्वचालित)</h4>
                    <p className="text-[10px] text-indigo-700 font-medium">Demand Letter ya photo scan karke Date, Company, Trade & Country auto-fill karein</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/20 transition-all p-3 rounded-xl cursor-pointer text-center group">
                    <span className="text-[11px] font-bold text-indigo-700 group-hover:text-indigo-900">
                      {isAiScanning ? 'Scanning with Gemini AI...' : '📁 Choose / Drag Demand Photo or Document'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Supports PNG, JPG, JPEG, PDF, Word & Text</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,text/plain"
                      className="hidden"
                      disabled={isAiScanning}
                      onChange={handleDemandPhotoUpload}
                    />
                  </label>
                </div>

                {isAiScanning && (
                  <div className="flex items-center gap-2 justify-center py-1.5 text-[10.5px] text-indigo-700 font-semibold bg-indigo-50 rounded-xl border border-indigo-150 animate-pulse">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Gemini is extracting details (Date, Company, Trades, Country)... Please wait</span>
                  </div>
                )}

                {aiScanError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[10px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{aiScanError}</span>
                  </div>
                )}

                {aiScanSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{aiScanSuccess}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-brand-700 uppercase tracking-wider block font-display">Interview Day Configuration</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Interview Date *</label>
                    <input
                      type="date"
                      value={newInterviewDate}
                      onChange={(e) => setNewInterviewDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-semibold focus:border-brand-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Interview Mode</label>
                    <select
                      value={newInterviewMode}
                      onChange={(e) => setNewInterviewMode(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-semibold focus:border-brand-500"
                    >
                      <option value="Client Direct Interview">Client Direct Interview</option>
                      <option value="Zoom Online Interview">Zoom Online Interview</option>
                      <option value="Skype Interview">Skype Interview</option>
                      <option value="Office Representative Screening">Office Representative Screening</option>
                      <option value="Practical Trade Test Drive">Practical Trade Test Drive</option>
                      <option value="CV Selection & Shortlisting">CV Selection & Shortlisting</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Company / Client Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Suwaidi Contracting, Saudi Arabia"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-medium focus:border-brand-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">Country Preference *</label>
                    <select
                      value={newCountry}
                      onChange={(e) => setNewCountry(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-semibold focus:border-brand-500"
                    >
                      {COUNTRIES_LIST.map((c: string) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      {!COUNTRIES_LIST.includes(newCountry) && newCountry && (
                        <option value={newCountry}>{newCountry} (Custom Extra)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block flex justify-between items-center">
                    <span>Job Trades (Multiple Allowed) *</span>
                    <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md animate-pulse">Supports 50+ Trades</span>
                  </label>
                  <textarea
                    placeholder="e.g. Electrician, Pipe Fitter, Welder, Mason, Carpenter, Plumber, Helper, Rigger, Scaffolder, Driver (All 50+ trades can be entered, separated by commas)"
                    value={newTrade}
                    onChange={(e) => setNewTrade(e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-medium focus:border-brand-500 font-sans leading-relaxed"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Interview Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. JV Tech Delhi Center"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-medium focus:border-brand-500"
                  />
                </div>

                 <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">Remarks / Requirements (Optional)</label>
                  <textarea
                    placeholder="e.g. Delegates coming. 150 vacancies. Candidates must carry hardcopy documents."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none font-medium focus:border-brand-500 resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule Date</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Filter and Tab Controller */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        
        {/* Completed/Scheduled Interviews Quick Select Dropdown */}
        <div className="bg-slate-100/60 p-5 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display uppercase tracking-wide">
                <ClipboardList className="w-4 h-4 text-brand-500" />
                <span>Filter Candidates by Interview (Company & Date)</span>
              </label>
              <p className="text-[10.5px] text-slate-500 font-medium">
                Jis interview ya company ko select karenge, niche timeline aur list me sirf usi interview/company ke candidates aur unki details show hongi.
              </p>
            </div>
            {selectedInterviewId !== 'All' && (
              <button
                onClick={() => setSelectedInterviewId('All')}
                className="text-xs font-extrabold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
              >
                Clear Selection
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={selectedInterviewId}
              onChange={(e) => setSelectedInterviewId(e.target.value)}
              className="w-full bg-white border border-slate-250 rounded-xl py-2.5 px-4 text-xs outline-none font-bold text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="All">🔍 Choose Interview Session / Selection Drive...</option>
              {scheduledInterviews.map((item) => {
                // Determine conducted based on current date context (June 30, 2026)
                const isConducted = item.date <= '2026-06-30';
                return (
                  <option key={item.id} value={item.id}>
                    {isConducted ? '✅ [Conducted/Completed]' : '⏳ [Upcoming/Scheduled]'} - Date: {item.date} — {item.companyName} ({item.country || 'Saudi Arabia'}) — ({item.trade})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected Interview Detail and Candidate Data Sheet View Card */}
        {selectedInterview && (
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-indigo-100/50 pb-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${selectedInterview.date <= '2026-06-30' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-xs font-extrabold text-indigo-950 tracking-tight font-display uppercase">
                  Interview Session File: {selectedInterview.companyName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDeleteScheduledInterview(selectedInterview.id, selectedInterview.companyName)}
                  className="text-rose-600 hover:text-rose-800 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  title="Delete Scheduled Interview"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Session</span>
                </button>
                <button
                  onClick={() => setSelectedInterviewId('All')}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer"
                  title="Close Detail View"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Selection Drive Profile */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-white p-4 rounded-xl border border-indigo-100/40">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Interview Date</span>
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDisplayDate(selectedInterview.date)} ({selectedInterview.date})
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Target Country</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {selectedInterview.country || 'Saudi Arabia'}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Targeted Job Profile</span>
                <span className="text-xs font-bold text-brand-600 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                  {selectedInterview.trade}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Drive Medium</span>
                <span className="text-xs font-semibold text-slate-800">
                  🎙️ {selectedInterview.mode}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold block">Venue Location</span>
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {selectedInterview.venue}
                </span>
              </div>

              {selectedInterview.description && (
                <div className="col-span-1 md:col-span-5 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600">
                  <strong className="text-slate-700">Client Guidelines / Remarks:</strong>{' '}
                  <span className="italic">"{selectedInterview.description}"</span>
                </div>
              )}
            </div>

            {/* Candidates Listed Under This Specific Interview */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-950 uppercase tracking-wider font-display block">
                  🤵‍♂️ Candidates Data Sheet for this Interview Drive ({driveCandidates.length})
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  driveCandidates.length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  {driveCandidates.length} Files Linked
                </span>
              </div>

              {driveCandidates.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={driveCandidates.length > 0 && driveCandidates.every(c => selectedCandIds.includes(c.id))}
                            onChange={() => {
                              const isAllDriveSelected = driveCandidates.length > 0 && driveCandidates.every(c => selectedCandIds.includes(c.id));
                              if (isAllDriveSelected) {
                                const driveIds = driveCandidates.map(c => c.id);
                                setSelectedCandIds(prev => prev.filter(id => !driveIds.includes(id)));
                              } else {
                                const driveIds = driveCandidates.map(c => c.id);
                                setSelectedCandIds(prev => Array.from(new Set([...prev, ...driveIds])));
                              }
                            }}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                            title="Select / Deselect All candidates of this drive"
                          />
                        </th>
                        <th className="p-3">Candidate Name</th>
                        <th className="p-3">Passport & Phone</th>
                        <th className="p-3">Assigned Trade</th>
                        <th className="p-3">Outcome Status</th>
                        <th className="p-3">Client Feedback Remarks</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {driveCandidates.map(c => {
                        const isSelected = selectedCandIds.includes(c.id);
                        return (
                          <tr key={c.id} className={`hover:bg-slate-50/50 transition-colors ${isSelected ? 'bg-brand-50/30' : ''}`}>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectCandidate(c.id)}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                              />
                            </td>
                            <td className="p-3 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3">
                            <span className="font-mono text-slate-600 font-bold block">{c.passportNumber}</span>
                            <span className="text-[10px] text-slate-400 block">{c.phone}</span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">{c.trade}</td>
                          <td className="p-3">{getStatusBadge(c.stage1.interviewStatus)}</td>
                          <td className="p-3 text-slate-500 italic max-w-xs truncate" title={c.stage1.comments}>
                            {c.stage1.comments || <span className="text-slate-300">No comments</span>}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onEditCandidate(c)}
                              className="bg-brand-50 hover:bg-brand-100 text-brand-600 font-extrabold px-3 py-1.5 rounded-lg border border-brand-200/50 transition-all cursor-pointer text-[10.5px] inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Update Outcome</span>
                            </button>
                          </td>
                        </tr>
                      ); })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2">
                  <UserPlus className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-600 font-bold">Is selection drive / company par koi candidates mapped nahi hain.</p>
                  <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                    Naye register karte samay ya candidates update modal me unka <strong>Interview Date</strong> ya <strong>Assigned Company</strong> is drive ke matching set karein.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 pt-2">
          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 max-w-sm w-full">
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedStatus('All');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Interview Logs Timeline</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('selected');
                setSelectedStatus('Selected');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'selected' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Selected Candidates List</span>
            </button>
          </div>

          {/* Quick Date Sorting */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Date Sort:</span>
            <button
              onClick={() => setSortByDate(sortByDate === 'desc' ? 'asc' : 'desc')}
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{sortByDate === 'desc' ? 'Newest Interview First' : 'Oldest Interview First'}</span>
            </button>
          </div>
        </div>

        {/* Inputs & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search Candidate, Passport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl py-2 pl-9 pr-4 text-xs transition-all outline-none font-medium"
            />
          </div>

          <div>
            <select
              value={selectedTrade}
              onChange={(e) => setSelectedTrade(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-medium text-slate-700"
            >
              <option value="All">Filter By Trade (All Jobs)</option>
              {customTrades.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {activeTab === 'all' && (
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-brand-500 outline-none font-medium text-slate-700"
              >
                <option value="All">Filter By Outcome (All Results)</option>
                <option value="Selected">Selected</option>
                <option value="Hold">On Hold</option>
                <option value="Rejected">Rejected</option>
                <option value="Pending">Pending Decision</option>
              </select>
            </div>
          )}
        </div>

        {/* Bulk Document Downloader Panel (Multi-select Download Option) */}
        {selectedCandIds.length > 0 && (
          <div className="bg-gradient-to-r from-brand-50 to-indigo-50/60 border-2 border-brand-200 p-5 rounded-2xl space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-200/50 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shrink-0">
                  <FolderDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xs font-display tracking-tight uppercase flex items-center gap-1.5">
                    <span>Bulk Document Downloader (एक साथ सेलेक्ट करके डाउनलोड)</span>
                    <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-[10px] font-extrabold normal-case">
                      {selectedCandIds.length} candidate(s) selected
                    </span>
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium mt-0.5">
                    Chuney gaye candidates ke documents ek single ZIP packet me bundle hokar download honge. Document types check karein:
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandIds([])}
                className="text-xs font-extrabold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                ✕ Clear Selection
              </button>
            </div>

            {/* Document Type Selectors */}
            <div className="space-y-2">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">
                Select document types to download:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'passportScan', label: 'Passport Scan 🛂' },
                  { id: 'photo', label: 'Passport Photo 🖼️' },
                  { id: 'offerLetter', label: 'Signed Offer Letter 📄' },
                  { id: 'medicalReport', label: 'Medical Report 🩺' },
                  { id: 'experienceCertificate', label: 'Experience Cert 📑' },
                  { id: 'pcc', label: 'PCC Report 👮' },
                  { id: 'visaCopy', label: 'Visa Copy 🪪' },
                  { id: 'flightTicket', label: 'Flight Ticket & PNR ✈️' },
                ].map((docType) => {
                  const isSelected = selectedDocTypes.includes(docType.id);
                  return (
                    <button
                      key={docType.id}
                      type="button"
                      onClick={() => {
                        setSelectedDocTypes(prev =>
                          prev.includes(docType.id)
                            ? prev.filter(id => id !== docType.id)
                            : [...prev, docType.id]
                        );
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-xs'
                          : 'bg-white border-slate-250 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{docType.label}</span>
                      {isSelected ? (
                        <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-extrabold font-mono">✓</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadSelectedDocs}
                disabled={isBulkDownloading}
                className={`px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-md transition-all ${
                  isBulkDownloading
                    ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02]'
                }`}
              >
                {isBulkDownloading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Compiling Documents ZIP Packet... Please wait</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Selected Documents ({selectedCandIds.length} Candidate(s)) 📥</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* View Grid/List Rendering */}
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold">Koi records ya interview data nahi mila.</p>
            <p className="text-xs text-slate-400">Search term change karein ya tab filter badlein.</p>
          </div>
        ) : activeTab === 'all' ? (
          /* TAB 1: ALL INTERVIEWS LOG TIMELINE */
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-brand-dark text-brand-100 text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10 text-center">
                    <input 
                      type="checkbox"
                      checked={filteredList.length > 0 && filteredList.every(c => selectedCandIds.includes(c.id))}
                      onChange={() => {
                        const isAllFilteredSelected = filteredList.length > 0 && filteredList.every(c => selectedCandIds.includes(c.id));
                        if (isAllFilteredSelected) {
                          const filteredIds = filteredList.map(c => c.id);
                          setSelectedCandIds(prev => prev.filter(id => !filteredIds.includes(id)));
                        } else {
                          const filteredIds = filteredList.map(c => c.id);
                          setSelectedCandIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                        }
                      }}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                      title="Select / Deselect All visible candidates"
                    />
                  </th>
                  <th className="p-4">Interview Date</th>
                  <th className="p-4">Candidate & Passport</th>
                  <th className="p-4">Trade / Job Profile</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">Decision / Status</th>
                  <th className="p-4">Client Feedback & Comments</th>
                  <th className="p-4 text-center">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium bg-white">
                {filteredList.map((cand) => {
                  const dateStr = cand.stage1.interviewDate || cand.createdDate;
                  const isSelected = selectedCandIds.includes(cand.id);
                  return (
                    <tr key={cand.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-brand-50/30' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectCandidate(cand.id)}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-500 border border-brand-100 flex items-center justify-center font-bold">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{formatDisplayDate(dateStr)}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{dateStr || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-900 block hover:text-brand-500 cursor-pointer" onClick={() => onEditCandidate(cand)}>
                          {cand.name}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{cand.passportNumber}</span>
                          <span>•</span>
                          <span>{cand.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold">{cand.trade}</span>
                        </div>
                        {cand.companyName && (
                          <div className="mt-1 text-[10px] font-bold text-purple-600 flex items-center gap-0.5">
                            🏢 {cand.companyName}
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cand.country}</span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(cand.stage1.interviewStatus)}
                          {cand.stage1.offerLetterSigned && (
                            <div className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100/80 font-extrabold px-1.5 py-0.5 rounded-lg flex items-center gap-1 w-max">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                              <span>Letter Signed</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="text-slate-600 leading-relaxed truncate hover:text-clip hover:whitespace-normal" title={cand.stage1.comments}>
                          {cand.stage1.comments || <span className="text-slate-400 italic">No feedback comments logged</span>}
                        </p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => onEditCandidate(cand)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold px-2.5 py-1.5 rounded-lg border border-sky-200/50 transition-all cursor-pointer text-[11px]"
                          >
                            Update
                          </button>
                          {onDeleteCandidate && (
                            <button
                              onClick={() => onDeleteCandidate(cand.id, cand.name)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1.5 rounded-lg border border-rose-200/50 transition-all cursor-pointer text-[11px] inline-flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* TAB 2: SELECTION SHOWCASE / BADGE BOARD */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((cand) => {
              const dateStr = cand.stage1.interviewDate || cand.createdDate;
              return (
                <div 
                  key={cand.id} 
                  className="bg-white rounded-2xl border-2 border-emerald-500/10 hover:border-emerald-500/30 p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
                >
                  {/* Selected Stamp Ribbon */}
                  <div className="absolute top-0 right-0">
                    <div className="bg-emerald-500 text-white text-[9px] font-extrabold uppercase tracking-widest px-4 py-1 rotate-45 translate-x-3 translate-y-2 shadow-sm">
                      Selected ✓
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm leading-tight hover:text-emerald-600 cursor-pointer" onClick={() => onEditCandidate(cand)}>
                          {cand.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{cand.passportNumber} • {cand.phone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Job Trade</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">{cand.trade}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Destination</span>
                        <span className="text-xs font-bold text-slate-700 truncate block">{cand.country}</span>
                      </div>
                      {cand.companyName && (
                        <div className="bg-purple-50 p-2 rounded-xl border border-purple-100 col-span-2">
                          <span className="text-[9px] text-purple-400 block font-bold uppercase tracking-wider">Placed Company</span>
                          <span className="text-xs font-extrabold text-purple-700 truncate block">🏢 {cand.companyName}</span>
                        </div>
                      )}
                    </div>

                    {/* Interview details */}
                    <div className="bg-emerald-50/40 border border-emerald-100/60 p-2.5 rounded-xl flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="text-[11px]">
                        <span className="text-slate-500 block">Interviewed & Selected on:</span>
                        <span className="font-extrabold text-emerald-800">{formatDisplayDate(dateStr)}</span>
                      </div>
                    </div>

                    {/* Offer Letter Sign Indicator */}
                    {cand.stage1.offerLetterSigned ? (
                      <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-teal-600 shrink-0" />
                          <div className="text-[11px]">
                            <span className="text-slate-500 block">Offer Letter Status:</span>
                            <span className="font-extrabold text-teal-800">✓ Signed & Verified</span>
                          </div>
                        </div>
                        {cand.stage1.offerLetterFileUrl && (
                          <a
                            href={cand.stage1.offerLetterFileUrl}
                            download={cand.stage1.offerLetterFileName || 'Offer_Letter.pdf'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white hover:bg-slate-50 text-teal-700 p-1.5 rounded-lg border border-teal-200/50 shadow-xs text-[10px] font-bold"
                            title="Download Signed Copy"
                          >
                            Download 📥
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100/50 p-2.5 rounded-xl flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="text-[11px]">
                          <span className="text-slate-500 block">Offer Letter Status:</span>
                          <span className="font-extrabold text-amber-700">✗ Sign Pending / Waiting</span>
                        </div>
                      </div>
                    )}

                    {cand.stage1.comments && (
                      <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                        <strong className="text-slate-700">Remarks: </strong>
                        <span className="italic">"{cand.stage1.comments}"</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-3">
                    <button
                      onClick={() => onEditCandidate(cand)}
                      className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Configure Next Stages</span>
                    </button>
                    <a
                      href={`https://wa.me/${cand.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow-sm"
                      title="Congratulate on WhatsApp"
                    >
                      <Send className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Process instructions */}
      <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-4">
        <Sparkles className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider font-display">Selection & Promotion Workflow Instructions</h3>
          <p className="text-xs text-brand-600 leading-relaxed">
            Naye scheduled client drives manage karne ke liye upar <strong>Schedule Interview Date</strong> button use karein. Isme bina candidate data ke direct slots block ho jate hain. Mapped candidates ke outcomes promote karne ke liye list me unke <strong>Update</strong> status option par click karein.
          </p>
        </div>
      </div>
    </div>
  );
}
