import React, { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfDay,
  differenceInCalendarDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Info, Car, CheckCircle2, AlertTriangle, XCircle, X, CalendarCheck2 } from 'lucide-react';

interface CalendarEvent {
  start: string | Date;
  end: string | Date;
  state: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'ONGOING' | 'RETURNED' | 'MAINTENANCE';
  resourceId?: string;
  title?: string;
  extendedProps?: {
    type?: string;
    status?: string;
    vehicleName?: string;
    model?: string;
    plateNumber?: string;
    customerName?: string;
    reference?: string;
    reason?: string;
  };
}

interface DayDetails {
  isSingle: boolean;
  modelName: string;
  state: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'ONGOING' | 'RETURNED' | 'MAINTENANCE';
  vehicleName?: string;
  plateNumber?: string;
  eventTitle?: string;
  totalAvailable: number;
  totalFleet: number;
  breakdown: Array<{
    model?: string;
    shortName: string;
    available: number;
    total: number;
    booked: number;
    maintenance: number;
  }>;
  unitList: any[];
}

interface InteractiveCalendarProps {
  events?: CalendarEvent[];
  selectedPickup?: Date | null;
  selectedReturn?: Date | null;
  onSelectRange?: (pickup: Date, returnDate: Date) => void;
  readOnly?: boolean;
  vehicles?: any[];
  selectedVehicleId?: string;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  events = [],
  selectedPickup,
  selectedReturn,
  onSelectRange,
  readOnly = false,
  vehicles = [],
  selectedVehicleId = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(selectedPickup || null);
  const [rangeStep, setRangeStep] = useState<'START' | 'END'>('START');
  const [modalDate, setModalDate] = useState<Date | null>(null);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Compute availability for a given day
  const getDayDetails = (date: Date): DayDetails => {
    const dayStart = startOfDay(date);

    // Blocked vehicles map for this day
    const blockedMap = new Map<string, { state: string; label: string }>();

    for (const ev of events) {
      const s = startOfDay(new Date(ev.start));
      const e = startOfDay(new Date(ev.end));
      if (dayStart >= s && dayStart <= e) {
        if (ev.resourceId) {
          blockedMap.set(ev.resourceId, {
            state: ev.state,
            label: ev.extendedProps?.vehicleName || ev.title || 'Reserved',
          });
        }
      }
    }

    // Factor in permanent vehicle status
    vehicles.forEach((v) => {
      if (v.status === 'MAINTENANCE') {
        blockedMap.set(v.id, { state: 'MAINTENANCE', label: 'Maintenance' });
      } else if (v.status === 'UNAVAILABLE') {
        blockedMap.set(v.id, { state: 'RESERVED', label: 'Unavailable' });
      }
    });

    // Determine target vehicles (e.g. all units of Mirage if Mirage is chosen, or entire fleet if All Vehicles)
    const selectedVehicle = selectedVehicleId ? vehicles.find((v) => v.id === selectedVehicleId) : null;
    const targetModel = selectedVehicle?.model;

    // If customer selected a specific model like Mirage G4:
    if (selectedVehicle) {
      // Find all units for this specific model in the fleet
      const modelUnits = targetModel
        ? vehicles.filter((v) => v.model === targetModel)
        : [selectedVehicle];

      let availableCount = 0;
      let maintenanceCount = 0;
      let bookedCount = 0;

      const unitList = modelUnits.map((v) => {
        const block = blockedMap.get(v.id);
        const dayStatus = block ? block.state : 'AVAILABLE';
        if (dayStatus === 'AVAILABLE') availableCount++;
        else if (dayStatus === 'MAINTENANCE') maintenanceCount++;
        else bookedCount++;

        return {
          ...v,
          dayStatus,
          blockInfo: block,
        };
      });

      const shortName = targetModel === 'Mirage G4' ? 'Mirage' : targetModel === 'NV350 Urvan' ? 'Urvan' : selectedVehicle.name;

      return {
        isSingle: true,
        modelName: shortName,
        state: availableCount > 0 ? 'AVAILABLE' : maintenanceCount > 0 ? 'MAINTENANCE' : 'RESERVED',
        vehicleName: selectedVehicle.name,
        plateNumber: selectedVehicle.plateNumber,
        totalAvailable: availableCount,
        totalFleet: modelUnits.length,
        breakdown: [
          {
            shortName,
            available: availableCount,
            total: modelUnits.length,
            booked: bookedCount,
            maintenance: maintenanceCount,
          },
        ],
        unitList,
      };
    }

    // ALL VEHICLES FLEET VIEW (Admin or general view):
    const modelMap = new Map<string, { available: number; total: number; booked: number; maintenance: number; shortName: string }>();

    const unitList = vehicles.map((v) => {
      const block = blockedMap.get(v.id);
      const dayStatus = block ? block.state : 'AVAILABLE';

      let shortName = v.model || v.name;
      if (v.model === 'Mirage G4') shortName = 'Mirage';
      else if (v.model === 'NV350 Urvan') shortName = 'Urvan';

      if (!modelMap.has(shortName)) {
        modelMap.set(shortName, { available: 0, total: 0, booked: 0, maintenance: 0, shortName });
      }
      const m = modelMap.get(shortName)!;
      m.total += 1;
      if (dayStatus === 'AVAILABLE') {
        m.available += 1;
      } else if (dayStatus === 'MAINTENANCE') {
        m.maintenance += 1;
      } else {
        m.booked += 1;
      }

      return {
        ...v,
        shortName,
        dayStatus,
        blockInfo: block,
      };
    });

    const breakdown = Array.from(modelMap.values());
    const totalAvailable = unitList.filter((u) => u.dayStatus === 'AVAILABLE').length;

    return {
      isSingle: false,
      modelName: 'Fleet',
      state: totalAvailable > 0 ? 'AVAILABLE' : 'RESERVED',
      totalAvailable,
      totalFleet: vehicles.length,
      breakdown,
      unitList,
    };
  };

