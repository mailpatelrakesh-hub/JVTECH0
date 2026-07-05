import { Candidate, InterviewStatus, MedicalStatus, VisaStatus, UserRole } from '../types';
import * as XLSX from 'xlsx';
import { Users, UserCheck, Activity, Award, Landmark, Plane, TrendingUp, DollarSign, Lock, Download } from 'lucide-react';

interface DashboardStatsProps {
  candidates: Candidate[];
  userRole?: UserRole;
}

export default function DashboardStats({ candidates, userRole = 'Admin' }: DashboardStatsProps) {
  const activeCandidates = candidates.filter((c) => !c.isArchived);
  const archivedCandidates = candidates.filter((c) => c.isArchived);

  const isAdmin = userRole === 'Admin';

  // Core metrics
  const totalRegistered = candidates.length;
  
  const selectedCount = candidates.filter(
    (c) => c.stage1.interviewStatus === InterviewStatus.Selected
  ).length;

  const medicalFitCount = candidates.filter(
    (c) => c.stage2.medicalStatus === MedicalStatus.Fit
  ).length;

  const visaReceivedCount = candidates.filter(
    (c) => c.stage4.visaStatus === VisaStatus.Received
  ).length;

  const deployedCount = candidates.filter(
    (c) => c.stage >= 9 && c.stage6.flightDate
  ).length;

  // Financial calculations
  let totalDealAmount = 0;
  let totalCollected = 0;

  candidates.forEach((c) => {
    totalDealAmount += c.stage5.totalDealAmount || 0;
    totalCollected += c.stage5.advanceReceived || 0;
  });

  const totalOutstanding = totalDealAmount - totalCollected;

  // Company-wise selection stats
  const companyStats: { [key: string]: { total: number; selected: number; interviewDates: string[] } } = {};
  candidates.forEach((c) => {
    const comp = (c.companyName || 'Not Assigned').trim();
    if (!companyStats[comp]) {
      companyStats[comp] = { total: 0, selected: 0, interviewDates: [] };
    }
    companyStats[comp].total += 1;
    if (c.stage1?.interviewStatus === InterviewStatus.Selected) {
      companyStats[comp].selected += 1;
    }
    const dateVal = c.stage1?.interviewDate;
    if (dateVal && dateVal.trim() !== '') {
      if (!companyStats[comp].interviewDates.includes(dateVal)) {
        companyStats[comp].interviewDates.push(dateVal);
      }
    }
  });

  // Sort interview dates chronologically
  Object.values(companyStats).forEach((stat) => {
    stat.interviewDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  });

  const sortedCompanies = Object.entries(companyStats)
    .filter(([name]) => name !== 'Not Assigned' || companyStats[name].selected > 0)
    .sort((a, b) => b[1].selected - a[1].selected || b[1].total - a[1].total);

  // Interview Date-wise selection stats
  const interviewStats: { [key: string]: { total: number; selected: number } } = {};
  candidates.forEach((c) => {
    const dateStr = c.stage1?.interviewDate || c.createdDate || 'N/A';
    if (!interviewStats[dateStr]) {
      interviewStats[dateStr] = { total: 0, selected: 0 };
    }
    interviewStats[dateStr].total += 1;
    if (c.stage1?.interviewStatus === InterviewStatus.Selected) {
      interviewStats[dateStr].selected += 1;
    }
  });

  const sortedInterviews = Object.entries(interviewStats)
    .filter(([date]) => date !== 'N/A' || interviewStats[date].selected > 0)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5);

  const generateAndDownloadExcel = (list: Candidate[], filename: string) => {
    // 1. Get company name
    const uniqueCompanies = Array.from(new Set(list.map(c => (c.companyName || 'Not Assigned').trim())));
    const companyName = uniqueCompanies.length === 1 
      ? uniqueCompanies[0].toUpperCase() 
      : uniqueCompanies.length > 1 
        ? 'VARIOUS COMPANIES' 
        : 'NOT ASSIGNED';

    // 2. Get interview date
    const uniqueDates = Array.from(new Set(list.map(c => c.stage1?.interviewDate || c.createdDate || '').filter(Boolean)));
    const interviewDate = uniqueDates.length === 1 
      ? uniqueDates[0].toUpperCase() 
      : uniqueDates.length > 1 
        ? uniqueDates.join(', ').toUpperCase() 
        : 'N/A';

    const excelData = [
      [`COMPANY: ${companyName}`],
      [`INTERVIEW DATE: ${interviewDate}`],
      [], // blank row
      ['Sr number', 'Name', 'Passport number', 'Trade', 'Mobile number']
    ];

    list.forEach((c, index) => {
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
    XLSX.writeFile(workbook, filename);
  };

  const handleDownloadAllSelected = () => {
    const selectedCandidates = candidates.filter(
      (c) => c.stage1?.interviewStatus === InterviewStatus.Selected
    );
    
    // Sort by company name, then candidate name
    const sorted = [...selectedCandidates].sort((a, b) => {
      const compA = (a.companyName || 'Not Assigned').trim().toLowerCase();
      const compB = (b.companyName || 'Not Assigned').trim().toLowerCase();
      if (compA !== compB) return compA.localeCompare(compB);
      return a.name.localeCompare(b.name);
    });

    generateAndDownloadExcel(sorted, 'All_Companies_Selected_Candidates.xlsx');
  };

  const handleDownloadCompanySelected = (compName: string) => {
    const selectedCandidates = candidates.filter(
      (c) => 
        c.stage1?.interviewStatus === InterviewStatus.Selected &&
        (c.companyName || 'Not Assigned').trim() === compName.trim()
    );

    // Sort by candidate name
    const sorted = [...selectedCandidates].sort((a, b) => a.name.localeCompare(b.name));

    const filename = `${compName.replace(/[^a-zA-Z0-9]/g, '_')}_Selected_Candidates.xlsx`;
    generateAndDownloadExcel(sorted, filename);
  };

  const statsItems = [
    {
      id: 'stat-total',
      title: 'Total Candidates',
      value: totalRegistered,
      subtitle: `${activeCandidates.length} Active • ${archivedCandidates.length} Deployed`,
      icon: Users,
      color: 'bg-brand-500/10 text-brand-500 border-brand-100',
    },
    {
      id: 'stat-selected',
      title: 'Selected Candidates',
      value: selectedCount,
      subtitle: `${candidates.filter(c => c.stage1.interviewStatus === InterviewStatus.Hold).length} on Hold`,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-100',
    },
    {
      id: 'stat-medical',
      title: 'Medical Cleared (Fit)',
      value: medicalFitCount,
      subtitle: `${candidates.filter(c => c.stage2.medicalStatus === MedicalStatus.ReportAwaiting).length} Report Awaiting`,
      icon: Activity,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-100',
    },
    {
      id: 'stat-visa',
      title: 'Visas Stamped',
      value: visaReceivedCount,
      subtitle: `${candidates.filter(c => c.stage4.visaStatus === VisaStatus.Applied).length} Applied & Pending`,
      icon: Award,
      color: 'bg-violet-500/10 text-violet-600 border-violet-100',
    },
  ];

  return (
    <div id="dashboard-stats-container" className="space-y-6">
      {/* Upper Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              id={item.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px] flex items-start justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.title}</span>
                <h3 className="text-3xl font-bold font-display text-slate-800">{item.value}</h3>
                <p className="text-xs text-slate-500">{item.subtitle}</p>
              </div>
              <div className={`p-3 rounded-xl border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Financials & Operations Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Collection card */}
        {isAdmin && (
          <div id="financial-ledger-summary-card" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                <span className="text-sm font-semibold text-slate-600">Accounts Ledger Overview</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">Live Accounts</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-6">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Total Collected</span>
                  <p className="text-2xl font-bold font-mono text-emerald-600">
                    ₹{totalCollected.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center text-[10px] text-emerald-600 font-semibold gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Collected</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Outstanding Balance</span>
                  <p className="text-2xl font-bold font-mono text-rose-500">
                    ₹{totalOutstanding.toLocaleString('en-IN')}
                  </p>
                  <div className="flex items-center text-[10px] text-rose-500 font-semibold gap-0.5">
                    <TrendingUp className="w-3 h-3 rotate-180" />
                    <span>Pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Collection Efficiency</span>
                <span>{totalDealAmount > 0 ? Math.round((totalCollected / totalDealAmount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalDealAmount > 0 ? (totalCollected / totalDealAmount) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Total Deal Volume: ₹{totalDealAmount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* Trade Wise Distribution (Bento) */}
        <div id="trade-distribution-card" className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm col-span-1 ${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-50">
            <span className="text-sm font-semibold text-slate-600">Demand by Job Profile / Trade</span>
            <span className="text-xs text-slate-400 font-mono">Active Trades</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            {/* Left Col: list of top trades */}
            <div className="space-y-3">
              {['Electrician', 'Industrial Welder', 'Pipe Fitter', 'Heavy Driver'].map((trade) => {
                const count = candidates.filter((c) => c.trade === trade).length;
                const percent = candidates.length > 0 ? Math.round((count / candidates.length) * 100) : 0;
                return (
                  <div key={trade} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{trade}</span>
                      <span className="font-mono text-slate-500">{count} Candidates ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full rounded-full" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Col: Country statistics */}
            <div className="border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4 pt-4 sm:pt-0 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Preferred Destinations</span>
              <div className="grid grid-cols-2 gap-2">
                {['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Oman'].map((country) => {
                  const count = candidates.filter((c) => c.country === country).length;
                  return (
                    <div key={country} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 p-2 rounded-xl transition-all">
                      <span className="text-[10px] text-slate-400 font-medium block truncate">{country}</span>
                      <span className="text-base font-bold font-display text-slate-700">{count} <span className="text-xs text-slate-400 font-normal">pax</span></span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                * Based on actual registrations at JV Tech Test and Training Center.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Selections by Company & Interview Dates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Company Selection Stats */}
        <div id="company-selections-card" className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-800">Company Selection Stats</span>
              <p className="text-[10px] text-slate-400">Total placed and selected candidates by company</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDownloadAllSelected}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded-lg shadow-xs transition-all cursor-pointer"
                title="Download Excel Sheet for All Companies Selected Members"
              >
                <Download className="w-3 h-3" />
                <span>Excel (All)</span>
              </button>
              <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2 py-1 rounded-lg">🏢 Clients</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {sortedCompanies.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No candidates selected/allocated to any company yet.</p>
            ) : (
              sortedCompanies.map(([compName, stats]) => {
                const percent = stats.total > 0 ? Math.round((stats.selected / stats.total) * 100) : 0;
                return (
                  <div key={compName} className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-100/50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-bold text-slate-700 truncate max-w-[140px]" title={compName}>{compName}</span>
                        {stats.selected > 0 && (
                          <button
                            onClick={() => handleDownloadCompanySelected(compName)}
                            className="flex items-center gap-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 shadow-xs transition-all cursor-pointer"
                            title={`Download Selected Candidates Excel for ${compName}`}
                          >
                            <Download className="w-2.5 h-2.5" />
                            <span>Excel</span>
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-600 font-mono">{stats.selected} Selected </span>
                        <span className="text-[10px] text-slate-400 font-medium">/ {stats.total} Registered</span>
                      </div>
                    </div>

                    {stats.interviewDates.length > 0 && (
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 flex-wrap">
                        <span className="text-slate-400 shrink-0">📅 Int. Dates:</span>
                        <div className="flex items-center gap-1 flex-wrap font-semibold text-purple-700">
                          {stats.interviewDates.map((dStr) => {
                            let formatted = dStr;
                            try {
                              formatted = new Date(dStr).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              });
                            } catch (e) {
                              formatted = dStr;
                            }
                            return (
                              <span key={dStr} className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100 text-[9px]">
                                {formatted}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold font-mono w-8 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Interview Date Selection Stats */}
        <div id="interview-date-selections-card" className="bg-white rounded-2xl border border-slate-150 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-800">Interview Date Selection Stats</span>
              <p className="text-[10px] text-slate-400">Selected candidates on specific interview days</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full">📅 Live Schedules</span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {sortedInterviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No interview dates logged yet.</p>
            ) : (
              sortedInterviews.map(([dateVal, stats]) => {
                const formattedDate = dateVal !== 'N/A' ? new Date(dateVal).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'N/A / Registration';
                const percent = stats.total > 0 ? Math.round((stats.selected / stats.total) * 100) : 0;
                return (
                  <div key={dateVal} className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50 transition-all border border-slate-100/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">📅</span>
                        <span className="text-xs font-bold text-slate-700">{formattedDate}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-brand-500 font-mono">{stats.selected} Selected </span>
                        <span className="text-[10px] text-slate-400 font-medium">/ {stats.total} Processed</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-500 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold font-mono w-8 text-right">{percent}%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
