import React, { useState, useEffect } from 'react';
import { Candidate, InterviewStatus, MedicalStatus, VisaStatus } from '../types';
import { X, Send, CheckCircle2, MessageSquare, ShieldAlert, Smartphone } from 'lucide-react';

interface MockWhatsAppModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export default function MockWhatsAppModal({ candidate, onClose }: MockWhatsAppModalProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Generate automated templates based on stage and status
  useEffect(() => {
    let template = '';
    const agencyName = 'JV Tech Test and Training Center';
    
    switch (candidate.stage) {
      case 1:
        if (candidate.stage1?.interviewStatus === InterviewStatus.Selected) {
          template = `*Selection Notice - ${agencyName}* 📢\n\nDear *${candidate.name}*,\n\nCongratulations! Aapko *${candidate.trade}* post ke liye *${candidate.country}* ka contract select kar liya gaya hai.\n\nAapka agla step *Medical Exam* hai. Kripya medical schedule ke liye office se contact karein.\n\nRegard,\nJV Tech Team`;
        } else if (candidate.stage1?.interviewStatus === InterviewStatus.Hold) {
          template = `*Status Update - ${agencyName}*\n\nDear *${candidate.name}*,\n\nAapka selection *${candidate.trade}* post ke liye abhi *Hold (Standby)* par rakha gaya hai. Client team se confirmation milte hi aapko inform kiya jayega.\n\nJV Tech Team`;
        } else {
          template = `*Interview Update - ${agencyName}*\n\nDear *${candidate.name}*,\n\nWe regret to inform you that your profile was not selected in the recent interview round for *${candidate.trade}*. Please stay in touch for future vacancies.\n\nJV Tech Team`;
        }
        break;

      case 2:
        if (candidate.stage2?.medicalStatus === MedicalStatus.ReportAwaiting) {
          template = `*Medical Report Status - ${agencyName}* 🏥\n\nDear *${candidate.name}*,\n\nAapka medical ho chuka hai aur reports abhi *Awaiting (Aane baaki)* hain. Report aate hi hum status update karenge.\n\nJV Tech Team`;
        } else if (candidate.stage2?.medicalStatus === MedicalStatus.Fit) {
          template = `*Medical Cleared - ${agencyName}* ✅\n\nDear *${candidate.name}*,\n\nCongratulations! Aapka Medical Report *FIT* aaya hai. Aap agle stage (Document Collection & PCC) ke liye eligible hain. Kripya bache hue documents submit karein.\n\nJV Tech Team`;
        } else if (candidate.stage2?.medicalStatus === MedicalStatus.Unfit) {
          template = `*Medical Report - ${agencyName}* ⚠️\n\nDear *${candidate.name}*,\n\nAapka Medical Report status *UNFIT* mila hai. Kripya guidelines aur agle steps ke liye office visit karein.\n\nJV Tech Team`;
        } else {
          template = `*Medical Appointment - ${agencyName}* 🏥\n\nDear *${candidate.name}*,\n\nAapka selection confirm ho chuka hai. Kripya apna medical karwane ke liye clinic appointment confirm karein.\n\nJV Tech Team`;
        }
        break;

      case 3:
        template = `*Documents Checklist - ${agencyName}* 📁\n\nDear *${candidate.name}*,\n\nAapki file process ho rahi hai. Kripya check karein ki aapke ye documents humare paas jama hain:\n- Passport Scan & Photo\n- Experience Certificate\n- Medical Fit report\n- PCC (Police Clearance Certificate)\n\nAgar koi document bacha ho toh WhatsApp par bhej dein.\n\nJV Tech Team`;
        break;

      case 4:
        if (candidate.stage4?.visaStatus === VisaStatus.Applied) {
          template = `*Visa Process Update - ${agencyName}* ✈️\n\nDear *${candidate.name}*,\n\nAapka Visa application *${candidate.country}* Embassy me apply ho gaya hai. Visa status check hone me 1-2 weeks lagenge. Shanti banaye rakhein.\n\nJV Tech Team`;
        } else if (candidate.stage4?.visaStatus === VisaStatus.Received) {
          template = `*Visa Received Announcement! - ${agencyName}* 🎉\n\nDear *${candidate.name}*,\n\nGreat News! Aapka visa successfully *RECEIVED / STAMPED* ho chuka hai. Kripya ticket booking aur ledger payment settlement ke liye office contact karein.\n\nJV Tech Team`;
        } else {
          template = `*Visa Application Notice - ${agencyName}*\n\nDear *${candidate.name}*,\n\nAapke documents verify ho chuke hain. Hum visa application file taiyar kar rahe hain.\n\nJV Tech Team`;
        }
        break;

      case 5:
        const balance = candidate.stage5?.balanceAmount || 0;
        if (balance > 0) {
          template = `*Ledger Balance Clear Notice - ${agencyName}* 💳\n\nDear *${candidate.name}*,\n\nAapka Visa aa chuka hai aur ticket flight process ho rahi hai.\n\nAapka pending balance: *₹${balance.toLocaleString('en-IN')}* hai. Kripya is balance ko clear karein taaki hum flight ticket issue kar sakein.\n\nJV Tech Team`;
        } else {
          template = `*Accounts Cleared - ${agencyName}* ✅\n\nDear *${candidate.name}*,\n\nAapka accounts ledger full clearance ho chuka hai. Balance: ₹0. Hum ticket book kar rahe hain aur flight timings jald share karenge.\n\nJV Tech Team`;
        }
        break;

      case 6:
        if (candidate.stage6?.flightDate) {
          template = `*Flight Ticket & Deployment - ${agencyName}* ✈️🎫\n\nDear *${candidate.name}*,\n\nAapki flight confirm ho gayi hai!\n\n- *Airline:* ${candidate.stage6.airlineName || 'N/A'}\n- *Flight Date:* ${candidate.stage6.flightDate}\n- *Time:* ${candidate.stage6.flightTime || 'N/A'}\n- *PNR:* ${candidate.stage6.pnrNumber || 'N/A'}\n\nSafe Journey! JV Tech Center aapke acche bhavishya ki kamna karta hai.\n\nRegards,\nJV Tech Test & Training`;
        } else {
          template = `*Flight Ticket Process - ${agencyName}* ✈️\n\nDear *${candidate.name}*,\n\nAapka payment aur visa clear ho gaya hai. Ticket flight schedule book ho raha hai, updates jald hi share kiye jayenge.\n\nJV Tech Team`;
        }
        break;

      default:
        template = `Dear ${candidate.name}, updates regarding your file with JV Tech Test and Training Center will be shared soon.`;
    }

    setMessage(template);
  }, [candidate]);

  const handleSendSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate API delay
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
    }, 1500);
  };

  return (
    <div id="whatsapp-modal-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="whatsapp-modal-body" 
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] transition-all transform scale-100"
      >
        {/* Modal Header */}
        <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight font-display">WhatsApp Status Update</h3>
              <p className="text-xs text-emerald-100">Direct Notification Builder</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-emerald-700 flex items-center justify-center transition-colors text-white outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {sentSuccess ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-slate-800">WhatsApp Message Sent!</h4>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Aapka customized message candidate ke mobile number <strong className="text-emerald-600">{candidate.phone}</strong> par simulate ho chuka hai.
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-800 text-xs py-2 px-3 rounded-xl max-w-sm mx-auto font-medium">
                🔔 API Log: Simulated HTTP Webhook Triggered successfully.
              </div>
              <button
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendSimulation} className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 font-semibold block">RECIPIENT CONTACT</span>
                  <p className="font-bold text-slate-700">
                    {candidate.name} ({candidate.phone})
                  </p>
                  <span className="text-slate-400">Current Stage: </span>
                  <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                    Stage {candidate.stage}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Customized Message Template</label>
                <div className="relative">
                  <textarea
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-sm p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm outline-none resize-none bg-slate-50/50 hover:bg-white focus:bg-white transition-all text-slate-700"
                    placeholder="Enter customized message..."
                    required
                  />
                  <div className="absolute bottom-3 right-3 text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded font-bold font-mono">
                    Markdown (*Bold*) Support
                  </div>
                </div>
              </div>

              {/* Warning/Guide */}
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 leading-normal">
                  <strong>Sandbox Simulation:</strong> Yeh feature candidate communication streamline karne ke liye test-mode me hai. Send par click karne se message log success verify hoga. Live production API connect karne ke liye Twilio/WhatsApp Cloud API keys set karein.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-2xl text-xs transition-all outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-md hover:shadow-emerald-500/10 flex items-center justify-center gap-1.5 outline-none disabled:opacity-50"
                >
                  {isSending ? (
                    <span>Sending Simulation...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send WhatsApp</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
