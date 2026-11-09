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
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Car,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  CalendarCheck2,
  Sparkles,
} from 'lucide-react';

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
  const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());
  const validPickup = isValidDate(selectedPickup) ? selectedPickup : null;
  const validReturn = isValidDate(selectedReturn) ? selectedReturn : null;

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectionStart, setSelectionStart] = useState<Date | null>(validPickup || null);
  const [rangeStep, setRangeStep] = useState<'START' | 'END'>('START');
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [activeMobileDate, setActiveMobileDate] = useState<Date>(
    validPickup && !isBefore(validPickup, startOfDay(new Date()))
      ? validPickup
      : new Date()
  );
  const [pastDateWarning, setPastDateWarning] = useState<string | null>(null);

  const isCurrentOrPastMonth =
    !readOnly &&
    (isSameMonth(currentMonth, new Date()) ||
      isBefore(currentMonth, startOfMonth(new Date())));

  const prevMonth = () => {
    if (isCurrentOrPastMonth) {
      setPastDateWarning('Previous months cannot be selected. Bookings are available today onwards only.');
      setTimeout(() => setPastDateWarning(null), 3500);
      return;
    }
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Compute availability for a given day
  const getDayDetails = (date: Date): DayDetails => {
    const dayStart = startOfDay(date);

    // Blocked vehicles map for this day
    const blockedMap = new Map<
      string,
      {
        state: string;
        label: string;
        customerName?: string;
        pickupTime?: string;
        reference?: string;
      }
    >();

    for (const ev of events) {
      const s = startOfDay(new Date(ev.start));
      const e = startOfDay(new Date(ev.end));
      if (dayStart >= s && dayStart <= e) {
        if (ev.resourceId) {
          blockedMap.set(ev.resourceId, {
            state: ev.state,
            label: ev.extendedProps?.vehicleName || ev.title || 'Reserved',
            customerName: ev.extendedProps?.customerName,
            pickupTime: ev.start ? format(new Date(ev.start), 'hh:mm a') : undefined,
            reference: ev.extendedProps?.reference,
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
      const fleetTotal =
        Number(selectedVehicle.availableFleetCount) ||
        Number(selectedVehicle.fleetCount) ||
        (targetModel ? vehicles.filter((v) => v.model === targetModel).length : 1) ||
        1;

      // Find all units for this specific model in the fleet
      const modelUnits = targetModel
        ? vehicles.filter((v) => v.model === targetModel)
        : [selectedVehicle];

      const unitList: any[] = modelUnits.map((v, i) => {
        const block = blockedMap.get(v.id);
        const dayStatus = block ? block.state : 'AVAILABLE';
        return {
          ...v,
          unitIndex: i + 1,
          dayStatus,
          blockInfo: block,
        };
      });

      if (unitList.length < fleetTotal) {
        const existingCount = unitList.length;
        for (let i = existingCount; i < fleetTotal; i++) {
          unitList.push({
            id: `${selectedVehicle.id}-unit-${i + 1}`,
            name: `${selectedVehicle.name} (Unit ${i + 1})`,
            plateNumber: `${selectedVehicle.plateNumber || 'NAG'}-${i + 1}`,
            color: selectedVehicle.color || 'Silver',
            unitIndex: i + 1,
            dayStatus: 'AVAILABLE',
            blockInfo: undefined,
          });
        }
      }

      const availableCount = unitList.filter((u) => u.dayStatus === 'AVAILABLE').length;
      const maintenanceCount = unitList.filter((u) => u.dayStatus === 'MAINTENANCE').length;
      const bookedCount = unitList.filter((u) => u.dayStatus !== 'AVAILABLE' && u.dayStatus !== 'MAINTENANCE').length;

      const shortName =
        targetModel === 'Mirage G4'
          ? 'Mirage G4'
          : targetModel === 'NV350 Urvan'
          ? 'NV350 Van'
          : selectedVehicle.name;

      return {
        isSingle: true,
        modelName: shortName,
        state: availableCount > 0 ? 'AVAILABLE' : maintenanceCount > 0 ? 'MAINTENANCE' : 'RESERVED',
        vehicleName: selectedVehicle.name,
        plateNumber: selectedVehicle.plateNumber,
        totalAvailable: availableCount,
        totalFleet: fleetTotal,
        breakdown: [
          {
            shortName,
            available: availableCount,
            total: fleetTotal,
            booked: bookedCount,
            maintenance: maintenanceCount,
          },
        ],
        unitList,
      };
    }

    // ALL VEHICLES FLEET VIEW (Admin or general view):
    const modelMap = new Map<
      string,
      { available: number; total: number; booked: number; maintenance: number; shortName: string }
    >();

    let totalFleetCount = 0;
    let totalAvailCount = 0;
    const unitList: any[] = [];

    vehicles.forEach((v) => {
      const vFleet = Number(v.availableFleetCount) || Number(v.fleetCount) || 1;
      let shortName = v.model || v.name;
      if (v.model === 'Mirage G4') shortName = 'Mirage G4';
      else if (v.model === 'NV350 Urvan') shortName = 'NV350 Van';
      else if (v.model === 'Vios') shortName = 'Vios 2025';

      if (!modelMap.has(shortName)) {
        modelMap.set(shortName, { available: 0, total: 0, booked: 0, maintenance: 0, shortName });
      }
      const m = modelMap.get(shortName)!;
      m.total += vFleet;
      totalFleetCount += vFleet;

      const block = blockedMap.get(v.id);
      const dayStatus = block ? block.state : 'AVAILABLE';
      if (dayStatus === 'AVAILABLE') {
        m.available += vFleet;
        totalAvailCount += vFleet;
      } else if (dayStatus === 'MAINTENANCE') {
        m.maintenance += 1;
        m.available += Math.max(0, vFleet - 1);
        totalAvailCount += Math.max(0, vFleet - 1);
      } else {
        m.booked += 1;
        m.available += Math.max(0, vFleet - 1);
        totalAvailCount += Math.max(0, vFleet - 1);
      }

      unitList.push({
        ...v,
        shortName,
        dayStatus,
        blockInfo: block,
      });
    });

    const breakdown = Array.from(modelMap.values());

    return {
      isSingle: false,
      modelName: 'Fleet',
      state: totalAvailCount > 0 ? 'AVAILABLE' : 'RESERVED',
      totalAvailable: totalAvailCount,
      totalFleet: totalFleetCount,
      breakdown,
      unitList,
    };
  };

  const handleDateClick = (date: Date) => {
    const isPast = isBefore(date, startOfDay(new Date()));

    if (isPast) {
      if (!readOnly) {
        setPastDateWarning('You cannot book previous dates. Pick-up schedule is available today onwards only.');
        setTimeout(() => setPastDateWarning(null), 3500);
        return;
      } else {
        setModalDate(date);
        setActiveMobileDate(date);
        return;
      }
    }

    setPastDateWarning(null);
    setActiveMobileDate(date);

    if (!readOnly && onSelectRange) {
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
          // Complete range selection
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
    validPickup && validReturn && validReturn > validPickup
      ? Math.max(1, differenceInCalendarDays(validReturn, validPickup))
      : 1;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const details = getDayDetails(cloneDay);
      const isPast = isBefore(cloneDay, startOfDay(new Date()));
      const isToday = isSameDay(cloneDay, new Date());
      const inCurrentMonth = isSameMonth(cloneDay, monthStart);
      const isSelectedMobile = isSameDay(cloneDay, activeMobileDate);

      const isPickup = validPickup && isSameDay(cloneDay, validPickup);
      const isReturn = validReturn && isSameDay(cloneDay, validReturn);
      const isInRange =
        validPickup &&
        validReturn &&
        cloneDay > validPickup &&
        cloneDay < validReturn;

      let dayBg = 'bg-white hover:bg-slate-50 cursor-pointer';

      if (isPast) {
        dayBg = 'bg-slate-100/70 text-slate-400 cursor-not-allowed select-none opacity-40 hover:bg-slate-100/70';
      } else if (details.totalAvailable === 0) {
        if (details.state === 'MAINTENANCE') {
          dayBg = 'bg-slate-100 text-slate-600';
        } else {
          dayBg = 'bg-rose-50/80 text-rose-800 border-rose-200';
        }
      }

      if (isInRange) {
        dayBg = 'bg-blue-50 text-blue-900 border-y border-blue-200 font-semibold cursor-pointer';
      }
      if (isPickup || isReturn) {
        dayBg = 'bg-brand-blue text-white font-bold shadow-md cursor-pointer';
      }

      days.push(
        <div
          key={cloneDay.toISOString()}
          onClick={() => handleDateClick(cloneDay)}
          className={`min-h-[58px] sm:min-h-[115px] md:min-h-[125px] p-1 sm:p-1.5 border border-slate-100 transition-all flex flex-col justify-between select-none group relative ${
            !inCurrentMonth ? 'opacity-35' : ''
          } ${isSelectedMobile ? 'ring-2 ring-brand-blue ring-inset' : ''} ${dayBg}`}
        >
          {/* Top row: Day Number & Available Slots Count */}
          <div className="flex justify-between items-center pb-0.5 sm:pb-1">
            <div className="flex items-center gap-1">
              <span
                className={`text-[11px] sm:text-xs font-black rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center ${
                  isPickup || isReturn
                    ? 'bg-white/20 text-white'
                    : isToday
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isPast
                    ? 'text-slate-400 line-through'
                    : 'text-slate-800'
                }`}
              >
                {format(cloneDay, 'd')}
              </span>
              {isToday && (
                <span className="text-[8px] font-black bg-blue-100 text-blue-900 border border-blue-300 px-1 rounded-sm uppercase tracking-wider hidden sm:inline-block">
                  Today
                </span>
              )}
            </div>

            {/* Desktop: Available slots badge or Past badge */}
            {isPast ? (
              <span className="hidden sm:inline-block text-[9px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded">
                Past
              </span>
            ) : inCurrentMonth ? (
              <span
                className={`hidden sm:inline-block text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border shadow-2xs ${
                  isPickup || isReturn
                    ? 'bg-white/20 text-white border-white/30'
                    : details.totalAvailable > 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}
              >
                {details.totalAvailable} / {details.totalFleet} Avail
              </span>
            ) : null}

            {isPickup && (
              <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold ml-1">
                Pick-up
              </span>
            )}
            {isReturn && (
              <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-bold ml-1">
                Return
              </span>
            )}
          </div>

          {/* MOBILE VIEW (sm:hidden): Clear indicator */}
          {isPast ? (
            <div className="sm:hidden flex flex-col items-center justify-center my-0.5">
              <span className="w-full text-center text-[8px] font-semibold py-0.5 px-0.5 rounded leading-none text-slate-400 bg-slate-200/50">
                Past
              </span>
            </div>
          ) : inCurrentMonth ? (
            <div className="sm:hidden flex flex-col items-center justify-center my-0.5">
              {isToday && (
                <span className="text-[7px] font-extrabold text-blue-700 bg-blue-100 px-1 rounded-xs uppercase mb-0.5">
                  Today
                </span>
              )}
              {details.totalAvailable > 0 ? (
                <span
                  className={`w-full text-center text-[9px] font-black py-0.5 px-0.5 rounded leading-none truncate shadow-2xs ${
                    isPickup || isReturn
                      ? 'bg-white/30 text-white'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {details.isSingle
                    ? `${details.totalAvailable}/${details.totalFleet}`
                    : `${details.totalAvailable} avail`}
                </span>
              ) : (
                <span className="w-full text-center text-[9px] font-bold py-0.5 px-0.5 rounded leading-none bg-rose-100 text-rose-700 border border-rose-200 truncate">
                  Full
                </span>
              )}
            </div>
          ) : (
            <div className="sm:hidden h-3"></div>
          )}

          {/* DESKTOP VIEW (hidden sm:flex): Rich multi-line breakdown */}
          <div className="hidden sm:flex flex-1 flex-col gap-1 overflow-hidden my-0.5 justify-center">
            {details.isSingle ? (
              /* Specific Model Slots */
              inCurrentMonth &&
              !isPast && (
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

          <div className="text-[8px] text-slate-400 text-right opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
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

  // Active detail data for mobile card and desktop modal
  const activeModalDetails = modalDate ? getDayDetails(modalDate) : null;
  const mobileDetails = getDayDetails(activeMobileDate);
  const isMobileDatePast = isBefore(activeMobileDate, startOfDay(new Date()));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Calendar Header with Mode & Duration Status */}
      <div className="bg-slate-900 text-white px-3 sm:px-5 py-3 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            {selectedDaysCount > 1 && (
              <span className="text-[11px] sm:text-xs bg-brand-blue text-white font-extrabold px-2.5 py-0.5 rounded-full border border-blue-400/40 flex items-center gap-1 shadow-xs">
                <CalendarCheck2 className="w-3.5 h-3.5" />
                {selectedDaysCount} Days Selected
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Today Onwards Only
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            {selectedVehicleId
              ? `Real-Time Available Slots for ${getDayDetails(new Date()).modelName} (${getDayDetails(new Date()).totalFleet} Total Units in Fleet)`
              : 'Interactive Vehicle Fleet Availability Calendar (Specific Models & Units)'}
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          {!readOnly && rangeStep === 'END' && (
            <span className="text-[11px] sm:text-xs font-bold text-amber-300 animate-pulse bg-amber-950/60 border border-amber-400/30 px-2 sm:px-3 py-1 rounded-xl">
              👉 Tap Return Date
            </span>
          )}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isCurrentOrPastMonth}
              className={`p-2 rounded-lg transition-colors ${
                isCurrentOrPastMonth
                  ? 'opacity-30 cursor-not-allowed text-slate-500'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isCurrentOrPastMonth ? 'Cannot view past months' : 'Previous Month'}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Past Date Warning Feedback Banner */}
      {pastDateWarning && (
        <div className="bg-amber-500/20 border-b border-amber-400/40 px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-amber-200 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{pastDateWarning}</span>
        </div>
      )}

      {/* Weekdays Bar */}
      <div className="grid grid-cols-7 bg-slate-100 text-center text-[11px] sm:text-xs font-bold text-slate-600 py-1.5 sm:py-2 border-b border-slate-200">
        <div><span className="sm:hidden">S</span><span className="hidden sm:inline">Sun</span></div>
        <div><span className="sm:hidden">M</span><span className="hidden sm:inline">Mon</span></div>
        <div><span className="sm:hidden">T</span><span className="hidden sm:inline">Tue</span></div>
        <div><span className="sm:hidden">W</span><span className="hidden sm:inline">Wed</span></div>
        <div><span className="sm:hidden">T</span><span className="hidden sm:inline">Thu</span></div>
        <div><span className="sm:hidden">F</span><span className="hidden sm:inline">Fri</span></div>
        <div><span className="sm:hidden">S</span><span className="hidden sm:inline">Sat</span></div>
      </div>

      {/* Days Grid */}
      <div className="divide-y divide-slate-100">{rows}</div>

      {/* MOBILE-ONLY INTERACTIVE DAY INSPECTOR CARD */}
      <div className="sm:hidden bg-slate-900 text-white p-3.5 border-t border-slate-800">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isMobileDatePast ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`}></span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">
                Selected Day Status
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-white mt-0.5">
              {format(activeMobileDate, 'EEEE, MMM d, yyyy')}
            </h4>
          </div>
          {isMobileDatePast ? (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 bg-slate-800 text-slate-400 border border-slate-700">
              Past Date · Locked
            </span>
          ) : (
            <span
              className={`text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${
                mobileDetails.totalAvailable > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              }`}
            >
              {mobileDetails.totalAvailable > 0
                ? `${mobileDetails.totalAvailable} / ${mobileDetails.totalFleet} Avail`
                : 'All Booked'}
            </span>
          )}
        </div>

        {isMobileDatePast ? (
          <div className="mt-2.5 bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Past Date · Booking Not Allowed
            </span>
            <p className="text-[11px] text-slate-300">
              You cannot book previous dates. Pick-up is available <strong>today onwards only</strong>. Please tap today or any upcoming date to reserve.
            </p>
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
          {mobileDetails.isSingle ? (
            <div className="bg-slate-800/90 rounded-xl p-2.5 border border-slate-700/60">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white">{mobileDetails.vehicleName}</span>
                <span className="font-mono font-bold text-emerald-400">
                  {mobileDetails.totalAvailable} Available Units
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {mobileDetails.totalAvailable > 0
                  ? `✓ Ready for reservation! ${mobileDetails.totalAvailable} unit(s) ready in fleet.`
                  : '✕ All units for this model are reserved on this date.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {mobileDetails.breakdown.map((item) => (
                <div
                  key={item.shortName}
                  className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                    item.available > 0
                      ? 'bg-slate-800 border-slate-700 text-white'
                      : 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                  }`}
                >
                  <span className="font-bold truncate mr-1">{item.shortName}</span>
                  <span
                    className={`font-mono font-black shrink-0 ${
                      item.available > 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {item.available}/{item.total}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!readOnly && onSelectRange && (
            <div className="pt-1.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectionStart(activeMobileDate);
                  setRangeStep('END');
                  onSelectRange(activeMobileDate, addDays(activeMobileDate, 1));
                }}
                className="flex-1 py-2 px-2.5 bg-brand-blue active:bg-blue-600 text-white font-bold text-xs rounded-xl shadow text-center transition-all"
              >
                Set Pick-up ({format(activeMobileDate, 'MMM d')})
              </button>
              {selectionStart && !isBefore(activeMobileDate, selectionStart) && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectRange(selectionStart, activeMobileDate);
                    setRangeStep('START');
                  }}
                  className="flex-1 py-2 px-2.5 bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow text-center transition-all"
                >
                  Set Return ({format(activeMobileDate, 'MMM d')})
                </button>
              )}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Calendar Color Coding Legend */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs"></span> Green = Available
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs"></span> Yellow = Hold
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-2xs"></span> Red = Booked
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-700 text-[11px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-2xs"></span> Blue = Selected
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Tap date to see units • 1st tap: Pick-up • 2nd tap: Return
        </div>
      </div>

      {/* Detailed Fleet Availability Modal for Selected Day (Desktop or Admin) */}
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
                        {u.blockInfo?.customerName && (
                          <p className="text-[11px] text-rose-700 font-bold mt-0.5 truncate">
                            Booked: {u.blockInfo.customerName} {u.blockInfo.pickupTime ? `• Release: ${u.blockInfo.pickupTime}` : ''}
                          </p>
                        )}
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
