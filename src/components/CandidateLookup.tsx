import React, { useState } from 'react';
import { Candidate, InterviewStatus, MedicalStatus, VisaStatus, SystemSettings } from '../types';
import Logo from './Logo';
import { Search, Compass, FileCheck, CheckCircle, Clock, XCircle, AlertCircle, Calendar, User, Phone, ShieldCheck, PlaneTakeoff, Info, Download } from 'lucide-react';

interface CandidateLookupProps {
  candidates: Candidate[];
  onBackToLogin?: () => void;
  systemSettings?: SystemSettings;
}

export default function CandidateLookup({ candidates, onBackToLogin, systemSettings }: CandidateLookupProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [foundCandidate, setFoundCandidate] = useState<Candidate | null>(null);
  const [searched, setSearched] = useState(false);

  // Fallbacks for customizable texts if systemSettings isn't loaded
  const portalName = systemSettings?.portalName || 'JV TECH TEST AND TRAINING CENTER, KUSHINAGAR';
  const portalSubtitle = systemSettings?.portalSubtitle || 'Secure CRM & Recruitment System';
  const supportContact = systemSettings?.supportContact || '+91 98765 43210';
  const supportHelpText = systemSettings?.supportHelpText || 'Agar is information me koi gadbadi dikhe, ya koi update chahiye, toh turant hamare JV TECH TEST AND TRAINING CENTER, KUSHINAGAR office phone number par ya WhatsApp par consult karein. Passport details match hona anivary hai.';
  const heroImage = systemSettings?.heroImageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    const cleanedQuery = searchQuery.trim().toLowerCase();
    
    if (!cleanedQuery) {
      setFoundCandidate(null);
      return;
    }

    const candidate = candidates.find(
      (c) =>
        c.passportNumber.toLowerCase() === cleanedQuery ||
        c.phone.replace(/[^a-zA-Z0-9]/g, '').includes(cleanedQuery.replace(/[^a-zA-Z0-9]/g, ''))
    );

    setFoundCandidate(candidate || null);
  };

  const getStageIcon = (stageNum: number, currentStage: number, status: any) => {
    if (currentStage > stageNum) {
      return <CheckCircle className="w-6 h-6 text-emerald-500" />;
    } else if (currentStage === stageNum) {
      if (status === 'Rejected' || status === 'Unfit' || status === 'Visa Rejected') {
        return <XCircle className="w-6 h-6 text-rose-500 animate-pulse" />;
      }
      return <Clock className="w-6 h-6 text-brand-500 animate-pulse" />;
    } else {
      return <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white" />;
    }
  };

  const getStageBadgeColor = (stageNum: number, currentStage: number) => {
    if (currentStage > stageNum) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (currentStage === stageNum) return 'bg-brand-50 text-brand-600 border-brand-200 ring-2 ring-brand-100';
    return 'bg-slate-50 text-slate-400 border-slate-100';
  };

  return (
    <div id="candidate-lookup-container" className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Search Header Banner */}
      <div className="bg-brand-dark text-white rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden flex items-center min-h-[280px]">
        {/* Background Image with elegant orange-charcoal overlay representing Candidate Flight Deployment */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="International Flight Deployment Sunset"
            className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105 transition-all duration-700 hover:scale-100"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark/95 to-brand-700/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-4 w-full">
          <Logo size="md" theme="dark" className="mb-4" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-200 border border-brand-500/30 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              <span>Candidate Portal • {portalName}</span>
            </div>
            {onBackToLogin && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1.5 bg-slate-900/40 hover:bg-slate-900/80 text-white border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105"
              >
                <span>← Back to Login</span>
              </button>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight leading-none text-brand-100">
            Apna File Status Check Karein
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl">
            {portalName} me registered candidates apna live status yahan dekh sakte hain. Apna Passport Number ya Phone Number daalein.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="E.g. Z8765432 ya +91 98765 43210"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 pl-11 pr-4 py-3.5 rounded-2xl border-0 focus:ring-2 focus:ring-brand-500 font-semibold placeholder:text-slate-400 text-sm shadow-inner outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold px-6 md:px-8 rounded-2xl transition-all shadow-md hover:shadow-brand-500/20 text-sm flex items-center gap-2 outline-none cursor-pointer"
            >
              <span>Khojein</span>
            </button>
          </form>
        </div>
      </div>

      {/* Result Display */}
      {searched && (
        <div id="lookup-results" className="transition-all duration-300">
          {foundCandidate ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{foundCandidate.name}</h2>
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 mt-1">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-[10px]">
                        ID: {foundCandidate.id}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        Passport: <strong className="text-slate-700">{foundCandidate.passportNumber}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        Phone: <strong className="text-slate-700">{foundCandidate.phone}</strong>
                      </span>
                      {foundCandidate.dateOfBirth && (
                        <span className="flex items-center gap-1 font-mono">
                          DOB: <strong className="text-slate-700">{foundCandidate.dateOfBirth}</strong>
                        </span>
                      )}
                    </div>
                    {foundCandidate.address && (
                      <div className="mt-2 text-xs bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl max-w-xl text-slate-600 leading-relaxed">
                        <span className="font-bold text-[10px] uppercase text-slate-400 block tracking-wider mb-0.5">Permanent Address</span>
                        {foundCandidate.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center">
                  <div className="bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Preferred Destination</span>
                    <span className="text-sm font-bold text-slate-700">{foundCandidate.country}</span>
                  </div>
                  <div className="bg-brand-50/50 px-4 py-2.5 rounded-xl border border-brand-100 text-right">
                    <span className="text-[10px] text-brand-500 uppercase tracking-wider font-semibold block">Job Trade</span>
                    <span className="text-sm font-bold text-brand-600">{foundCandidate.trade}</span>
                  </div>
                </div>
              </div>

              {/* Status Tracker Flow (9 Stages) */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8">
                <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-500" />
                  <span>Real-time Application Progress (9 Stages)</span>
                </h3>

                {/* Vertical Timeline */}
                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {/* Stage 1: All File Workplace */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(1, foundCandidate.stage, null)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(1, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 1: All File Workplace</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        Workspace initialized and files ready for registration.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">Date: {foundCandidate.createdDate || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Stage 2: Registration */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(2, foundCandidate.stage, null)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(2, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 2: Candidate Registration</span>
                      <p className="text-sm font-semibold text-slate-800 mt-1">
                        Profile details captured in system database.
                      </p>
                      <div className="flex gap-4 mt-2 text-xs font-semibold text-slate-600">
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg">Trade: {foundCandidate.trade}</span>
                        <span className="bg-slate-100 px-2.5 py-1 rounded-lg">Country: {foundCandidate.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: Interview Documents */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(3, foundCandidate.stage, foundCandidate.stage1?.interviewStatus)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(3, foundCandidate.stage)}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">Stage 3: Interview Signed Form</span>
                        {foundCandidate.stage1?.interviewDate && (
                          <span className="text-xs font-medium text-slate-400">Date: {foundCandidate.stage1.interviewDate}</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        Status: <span className="text-brand-600">{foundCandidate.stage1?.interviewStatus || 'Pending'}</span>
                      </p>
                      {foundCandidate.stage1?.interviewFileName && (
                        <div className="mt-2 text-xs flex items-center justify-between bg-white/60 p-2 rounded border border-slate-100">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Signed Form:</span>
                            <span className="text-slate-800 font-mono text-[11px] truncate" title={foundCandidate.stage1.interviewFileName}>{foundCandidate.stage1.interviewFileName}</span>
                          </div>
                          {foundCandidate.stage1.interviewFileUrl && (
                            <a 
                              href={foundCandidate.stage1.interviewFileUrl}
                              download={foundCandidate.stage1.interviewFileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold ml-2 underline shrink-0"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      )}
                      {foundCandidate.stage1?.comments && (
                        <p className="text-xs text-slate-500 mt-2 bg-white/50 p-2 rounded border border-slate-100 italic">
                          "{foundCandidate.stage1.comments}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage 4: Candidate Document Checklist */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(4, foundCandidate.stage, null)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(4, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block mb-2">Stage 4: Candidate Document Verification</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { label: 'Passport Scan', check: foundCandidate.stage3?.documents?.passportScan },
                          { label: 'Passport Photo', check: foundCandidate.stage3?.documents?.photo },
                          { label: 'Experience Cert', check: foundCandidate.stage3?.documents?.experienceCertificate },
                          { label: 'Medical Report', check: foundCandidate.stage3?.documents?.medicalReport },
                          { label: 'PCC Clear', check: foundCandidate.stage3?.documents?.pcc },
                        ].map((doc, idx) => (
                          <div 
                            key={idx}
                            className={`p-2 rounded-lg border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                              doc.check ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400'
                            }`}
                          >
                            <FileCheck className={`w-4 h-4 ${doc.check ? 'text-emerald-500' : 'text-slate-300'}`} />
                            <span className="text-[10px] font-medium leading-none">{doc.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stage 5: Offer Letter */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(5, foundCandidate.stage, foundCandidate.stage1?.offerLetterSigned ? 'Signed' : 'Pending')}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(5, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 5: Offer Letter Verification</span>
                      <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
                        Status: 
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          foundCandidate.stage1?.offerLetterSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {foundCandidate.stage1?.offerLetterSigned ? '✓ Offer Letter Signed' : '✗ Offer Letter Pending'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Stage 6: Medical Fitness */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(6, foundCandidate.stage, foundCandidate.stage2?.medicalStatus)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(6, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 6: Medical Fitness</span>
                      <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
                        Status: 
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          foundCandidate.stage2?.medicalStatus === MedicalStatus.Fit ? 'bg-emerald-100 text-emerald-700' :
                          foundCandidate.stage2?.medicalStatus === MedicalStatus.Unfit ? 'bg-rose-100 text-rose-700' :
                          foundCandidate.stage2?.medicalStatus === MedicalStatus.ReportAwaiting ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {foundCandidate.stage2?.medicalStatus || 'Pending'}
                        </span>
                      </p>
                      {foundCandidate.stage2?.medicalDate && (
                        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" /> Medical Done On: {foundCandidate.stage2.medicalDate}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage 7: Visa Process */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(7, foundCandidate.stage, foundCandidate.stage4?.visaStatus)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(7, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 7: Visa Processing & Stamping</span>
                      <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
                        Status:
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          foundCandidate.stage4?.visaStatus === VisaStatus.Received ? 'bg-emerald-100 text-emerald-700' :
                          foundCandidate.stage4?.visaStatus === VisaStatus.Applied ? 'bg-sky-100 text-sky-700' :
                          foundCandidate.stage4?.visaStatus === VisaStatus.Rejected ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {foundCandidate.stage4?.visaStatus || 'Pending'}
                        </span>
                      </p>
                      {foundCandidate.stage4?.visaExpiryDate && (
                        <p className="text-xs text-slate-500 mt-2 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Visa Expiry Date: <strong className="text-slate-700">{foundCandidate.stage4.visaExpiryDate}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stage 8: Payment Ledger */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(8, foundCandidate.stage, null)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(8, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 8: Accounts Ledger (Payment Status)</span>
                      
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-white/60 p-2.5 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold uppercase leading-tight">Deal Amount</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-slate-700">₹{(foundCandidate.stage5?.totalDealAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                          <span className="text-[10px] text-emerald-600 block font-semibold uppercase leading-tight">Paid Amount</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-700">₹{(foundCandidate.stage5?.advanceReceived || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className={`p-2.5 rounded-lg border ${
                          (foundCandidate.stage5?.balanceAmount || 0) <= 0 ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'
                        }`}>
                          <span className="text-[10px] block font-semibold uppercase leading-tight text-slate-400">Balance Pending</span>
                          <span className={`text-xs sm:text-sm font-bold font-mono ${
                            (foundCandidate.stage5?.balanceAmount || 0) <= 0 ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            ₹{(foundCandidate.stage5?.balanceAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {foundCandidate.stage5 && foundCandidate.stage5.balanceAmount <= 0 && foundCandidate.stage > 1 && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-2">
                          <CheckCircle className="w-3 h-3" /> Fully Cleared
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stage 9: Flight Details */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[27px] top-0 bg-white p-0.5">
                      {getStageIcon(9, foundCandidate.stage, null)}
                    </div>
                    <div className={`p-4 rounded-xl border ${getStageBadgeColor(9, foundCandidate.stage)}`}>
                      <span className="text-xs font-bold uppercase tracking-wider block">Stage 9: Flight Ticket & Deployment</span>
                      
                      {foundCandidate.stage >= 9 && foundCandidate.stage6?.flightDate ? (
                        <div className="mt-3 space-y-3">
                          <div className="inline-flex items-center gap-1.5 bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider animate-bounce">
                            <PlaneTakeoff className="w-4 h-4" />
                            <span>Flight Ticket Confirmed</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 p-3 rounded-xl border border-slate-100 font-mono text-xs text-slate-700">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">AIRLINE</span>
                              <strong className="text-slate-800">{foundCandidate.stage6.airlineName || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">FLIGHT DATE</span>
                              <strong className="text-slate-800">{foundCandidate.stage6.flightDate || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">TIME</span>
                              <strong className="text-slate-800">{foundCandidate.stage6.flightTime || 'N/A'}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-sans">PNR / TICKET</span>
                              <strong className="text-slate-800">{foundCandidate.stage6.pnrNumber || 'N/A'}</strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-400 mt-1">
                          Flight ticket configuration awaits preceding visa stamping and account settlement clearance.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Guidance Banner */}
              <div className="bg-brand-50 border border-brand-100 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-brand-700">Need Help? Contact Support</h4>
                  <p className="text-xs text-brand-600 leading-relaxed">
                    {supportHelpText} (Contact: <strong className="text-brand-800">{supportContact}</strong>)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Candidate File Nahi Mila!</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Aapka Passport Number ya Mobile Number humare system me register nahi mila. Kripya dhyan se check karke sahi information fill karein.
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-sm mx-auto text-left text-xs text-slate-500">
                <p className="font-semibold text-slate-600 mb-1">💡 Tips for finding your record:</p>
                <ul className="list-disc pl-4 space-y-1 font-mono">
                  <li>Passport details correct format me hone chahiye.</li>
                  <li>E.g. Z8765432 or P1234567</li>
                  <li>Registration ke time diya hua valid Phone number hi search karein.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
