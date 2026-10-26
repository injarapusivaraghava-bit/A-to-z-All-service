import React from 'react';
import { Booking, BookingStatus } from '../types/index.ts';
import {
  X,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  Star,
  ShieldCheck,
  AlertCircle,
  Truck,
  Wrench,
  XCircle,
} from 'lucide-react';

interface BookingTrackerModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onRateBooking?: (booking: Booking) => void;
}

export const BookingTrackerModal: React.FC<BookingTrackerModalProps> = ({
  booking,
  isOpen,
  onClose,
  onRateBooking,
}) => {
  if (!isOpen || !booking) return null;

  const STATUS_STEPS: BookingStatus[] = [
    'Pending',
    'Confirmed',
    'Assigned',
    'On the Way',
    'In Progress',
    'Completed',
  ];

  const isCancelled = booking.status === 'Cancelled';
  const currentStepIdx = STATUS_STEPS.indexOf(booking.status);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'Completed':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'In Progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'On the Way':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'Assigned':
        return 'text-cyan-700 bg-cyan-50 border-cyan-200';
      case 'Confirmed':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Cancelled':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'Pending':
      default:
        return 'text-neutral-700 bg-neutral-100 border-neutral-300';
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {booking.reference}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${getStatusColor(
                  booking.status
                )}`}
              >
                {booking.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900">{booking.serviceName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Visual Step Progress Bar */}
          {!isCancelled ? (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
                Service Progression
              </div>
              <div className="grid grid-cols-6 gap-1 relative">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-neutral-900 text-white ring-4 ring-neutral-200'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-neutral-100 text-neutral-400'
                        }`}
                      >
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-[10px] font-medium mt-1 leading-tight ${
                          isCurrent ? 'font-bold text-neutral-900' : 'text-neutral-500'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs text-red-800">
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Booking Cancelled</div>
                <div>{booking.cancellationReason || 'Cancelled upon customer or operations request.'}</div>
              </div>
            </div>
          )}

          {/* Assigned Technician Card (if assigned) */}
          {booking.technicianName && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                  {booking.technicianName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs text-neutral-500 font-medium">Assigned Service Specialist</div>
                  <div className="text-sm font-bold text-neutral-900">{booking.technicianName}</div>
                  <div className="text-xs text-neutral-600 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span>{booking.technicianPhone}</span>
                  </div>
                </div>
              </div>
              <a
                href={`tel:${booking.technicianPhone}`}
                className="px-3 py-1.5 text-xs font-bold text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Specialist</span>
              </a>
            </div>
          )}

          {/* Booking Summary Details */}
          <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Service Task:</span>
              <span className="font-medium text-neutral-900">{booking.subService}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Customer:</span>
              <span className="font-medium text-neutral-900">{booking.customerName} ({booking.customerPhone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Address:</span>
              <span className="font-medium text-neutral-900 text-right max-w-xs">{booking.address}, {booking.locality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Scheduled Date & Slot:</span>
              <span className="font-semibold text-neutral-900">{booking.preferredDate} · {booking.preferredTimeSlot}</span>
            </div>
            <div className="pt-1 border-t border-neutral-200">
              <span className="text-neutral-500 block mb-0.5">Problem Notes:</span>
              <p className="text-neutral-700 italic">"{booking.problemDescription}"</p>
            </div>
          </div>

          {/* Status History Audit Log */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">
              Status History & Activity Log
            </h4>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden text-xs">
              {booking.statusHistory && booking.statusHistory.length > 0 ? (
                booking.statusHistory.map((hist, idx) => (
                  <div key={hist.id || idx} className="p-3 hover:bg-neutral-50/80 transition-colors flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{hist.status}</span>
                        <span className="text-[11px] text-neutral-400">·</span>
                        <span className="text-[11px] text-neutral-500 capitalize">
                          By {hist.updatedByName} ({hist.updatedByRole})
                        </span>
                      </div>
                      {hist.note && <div className="text-neutral-600 text-[11px]">{hist.note}</div>}
                    </div>
                    <div className="text-[11px] text-neutral-400 whitespace-nowrap shrink-0 font-mono">
                      {formatTimestamp(hist.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-neutral-500 text-center">No history recorded yet</div>
              )}
            </div>
          </div>

          {/* Action if Completed: Allow Rating */}
          {booking.status === 'Completed' && onRateBooking && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{booking.hasReviewed ? 'You have reviewed this service' : 'Rate Your Experience'}</span>
                </div>
                <div className="text-[11px] text-neutral-600">
                  {booking.hasReviewed
                    ? 'Thank you! You can update your feedback anytime.'
                    : 'Your genuine feedback helps us maintain verified quality technicians.'}
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onRateBooking(booking);
                }}
                className="px-4 py-2 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm shrink-0 ml-3"
              >
                {booking.hasReviewed ? 'Edit Rating' : 'Leave Rating'}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
