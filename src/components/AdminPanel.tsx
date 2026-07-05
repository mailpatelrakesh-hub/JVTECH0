import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import Logo from './Logo';
import { Candidate, UserRole, SystemSettings, StaffUser } from '../types';
import { 
  Shield, Users, Database, Settings, Download, Upload, 
  Trash2, Plus, Sparkles, CheckSquare, Key, AlertTriangle, 
  ToggleLeft, ToggleRight, Briefcase, Globe, Landmark, ShieldCheck,
  Edit, Save, Image, Phone, MapPin, Eye, EyeOff, FileText, IdCard, FileSpreadsheet
} from 'lucide-react';

interface AdminPanelProps {
  candidates: Candidate[];
  onImportDatabase: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportDatabase: () => void;
  onUpdateCandidatesList: (newList: Candidate[]) => void;
  triggerToast: (msg: string) => void;
  systemSettings: SystemSettings;
  onUpdateSystemSettings: (newSettings: SystemSettings) => void;
  systemUsers: StaffUser[];
  onUpdateSystemUsers: (newUsers: StaffUser[]) => void;
}

export default function AdminPanel({ 
  candidates, 
  onImportDatabase, 
  onExportDatabase, 
  onUpdateCandidatesList,
  triggerToast,
  systemSettings,
  onUpdateSystemSettings,
  systemUsers,
  onUpdateSystemUsers
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'backup' | 'jobs' | 'agency'>('users');
  
  // New user registration states
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Staff');
  const [newUserAvatarName, setNewUserAvatarName] = useState('🤵‍♂️ Male Officer');
  const [newUserPhotoUrl, setNewUserPhotoUrl] = useState('');

  // User editing states
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Staff');
  const [editAvatarName, setEditAvatarName] = useState('🤵‍♂️ Male Officer');
  const [editUserPhotoUrl, setEditUserPhotoUrl] = useState('');

  // ID Card Generator States
  const [selectedIdCardUser, setSelectedIdCardUser] = useState<StaffUser | null>(null);
  const [idCardName, setIdCardName] = useState('');
  const [idCardDesignation, setIdCardDesignation] = useState('');
  const [idCardMobile, setIdCardMobile] = useState('');
  const [idCardEmail, setIdCardEmail] = useState('');
  const [idCardAddress, setIdCardAddress] = useState('');
  const [idCardPhotoUrl, setIdCardPhotoUrl] = useState('');

  const idCardRef = React.useRef<HTMLDivElement>(null);

  const openIdCardGenerator = (user: StaffUser) => {
    setSelectedIdCardUser(user);
    setIdCardName(user.name.toUpperCase());
    
    // Extract designation (clean emoji if present)
    const cleanedRole = user.avatarName 
      ? user.avatarName.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim().toUpperCase() 
      : user.role.toUpperCase();
    setIdCardDesignation(cleanedRole || "COMPUTER OPERATOR");
    
    setIdCardMobile("7706087734"); // default matching reference image
    setIdCardEmail(user.username ? `${user.username.toUpperCase()}@GMAIL.COM` : "JVTECH71@GMAIL.COM");
    setIdCardAddress("TURKPATTI, KUSHINAGAR");
    setIdCardPhotoUrl(user.photoUrl || "");
  };

  const handleIdCardPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setIdCardPhotoUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadIdCardAsImage = async () => {
    if (!idCardRef.current) return;
    try {
      triggerToast("Generating your high-resolution ID card...");
      const canvas = await html2canvas(idCardRef.current, {
        scale: 2.5, // Ultra crisp export
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `JV_TECH_ID_CARD_${(idCardName || 'STAFF').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      triggerToast("ID Card downloaded successfully!");
    } catch (err) {
      console.error("ID Card download error:", err);
      alert("ID Card image download failed.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size must be less than 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        if (isEdit) {
          setEditUserPhotoUrl(base64String);
        } else {
          setNewUserPhotoUrl(base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditUser = (user: StaffUser) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword(user.password || (user.role === 'Admin' ? 'admin123' : 'staff123'));
    setEditRole(user.role);
    setEditAvatarName(user.avatarName || '🤵‍♂️ Male Officer');
    setEditUserPhotoUrl(user.photoUrl || '');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editName || !editUsername || !editPassword) {
      alert('Please fill out all fields.');
      return;
    }

    const updatedUsers = systemUsers.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          name: editName,
          username: editUsername.toLowerCase().trim(),
          password: editPassword,
          role: editRole,
          avatarName: editAvatarName,
          photoUrl: editUserPhotoUrl
        };
      }
      return u;
    });

    onUpdateSystemUsers(updatedUsers);
    setEditingUser(null);
    triggerToast(`Staff User "${editName}" account updated successfully.`);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === '1' || name.toLowerCase().includes('rakesh')) {
      alert('Security Protection: Main administrator account cannot be deleted!');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete login for "${name}"?`)) {
      const updatedUsers = systemUsers.filter(u => u.id !== id);
      onUpdateSystemUsers(updatedUsers);
      triggerToast(`Account for "${name}" deleted.`);
    }
  };

  // New Job Trade & Country State
  const [newTradeName, setNewTradeName] = useState('');
  const [newCountryName, setNewCountryName] = useState('');

  // Local state for Global Settings Fields
  const [portalName, setPortalName] = useState(systemSettings.portalName || '');
  const [portalSubtitle, setPortalSubtitle] = useState(systemSettings.portalSubtitle || '');
  const [locationDetails, setLocationDetails] = useState(systemSettings.locationDetails || '');
  const [supportContact, setSupportContact] = useState(systemSettings.supportContact || '');
  const [supportHelpText, setSupportHelpText] = useState(systemSettings.supportHelpText || '');
  const [logoTextPrimary, setLogoTextPrimary] = useState(systemSettings.logoTextPrimary || '');
  const [logoTextSecondary, setLogoTextSecondary] = useState(systemSettings.logoTextSecondary || '');
  const [logoTextLocation, setLogoTextLocation] = useState(systemSettings.logoTextLocation || '');
  const [logoImageUrl, setLogoImageUrl] = useState(systemSettings.logoImageUrl || '');
  const [heroImageUrl, setHeroImageUrl] = useState(systemSettings.heroImageUrl || '');
  const [googleSheetCsvUrl, setGoogleSheetCsvUrl] = useState(systemSettings.googleSheetCsvUrl || '');
  const [geminiApiKey, setGeminiApiKey] = useState(systemSettings.geminiApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);

  // Keep local inputs in sync with global settings on initial mount
  React.useEffect(() => {
    setPortalName(systemSettings.portalName || '');
    setPortalSubtitle(systemSettings.portalSubtitle || '');
    setLocationDetails(systemSettings.locationDetails || '');
    setSupportContact(systemSettings.supportContact || '');
    setSupportHelpText(systemSettings.supportHelpText || '');
    setLogoTextPrimary(systemSettings.logoTextPrimary || '');
    setLogoTextSecondary(systemSettings.logoTextSecondary || '');
    setLogoTextLocation(systemSettings.logoTextLocation || '');
    setLogoImageUrl(systemSettings.logoImageUrl || '');
    setHeroImageUrl(systemSettings.heroImageUrl || '');
    setGoogleSheetCsvUrl(systemSettings.googleSheetCsvUrl || '');
    setGeminiApiKey(systemSettings.geminiApiKey || '');
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserUsername || !newUserPassword) {
      alert('Please fill out all fields including password.');
      return;
    }
    const newUser: StaffUser = {
      id: (systemUsers.length + 1).toString(),
      name: newUserName,
      username: newUserUsername.toLowerCase().trim(),
      role: newUserRole,
      password: newUserPassword,
      lastActive: 'Never',
      status: 'Active',
      avatarName: newUserAvatarName,
      photoUrl: newUserPhotoUrl
    };
    onUpdateSystemUsers([...systemUsers, newUser]);
    triggerToast(`Staff User "${newUserName}" added with role "${newUserRole}"`);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserPassword('');
    setNewUserAvatarName('🤵‍♂️ Male Officer');
    setNewUserPhotoUrl('');
  };

  const toggleUserStatus = (id: string) => {
    onUpdateSystemUsers(systemUsers.map(u => {
      if (u.id === id) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        triggerToast(`User "${u.name}" account is now ${nextStatus}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleAddTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName) return;
    if (systemSettings.customTrades.includes(newTradeName)) {
      alert('This job profile already exists!');
      return;
    }
    onUpdateSystemSettings({
      ...systemSettings,
      customTrades: [...systemSettings.customTrades, newTradeName]
    });
    triggerToast(`New Trade: "${newTradeName}" added successfully.`);
    setNewTradeName('');
  };

  const handleDeleteTrade = (tradeToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the trade "${tradeToDelete}"?`)) {
      onUpdateSystemSettings({
        ...systemSettings,
        customTrades: systemSettings.customTrades.filter(t => t !== tradeToDelete)
      });
      triggerToast(`Trade "${tradeToDelete}" deleted successfully.`);
    }
  };

  const handleAddCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName) return;
    if (systemSettings.customCountries.includes(newCountryName)) {
      alert('This country already exists!');
      return;
    }
    onUpdateSystemSettings({
      ...systemSettings,
      customCountries: [...systemSettings.customCountries, newCountryName]
    });
    triggerToast(`New Country: "${newCountryName}" added successfully.`);
    setNewCountryName('');
  };

  const handleDeleteCountry = (countryToDelete: string) => {
    if (window.confirm(`Are you sure you want to delete the country "${countryToDelete}"?`)) {
      onUpdateSystemSettings({
        ...systemSettings,
        customCountries: systemSettings.customCountries.filter(c => c !== countryToDelete)
      });
      triggerToast(`Country "${countryToDelete}" deleted successfully.`);
    }
  };

  const handleSaveGlobalSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSystemSettings({
      ...systemSettings,
      portalName,
      portalSubtitle,
      locationDetails,
      supportContact,
      supportHelpText,
      logoTextPrimary,
      logoTextSecondary,
      logoTextLocation,
      logoImageUrl,
      heroImageUrl,
      googleSheetCsvUrl,
      geminiApiKey
    });
  };

  const handleWipeDatabase = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to permanently clear all candidates files? This action CANNOT be undone!")) {
      onUpdateCandidatesList([]);
      localStorage.removeItem('JV_TECH_CRM_CANDIDATES');
      triggerToast("System Database cleared successfully. Clean registry initiated.");
    }
  };

  return (
    <div id="admin-panel-root" className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex items-center min-h-[180px]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80" 
            alt="Admin Controls"
            className="w-full h-full object-cover object-center opacity-15 mix-blend-overlay"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-brand-950" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Root Administrator console</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white">
            Secure Admin & Settings Dashboard
          </h1>
          <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
            Only authorized administrator roles can view this board. Yahan aap sub-agents accounts, database backups, custom job trades aur SMS automation switch configure kar sakte hain.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Rail */}
        <div className="lg:col-span-1 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-3 block mb-1">Control Sections</span>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Accounts</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'backup' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>System Data Backup</span>
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'jobs' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Trade Configurations</span>
          </button>

          <button
            onClick={() => setActiveTab('agency')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'agency' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Portal Parameters</span>
          </button>
        </div>

        {/* Content Board */}
        <div className="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm min-h-[400px]">
          
          {/* TAB 1: USERS ACCOUNTS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 font-display">Staff & Operator Accounts</h3>
                  <p className="text-xs text-slate-400">Manage login credentials and system access levels for the office team.</p>
                </div>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                  {systemUsers.length} Logins Registered
                </span>
              </div>

              {/* Add User form */}
              <form onSubmit={handleAddUser} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-500" />
                  <span>Register New Office Staff Login</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. Rajesh Kumar"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Username / ID</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. rajesh"
                      value={newUserUsername}
                      onChange={(e) => setNewUserUsername(e.target.value)}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Login Password</label>
                    <input
                      type="text"
                      required
                      placeholder="E.g. securePass123"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Permission Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700"
                    >
                      <option value="Staff">Staff (Ledger Restricted)</option>
                      <option value="Admin">Admin (Full Access & Ledger View)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">User Image (Avatar)</label>
                    <select
                      value={newUserAvatarName}
                      onChange={(e) => setNewUserAvatarName(e.target.value)}
                      className="w-full text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-semibold text-slate-700"
                    >
                      <option value="🤵‍♂️ Male Officer">🤵‍♂️ Male Officer</option>
                      <option value="👩‍💼 Female Officer">👩‍💼 Female Officer</option>
                      <option value="👨‍💻 Developer">👨‍💻 Developer</option>
                      <option value="👩‍💻 Female Admin">👩‍💻 Female Admin</option>
                      <option value="💼 Manager">💼 Manager</option>
                      <option value="👑 Executive">👑 Executive</option>
                      <option value="🛡️ Security">🛡️ Security</option>
                      <option value="⚡ Support Hero">⚡ Support Hero</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Upload Real Photo</label>
                    <div className="flex items-center gap-2">
                      <label className="flex flex-col items-center justify-center h-[38px] px-2 bg-white text-slate-700 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors w-full">
                        <span className="text-[10px] font-extrabold truncate max-w-[80px] text-center text-slate-500">
                          {newUserPhotoUrl ? '✓ Photo Selected' : '📁 Choose File'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                      {newUserPhotoUrl && (
                        <div className="flex items-center gap-1 shrink-0">
                          <img src={newUserPhotoUrl} alt="Preview" className="w-7 h-7 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setNewUserPhotoUrl('')}
                            className="text-[10px] font-extrabold text-rose-500 hover:bg-rose-50 p-1 rounded cursor-pointer"
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Create Account Login
                </button>
              </form>

              {/* User lists table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3">Staff Name</th>
                      <th className="p-3">Login Username</th>
                      <th className="p-3">Password</th>
                      <th className="p-3">Assigned Role</th>
                      <th className="p-3">Last Checked In</th>
                      <th className="p-3">Account Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {systemUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-base border border-slate-200 shadow-xs shrink-0 overflow-hidden">
                              {user.photoUrl ? (
                                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                user.avatarName ? (user.avatarName.split(' ')[0] || '🤵‍♂️') : '🤵‍♂️'
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 block">{user.name}</span>
                              {user.avatarName && (
                                <span className="text-[9px] text-slate-400 block font-semibold leading-none">{user.avatarName.substring(user.avatarName.indexOf(' ') + 1)}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600 font-semibold">{user.username}</td>
                        <td className="p-3 font-mono text-slate-500">{user.password || (user.role === 'Admin' ? 'admin123' : 'staff123')}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.role === 'Admin' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">{user.lastActive}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 ${
                            user.status === 'Active' ? 'text-emerald-600' : 'text-rose-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{user.status}</span>
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openIdCardGenerator(user)}
                              className="px-2 py-1 rounded-lg border border-indigo-250 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            >
                              <IdCard className="w-3 h-3" />
                              <span>ID Card</span>
                            </button>
                            <button
                              onClick={() => startEditUser(user)}
                              className="px-2 py-1 rounded-lg border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1 shadow-xs"
                            >
                              <Edit className="w-3 h-3 text-slate-500" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                user.status === 'Active' 
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200'
                              }`}
                            >
                              {user.status === 'Active' ? 'Suspend' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="px-2 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Floating Edit User Modal */}
              {editingUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-sm font-extrabold text-slate-800">Edit User Account</h4>
                      </div>
                      <button 
                        onClick={() => setEditingUser(null)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-sm"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleSaveEditUser} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Employee Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Login Username</label>
                        <input
                          type="text"
                          required
                          placeholder="Username"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Account Password</label>
                        <input
                          type="text"
                          required
                          placeholder="Password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none font-bold text-slate-700 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Portal Permission Role</label>
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none font-bold text-slate-700"
                        >
                          <option value="Staff">Staff (Ledger Restricted)</option>
                          <option value="Admin">Admin (Full Access & Ledger View)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">User Image (Avatar)</label>
                        <select
                          value={editAvatarName}
                          onChange={(e) => setEditAvatarName(e.target.value)}
                          className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-brand-500 outline-none font-bold text-slate-700"
                        >
                          <option value="🤵‍♂️ Male Officer">🤵‍♂️ Male Officer</option>
                          <option value="👩‍💼 Female Officer">👩‍💼 Female Officer</option>
                          <option value="👨‍💻 Developer">👨‍💻 Developer</option>
                          <option value="👩‍💻 Female Admin">👩‍💻 Female Admin</option>
                          <option value="💼 Manager">💼 Manager</option>
                          <option value="👑 Executive">👑 Executive</option>
                          <option value="🛡️ Security">🛡️ Security</option>
                          <option value="⚡ Support Hero">⚡ Support Hero</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Or Upload Custom Photo</label>
                        <div className="flex items-center gap-2">
                          <label className="flex flex-col items-center justify-center h-[38px] px-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors w-full">
                            <span className="text-[10px] font-extrabold truncate max-w-[150px] text-center text-slate-500">
                              {editUserPhotoUrl ? '✓ Custom Photo Selected' : '📁 Choose Photo File'}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, true)}
                              className="hidden"
                            />
                          </label>
                          {editUserPhotoUrl && (
                            <div className="flex items-center gap-1 shrink-0">
                              <img src={editUserPhotoUrl} alt="Preview" className="w-7 h-7 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => setEditUserPhotoUrl('')}
                                className="text-[10px] font-extrabold text-rose-500 hover:bg-rose-50 p-1 rounded cursor-pointer"
                                title="Remove photo"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingUser(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white hover:bg-brand-600 text-xs font-bold transition-all shadow-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Floating ID Card Generator Modal */}
              {selectedIdCardUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-slate-50 rounded-3xl p-6 max-w-5xl w-full border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-5">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <IdCard className="w-5 h-5 text-indigo-600" />
                        <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-tight font-display">JV Tech Staff ID Card Creator & Downloader</h4>
                      </div>
                      <button 
                        onClick={() => setSelectedIdCardUser(null)}
                        className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 2-Column layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: Editor Controls */}
                      <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-2xs">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">Customize ID Card Details</h5>
                        
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Full Name</label>
                          <input
                            type="text"
                            value={idCardName}
                            onChange={(e) => setIdCardName(e.target.value.toUpperCase())}
                            className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            placeholder="NAME"
                          />
                        </div>

                        {/* Designation */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Designation</label>
                          <input
                            type="text"
                            value={idCardDesignation}
                            onChange={(e) => setIdCardDesignation(e.target.value.toUpperCase())}
                            className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            placeholder="DESIGNATION"
                          />
                        </div>

                        {/* Mobile Number */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Mobile Number</label>
                          <input
                            type="text"
                            value={idCardMobile}
                            onChange={(e) => setIdCardMobile(e.target.value)}
                            className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-700"
                            placeholder="MOBILE NO."
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Email Address</label>
                          <input
                            type="text"
                            value={idCardEmail}
                            onChange={(e) => setIdCardEmail(e.target.value.toUpperCase())}
                            className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-mono font-bold text-slate-700"
                            placeholder="EMAIL"
                          />
                        </div>

                        {/* Address */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Address</label>
                          <input
                            type="text"
                            value={idCardAddress}
                            onChange={(e) => setIdCardAddress(e.target.value.toUpperCase())}
                            className="w-full text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            placeholder="ADDRESS"
                          />
                        </div>

                        {/* Photo Selection / File Upload */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">ID Card Photo (Real Photo)</label>
                          <div className="flex gap-2">
                            <label className="flex-1 flex flex-col items-center justify-center h-[38px] px-3 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                              <span className="text-[10px] font-black truncate max-w-[150px] text-center text-slate-500">
                                {idCardPhotoUrl ? '✓ Photo Uploaded' : '📁 Upload Photo File'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleIdCardPhotoUpload}
                                className="hidden"
                              />
                            </label>
                            {idCardPhotoUrl && (
                              <button
                                type="button"
                                onClick={() => setIdCardPhotoUrl('')}
                                className="px-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer transition-colors"
                              >
                                Clear Photo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Live Template Preview & Download */}
                      <div className="lg:col-span-7 flex flex-col items-center justify-center gap-6">
                        
                        {/* ID CARD CANVAS EXPORT container */}
                        <div className="overflow-x-auto w-full flex justify-center p-2">
                          <div 
                            ref={idCardRef} 
                            className="w-[640px] h-[400px] bg-[#ffffff] relative overflow-hidden flex flex-col justify-between p-0 shadow-lg border border-slate-300 select-none shrink-0"
                            style={{ minWidth: '640px', minHeight: '400px', maxWidth: '640px', maxHeight: '400px', width: '640px', height: '400px' }}
                          >
                            {/* Visual Diagonal Gray/Silver Texture Accents to prevent "khali khali" feeling */}
                            <div className="absolute inset-0 bg-slate-50/75 pointer-events-none" />
                            <div className="absolute top-[80px] left-[140px] w-[260px] h-[340px] bg-slate-200/45 rotate-[35deg] transform origin-top-left pointer-events-none border-r border-slate-300/30" />
                            <div className="absolute top-[160px] left-[40px] w-[200px] h-[300px] bg-slate-100/80 -rotate-[25deg] transform origin-top-left pointer-events-none border-l border-slate-300/20" />
                            <div className="absolute bottom-[-50px] left-[180px] w-[220px] h-[220px] bg-slate-200/40 rotate-[45deg] pointer-events-none border border-slate-300/20" />
                            <div className="absolute top-[120px] right-[20px] w-[140px] h-[140px] bg-slate-200/25 rotate-[20deg] pointer-events-none border border-slate-300/15" />
                            <div className="absolute top-[60px] left-[320px] w-[180px] h-[180px] bg-slate-100/50 rotate-[10deg] pointer-events-none border-r border-slate-300/25" />
                            <div className="absolute bottom-[40px] left-[20px] w-[150px] h-[150px] bg-slate-200/30 rotate-[60deg] pointer-events-none border-l border-slate-300/20" />

                            {/* Header Section */}
                            <div className="relative w-full h-[115px] shrink-0 bg-[#c67123] flex flex-col justify-between overflow-hidden">
                              {/* Slanted orange divider/border behind the dark section */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-[#df7a1a]"
                                style={{ width: '232px', clipPath: 'polygon(0 0, 100% 0, 83% 100%, 0% 100%)' }}
                              />
                              
                              {/* Dark angled background on the left */}
                              <div 
                                className="absolute top-0 left-0 h-full bg-[#141517]"
                                style={{ width: '224px', clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0% 100%)' }}
                              />
                              
                              {/* Logo Area inside dark block - with white contour outline */}
                              <div className="absolute left-7 top-1.5 z-10 w-[100px] h-[100px] flex items-center justify-center">
                                <Logo size="custom" showText={false} className="w-full h-full" />
                              </div>

                              {/* Header Title Text - Georgia Bold/Black, Centered on the Right Amber Space */}
                              <div className="absolute left-[235px] right-4 top-4 flex items-center justify-center h-[52px] z-10">
                                <h1 className="text-[25px] font-black text-[#141517] tracking-wider leading-[1.1] font-serif uppercase text-center" style={{ fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                                  JV TECH TEST & TRAINING CENTER
                                </h1>
                              </div>

                              {/* Slanted white address banner running across bottom of header */}
                              <div 
                                className="absolute bottom-0 right-0 left-0 h-[28px] bg-white border-y border-amber-600 flex items-center justify-end pr-6 z-10"
                              >
                                {/* Left end slant to perfectly mesh with dark header block */}
                                <div 
                                  className="absolute left-0 top-0 h-full bg-[#df7a1a]" 
                                  style={{ width: '224px', clipPath: 'polygon(0 0, 100% 0, 83% 100%, 0% 100%)' }}
                                />
                                <div 
                                  className="absolute left-0 top-0 h-full bg-[#141517]" 
                                  style={{ width: '216px', clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0% 100%)' }}
                                />
                                <p className="text-[10px] font-black text-[#141517] uppercase tracking-tight pl-[225px] select-all font-sans">
                                  Add. Near HP Petrol Pump Main Road Turkpatti, Kushinagar (U.P.) 274302
                                </p>
                              </div>
                            </div>

                            {/* Body Section */}
                            <div className="flex-1 px-8 py-4 flex justify-between items-start z-10 relative">
                              {/* Left: Details */}
                              <div className="space-y-4 max-w-[360px] pt-1">
                                <div className="inline-block border-b-2 border-[#df7a1a] pb-0.5">
                                  <h2 className="text-[23px] font-black text-slate-950 tracking-widest uppercase font-serif leading-none select-all" style={{ fontFamily: 'Georgia, serif', fontWeight: 900 }}>
                                    {idCardDesignation ? idCardDesignation.toUpperCase() : 'COMPUTER OPERATOR'}
                                  </h2>
                                </div>

                                <div className="space-y-3 text-slate-950 font-serif mt-4 pl-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                                  <div className="grid grid-cols-[75px_20px_1fr] items-center text-sm font-black uppercase tracking-wide">
                                    <span className="text-slate-950 text-[14.5px] font-black tracking-widest">NAME</span>
                                    <span className="text-slate-950 font-black text-[14.5px]">:</span>
                                    <span className="text-slate-950 text-[14.5px] font-black tracking-wider select-all">{(idCardName || 'RAKESH PATEL').toUpperCase()}</span>
                                  </div>
                                  <div className="grid grid-cols-[75px_20px_1fr] items-center text-sm font-black uppercase tracking-wide">
                                    <span className="text-slate-950 text-[14.5px] font-black tracking-widest">MO</span>
                                    <span className="text-slate-950 font-black text-[14.5px]">:</span>
                                    <span className="text-slate-950 font-mono text-[14.5px] font-black tracking-wider select-all">{idCardMobile || '7706087734'}</span>
                                  </div>
                                  <div className="grid grid-cols-[75px_20px_1fr] items-center text-sm font-black uppercase tracking-wide">
                                    <span className="text-slate-950 text-[14.5px] font-black tracking-widest">EMAIL</span>
                                    <span className="text-slate-950 font-black text-[14.5px]">:</span>
                                    <span className="text-[#141517] font-mono text-[13.5px] font-black tracking-normal uppercase select-all">{(idCardEmail || 'JVTECH71@GMAIL.COM').toUpperCase()}</span>
                                  </div>
                                  <div className="grid grid-cols-[75px_20px_1fr] items-start text-sm font-black uppercase tracking-wide">
                                    <span className="text-slate-950 text-[14.5px] font-black tracking-widest pt-0.5">ADD</span>
                                    <span className="text-slate-950 font-black text-[14.5px] pt-0.5">:</span>
                                    <span className="text-slate-950 text-[13.5px] font-black leading-tight tracking-wide select-all">{(idCardAddress || 'TURKPATTI, KUSHINAGAR').toUpperCase()}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right: User Photo with Thick Black Border */}
                              <div className="relative mt-2 shrink-0">
                                <div className="w-[145px] h-[175px] bg-slate-50 border-[4px] border-slate-950 shadow-md overflow-hidden flex items-center justify-center relative">
                                  {idCardPhotoUrl ? (
                                    <img 
                                      src={idCardPhotoUrl} 
                                      alt="ID Photo" 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300 bg-slate-100 w-full h-full">
                                      <span className="text-5xl">🤵‍♂️</span>
                                      <span className="text-[10px] text-slate-400 font-extrabold mt-2 uppercase tracking-wider">Upload Photo</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Bottom Decorative Section (Matching header style perfectly) */}
                            <div className="relative h-[42px] w-full bg-white shrink-0 overflow-hidden mt-auto border-t border-slate-200">
                              {/* Black bottom stripe */}
                              <div className="absolute bottom-0 left-0 right-0 h-[8px] bg-[#141517]" />
                              
                              {/* Orange bottom stripe running along bottom, slanting up on the right */}
                              <div 
                                className="absolute bottom-[8px] left-0 h-[26px] bg-[#df7a1a]"
                                style={{ width: '420px', clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}
                              />
                              
                              {/* Black slanted block on the bottom right */}
                              <div 
                                className="absolute bottom-[8px] right-0 h-[34px] bg-[#141517]"
                                style={{ width: '200px', clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}
                              />
                              
                              {/* Orange slanted accent on the far bottom right */}
                              <div 
                                className="absolute bottom-[8px] right-0 h-[22px] bg-[#df7a1a]"
                                style={{ width: '90px', clipPath: 'polygon(25% 0, 100% 0, 100% 100%, 0 100%)' }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4 w-full justify-center">
                          <button
                            type="button"
                            onClick={() => setSelectedIdCardUser(null)}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={downloadIdCardAsImage}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download ID Card (PNG)</span>
                          </button>
                        </div>

                        <div className="text-center max-w-md bg-slate-100 p-3.5 rounded-xl border border-slate-200">
                          <p className="text-[11px] text-slate-500 leading-normal font-medium">
                            💡 <strong>Tip:</strong> Is Card ko professional ID card print sheets ya plastic cards par standard dimensions me direct print kiya ja sakta hai.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM BACKUP & CLEAN UP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 font-display">Durable Database backup & Restore</h3>
                <p className="text-xs text-slate-400">Download files or import candidate registry dumps to ensure zero-loss operations.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Card */}
                <div className="border border-slate-150 p-5 rounded-2xl space-y-3 bg-slate-50/50">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-500 border border-brand-100">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Export Full CRM Database</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sabhi active, archived aur process-flow candidates ka standard backup code JSON format me local computer me download karein.
                  </p>
                  <button
                    onClick={onExportDatabase}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="border border-slate-150 p-5 rounded-2xl space-y-3 bg-slate-50/50">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Restore / Import JSON Dump</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pichli save ki gyi backup files ko select karke pure system details ko instant restore ya overwrite karein.
                  </p>
                  <label className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Backup File</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={onImportDatabase} 
                    />
                  </label>
                </div>
              </div>

              {/* Maintenance Area */}
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Registry Maintenance & System Wipe</span>
                </h4>
                <p className="text-xs text-rose-700 leading-relaxed">
                  Database wipe karne se aapke pure {candidates.length} candidates records delete ho jayenge. System restart default seed values me revert ho jayega. Wipe karne se pehle download dump check karle.
                </p>
                <button
                  onClick={handleWipeDatabase}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Wipe Candidates Registry Database</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TRADE & COUNTRY CONFIGS */}
          {activeTab === 'jobs' && (
            <div className="space-y-8">
              {/* Job Trades */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 font-display">Custom Job Trades Configuration</h3>
                  <p className="text-xs text-slate-400">Add or manage job profiles for visa demand and overseas selections.</p>
                </div>

                <form onSubmit={handleAddTrade} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="E.g. Safety Inspector, Mason, Cook..."
                    value={newTradeName}
                    onChange={(e) => setNewTradeName(e.target.value)}
                    className="flex-1 text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Add Job
                  </button>
                </form>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Recruitment Trades list</span>
                  <div className="flex flex-wrap gap-2">
                    {systemSettings.customTrades.map((t) => {
                      const count = candidates.filter(c => c.trade === t).length;
                      return (
                        <span 
                          key={t} 
                          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t}</span>
                          <span className="bg-slate-100 text-[10px] font-extrabold px-1.5 py-0.5 rounded text-slate-500">{count} active</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteTrade(t)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer ml-1"
                            title="Delete Trade"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Countries preference */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="pb-3">
                  <h3 className="text-sm font-extrabold text-slate-800 font-display">Custom Country Preferences</h3>
                  <p className="text-xs text-slate-400">Add or manage destinations available for candidate selection.</p>
                </div>

                <form onSubmit={handleAddCountry} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="E.g. Oman, Romania, Dubai..."
                    value={newCountryName}
                    onChange={(e) => setNewCountryName(e.target.value)}
                    className="flex-1 text-xs bg-white p-2.5 rounded-xl border border-slate-200 focus:ring-1 focus:ring-brand-500 outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Add Country
                  </button>
                </form>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Country List</span>
                  <div className="flex flex-wrap gap-2">
                    {systemSettings.customCountries.map((c) => {
                      const count = candidates.filter(cand => cand.country === c).length;
                      return (
                        <span 
                          key={c} 
                          className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm"
                        >
                          <Globe className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{c}</span>
                          <span className="bg-indigo-50 text-[10px] text-indigo-600 font-extrabold px-1.5 py-0.5 rounded">{count} active</span>
                          <button 
                            type="button" 
                            onClick={() => handleDeleteCountry(c)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer ml-1"
                            title="Delete Country"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AGENCY GLOBAL PARAMETERS & WEBSITE DESIGN CUSTOMIZATION */}
          {activeTab === 'agency' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 font-display">Portal Parameters & Website Customization</h3>
                <p className="text-xs text-slate-400">Configure global switches, center names, support help text, logos, and images.</p>
              </div>

              {/* Toggles section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Candidate Online Self-Registration</span>
                    <span className="text-[11px] text-slate-400">Turn off to lock manual registrations online.</span>
                  </div>
                  <button 
                    onClick={() => {
                      onUpdateSystemSettings({
                        ...systemSettings,
                        isRegistrationOpen: !systemSettings.isRegistrationOpen
                      });
                      triggerToast(`Self-Registration is now ${!systemSettings.isRegistrationOpen ? 'OPEN' : 'CLOSED'}`);
                    }}
                    className="text-slate-600 focus:outline-none cursor-pointer border-0 bg-transparent"
                  >
                    {systemSettings.isRegistrationOpen ? (
                      <ToggleRight className="w-10 h-10 text-brand-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">WhatsApp SMS Notification Alerts</span>
                    <span className="text-[11px] text-slate-400">Simulate background WhatsApp messages on promotion.</span>
                  </div>
                  <button 
                    onClick={() => {
                      onUpdateSystemSettings({
                        ...systemSettings,
                        isSmsAlertsActive: !systemSettings.isSmsAlertsActive
                      });
                      triggerToast(`WhatsApp notifications are now ${!systemSettings.isSmsAlertsActive ? 'ENABLED' : 'DISABLED'}`);
                    }}
                    className="text-slate-600 focus:outline-none cursor-pointer border-0 bg-transparent"
                  >
                    {systemSettings.isSmsAlertsActive ? (
                      <ToggleRight className="w-10 h-10 text-brand-500" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-300" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-800 block">System Backup Automation Frequency</span>
                <div className="flex gap-2">
                  {['Hourly', 'Daily Auto', 'Weekly Roll', 'Manual Backup Only'].map(freq => (
                    <button
                      key={freq}
                      onClick={() => {
                        onUpdateSystemSettings({
                          ...systemSettings,
                          backupFrequency: freq
                        });
                        triggerToast(`Backup frequency updated to ${freq}`);
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        systemSettings.backupFrequency === freq
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Branding and Texts form */}
              <form onSubmit={handleSaveGlobalSettings} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <Settings className="w-4 h-4 text-brand-500" />
                  <span>Customize Website Content & Visual Identity</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Portal Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Portal & Agency Name</label>
                    <input
                      type="text"
                      required
                      value={portalName}
                      onChange={(e) => setPortalName(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Portal Subtitle */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Portal Subtitle</label>
                    <input
                      type="text"
                      required
                      value={portalSubtitle}
                      onChange={(e) => setPortalSubtitle(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Location Details */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Location Details</label>
                    <input
                      type="text"
                      required
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Support Contact */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Support Contact Number</label>
                    <input
                      type="text"
                      required
                      value={supportContact}
                      onChange={(e) => setSupportContact(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                {/* Support Help text */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Support Notice Help Text (Hindi / English)</label>
                  <textarea
                    rows={2}
                    required
                    value={supportHelpText}
                    onChange={(e) => setSupportHelpText(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-medium leading-relaxed"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Logo Text Primary */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logo Text: Primary</label>
                    <input
                      type="text"
                      required
                      value={logoTextPrimary}
                      onChange={(e) => setLogoTextPrimary(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Logo Text Secondary */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logo Text: Secondary</label>
                    <input
                      type="text"
                      required
                      value={logoTextSecondary}
                      onChange={(e) => setLogoTextSecondary(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Logo Text Location */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Logo Text: Location tag</label>
                    <input
                      type="text"
                      required
                      value={logoTextLocation}
                      onChange={(e) => setLogoTextLocation(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                {/* Custom Logo Image URL (Optional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">Custom Logo Image URL (Optional - leave empty to use our vector logo)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste your logo .png/.jpg/.svg URL here"
                      value={logoImageUrl}
                      onChange={(e) => setLogoImageUrl(e.target.value)}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                    {logoImageUrl && (
                      <div className="w-12 h-10 border border-indigo-200 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                        <img src={logoImageUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).src = "https://placehold.co/100x100?text=Error" }} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">If you have a custom logo image hosted online (e.g., Postimg, Imgur, or your website), paste its direct image URL here to show it everywhere. Otherwise, leave it empty to show the vector mascot design.</span>
                </div>

                {/* Hero Banner Image URL */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Hero Banner Image URL (Website Wallpaper / Option change)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 p-3 rounded-xl focus:bg-white focus:border-brand-500 outline-none transition-all text-slate-800 font-semibold"
                    />
                    <div className="w-12 h-10 border border-slate-200 rounded-xl overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                      <img src={heroImageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=100&q=80" }} />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">Provide a standard image URL (e.g. Unsplash) representing international recruitment.</span>
                </div>

                {/* Gemini API Key Configuration Section */}
                <div className="p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/20 border border-amber-100/75 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </span>
                      <div>
                        <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Gemini AI API Key Configuration</h5>
                        <p className="text-[10px] text-slate-500">Enable client-side direct AI Autofill & Document Scanner features immediately.</p>
                      </div>
                    </div>
                    {systemSettings.geminiApiKey ? (
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                        🔑 Active & Saved
                      </span>
                    ) : (
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-1 rounded-full uppercase">
                        ⚠️ Not Configured
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                        <span>Enter Gemini API Key (Required for client-side extraction)</span>
                        <a 
                          href="https://aistudio.google.com/app/apikey" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] text-brand-600 hover:underline font-bold flex items-center gap-0.5"
                        >
                          Get Free Key here <span className="text-[8px]">↗</span>
                        </a>
                      </label>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showApiKey ? "text" : "password"}
                            placeholder="AIzaSy..."
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 p-3 pr-10 rounded-xl focus:border-amber-500 outline-none transition-all text-slate-800 font-mono tracking-wide shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-transparent border-0 p-0"
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedKey = geminiApiKey.trim();
                            onUpdateSystemSettings({
                              ...systemSettings,
                              geminiApiKey: trimmedKey
                            });
                            triggerToast("🔑 Gemini API Key saved and activated successfully! (Changes saved to Local Storage)");
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-0 shrink-0"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Key</span>
                        </button>
                      </div>

                      <span className="text-[10px] text-slate-500 block leading-relaxed">
                        Hindi instructions: Agar aap is app ko <strong>Netlify static deployment</strong> par run kar rhe hain, toh server calls <strong>404 Server Code</strong> error return karti hain kyunki static hosting par backend server nahi hota. Is problem ko solve karne ke liye, apna <strong>Gemini API Key</strong> yahan paste karke direct <strong>"Save Key"</strong> button par click karein. Isse browser direct Google servers se candidate profile details aur demand letter extract karega aur koi error nahi aayega!
                      </span>
                    </div>
                  </div>
                </div>

                {/* Google Forms Integration Section */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/50 to-brand-50/20 border border-indigo-100/75 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                      <FileSpreadsheet className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Google Form & Sheets Sync Integration</h5>
                      <p className="text-[10px] text-slate-400">Naye registrations ko Google Form aur dynamic Sheets data se link karein.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Google Sheet CSV Export Link */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 block flex items-center gap-1">
                        <span>Google Sheets CSV Link (For Automated Import)</span>
                        <span className="text-[9px] text-rose-500 font-bold">(Highly Recommended)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                        value={googleSheetCsvUrl}
                        onChange={(e) => setGoogleSheetCsvUrl(e.target.value)}
                        className="w-full text-xs bg-white border border-slate-200 p-3 rounded-xl focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                      />
                      <span className="text-[9px] text-slate-400 block">
                        Sheets me <strong className="text-slate-600">File &gt; Share &gt; Publish to web</strong> choose karein, fir format me <strong className="text-slate-600">CSV</strong> select karke link copy karein.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer border-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Website Layout & Changes</span>
                  </button>
                </div>
              </form>

              <div className="bg-emerald-50/50 border border-emerald-100/60 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800 block">Live Application Link Details</span>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    This website is dynamic! Custom titles: <strong>"{systemSettings.portalName}"</strong>, address details, and images updated in this admin panel are reflected immediately across candidate checkup portals and receipt pages in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
