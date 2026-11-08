import React from 'react';
import { X, Printer, ShieldCheck, Download, FileText, CheckCircle2 } from 'lucide-react';

export interface AgreementPartnerDetails {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  year?: number | string;
  transmission?: string;
  category?: string;
  color?: string;
  plateNumber?: string;
  chassisVin?: string;
  engineNumber?: string;
  gpsBrandImei?: string;
  insurancePolicy?: string;
  partnerSharePercent?: number | string;
  custoworksFeePercent?: number | string;
}

interface TieUpAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerDetails?: AgreementPartnerDetails;
}

export const TieUpAgreementModal: React.FC<TieUpAgreementModalProps> = ({
  isOpen,
  onClose,
  partnerDetails,
}) => {
  if (!isOpen) return null;

  const partnerName = partnerDetails?.fullName || '________________________________________';
  const partnerCity = partnerDetails?.city || 'Naga City, Camarines Sur';
  const partnerPhone = partnerDetails?.phone || '____________________';

  const makeModel = partnerDetails?.vehicleMake && partnerDetails?.vehicleModel
    ? `${partnerDetails.vehicleMake} ${partnerDetails.vehicleModel}`
    : '[e.g., Toyota Vios / Innova / Mirage G4]';
  const yearModel = partnerDetails?.year ? String(partnerDetails.year) : '[2024 / 2025 / 2026]';
  const plateNumber = partnerDetails?.plateNumber || '[Plate or Conduction No.]';
  const colorTrans = `${partnerDetails?.color || 'Color'} / ${partnerDetails?.transmission === 'MT' ? 'Manual (MT)' : 'Automatic (AT)'}`;
  const chassisVin = partnerDetails?.chassisVin || '[Chassis / VIN Number]';
  const engineNumber = partnerDetails?.engineNumber || '[Engine Number]';
  const gpsDevice = partnerDetails?.gpsBrandImei || '[Active 24/7 Installed GPS Tracker & IMEI]';
  const insurancePolicy = partnerDetails?.insurancePolicy || '[Comprehensive Insurer & Policy No.]';

  const partnerShare = partnerDetails?.partnerSharePercent ? `${partnerDetails.partnerSharePercent}%` : '80%';
  const operatorShare = partnerDetails?.custoworksFeePercent ? `${partnerDetails.custoworksFeePercent}%` : '20%';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Header (Hidden in Print) */}
        <div className="bg-brand-navy px-6 py-4 text-white flex justify-between items-center print:hidden border-b border-blue-900/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
              Vehicle Consignment & Tie-Up Agreement Terms
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div className="p-6 sm:p-10 overflow-y-auto font-serif text-slate-800 text-[13px] leading-relaxed space-y-6 print:p-0 print:overflow-visible print:text-black">
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5">
            <div className="flex justify-center items-center gap-2 mb-1">
              <span className="font-black text-xl tracking-wider text-slate-950 font-sans">CUSTOWORKS CAR RENTAL</span>
            </div>
            <h1 className="font-black text-lg sm:text-xl uppercase tracking-wider text-slate-950 mt-1">
              VEHICLE CONSIGNMENT & TIE-UP AGREEMENT
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600 font-sans mt-0.5">
              FLEET PARTNER OPERATIONS & COLLISION LIABILITY TERMS
            </p>
          </div>

          {/* Preamble */}
          <p className="text-justify indent-8">
            This Vehicle Fleet Consignment and Tie-Up Agreement (the <strong>"Agreement"</strong>) is entered into this{' '}
            <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u> day of{' '}
            <u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>, 20____, by and between:
          </p>

          <p className="text-justify">
            <strong>CUSTOWORKS CAR RENTAL</strong>, an authorized car rental enterprise with office address at{' '}
            <u>Carnation St. CBD II, Brgy. Triangulo (Beside SM), Naga City, Camarines Sur, Philippines</u> (hereinafter referred to as the <strong>"OPERATOR"</strong>);
          </p>

          <p className="text-center font-bold text-xs">and</p>

          <p className="text-justify">
            <strong>{partnerName}</strong>, of legal age, residing at <u>{partnerCity}</u> with contact number{' '}
            <u>{partnerPhone}</u> (hereinafter referred to as the <strong>"PARTNER"</strong>).
          </p>

          {/* Schedule A Table */}
          <div className="pt-2">
            <div className="bg-slate-900 text-white font-sans font-bold text-xs px-3.5 py-1.5 uppercase tracking-wider rounded-t-lg print:bg-slate-800">
              SCHEDULE A: PARTNER UNIT & REGISTRATION DETAILS
            </div>
            <div className="border border-slate-300 rounded-b-lg overflow-hidden font-sans text-xs">
              <div className="grid grid-cols-2 divide-x divide-y divide-slate-200">
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Make & Model:</span>
                  <strong className="text-slate-900">{makeModel}</strong>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Year Model:</span>
                  <strong className="text-slate-900">{yearModel}</strong>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Plate / CS Number:</span>
                  <strong className="text-slate-900">{plateNumber}</strong>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Color / Transmission:</span>
                  <strong className="text-slate-900">{colorTrans}</strong>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Chassis / VIN:</span>
                  <span className="text-slate-800">{chassisVin}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Engine Number:</span>
                  <span className="text-slate-800">{engineNumber}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">GPS Device Brand & IMEI:</span>
                  <span className="text-slate-800">{gpsDevice}</span>
                </div>
                <div className="p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Insurance Policy No.:</span>
                  <span className="text-slate-800">{insurancePolicy}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 1: UNIT ELIGIBILITY & TRACKING PRE-REQUISITES
            </h3>
            <p className="text-justify">
              <strong>1.1 Model Year Qualification:</strong> The PARTNER certifies that the enrolled vehicle is model year 2024 or newer (or clean 2023+ with verified CASA records), in pristine mechanical condition, free from structural chassis damage, and holds valid and updated LTO Registration (OR/CR).
            </p>
            <p className="text-justify">
              <strong>1.2 Mandatory Real-Time GPS Tracking:</strong> Installation of an active, 24/7 operating GPS tracking device with remote engine shut-off capability is strictly mandatory. The PARTNER must provide the OPERATOR administrative or sub-account monitoring access to the vehicle's tracking application prior to initial deployment. If the GPS tracker goes offline or malfunctions, the unit shall immediately be paused from rental dispatch until fully restored.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 2: DISPATCH COORDINATION & PARTNER GROUP CHAT PROTOCOL
            </h3>
            <p className="text-justify">
              <strong>2.1 Official Dispatch Channel:</strong> All dispatch notices, availability calls, customer bookings, rental schedules, and vehicle check-out/check-in logs shall be administered via the official <strong>Custoworks Partner Dispatch Group Chat (GC)</strong>. Verbal or undocumented side bookings outside the official channel are strictly prohibited.
            </p>
            <p className="text-justify">
              <strong>2.2 Client Verification & Renter Screening:</strong> The OPERATOR agrees to enforce strict client vetting protocols before releasing any partner unit, including: (a) physical verification of at least two (2) valid government-issued IDs, (b) proof of billing / employment or residential verification, (c) signed Master Rental Contract, and (d) mandatory security cash deposit.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 3: REVENUE SHARING & REMITTANCE STRUCTURE
            </h3>
            <p className="text-justify">
              <strong>3.1 Rental Rates and Split:</strong> Vehicle rental fees shall adhere to the agreed standard fleet rate card. Net rental proceeds shall be apportioned as agreed: <strong>{partnerShare} to the PARTNER</strong> and <strong>{operatorShare} to the OPERATOR</strong> (as administrative, dispatch, and marketing fee).
            </p>
            <p className="text-justify">
              <strong>3.2 Remittance Schedule:</strong> All partner shares shall be remitted via bank transfer or GCash within <strong>3 business days</strong> following the successful completion of each rental booking and vehicle return inspection.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 4: COLLISION, ACCIDENT, AND DAMAGE TERMS ("KUNG NABANGGA ANG SASAKYAN")
            </h3>
            <p className="text-justify">
              In the event of any vehicular accident, body damage, scratch, dent, glass breakage, or collision occurring while the unit is deployed under an active rental contract, the following terms shall strictly govern:
            </p>

            <div className="bg-slate-50 border-l-4 border-slate-800 p-3 my-2 text-xs italic">
              <strong>Primary Principle of Liability:</strong> Custoworks Car Rental ensures that the vehicle owner shall not personally bear the cost of collision repairs caused by verified rental clients. All active renters execute a legally binding contract with liability for damages, repair downtime, and insurance deductibles.
            </div>

            <p className="text-justify">
              <strong>Custoworks Non-Liability & Agency Role:</strong> CUSTOWORKS CAR RENTAL operates strictly as a fleet marketing, booking facilitator, and dispatch coordinator. CUSTOWORKS SHALL NOT BE FINANCIALLY LIABLE FOR ANY REPAIR EXPENSES, INSURANCE PARTICIPATION DEFICITS, BODILY INJURIES, OR MECHANICAL REPAIRS. All vehicular damages and collisions shall be claimed strictly through the vehicle's Comprehensive Insurance policy and/or directly against the responsible renter.
            </p>
            <p className="text-justify">
              <strong>4.1 Mandatory Comprehensive Insurance Claim:</strong><br />
              • <em>Primary Recourse:</em> All collision and major accidental damages must be processed directly under the PARTNER unit's existing Comprehensive Insurance Policy. The PARTNER must keep the policy active, updated, and enforceable at all times.<br />
              • <em>Insurance Participation / Deductible:</em> The renter who rented the vehicle during the incident shall be held contractually liable to pay the full insurance participation / deductible fee. Under no circumstance shall CUSTOWORKS CAR RENTAL advance or shoulder this fee.<br />
              • <em>Assistance in Claim Filing:</em> The OPERATOR shall assist the PARTNER by providing the renter's identification documents, signed rental agreement, accident photographs, and coordinating the collection of the official Police Report.
            </p>
            <p className="text-justify">
              <strong>4.2 No Daily Rental Remittance During Downtime ("Walang Daily Income Kapag Nakatambay Dahil sa Bangga"):</strong> While the vehicle is undergoing insurance appraisal, parts procurement, body repair, paint restoration, or sitting inactive in the auto shop or dealership (Casa), <strong>NO DAILY RENTAL FEE OR DOWNTIME EARNINGS SHALL BE CHARGED TO OR PAID OUT BY CUSTOWORKS CAR RENTAL TO THE PARTNER</strong>. Revenue sharing applies only to days when the unit is actively mobilized and rented by a paying customer.
            </p>
            <p className="text-justify">
              <strong>4.3 Minor Damages Below Insurance Participation:</strong> For minor scratches, scrapes, or dents that do not meet or warrant an insurance claim, repair expenses shall be deducted directly from the responsible Renter's security deposit. If the cost exceeds the deposit, the OPERATOR will actively pursue the renter for reimbursement on the PARTNER's behalf, but CUSTOWORKS shall not advance corporate funds for said repairs.
            </p>
            <p className="text-justify">
              <strong>4.4 Immediate Accident Reporting & Documentation:</strong> In any collision, an official Police Report and comprehensive photographic/video documentation are required within twenty-four (24) hours. The unit must undergo an immediate damage appraisal to initiate insurance proceedings without delay.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 5: ROUTINE MAINTENANCE VS. WEAR & TEAR
            </h3>
            <p className="text-justify">
              <strong>5.1 Scheduled PMS & Mechanical Care:</strong> Periodic Maintenance Service (PMS such as oil change, filters, brake pads) remains the responsibility of the PARTNER to preserve the manufacturer's warranty. The OPERATOR shall ensure that basic fluid levels, tire pressure, and vehicle cleanliness are strictly verified before each release and turnover.
            </p>
          </div>

          {/* Section 6 */}
          <div className="space-y-2 pt-2">
            <h3 className="font-sans font-black text-sm uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              SECTION 6: AGREEMENT DURATION & UNIT PULL-OUT
            </h3>
            <p className="text-justify">
              <strong>6.1 Term & Withdrawal:</strong> This agreement is effective for a minimum period of three (3) months from signing. Either party may terminate this agreement or retrieve the unit by providing at least seven (7) business days prior written notice via the official Partner GC, provided all ongoing and pre-booked schedules for the unit are honored or reassigned.
            </p>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 font-sans text-xs">
            <div className="space-y-6">
              <div>
                <p className="font-bold text-slate-900">CUSTOWORKS CAR RENTAL</p>
                <div className="mt-8 border-b border-slate-800 w-4/5" />
                <p className="text-[11px] text-slate-500 mt-1">Authorized Representative / Fleet Manager</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Date Signed: ________________________</p>
              </div>

              <div>
                <p className="font-bold text-slate-700">WITNESS 1:</p>
                <div className="mt-8 border-b border-slate-400 w-4/5" />
                <p className="text-[11px] text-slate-500 mt-1">Name & Signature</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="font-bold text-slate-900">[{partnerName}]</p>
                <div className="mt-8 border-b border-slate-800 w-4/5" />
                <p className="text-[11px] text-slate-500 mt-1">Registered Vehicle Owner (PARTNER)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Date Signed: ________________________</p>
              </div>

              <div>
                <p className="font-bold text-slate-700">WITNESS 2:</p>
                <div className="mt-8 border-b border-slate-400 w-4/5" />
                <p className="text-[11px] text-slate-500 mt-1">Name & Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden in Print) */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center print:hidden">
          <span className="text-xs text-slate-500">
            Custoworks Car Rental — Fleet Partner Consignment & Collision Liability Agreement
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-brand-blue hover:bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Agreement
            </button>
            <button
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
