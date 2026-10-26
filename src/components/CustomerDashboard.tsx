import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  CheckCircle2,
  Star,
  RefreshCw,
  ExternalLink,
  XCircle,
  Truck,
  Wrench,
  Search,
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenBookingTracker: (booking: Booking) => void;
  onOpenReview: (booking: Booking) => void;
  onGoToServices: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenBookingTracker,
  onOpenReview,
  onGoToServices,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await api.bookings.getAll();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    setIsCancelling(true);
    try {
      await api.bookings.updateStatus(
        cancelModalBooking.id,
        'Cancelled',
        cancelReason || 'Cancelled by customer',
        cancelReason || 'Customer requested cancellation'
      );
      setActionMessage(`Booking ${cancelModalBooking.reference} has been cancelled.`);
      setCancelModalBooking(null);
      setCancelReason('');
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="w-3.5 h-3.5" />
            In Progress
          </span>
        );
      case 'On the Way':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-3.5 h-3.5" />
            On the Way
          </span>
        );
      case 'Assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Technician Assigned
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Confirmed
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-300">
            Pending Assignment
          </span>
        );
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterTab === 'active') {
      return ['Pending', 'Confirmed', 'Assigned', 'On the Way', 'In Progress'].includes(b.status);
    }
    if (filterTab === 'completed') {
      return b.status === 'Completed';
    }
    if (filterTab === 'cancelled') {
      return b.status === 'Cancelled';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Customer Dashboard
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            My Service Bookings
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Track technician dispatch, view live status updates, and provide genuine reviews for completed jobs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBookings}
            className="p-2 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
            title="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onGoToServices}
            className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-sm"
          >
            + Book New Service
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="font-bold hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg max-w-md">
        <button
          onClick={() => setFilterTab('all')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterTab === 'all'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setFilterTab('active')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterTab === 'active'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Active ({bookings.filter((b) => !['Completed', 'Cancelled'].includes(b.status)).length})
        </button>
        <button
          onClick={() => setFilterTab('completed')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterTab === 'completed'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Completed ({bookings.filter((b) => b.status === 'Completed').length})
        </button>
        <button
          onClick={() => setFilterTab('cancelled')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            filterTab === 'cancelled'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Cancelled ({bookings.filter((b) => b.status === 'Cancelled').length})
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-neutral-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
          Loading your verified bookings...
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-4">
          <Calendar className="w-12 h-12 text-neutral-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-neutral-800">
              No bookings found in this category
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Select one of our 10 verified home service categories to book a certified technician.
            </p>
          </div>
          <button
            onClick={onGoToServices}
            className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm"
          >
            Explore Home Services
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all p-5 shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      {b.reference}
                    </span>
                    {getStatusBadge(b.status)}
                  </div>
                  <h3 className="text-base font-bold text-neutral-900 leading-snug">
                    {b.serviceName}
                  </h3>
                  <div className="text-xs text-neutral-500 font-medium">{b.subService}</div>
                </div>

                <div className="text-right font-mono tabular-nums text-xs">
                  <div className="font-bold text-neutral-900">₹{b.priceEstimate?.baseVisit || 199}</div>
                  <div className="text-[10px] text-neutral-400">Visiting Fee</div>
                </div>
              </div>

              {/* Schedule and Location */}
              <div className="bg-neutral-50/80 rounded-lg p-3 text-xs space-y-1.5 text-neutral-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>
                    <strong>Date:</strong> {b.preferredDate} ({b.preferredTimeSlot})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">
                    <strong>Address:</strong> {b.address}, {b.locality}
                  </span>
                </div>
                {b.problemDescription && (
                  <p className="text-[11px] text-neutral-500 italic line-clamp-1 pt-1 border-t border-neutral-200/60">
                    "{b.problemDescription}"
                  </p>
                )}
              </div>

              {/* Technician Info (if assigned) */}
              {b.technicianName ? (
                <div className="flex items-center justify-between text-xs py-1 px-2 bg-neutral-100/60 rounded border border-neutral-200/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-[10px]">
                      {b.technicianName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{b.technicianName}</div>
                      <div className="text-[10px] text-neutral-500">Assigned Technician</div>
                    </div>
                  </div>
                  <a
                    href={`tel:${b.technicianPhone}`}
                    className="flex items-center gap-1 text-[11px] font-bold text-neutral-800 hover:text-black bg-white px-2 py-1 rounded border border-neutral-200"
                  >
                    <Phone className="w-3 h-3 text-neutral-500" />
                    <span>Call</span>
                  </a>
                </div>
              ) : (
                <div className="text-xs text-amber-700 bg-amber-50/70 p-2 rounded border border-amber-200/50 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Awaiting technician assignment from operations dispatch.</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenBookingTracker(b)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Status Timeline</span>
                </button>

                <div className="flex items-center gap-2">
                  {/* Cancel button if pending/assigned */}
                  {['Pending', 'Confirmed', 'Assigned'].includes(b.status) && (
                    <button
                      type="button"
                      onClick={() => setCancelModalBooking(b)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}

                  {/* Rate Service button if Completed! */}
                  {b.status === 'Completed' && (
                    <button
                      type="button"
                      onClick={() => onOpenReview(b)}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Star className="w-3.5 h-3.5 fill-neutral-900" />
                      <span>{b.hasReviewed ? 'Edit Rating' : 'Rate Service'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancellation confirmation modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              Cancel Booking {cancelModalBooking.reference}?
            </h3>
            <p className="text-xs text-neutral-600">
              Please let us know the reason for cancellation so we can improve our service:
            </p>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule changed, issue resolved itself..."
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600"
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleCancelBooking}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