  const handleDateClick = (date: Date) => {
    if (!readOnly && onSelectRange) {
      if (isBefore(date, startOfDay(new Date()))) return;
      const details = getDayDetails(date);
      if (details.totalAvailable === 0 && details.state === 'RESERVED') return;

      if (rangeStep === 'START' || !selectionStart) {
        // Step 1: Pick-up date clicked
        setSelectionStart(date);
        setRangeStep('END');
        onSelectRange(date, addDays(date, 1));
      } else {
        // Step 2: Return date clicked (e.g. 3 days, 5 days, etc.)
        if (isBefore(date, selectionStart)) {
          setSelectionStart(date);
          setRangeStep('END');
          onSelectRange(date, addDays(date, 1));
        } else if (isSameDay(date, selectionStart)) {
          onSelectRange(date, addDays(date, 1));
          setRangeStep('START');
        } else {
          // Complete range selection (e.g. Nov 9 to Nov 14 = 5 days)
          onSelectRange(selectionStart, date);
          setRangeStep('START');
        }
      }
    } else {
      // In Admin or readOnly mode, open detailed fleet inspector modal
      setModalDate(date);
    }
  };

  // Generate day cells
  const rows = [];
  let days = [];
  let day = startDate;

  // Selected duration calculation
  const selectedDaysCount =
    selectedPickup && selectedReturn
      ? Math.max(1, differenceInCalendarDays(selectedReturn, selectedPickup))
      : 1;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const details = getDayDetails(cloneDay);
      const isPast = isBefore(cloneDay, startOfDay(new Date()));
      const inCurrentMonth = isSameMonth(cloneDay, monthStart);

      const isPickup = selectedPickup && isSameDay(cloneDay, selectedPickup);
      const isReturn = selectedReturn && isSameDay(cloneDay, selectedReturn);
      const isInRange =
        selectedPickup &&
        selectedReturn &&
        cloneDay > selectedPickup &&
        cloneDay < selectedReturn;

      let dayBg = 'bg-white hover:bg-slate-50';

      if (isPast) {
        dayBg = 'bg-slate-50/70 text-slate-300';
      } else if (details.totalAvailable === 0) {
        if (details.state === 'MAINTENANCE') {
          dayBg = 'bg-slate-100 text-slate-600';
        } else {
          dayBg = 'bg-rose-50/80 text-rose-800 border-rose-200';
        }
      }

      if (isInRange) {
        dayBg = 'bg-blue-50 text-blue-900 border-y border-blue-200 font-semibold';
      }
      if (isPickup || isReturn) {
        dayBg = 'bg-brand-blue text-white font-bold shadow-md';
      }

