import { Candidate, InterviewStatus, MedicalStatus, VisaStatus } from './types';

export const TRADES_LIST = [
  'Electrician',
  'Industrial Welder',
  'Pipe Fitter',
  'Plumber',
  'Mason',
  'Heavy Driver',
  'HVAC Technician',
  'Scaffolder',
  'General Helper',
];

export const COUNTRIES_LIST = [
  'Saudi Arabia',
  'United Arab Emirates',
  'Qatar',
  'Oman',
  'Kuwait',
  'Bahrain',
];

export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'CAND-001',
    name: 'Rajesh Kumar',
    passportNumber: 'Z8765432',
    phone: '+91 98765 43210',
    trade: 'Electrician',
    country: 'United Arab Emirates',
    companyName: 'Al-Marai Contracting Ltd',
    createdDate: '2026-06-25',
    stage: 1,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: 'Excellent electrical panel wiring skills. Ready for medical.',
    },
    stage2: {
      medicalStatus: MedicalStatus.Pending,
    },
    stage3: {
      documents: {
        passportScan: false,
        photo: false,
        experienceCertificate: false,
        medicalReport: false,
        pcc: false,
      },
      uploadedDocs: [],
    },
    stage4: {
      visaStatus: VisaStatus.Pending,
    },
    stage5: {
      totalDealAmount: 65000,
      advanceReceived: 10000,
      balanceAmount: 55000,
      paymentHistory: [
        {
          id: 'PMT-001',
          amount: 10000,
          date: '2026-06-25',
          mode: 'Cash',
          reference: 'Interview advance',
        }
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-002',
    name: 'Mohammad Tariq',
    passportNumber: 'P1234567',
    phone: '+91 87654 32109',
    trade: 'Industrial Welder',
    country: 'Saudi Arabia',
    companyName: 'Al-Marai Contracting Ltd',
    createdDate: '2026-06-20',
    stage: 2,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: '6G welder certificate holder. Highly experienced.',
    },
    stage2: {
      medicalDate: '2026-06-24',
      medicalStatus: MedicalStatus.ReportAwaiting,
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: false,
        pcc: false,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_tariq.pdf', uploadedAt: '2026-06-20 14:30' },
        { key: 'photo', name: 'photo_tariq.jpg', uploadedAt: '2026-06-20 14:32' },
        { key: 'experienceCertificate', name: 'exp_welder_6g.pdf', uploadedAt: '2026-06-21 11:15' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Pending,
    },
    stage5: {
      totalDealAmount: 75000,
      advanceReceived: 15000,
      balanceAmount: 60000,
      paymentHistory: [
        {
          id: 'PMT-002',
          amount: 15000,
          date: '2026-06-20',
          mode: 'Online',
          reference: 'GPay - Tariq',
        }
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-003',
    name: 'Vikram Singh',
    passportNumber: 'K4567890',
    phone: '+91 76543 21098',
    trade: 'Plumber',
    country: 'Qatar',
    companyName: 'Bin-Ladin Group',
    createdDate: '2026-06-15',
    stage: 3,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: 'Selected in client interview for Doha Metro project.',
    },
    stage2: {
      medicalDate: '2026-06-18',
      medicalStatus: MedicalStatus.Fit,
      medicalReportName: 'medical_fit_vikram.pdf',
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: true,
        pcc: true,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_vikram.pdf', uploadedAt: '2026-06-15' },
        { key: 'photo', name: 'photo_vikram.jpg', uploadedAt: '2026-06-15' },
        { key: 'experienceCertificate', name: 'plumber_exp.pdf', uploadedAt: '2026-06-15' },
        { key: 'medicalReport', name: 'medical_fit_vikram.pdf', uploadedAt: '2026-06-19' },
        { key: 'pcc', name: 'pcc_vikram.pdf', uploadedAt: '2026-06-22' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Pending,
    },
    stage5: {
      totalDealAmount: 70000,
      advanceReceived: 35000,
      balanceAmount: 35000,
      paymentHistory: [
        { id: 'PMT-003', amount: 15000, date: '2026-06-15', mode: 'Cash', reference: 'Registration' },
        { id: 'PMT-004', amount: 20000, date: '2026-06-19', mode: 'Online', reference: 'Medical fit advance' },
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-004',
    name: 'Amit Sharma',
    passportNumber: 'S3456789',
    phone: '+91 99988 77766',
    trade: 'Heavy Driver',
    country: 'Oman',
    createdDate: '2026-06-10',
    stage: 4,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: 'Gulf License holder. Speaks basic Arabic. Excellent candidate.',
    },
    stage2: {
      medicalDate: '2026-06-13',
      medicalStatus: MedicalStatus.Fit,
      medicalReportName: 'sharma_med_fit.pdf',
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: true,
        pcc: true,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_amit.pdf', uploadedAt: '2026-06-10' },
        { key: 'photo', name: 'photo_amit.jpg', uploadedAt: '2026-06-10' },
        { key: 'experienceCertificate', name: 'gulf_license.pdf', uploadedAt: '2026-06-10' },
        { key: 'medicalReport', name: 'sharma_med_fit.pdf', uploadedAt: '2026-06-14' },
        { key: 'pcc', name: 'pcc_amit.pdf', uploadedAt: '2026-06-15' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Applied,
    },
    stage5: {
      totalDealAmount: 85000,
      advanceReceived: 45000,
      balanceAmount: 40000,
      paymentHistory: [
        { id: 'PMT-005', amount: 20000, date: '2026-06-10', mode: 'Online', reference: 'GPay' },
        { id: 'PMT-006', amount: 25000, date: '2026-06-15', mode: 'Cash', reference: 'Doc collection receipt' },
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-005',
    name: 'Gurpreet Singh',
    passportNumber: 'T9812345',
    phone: '+91 91122 33445',
    trade: 'HVAC Technician',
    country: 'Kuwait',
    createdDate: '2026-06-05',
    stage: 5,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: '10 years experience in Central AC units.',
    },
    stage2: {
      medicalDate: '2026-06-08',
      medicalStatus: MedicalStatus.Fit,
      medicalReportName: 'gurpreet_medical.pdf',
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: true,
        pcc: true,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_gurpreet.pdf', uploadedAt: '2026-06-05' },
        { key: 'photo', name: 'photo_gurpreet.jpg', uploadedAt: '2026-06-05' },
        { key: 'experienceCertificate', name: 'iti_hvac_cert.pdf', uploadedAt: '2026-06-05' },
        { key: 'medicalReport', name: 'gurpreet_medical.pdf', uploadedAt: '2026-06-09' },
        { key: 'pcc', name: 'pcc_gurpreet.pdf', uploadedAt: '2026-06-11' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Received,
      visaCopyName: 'kuwait_visa_gurpreet.pdf',
      visaExpiryDate: '2026-09-15',
    },
    stage5: {
      totalDealAmount: 90000,
      advanceReceived: 80000,
      balanceAmount: 10000,
      paymentHistory: [
        { id: 'PMT-007', amount: 20000, date: '2026-06-05', mode: 'Online', reference: 'Registration' },
        { id: 'PMT-008', amount: 30000, date: '2026-06-09', mode: 'Cash', reference: 'Med fit payment' },
        { id: 'PMT-009', amount: 30000, date: '2026-06-18', mode: 'Online', reference: 'Visa stamped GPay' },
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-006',
    name: 'Sukhvinder Pal',
    passportNumber: 'F7896543',
    phone: '+91 88877 66554',
    trade: 'Pipe Fitter',
    country: 'Oman',
    createdDate: '2026-05-20',
    stage: 6,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: 'Experienced in industrial refinery pipe networks.',
    },
    stage2: {
      medicalDate: '2026-05-24',
      medicalStatus: MedicalStatus.Fit,
      medicalReportName: 'medical_fit_sukhvinder.pdf',
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: true,
        pcc: true,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_sukhvinder.pdf', uploadedAt: '2026-05-20' },
        { key: 'photo', name: 'photo_sukhvinder.jpg', uploadedAt: '2026-05-20' },
        { key: 'experienceCertificate', name: 'refinery_exp.pdf', uploadedAt: '2026-05-20' },
        { key: 'medicalReport', name: 'medical_fit_sukhvinder.pdf', uploadedAt: '2026-05-25' },
        { key: 'pcc', name: 'pcc_sukhvinder.pdf', uploadedAt: '2026-05-27' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Received,
      visaCopyName: 'oman_stamped_visa.pdf',
      visaExpiryDate: '2026-08-20',
    },
    stage5: {
      totalDealAmount: 80000,
      advanceReceived: 80000,
      balanceAmount: 0,
      paymentHistory: [
        { id: 'PMT-010', amount: 20000, date: '2026-05-20', mode: 'Cash', reference: 'Advance' },
        { id: 'PMT-011', amount: 30000, date: '2026-05-26', mode: 'Online', reference: 'Medical clearance' },
        { id: 'PMT-012', amount: 30000, date: '2026-06-15', mode: 'Online', reference: 'Full clearance payment' },
      ],
    },
    stage6: {
      flightTicketName: 'oman_air_ticket.pdf',
      flightDate: '2026-06-30',
      flightTime: '14:30',
      pnrNumber: 'WY819230',
      airlineName: 'Oman Air',
    },
  },
  {
    id: 'CAND-007',
    name: 'Dinesh Prasad',
    passportNumber: 'X1122334',
    phone: '+91 66655 44433',
    trade: 'General Helper',
    country: 'United Arab Emirates',
    createdDate: '2026-06-26',
    stage: 1,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Rejected,
      comments: 'Failed to pass basic English communication assessment during the client round.',
    },
    stage2: {
      medicalStatus: MedicalStatus.Pending,
    },
    stage3: {
      documents: {
        passportScan: false,
        photo: false,
        experienceCertificate: false,
        medicalReport: false,
        pcc: false,
      },
      uploadedDocs: [],
    },
    stage4: {
      visaStatus: VisaStatus.Pending,
    },
    stage5: {
      totalDealAmount: 50000,
      advanceReceived: 0,
      balanceAmount: 50000,
      paymentHistory: [],
    },
    stage6: {},
  },
  {
    id: 'CAND-008',
    name: 'Jaspal Singh',
    passportNumber: 'N4455667',
    phone: '+91 78945 61230',
    trade: 'Industrial Welder',
    country: 'Qatar',
    createdDate: '2026-06-26',
    stage: 1,
    isArchived: false,
    stage1: {
      interviewStatus: InterviewStatus.Hold,
      comments: 'Slightly slow in structural welding test. Put on standby list.',
    },
    stage2: {
      medicalStatus: MedicalStatus.Pending,
    },
    stage3: {
      documents: {
        passportScan: false,
        photo: false,
        experienceCertificate: false,
        medicalReport: false,
        pcc: false,
      },
      uploadedDocs: [],
    },
    stage4: {
      visaStatus: VisaStatus.Pending,
    },
    stage5: {
      totalDealAmount: 70000,
      advanceReceived: 2000,
      balanceAmount: 68000,
      paymentHistory: [
        { id: 'PMT-013', amount: 2000, date: '2026-06-26', mode: 'Cash', reference: 'Gate pass and registration fee' }
      ],
    },
    stage6: {},
  },
  {
    id: 'CAND-009',
    name: 'Karan Mehra',
    passportNumber: 'J9012345',
    phone: '+91 95432 10987',
    trade: 'Mason',
    country: 'Saudi Arabia',
    createdDate: '2026-05-10',
    stage: 6,
    isArchived: true, // Successfully Deployed and archived!
    stage1: {
      interviewStatus: InterviewStatus.Selected,
      comments: 'Tiles and marble specialist.',
    },
    stage2: {
      medicalDate: '2026-05-14',
      medicalStatus: MedicalStatus.Fit,
      medicalReportName: 'medical_fit_karan.pdf',
    },
    stage3: {
      documents: {
        passportScan: true,
        photo: true,
        experienceCertificate: true,
        medicalReport: true,
        pcc: true,
      },
      uploadedDocs: [
        { key: 'passportScan', name: 'passport_karan.pdf', uploadedAt: '2026-05-10' },
        { key: 'photo', name: 'photo_karan.jpg', uploadedAt: '2026-05-10' },
        { key: 'medicalReport', name: 'medical_fit_karan.pdf', uploadedAt: '2026-05-15' },
        { key: 'pcc', name: 'pcc_karan.pdf', uploadedAt: '2026-05-18' },
      ],
    },
    stage4: {
      visaStatus: VisaStatus.Received,
      visaCopyName: 'ksa_visa_karan.pdf',
      visaExpiryDate: '2026-08-10',
    },
    stage5: {
      totalDealAmount: 60000,
      advanceReceived: 60000,
      balanceAmount: 0,
      paymentHistory: [
        { id: 'PMT-014', amount: 15000, date: '2026-05-10', mode: 'Cash', reference: 'Registration' },
        { id: 'PMT-015', amount: 45000, date: '2026-05-20', mode: 'Online', reference: 'Visa/Flight full settlement' },
      ],
    },
    stage6: {
      flightTicketName: 'air_india_ix123.pdf',
      flightDate: '2026-06-20',
      flightTime: '08:45',
      pnrNumber: 'AI982130',
      airlineName: 'Air India Express',
      deployedDate: '2026-06-20',
    },
  },
];
