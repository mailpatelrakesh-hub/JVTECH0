import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Candidate, InterviewStatus, UserRole } from '../types';
import { 
  Building, Download, Search, Users, CreditCard, ChevronRight, ArrowLeft, 
  FileText, ExternalLink, Calendar, CheckCircle2, AlertCircle, Eye, RefreshCw
} from 'lucide-react';

interface CompanyLedgerViewProps {
  candidates: Candidate[];
  onEditCandidate: (candidate: Candidate) => void;
  userRole: UserRole;
}

export default function CompanyLedgerView({ candidates, onEditCandidate, userRole }: CompanyLedgerViewProps) {
  const isAdmin = userRole === 'Admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  
  // Date filters for Excel export
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportCompanyFilter, setExportCompanyFilter] = useState('All');

  // Unified table states
  const [activeTab, setActiveTab] = useState<'directory' | 'unified'>('directory');
  const [tableCompanyFilter, setTableCompanyFilter] = useState<string>('All');
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');
  const [balanceStatusFilter, setBalanceStatusFilter] = useState<'All' | 'Pending' | 'Cleared'>('All');

  // Unique list of companies for filters
  const uniqueCompaniesForFilter = useMemo(() => {
    const list = new Set<string>();
    candidates.forEach(cand => {
      list.add(cand.companyName?.trim() || 'Unassigned / General Pool');
    });
    return Array.from(list).sort();
  }, [candidates]);

  // Computed candidates for the Unified Accounts Ledger Sheet
  const unifiedCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // Filter by company
      if (tableCompanyFilter !== 'All') {
        const compName = cand.companyName?.trim() || 'Unassigned / General Pool';
        if (compName !== tableCompanyFilter) return false;
      }

      // Filter by Search term (Name, ID, Passport)
      if (tableSearchTerm.trim() !== '') {
        const term = tableSearchTerm.toLowerCase();
        const matchesName = cand.name?.toLowerCase().includes(term);
        const matchesId = cand.id?.toLowerCase().includes(term);
        const matchesPassport = cand.passportNumber?.toLowerCase().includes(term);
        const matchesTrade = cand.trade?.toLowerCase().includes(term);
        if (!matchesName && !matchesId && !matchesPassport && !matchesTrade) return false;
      }

      // Filter by Balance Status
      const outstanding = (cand.stage5?.totalDealAmount || 0) - (cand.stage5?.advanceReceived || 0);
      if (balanceStatusFilter === 'Pending') {
        if (outstanding <= 0) return false;
      } else if (balanceStatusFilter === 'Cleared') {
        if (outstanding > 0) return false;
      }

      return true;
    });
  }, [candidates, tableCompanyFilter, tableSearchTerm, balanceStatusFilter]);

  // Computed totals for Unified Accounts Ledger Sheet
  const unifiedTotals = useMemo(() => {
    let deal = 0;
    let paid = 0;
    let balance = 0;
    let count = 0;

    unifiedCandidates.forEach(cand => {
      deal += cand.stage5?.totalDealAmount || 0;
      paid += cand.stage5?.advanceReceived || 0;
      balance += cand.stage5?.balanceAmount || 0;
      count += 1;
    });

    return { deal, paid, balance, count };
  }, [unifiedCandidates]);

  // 1. Group candidates by company and compute statistics
  const companyStats = useMemo(() => {
    const stats: Record<string, {
      name: string;
      totalCandidates: number;
      selectedCandidates: number;
      deployedCandidates: number;
      totalDealAmount: number;
      totalPaidAmount: number;
      totalBalance: number;
      candidatesList: Candidate[];
      screenshots: Array<{ candidateName: string; docName: string; url: string; date: string }>;
    }> = {};

    candidates.forEach((cand) => {
      // Normalize company name, fallback to "Unassigned / General Pool" if none
      const compRaw = cand.companyName?.trim();
      const compName = compRaw && compRaw !== '' ? compRaw : 'Unassigned / General Pool';

      if (!stats[compName]) {
        stats[compName] = {
          name: compName,
          totalCandidates: 0,
          selectedCandidates: 0,
          deployedCandidates: 0,
          totalDealAmount: 0,
          totalPaidAmount: 0,
          totalBalance: 0,
          candidatesList: [],
          screenshots: []
        };
      }

      const comp = stats[compName];
      comp.totalCandidates += 1;
      comp.candidatesList.push(cand);

      // Check selection status (Stage 1 Selected means they are selected for the company)
      const isSelected = cand.stage1?.interviewStatus === InterviewStatus.Selected;
      if (isSelected) {
        comp.selectedCandidates += 1;
      }

      if (cand.stage === 6) {
        comp.deployedCandidates += 1;
      }

      // Financials
      const deal = cand.stage5?.totalDealAmount || 0;
      const paid = cand.stage5?.advanceReceived || 0;
      const bal = cand.stage5?.balanceAmount || 0;

      comp.totalDealAmount += deal;
      comp.totalPaidAmount += paid;
      comp.totalBalance += bal;

      // Screenshot collection
      if (cand.stage5?.companyLedgerScreenshotUrl) {
        comp.screenshots.push({
          candidateName: cand.name,
          docName: cand.stage5.companyLedgerScreenshotName || 'Screenshot',
          url: cand.stage5.companyLedgerScreenshotUrl,
          date: cand.createdDate
        });
      }
    });

    return Object.values(stats);
  }, [candidates]);

  // 2. Filter companies based on search
  const filteredCompanies = useMemo(() => {
    return companyStats.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companyStats, searchTerm]);

  // Find currently active company data
  const activeCompanyData = useMemo(() => {
    if (!selectedCompany) return null;
    return companyStats.find(c => c.name === selectedCompany) || null;
  }, [companyStats, selectedCompany]);

  // 3. Helper to format Indian Rupees
  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  // 4. Generate and download Excel / XLSX file
  // "selection member ka company date wise excel download ka option ho"
  const handleExportExcel = () => {
    // Collect all selected candidates across companies
    let listToExport = candidates.filter(cand => cand.stage1?.interviewStatus === InterviewStatus.Selected);

    // Apply company filter
    if (exportCompanyFilter !== 'All') {
      listToExport = listToExport.filter(cand => {
        const compName = cand.companyName?.trim() || 'Unassigned / General Pool';
        return compName === exportCompanyFilter;
      });
    }

    // Apply start date filter
    if (startDate) {
      listToExport = listToExport.filter(cand => cand.createdDate >= startDate);
    }

    // Apply end date filter
    if (endDate) {
      listToExport = listToExport.filter(cand => cand.createdDate <= endDate);
    }

    // Sort by Company Name first, and then Selection/Created Date wise
    listToExport.sort((a, b) => {
      const compA = a.companyName || 'Unassigned / General Pool';
      const compB = b.companyName || 'Unassigned / General Pool';
      if (compA !== compB) {
        return compA.localeCompare(compB);
      }
      return a.createdDate.localeCompare(b.createdDate);
    });

    // Generate Excel content
    const companyName = exportCompanyFilter !== 'All' 
      ? String(exportCompanyFilter).toUpperCase() 
      : 'ALL COMPANIES';

    const uniqueDates = Array.from(new Set(listToExport.map(c => c.stage1?.interviewDate || c.createdDate || '').filter(Boolean)));
    const interviewDate = uniqueDates.length === 1 
      ? String(uniqueDates[0]).toUpperCase() 
      : uniqueDates.length > 1 
        ? uniqueDates.join(', ').toUpperCase() 
        : 'N/A';

    const excelData = [
      [`COMPANY: ${companyName}`],
      [`INTERVIEW DATE: ${interviewDate}`],
      [], // blank row
      ['Sr number', 'Name', 'Passport number', 'Trade', 'Mobile number']
    ];

    listToExport.forEach((cand, index) => {
      excelData.push([
        String(index + 1),
        cand.name || '',
        cand.passportNumber || '',
        cand.trade || '',
        cand.phone || ''
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Selected Candidates');

    const formattedDate = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Selection_Registry_Report_${formattedDate}.xlsx`);
  };

  return (
    <div id="company-ledger-container" className="space-y-6">
      
      {/* Upper Navigation/Action Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <Building className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 font-display">Company Ledgers & Placements</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Monitor company wise selected candidates, payment screenshots, and export date-wise recruitment registries.
          </p>
        </div>

        {/* Excel / CSV Export Area */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">From Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-white text-xs p-1.5 rounded-lg border border-slate-200 outline-none w-full"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">To Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-white text-xs p-1.5 rounded-lg border border-slate-200 outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-0.5 w-full sm:w-44">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Select Company</label>
            <select
              value={exportCompanyFilter}
              onChange={e => setExportCompanyFilter(e.target.value)}
              className="bg-white text-xs p-1.5 rounded-lg border border-slate-200 outline-none w-full font-medium"
            >
              <option value="All">All Companies Selection</option>
              {uniqueCompaniesForFilter.map((comp, idx) => (
                <option key={idx} value={comp}>{comp}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer w-full sm:w-auto"
            title="Download date-wise placement records in Microsoft Excel format"
          >
            <Download className="w-3.5 h-3.5" />
            Excel Download
          </button>
        </div>
      </div>

      {/* Tab Selector for Ledger Modes */}
      {!selectedCompany && (
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 max-w-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'directory'
                ? 'bg-white text-purple-750 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>🏢 Company Directory (कंपनी वार)</span>
          </button>
          <button
            onClick={() => setActiveTab('unified')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'unified'
                ? 'bg-white text-purple-750 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>📊 Unified Company-Wise Ledger (सभी खाते)</span>
          </button>
        </div>
      )}

      {/* Main Two-Pane or Detail Layout */}
      {!selectedCompany ? (
        activeTab === 'directory' ? (
          // ------------------ DIRECTORY LIST VIEW ------------------
          <div className="space-y-4 animate-fadeIn">
            {/* Search bar */}
            <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 max-w-md shadow-inner">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input 
                type="text"
                placeholder="Search by company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-sm font-medium outline-none text-slate-700 bg-transparent placeholder:text-slate-400"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {filteredCompanies.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-150 space-y-3">
                <div className="w-14 h-14 bg-slate-50 text-slate-400 border border-slate-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">No Companies Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No candidates are registered under this company yet. You can set the Company Name on any candidate's registration card.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCompanies.map((comp) => {
                    const uniqueDates = Array.from(
                      new Set(
                        comp.candidatesList
                          .map(c => c.stage1?.interviewDate || c.createdDate)
                          .filter(Boolean)
                      )
                    ).sort() as string[];
                    const totalDue = comp.totalBalance;
                    return (
                      <div 
                        key={comp.name}
                        className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:border-purple-200 group"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-slate-800 tracking-tight leading-tight max-w-[200px] truncate" title={comp.name}>
                                {comp.name}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                                <Users className="w-3 h-3" /> {comp.totalCandidates} Candidates Registered
                              </span>
                              {uniqueDates.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] font-semibold text-slate-500">
                                  <span className="text-slate-400 font-bold">📅 Dates:</span>
                                  {uniqueDates.slice(0, 2).map(d => (
                                    <span key={d} className="bg-purple-55 text-purple-750 px-1.5 py-0.5 rounded text-[9px] border border-purple-100/50 font-bold">{d}</span>
                                  ))}
                                  {uniqueDates.length > 2 && (
                                    <span className="text-slate-400 text-[9px] font-bold">+{uniqueDates.length - 2} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 shadow-sm border border-purple-100">
                              {comp.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>

                        {/* Small Stat Badges */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-center sm:text-left">
                            <span className="text-[8px] text-slate-400 block font-semibold uppercase leading-tight">Selected</span>
                            <span className="text-sm font-bold text-emerald-600">{comp.selectedCandidates} Member</span>
                          </div>
                          <div className="text-center sm:text-left border-l border-slate-200/60 pl-2">
                            <span className="text-[8px] text-slate-400 block font-semibold uppercase leading-tight">Screenshots</span>
                            <span className="text-sm font-bold text-purple-600">{comp.screenshots.length} Uploaded</span>
                          </div>
                        </div>

                        {/* Financial summary for Admin */}
                        {isAdmin && (
                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs font-mono">
                            <div>
                              <span className="text-[8px] text-slate-400 block font-sans font-bold uppercase leading-tight">Collected</span>
                              <span className="font-bold text-slate-700">{formatCurrency(comp.totalPaidAmount)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] text-slate-400 block font-sans font-bold uppercase leading-tight">Due Pending</span>
                              <span className={`font-bold ${totalDue > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {formatCurrency(totalDue)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        onClick={() => setSelectedCompany(comp.name)}
                        className="w-full mt-4 bg-slate-50 hover:bg-purple-50 text-slate-600 hover:text-purple-700 font-bold text-xs py-2 rounded-xl transition-all border border-slate-150 hover:border-purple-200 flex items-center justify-center gap-1 group/btn cursor-pointer"
                      >
                        <span>View Company Ledger</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // ------------------ UNIFIED TABULAR LEDGER VIEW ------------------
          <div className="space-y-6 animate-fadeIn">
            {/* Filters Dashboard */}
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Search className="w-4 h-4 text-purple-600" /> Filter accounts company wise (कंपनी-वार खाते फिल्टर करें)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Term */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Search Candidate</label>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shadow-inner">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      placeholder="Name, Passport, ID..."
                      value={tableSearchTerm}
                      onChange={(e) => setTableSearchTerm(e.target.value)}
                      className="w-full text-xs font-semibold outline-none text-slate-700 bg-transparent placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Company Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Company Name (कंपनी का नाम)</label>
                  <select
                    value={tableCompanyFilter}
                    onChange={(e) => setTableCompanyFilter(e.target.value)}
                    className="bg-slate-50 text-xs font-bold text-slate-700 p-2.5 rounded-xl border border-slate-200 outline-none w-full cursor-pointer"
                  >
                    <option value="All">All Companies (सभी कंपनियां)</option>
                    {uniqueCompaniesForFilter.map((comp, idx) => (
                      <option key={idx} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>

                {/* Outstanding Balance Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-sans">Ledger Balance Status</label>
                  <select
                    value={balanceStatusFilter}
                    onChange={(e) => setBalanceStatusFilter(e.target.value as any)}
                    className="bg-slate-50 text-xs font-bold text-slate-700 p-2.5 rounded-xl border border-slate-200 outline-none w-full cursor-pointer"
                  >
                    <option value="All">All Balance Accounts (सभी खाते)</option>
                    <option value="Pending">Pending Balance Only (केवल बाकी बकाया)</option>
                    <option value="Cleared">Cleared Balance Only (पूर्ण चुकता)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Financial Summary Cards for the Filtered Group */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">Filtered Candidates</span>
                <span className="text-xl font-extrabold text-slate-800 block mt-2">{unifiedTotals.count} Candidate(s)</span>
                <span className="text-[9px] text-slate-400 mt-1">Matched the active filters</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight">Total Deal Revenue</span>
                <span className="text-xl font-extrabold text-slate-800 block mt-2">{formatCurrency(unifiedTotals.deal)}</span>
                <span className="text-[9px] text-slate-400 mt-1">Accumulated deal rate</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight font-sans">Total Received</span>
                <span className="text-xl font-extrabold text-emerald-600 block mt-2">{formatCurrency(unifiedTotals.paid)}</span>
                <span className="text-[9px] text-slate-400 mt-1 font-sans">Advance collected to date</span>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-tight font-sans">Total Outstanding</span>
                <span className={`text-xl font-extrabold block mt-2 ${unifiedTotals.balance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                  {formatCurrency(unifiedTotals.balance)}
                </span>
                <span className="text-[9px] text-slate-400 mt-1 font-sans">Pending payments due</span>
              </div>
            </div>

            {/* Unified candidates ledger list */}
            <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Company Wise Ledger Accounts Sheet ({unifiedCandidates.length})
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Click Ledger button to update candidate account details</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Reg Date</th>
                      <th className="px-6 py-4">Candidate Details</th>
                      <th className="px-6 py-4">Company Name</th>
                      <th className="px-6 py-4">Job Profile / Trade</th>
                      {isAdmin && (
                        <>
                          <th className="px-6 py-4 text-right">Deal Amount</th>
                          <th className="px-6 py-4 text-right font-sans">Paid Advance</th>
                          <th className="px-6 py-4 text-right font-sans">Pending Balance</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-center">Receipt</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                    {unifiedCandidates.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 9 : 6} className="text-center py-12 text-slate-400 italic">
                          No candidates found matching the active company/search filters.
                        </td>
                      </tr>
                    ) : (
                      unifiedCandidates.map((cand) => {
                        const hasReceipt = !!cand.stage5?.companyLedgerScreenshotUrl;
                        const outstanding = (cand.stage5?.totalDealAmount || 0) - (cand.stage5?.advanceReceived || 0);
                        const compRaw = cand.companyName?.trim();
                        const compName = compRaw && compRaw !== '' ? compRaw : 'Unassigned / General Pool';

                        return (
                          <tr key={cand.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-400">{cand.createdDate}</td>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-800 block">{cand.name}</span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                                  <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold">ID: {cand.id}</span>
                                  <span>Passport: <strong className="text-slate-600 font-semibold">{cand.passportNumber}</strong></span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                compName === 'Unassigned / General Pool'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-100'
                              }`}>
                                <Building className="w-2.5 h-2.5" />
                                {compName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {cand.trade}
                              </span>
                            </td>
                            {isAdmin && (
                              <>
                                <td className="px-6 py-4 text-right font-mono text-slate-600">
                                  {formatCurrency(cand.stage5?.totalDealAmount || 0)}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-emerald-600">
                                  {formatCurrency(cand.stage5?.advanceReceived || 0)}
                                </td>
                                <td className={`px-6 py-4 text-right font-mono font-bold ${
                                  outstanding <= 0 ? 'text-emerald-600' : 'text-rose-500'
                                }`}>
                                  {formatCurrency(outstanding)}
                                </td>
                              </>
                            )}
                            <td className="px-6 py-4 text-center">
                              {hasReceipt ? (
                                <a 
                                  href={cand.stage5?.companyLedgerScreenshotUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded-lg border border-purple-150 transition-all text-[10px] font-bold cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" /> View
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => onEditCandidate(cand)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                              >
                                <span>Edit Ledger</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        // ------------------ DETAILED COMPANY LEDGER VIEW ------------------
        <div className="space-y-6 animate-fadeIn">
          {/* Back Button and Company Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button 
              onClick={() => setSelectedCompany(null)}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Company Directory
            </button>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Switch Company:</span>
              <select
                value={selectedCompany || ''}
                onChange={e => setSelectedCompany(e.target.value || null)}
                className="bg-transparent text-xs font-bold text-purple-700 outline-none cursor-pointer"
              >
                {uniqueCompaniesForFilter.map((comp, idx) => (
                  <option key={idx} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Company Brief Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="space-y-1.5 md:col-span-2">
              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Company Profile</span>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">
                {activeCompanyData?.name}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Reviewing list of selection members, transaction health, and verified ledger receipts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 shadow-inner">
                <span className="text-[10px] text-slate-400 block font-semibold uppercase leading-tight">Selected Members</span>
                <span className="text-xl font-black text-emerald-600 block mt-1">{activeCompanyData?.selectedCandidates} Placed</span>
                <span className="text-[9px] text-slate-400">Out of {activeCompanyData?.totalCandidates} registered</span>
              </div>

              {isAdmin && (
                <div className="bg-purple-50/40 p-4 rounded-2xl border border-purple-100/50">
                  <span className="text-[10px] text-purple-600 block font-semibold uppercase leading-tight font-sans">Total Ledger Revenue</span>
                  <span className="text-xl font-black text-purple-700 block mt-1">{formatCurrency(activeCompanyData?.totalDealAmount || 0)}</span>
                  <span className="text-[9px] text-slate-400 font-mono">Collected: {formatCurrency(activeCompanyData?.totalPaidAmount || 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ledger Receipts Gallery */}
          {activeCompanyData && activeCompanyData.screenshots.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Building className="w-4 h-4 text-purple-500" /> Company Ledger Payment Screenshots ({activeCompanyData.screenshots.length})
              </h4>
              <p className="text-[11px] text-slate-500">
                Below are all the ledger screenshots uploaded for payments settled with this company. Click to open full view.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {activeCompanyData.screenshots.map((shot, idx) => (
                  <div 
                    key={idx}
                    className="group bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 relative overflow-hidden hover:border-purple-300 transition-all shadow-sm"
                  >
                    <div className="h-28 bg-slate-200 rounded-xl overflow-hidden relative flex items-center justify-center">
                      <img 
                        src={shot.url} 
                        alt={shot.docName} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-white text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow flex items-center gap-1">
                          <Eye className="w-3 h-3" /> View Receipt
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block truncate" title={shot.candidateName}>
                        Candidate: {shot.candidateName}
                      </span>
                      <span className="text-[8px] text-slate-400 font-mono block mt-0.5">
                        Uploaded On: {shot.date}
                      </span>
                    </div>
                    {/* Invisible absolute anchor to open screenshot preview */}
                    <a 
                      href={shot.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="absolute inset-0 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Candidate roster list */}
          <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Placed Candidates / Selection Members List ({activeCompanyData?.candidatesList.length})
              </h4>
              <span className="text-[10px] text-slate-400 font-medium">Click on any candidate to open details & ledger</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Reg Date</th>
                    <th className="px-6 py-4">Candidate</th>
                    <th className="px-6 py-4">Passport No</th>
                    <th className="px-6 py-4">Job Profile</th>
                    <th className="px-6 py-4">Recruitment Stage</th>
                    {isAdmin && (
                      <>
                        <th className="px-6 py-4 text-right">Deal Amount</th>
                        <th className="px-6 py-4 text-right">Paid Advance</th>
                        <th className="px-6 py-4 text-right">Pending Balance</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-center">Receipt</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {activeCompanyData?.candidatesList.map((cand) => {
                    const hasReceipt = !!cand.stage5?.companyLedgerScreenshotUrl;
                    const isPlaced = cand.stage1?.interviewStatus === InterviewStatus.Selected;

                    return (
                      <tr key={cand.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-400">{cand.createdDate}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 block">{cand.name}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">ID: {cand.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">{cand.passportNumber}</td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                            {cand.trade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            cand.stage === 6 ? 'text-rose-600' :
                            cand.stage === 5 ? 'text-purple-600' :
                            cand.stage === 4 ? 'text-violet-600' :
                            cand.stage === 3 ? 'text-emerald-600' :
                            cand.stage === 2 ? 'text-indigo-600' : 'text-slate-500'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Stage {cand.stage} ({cand.stage === 6 ? 'Deployed' : cand.stage === 5 ? 'Accounts' : 'Processing'})
                          </span>
                        </td>

                        {isAdmin && (
                          <>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                              {formatCurrency(cand.stage5?.totalDealAmount || 0)}
                            </td>
                            <td className="px-6 py-4 text-right font-mono text-emerald-600">
                              {formatCurrency(cand.stage5?.advanceReceived || 0)}
                            </td>
                            <td className={`px-6 py-4 text-right font-mono font-bold ${
                              (cand.stage5?.balanceAmount || 0) <= 0 ? 'text-emerald-600' : 'text-rose-500'
                            }`}>
                              {formatCurrency(cand.stage5?.balanceAmount || 0)}
                            </td>
                          </>
                        )}

                        <td className="px-6 py-4 text-center">
                          {hasReceipt ? (
                            <a 
                              href={cand.stage5?.companyLedgerScreenshotUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded-lg border border-purple-150 transition-all text-[10px] font-bold"
                            >
                              <FileText className="w-3 h-3" /> View
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">None</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => onEditCandidate(cand)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span>Ledger</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
