import React, { useState } from 'react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { Candidate, InterviewStatus, CandidateDocuments } from '../types';
import { 
  Building2, Calendar, Download, Search, FileText, CheckCircle2, 
  Clock, AlertCircle, FileCheck, ShieldAlert, FolderDown,
  ChevronDown, ChevronRight, User, HelpCircle, RefreshCw
} from 'lucide-react';

interface DocumentHubProps {
  candidates: Candidate[];
  triggerToast: (msg: string) => void;
  onEditCandidate: (candidate: Candidate) => void;
}

type GroupType = 'company' | 'interviewDate';

export default function DocumentHub({ candidates, triggerToast, onEditCandidate }: DocumentHubProps) {
  const [groupType, setGroupType] = useState<GroupType>('company');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [downloadingGroup, setDownloadingGroup] = useState<string | null>(null);

  // Selective Bulk Downloader States
  const [bulkScope, setBulkScope] = useState<'all' | 'selected'>('all');
  const [bulkCompanyFilter, setBulkCompanyFilter] = useState<string>('All');
  const [bulkDocTypes, setBulkDocTypes] = useState<Record<string, boolean>>({
    photo: true,
    passport: true,
    visa: true,
    medical: true
  });
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Extract unique Company Name with Date mappings
  const bulkCompanyOptions = Array.from(
    new Set(
      candidates
        .map(c => {
          const comp = (c.companyName || '').trim();
          const date = c.stage1?.interviewDate || '';
          if (!comp) return null;
          return date ? `${comp} | ${date}` : comp;
        })
        .filter(Boolean)
    )
  ).sort() as string[];

  // Selective bulk download ZIP handler
  const handleSelectiveBulkDownload = async () => {
    try {
      setIsBulkDownloading(true);
      
      // 1. Filter candidates based on scope and company filter
      let targets = candidates;
      
      if (bulkScope === 'selected') {
        targets = targets.filter(c => c.stage1?.interviewStatus === InterviewStatus.Selected);
      }
      
      if (bulkCompanyFilter !== 'All') {
        targets = targets.filter(c => {
          const comp = (c.companyName || '').trim();
          const date = c.stage1?.interviewDate || '';
          const key = date ? `${comp} | ${date}` : comp;
          return key === bulkCompanyFilter;
        });
      }

      if (targets.length === 0) {
        alert("Select kiye gaye filters ke anusaar koi candidate nahi mila.");
        setIsBulkDownloading(false);
        return;
      }

      const zip = new JSZip();
      let totalFilesAdded = 0;

      // 2. Loop targets and append checked documents
      targets.forEach(c => {
        const candidateFolder = zip.folder(c.name.replace(/[^a-zA-Z0-9 ]/g, ''));
        if (!candidateFolder) return;

        let candidateFilesAdded = 0;

        // Photo
        if (bulkDocTypes.photo) {
          const photo = c.stage3?.uploadedDocs?.find(d => d.key === 'photo');
          const photoUrl = photo?.url || c.photoUrl;
          if (photoUrl) {
            candidateFolder.file(photo?.name || 'Passport_Size_Photo.jpg', `Simulated image file for ${c.name}`);
            candidateFilesAdded++;
          }
        }

        // Passport Scan
        if (bulkDocTypes.passport) {
          const passScan = c.stage3?.uploadedDocs?.find(d => d.key === 'passportScan');
          const passUrl = passScan?.url;
          if (passUrl) {
            candidateFolder.file(passScan?.name || 'Passport_Scan.pdf', `Simulated passport document for ${c.name}`);
            candidateFilesAdded++;
          }
        }

        // Visa
        if (bulkDocTypes.visa) {
          const visaUrl = c.stage4?.visaCopyUrl;
          if (visaUrl) {
            candidateFolder.file(c.stage4?.visaCopyName || 'Visa_Copy.pdf', `Simulated visa document for ${c.name}`);
            candidateFilesAdded++;
          }
        }

        // Medical
        if (bulkDocTypes.medical) {
          const medUrl = c.stage2?.medicalReportUrl;
          if (medUrl) {
            candidateFolder.file(c.stage2?.medicalReportName || 'Medical_Report.pdf', `Simulated medical report for ${c.name}`);
            candidateFilesAdded++;
          }
        }

        if (candidateFilesAdded > 0) {
          totalFilesAdded += candidateFilesAdded;
        } else {
          // Remove empty folder from zip structure
          delete zip.files[c.name.replace(/[^a-zA-Z0-9 ]/g, '') + '/'];
        }
      });

      if (totalFilesAdded === 0) {
        alert("Chune gaye candidates ke paas selected documents me se koi bhi uploaded nahi hai.");
        setIsBulkDownloading(false);
        return;
      }

      triggerToast(`Compiling ZIP with ${totalFilesAdded} selective documents...`);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Selective_Bulk_Docs_${bulkScope}_${bulkCompanyFilter.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerToast(`Successfully downloaded ZIP containing ${totalFilesAdded} documents!`);
    } catch (e) {
      console.error(e);
      alert("Bulk download ZIP build failed.");
    } finally {
      setIsBulkDownloading(false);
    }
  };

  // Helper: Toggle group collapse
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  // Filter candidates by search query
  const filteredCandidates = candidates.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.passportNumber.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      c.trade.toLowerCase().includes(query) ||
      (c.companyName || '').toLowerCase().includes(query)
    );
  });

  // Grouping logic
  const groups: Record<string, Candidate[]> = {};
  filteredCandidates.forEach(c => {
    let key = '';
    if (groupType === 'company') {
      key = c.companyName?.trim() || 'Not Assigned / Direct Placement';
    } else {
      key = c.stage1?.interviewDate || 'Date Not Scheduled';
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(c);
  });

  // Sort group keys
  const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
    if (a.includes('Not') || a.includes('Direct')) return 1;
    if (b.includes('Not') || b.includes('Direct')) return -1;
    return a.localeCompare(b);
  });

  // Single candidate document list collector
  const getCandidateDocuments = (c: Candidate) => {
    const docsList: Array<{
      id: string;
      label: string;
      fileName: string;
      fileUrl?: string;
      stage: string;
      uploaded: boolean;
    }> = [];

    // 1. Passport Scan
    const passScan = c.stage3?.uploadedDocs?.find(d => d.key === 'passportScan');
    docsList.push({
      id: 'passportScan',
      label: 'Passport Scan',
      fileName: passScan?.name || (c.stage3?.documents?.passportScan ? 'Passport_Scan.pdf' : ''),
      fileUrl: passScan?.url,
      stage: 'Stage 3: Documents',
      uploaded: !!(passScan || c.stage3?.documents?.passportScan)
    });

    // 2. Photo
    const photo = c.stage3?.uploadedDocs?.find(d => d.key === 'photo');
    docsList.push({
      id: 'photo',
      label: 'Passport Size Photo',
      fileName: photo?.name || (c.stage3?.documents?.photo ? 'Photo.jpg' : ''),
      fileUrl: photo?.url,
      stage: 'Stage 3: Documents',
      uploaded: !!(photo || c.stage3?.documents?.photo)
    });

    // 3. Experience Certificate
    const expCert = c.stage3?.uploadedDocs?.find(d => d.key === 'experienceCertificate');
    docsList.push({
      id: 'experienceCertificate',
      label: 'Experience Certificate',
      fileName: expCert?.name || (c.stage3?.documents?.experienceCertificate ? 'Experience_Certificate.pdf' : ''),
      fileUrl: expCert?.url,
      stage: 'Stage 3: Documents',
      uploaded: !!(expCert || c.stage3?.documents?.experienceCertificate)
    });

    // 4. Medical Report
    docsList.push({
      id: 'medicalReport',
      label: 'Medical Report',
      fileName: c.stage2?.medicalReportName || '',
      fileUrl: c.stage2?.medicalReportUrl,
      stage: 'Stage 2: Medical',
      uploaded: !!c.stage2?.medicalReportName
    });

    // 5. PCC
    const pcc = c.stage3?.uploadedDocs?.find(d => d.key === 'pcc');
    docsList.push({
      id: 'pcc',
      label: 'Police Clearance (PCC)',
      fileName: pcc?.name || (c.stage3?.documents?.pcc ? 'PCC_Report.pdf' : ''),
      fileUrl: pcc?.url,
      stage: 'Stage 3: Documents',
      uploaded: !!(pcc || c.stage3?.documents?.pcc)
    });

    // 6. Visa Copy
    docsList.push({
      id: 'visaCopy',
      label: 'Visa Copy / Approval',
      fileName: c.stage4?.visaCopyName || '',
      fileUrl: c.stage4?.visaCopyUrl,
      stage: 'Stage 4: Visa Process',
      uploaded: !!c.stage4?.visaCopyName
    });

    // 7. Flight Ticket
    docsList.push({
      id: 'flightTicket',
      label: 'Flight Ticket & PNR',
      fileName: c.stage6?.flightTicketName || '',
      fileUrl: c.stage6?.flightTicketUrl,
      stage: 'Stage 6: Departure',
      uploaded: !!c.stage6?.flightTicketName
    });

    // 8. Offer Letter (New Option Added)
    docsList.push({
      id: 'offerLetter',
      label: 'Signed Offer Letter',
      fileName: c.stage1?.offerLetterFileName || '',
      fileUrl: c.stage1?.offerLetterFileUrl,
      stage: 'Stage 1: Interview & Offer',
      uploaded: !!c.stage1?.offerLetterSigned
    });

    return docsList;
  };

  // Helper to trigger direct download
  const handleDownloadSingleFile = (fileName: string, fileUrl?: string) => {
    const link = document.createElement('a');
    link.download = fileName || 'document.pdf';
    link.href = fileUrl || 'data:text/plain;charset=utf-8,' + encodeURIComponent(`Simulated document file content for ${fileName}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast(`Downloading: ${fileName}`);
  };

  // Download all files for a candidate in a Zip
  const handleDownloadCandidateZip = async (c: Candidate) => {
    try {
      const zip = new JSZip();
      let filesAdded = 0;
      const docs = getCandidateDocuments(c);

      docs.forEach(doc => {
        if (!doc.uploaded) return;
        const name = doc.fileName || `${doc.id}.pdf`;
        const url = doc.fileUrl;

        if (url && url.startsWith('data:')) {
          const base64Index = url.indexOf(';base64,');
          if (base64Index !== -1) {
            zip.file(name, url.substring(base64Index + 8), { base64: true });
            filesAdded++;
          } else {
            const plainIndex = url.indexOf(',');
            zip.file(name, decodeURIComponent(url.substring(plainIndex + 1)));
            filesAdded++;
          }
        } else {
          zip.file(name, `Simulated document file content for ${name}`);
          filesAdded++;
        }
      });

      if (filesAdded === 0) {
        alert(`${c.name} ke paas koi uploaded documents nahi hain.`);
        return;
      }

      triggerToast(`Compiling ZIP for ${c.name}...`);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `${c.name.replace(/[^a-zA-Z0-9]/g, '_')}_docs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Successfully downloaded ZIP containing ${filesAdded} documents!`);
    } catch (e) {
      console.error(e);
      alert('ZIP generation failed.');
    }
  };

  // Group Zip Downloader
  const handleDownloadGroupZip = async (groupName: string, groupCandidates: Candidate[]) => {
    try {
      setDownloadingGroup(groupName);
      const zip = new JSZip();
      let totalFiles = 0;

      groupCandidates.forEach(c => {
        const candidateFolder = zip.folder(c.name.replace(/[^a-zA-Z0-9 ]/g, ''));
        if (!candidateFolder) return;

        const docs = getCandidateDocuments(c);
        docs.forEach(doc => {
          if (!doc.uploaded) return;
          const name = doc.fileName || `${doc.id}.pdf`;
          const url = doc.fileUrl;

          if (url && url.startsWith('data:')) {
            const base64Index = url.indexOf(';base64,');
            if (base64Index !== -1) {
              candidateFolder.file(name, url.substring(base64Index + 8), { base64: true });
              totalFiles++;
            } else {
              const plainIndex = url.indexOf(',');
              candidateFolder.file(name, decodeURIComponent(url.substring(plainIndex + 1)));
              totalFiles++;
            }
          } else {
            candidateFolder.file(name, `Simulated document file content for ${name}`);
            totalFiles++;
          }
        });
      });

      if (totalFiles === 0) {
        alert('Is group ke candidates ke paas koi documents nahi hain.');
        setDownloadingGroup(null);
        return;
      }

      triggerToast(`Compiling ZIP for group "${groupName}"...`);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const safeGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Group_${safeGroupName}_Documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast(`Successfully downloaded group ZIP with ${totalFiles} files!`);
    } catch (e) {
      console.error(e);
      alert('Group ZIP generation failed.');
    } finally {
      setDownloadingGroup(null);
    }
  };

  // Candidate list download as CSV
  const handleDownloadCandidateListExcel = (groupName: string, groupCandidates: Candidate[]) => {
    let companyName = 'ALL COMPANIES';
    let interviewDate = 'N/A';

    if (groupType === 'company') {
      companyName = groupName;
      const uniqueDates = Array.from(new Set(groupCandidates.map(c => c.stage1?.interviewDate || c.createdDate || '').filter(Boolean)));
      interviewDate = uniqueDates.length > 0 ? uniqueDates.join(', ') : 'N/A';
    } else {
      interviewDate = groupName;
      const uniqueCompanies = Array.from(new Set(groupCandidates.map(c => c.companyName || '').filter(Boolean)));
      companyName = uniqueCompanies.length > 0 ? uniqueCompanies.join(', ') : 'Not Assigned';
    }

    const excelData = [
      [`COMPANY: ${companyName.toUpperCase()}`],
      [`INTERVIEW DATE: ${interviewDate.toUpperCase()}`],
      [], // blank row
      ['Sr number', 'Name', 'Passport number', 'Trade', 'Mobile number']
    ];

    groupCandidates.forEach((c, index) => {
      excelData.push([
        String(index + 1),
        c.name || '',
        c.passportNumber || '',
        c.trade || '',
        c.phone || ''
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Candidates');

    const safeGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(workbook, `Candidate_List_${safeGroupName}.xlsx`);
    triggerToast(`Downloaded Excel Candidate List for ${groupName}`);
  };

  const getStageBadgeColor = (stage: number) => {
    switch (stage) {
      case 1: return 'bg-sky-50 text-sky-700 border-sky-100';
      case 2: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 3: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 4: return 'bg-purple-50 text-purple-700 border-purple-100';
      case 5: return 'bg-amber-50 text-amber-700 border-amber-100';
      case 6: return 'bg-teal-50 text-teal-700 border-teal-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'Date Not Scheduled') return 'Not Scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div id="document-hub-container" className="space-y-6">
      
      {/* Header Info Banner */}
      <div className="bg-brand-dark text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex items-center min-h-[160px]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80" 
            alt="Documents Center"
            className="w-full h-full object-cover object-center opacity-20 mix-blend-luminosity"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-indigo-950/70" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/15 text-brand-300 border border-brand-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <FolderDown className="w-3.5 h-3.5 text-brand-400" />
            <span>JV Tech Document Download Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-brand-100">
            Document & Candidate List Center
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
            Company Name ya Interview Date ke hisab se candidate lists download karein ya unke specific stage-wise documents (Passport, Medical, Offer Letter, PCC, Visa aur Ticket) single click me download karein.
          </p>
        </div>
      </div>

      {/* Selective Bulk Document & Candidate List Downloader Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-indigo-850 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100/10 pb-4">
          <div>
            <span className="text-[10px] text-indigo-300 uppercase tracking-widest font-extrabold block">
              Advanced Selective Downloader (JV Tech Custom Feature)
            </span>
            <h2 className="text-lg font-bold font-display tracking-tight text-white mt-1">
              All Registered & Selection Candidate List Downloader
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                bulkScope === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-indigo-950/40 text-indigo-200 border-indigo-900 hover:bg-indigo-900/50'
              }`}
            >
              All Registered Candidates
            </button>
            <button
              onClick={() => setBulkScope('selected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                bulkScope === 'selected'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-indigo-950/40 text-indigo-200 border-indigo-900 hover:bg-indigo-900/50'
              }`}
            >
              Selected Candidates List (Passed Interview)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
          {/* Company with Date Selector */}
          <div className="lg:col-span-5 space-y-2">
            <label className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Company Name with Date Selection
            </label>
            <select
              value={bulkCompanyFilter}
              onChange={(e) => setBulkCompanyFilter(e.target.value)}
              className="w-full bg-indigo-950/80 border border-indigo-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-white outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            >
              <option value="All">📂 All Companies & Interview Dates Combined</option>
              {bulkCompanyOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Document Checklist Options */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Select Member Documents to Include
            </label>
            <div className="grid grid-cols-2 gap-2 bg-indigo-950/55 p-2 rounded-xl border border-indigo-900">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-indigo-100 select-none">
                <input
                  type="checkbox"
                  checked={bulkDocTypes.photo}
                  onChange={(e) => setBulkDocTypes(prev => ({ ...prev, photo: e.target.checked }))}
                  className="rounded border-indigo-700 bg-indigo-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Member Photo</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-indigo-100 select-none">
                <input
                  type="checkbox"
                  checked={bulkDocTypes.passport}
                  onChange={(e) => setBulkDocTypes(prev => ({ ...prev, passport: e.target.checked }))}
                  className="rounded border-indigo-700 bg-indigo-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Passport Scan</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-indigo-100 select-none">
                <input
                  type="checkbox"
                  checked={bulkDocTypes.visa}
                  onChange={(e) => setBulkDocTypes(prev => ({ ...prev, visa: e.target.checked }))}
                  className="rounded border-indigo-700 bg-indigo-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Visa Copy</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-indigo-100 select-none">
                <input
                  type="checkbox"
                  checked={bulkDocTypes.medical}
                  onChange={(e) => setBulkDocTypes(prev => ({ ...prev, medical: e.target.checked }))}
                  className="rounded border-indigo-700 bg-indigo-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                />
                <span>Medical Report</span>
              </label>
            </div>
          </div>

          {/* Download Action Trigger */}
          <div className="lg:col-span-3">
            <button
              onClick={handleSelectiveBulkDownload}
              disabled={isBulkDownloading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-700 disabled:to-slate-800 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400"
            >
              {isBulkDownloading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing Selective ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Selective ZIP 📦</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel: Filters and Toggles */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle between Company Name and Interview Date Grouping */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/60 max-w-md w-full">
          <button
            onClick={() => setGroupType('company')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              groupType === 'company' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Group by Company Name</span>
          </button>
          <button
            onClick={() => setGroupType('interviewDate')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              groupType === 'interviewDate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Group by Interview Date</span>
          </button>
        </div>

        {/* Search Candidates Bar */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Search candidate name / passport..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs transition-all outline-none text-slate-700 focus:bg-white focus:border-brand-500 font-semibold"
          />
        </div>
      </div>

      {/* Group Lists */}
      <div className="space-y-6">
        {sortedGroupKeys.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-sm">Koi candidates nahi mile</h3>
            <p className="text-xs text-slate-400">Search input check karein ya naye candidates select stage me add karein.</p>
          </div>
        ) : (
          sortedGroupKeys.map(groupKey => {
            const groupCandidates = groups[groupKey];
            const isCollapsed = collapsedGroups[groupKey];
            const displayTitle = groupType === 'interviewDate' ? formatDisplayDate(groupKey) : groupKey;

            // Calculate total uploaded documents across all candidates in this group
            let totalDocsInGroup = 0;
            groupCandidates.forEach(c => {
              const docs = getCandidateDocuments(c);
              totalDocsInGroup += docs.filter(d => d.uploaded).length;
            });

            return (
              <div key={groupKey} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
                
                {/* Group Heading Header Bar */}
                <div className="bg-slate-50/70 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                  <button 
                    onClick={() => toggleGroup(groupKey)}
                    className="flex items-center gap-2.5 text-left font-display cursor-pointer outline-none select-none shrink-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm md:text-base flex items-center gap-1.5 uppercase tracking-tight">
                        {groupType === 'company' ? (
                          <Building2 className="w-5 h-5 text-purple-600 shrink-0" />
                        ) : (
                          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                        )}
                        <span>{displayTitle}</span>
                      </h3>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold mt-0.5">
                        {groupCandidates.length} Candidates • {totalDocsInGroup} Uploaded Documents Collected
                      </p>
                    </div>
                  </button>

                  {/* Bulk Actions for Group */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleDownloadCandidateListExcel(groupKey, groupCandidates)}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Download candidates list as Excel spreadsheet"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>Candidate List Excel 📥</span>
                    </button>
                    
                    <button
                      onClick={() => handleDownloadGroupZip(groupKey, groupCandidates)}
                      disabled={downloadingGroup === groupKey || totalDocsInGroup === 0}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        totalDocsInGroup > 0
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                      title="Download all candidate files in this group grouped into separate folders"
                    >
                      {downloadingGroup === groupKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Zipping...</span>
                        </>
                      ) : (
                        <>
                          <FolderDown className="w-3.5 h-3.5" />
                          <span>Download All Docs ZIP 📦</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Candidate Listings inside Group */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {groupCandidates.map(cand => {
                      const candDocs = getCandidateDocuments(cand);
                      const uploadedDocsCount = candDocs.filter(d => d.uploaded).length;

                      return (
                        <div key={cand.id} className="p-5 hover:bg-slate-50/40 transition-all space-y-4">
                          
                          {/* Candidate Primary Info Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-500 border border-brand-100 flex items-center justify-center font-bold text-lg shrink-0 select-none">
                                <User className="w-5 h-5 text-slate-600" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span 
                                    className="font-extrabold text-slate-800 text-sm hover:text-brand-600 hover:underline cursor-pointer"
                                    onClick={() => onEditCandidate(cand)}
                                  >
                                    {cand.name}
                                  </span>
                                  <span className="text-[10px] font-mono bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                    {cand.passportNumber}
                                  </span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getStageBadgeColor(cand.stage)}`}>
                                    Stage {cand.stage}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
                                  <span>📞 {cand.phone}</span>
                                  <span>•</span>
                                  <span>💼 {cand.trade}</span>
                                  <span>•</span>
                                  <span>📍 {cand.country}</span>
                                </div>
                              </div>
                            </div>

                            {/* Candidate specific bulk actions */}
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                onClick={() => handleDownloadCandidateZip(cand)}
                                disabled={uploadedDocsCount === 0}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                                  uploadedDocsCount > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>ZIP Docs ({uploadedDocsCount})</span>
                              </button>
                              <button
                                onClick={() => onEditCandidate(cand)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border border-slate-250 cursor-pointer"
                              >
                                Manage / Edit
                              </button>
                            </div>
                          </div>

                          {/* Horizontal Scrollable Document Checklist Chips */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                            {candDocs.map(doc => {
                              return (
                                <div 
                                  key={doc.id}
                                  className={`p-2.5 rounded-xl border flex flex-col justify-between min-h-[90px] transition-all relative group ${
                                    doc.uploaded 
                                      ? 'bg-white border-slate-200 shadow-2xs hover:shadow-sm' 
                                      : 'bg-slate-50/50 border-slate-100 border-dashed opacity-60'
                                  }`}
                                >
                                  <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block truncate" title={doc.label}>
                                      {doc.label}
                                    </span>
                                    {doc.uploaded ? (
                                      <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-0.5 mt-1">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        <span>Uploaded</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5 mt-1">
                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                        <span>Missing</span>
                                      </span>
                                    )}
                                  </div>

                                  {doc.uploaded ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadSingleFile(doc.fileName, doc.fileUrl)}
                                      className="mt-2 w-full bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 transition-all py-1 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer border border-indigo-100"
                                      title={doc.fileName}
                                    >
                                      <Download className="w-2.5 h-2.5" />
                                      <span>Download</span>
                                    </button>
                                  ) : (
                                    <span className="mt-2 text-center text-[9px] text-slate-400 italic font-medium py-1">
                                      N/A
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