      days.push(
        <div
          key={cloneDay.toISOString()}
          onClick={() => handleDateClick(cloneDay)}
          className={`min-h-[115px] md:min-h-[125px] p-1.5 border border-slate-100 transition-all flex flex-col justify-between cursor-pointer select-none group relative ${
            !inCurrentMonth ? 'opacity-35' : ''
          } ${dayBg}`}
        >
          {/* Top row: Day Number & Available Slots Count */}
          <div className="flex justify-between items-center pb-1">
            <span
              className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                isPickup || isReturn ? 'bg-white/20 text-white' : 'text-slate-800'
              }`}
            >
              {format(cloneDay, 'd')}
            </span>

            {/* Available slots badge */}
            {inCurrentMonth && !isPast && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border shadow-2xs ${
                  isPickup || isReturn
                    ? 'bg-white/20 text-white border-white/30'
                    : details.totalAvailable > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {details.totalAvailable} / {details.totalFleet} Avail
              </span>
            )}

            {isPickup && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold ml-1">Pick-up</span>}
            {isReturn && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold ml-1">Return</span>}
          </div>

          {/* Specific Model Slot Badges */}
          <div className="flex-1 flex flex-col gap-1 overflow-hidden my-0.5 justify-center">
            {details.isSingle ? (
              /* Specific Model Slots (e.g. 5 Mirage units) */
              inCurrentMonth && !isPast && (
                <div className="space-y-1">
                  <div
                    className={`text-[9px] font-bold px-1.5 py-1 rounded border flex items-center justify-between gap-1 shadow-2xs ${
                      isPickup || isReturn
                        ? 'bg-white/20 text-white border-white/30'
                        : details.totalAvailable > 0
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isPickup || isReturn
                            ? 'bg-white'
                            : details.totalAvailable > 0
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {details.modelName} Slots
                    </span>
                    <strong className="font-mono text-[10px]">
                      {details.totalAvailable} / {details.totalFleet}
                    </strong>
                  </div>

                  <span
                    className={`text-[8px] block truncate text-center ${
                      isPickup || isReturn ? 'text-blue-100 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {details.totalAvailable > 0
                      ? `${details.totalAvailable} of ${details.totalFleet} Available`
                      : 'All slots booked'}
                  </span>
                </div>
              )
            ) : inCurrentMonth && !isPast ? (
              /* All Fleet Models Breakdown */
              <div className="space-y-1">
                {details.breakdown.slice(0, 3).map((item) => (
                  <div
                    key={item.shortName}
                    className={`text-[9px] font-semibold px-1 py-0.5 rounded border truncate flex items-center justify-between gap-1 ${
                      isPickup || isReturn
                        ? 'bg-white/20 text-white border-white/30'
                        : item.available > 0
                        ? 'bg-emerald-50/90 text-emerald-900 border-emerald-200/70'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isPickup || isReturn
                            ? 'bg-white'
                            : item.available > 0
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      {item.shortName}
                    </span>
                    <strong className="font-mono font-bold text-[10px]">
                      {item.available}/{item.total}
                    </strong>
                  </div>
                ))}

                {details.breakdown.length > 3 && (
                  <span
                    className={`text-[9px] font-bold block text-center truncate group-hover:underline ${
                      isPickup || isReturn ? 'text-white' : 'text-brand-blue'
                    }`}
                  >
                    +{details.breakdown.length - 3} more...
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="text-[8px] text-slate-400 text-right opacity-0 group-hover:opacity-100 transition-opacity">
            Click details
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toISOString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  // Active detail modal data when a day is clicked
  const activeModalDetails = modalDate ? getDayDetails(modalDate) : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Calendar Header with Mode & Duration Status */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {selectedDaysCount > 1 && (
              <span className="text-xs bg-brand-blue text-white font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/40 flex items-center gap-1">
                <CalendarCheck2 className="w-3.5 h-3.5" />
                {selectedDaysCount} Days Selected
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedVehicleId
              ? `Real-Time Available Slots for ${getDayDetails(new Date()).modelName} (${getDayDetails(new Date()).totalFleet} Total Units)`
              : 'Interactive Vehicle Fleet Availability Calendar (Specific Models & Units)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && rangeStep === 'END' && (
            <span className="text-xs font-bold text-amber-300 animate-pulse bg-amber-950/60 border border-amber-400/30 px-3 py-1 rounded-xl">
              👉 Click Return Date on Calendar (e.g. 3 or 5 days)
            </span>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays Bar */}
      <div className="grid grid-cols-7 bg-slate-100 text-center text-xs font-bold text-slate-600 py-2 border-b border-slate-200">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Days Grid */}
      <div className="divide-y divide-slate-100">{rows}</div>

      {/* Calendar Color Coding Legend */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs"></span> Green = Available Slots
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs"></span> Yellow = Pending Hold
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs"></span> Red = All Slots Reserved
          </span>
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-3 h-3 rounded-full bg-blue-600 shadow-2xs"></span> Blue = Selected Rental Span
          </span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-500" /> Click 1: Pick-up date • Click 2: Return date (e.g. 3 or 5 days)
        </div>
      </div>

      {/* Detailed Fleet Availability Modal for Selected Day */}
      {modalDate && activeModalDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold text-brand-blue uppercase tracking-wider">
                  Daily Slot Inspection
                </span>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {format(modalDate, 'EEEE, MMMM d, yyyy')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Stat Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                {activeModalDetails.modelName} Availability Status:
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                {activeModalDetails.totalAvailable} of {activeModalDetails.totalFleet} Slots Available
              </span>
            </div>

            {/* Units List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activeModalDetails.unitList.map((u: any, idx: number) => {
                const isAvail = u.dayStatus === 'AVAILABLE';
                const isMaint = u.dayStatus === 'MAINTENANCE';

                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isAvail
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : isMaint
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                          isAvail
                            ? 'bg-emerald-100 text-emerald-700'
                            : isMaint
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        #{idx + 1}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{u.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Plate: {u.plateNumber} • Color: {u.color || 'Silver'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAvail ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Slot Ready
                        </span>
                      ) : isMaint ? (
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full text-[11px]">
                          <AlertTriangle className="w-3 h-3" /> In Maintenance
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          <XCircle className="w-3 h-3" /> Reserved / Out
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setModalDate(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
