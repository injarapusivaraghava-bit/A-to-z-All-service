import React, { useState, useEffect, useCallback } from 'react';
import { Booking, BookingStatus } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  Wrench,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  Truck,
  RefreshCw,
  Star,
  ExternalLink,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

interface TechnicianDashboardProps {
  onOpenBookingTracker: (booking: Booking) => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  onOpenBookingTracker,
}) => {
  const { user } = useAuth();
  const [assignedBookings, setAssignedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Completion modal state
  const [completionModalBooking, setCompletionModalBooking] = useState<Booking | null>(null);
  const [completionNote, setCompletionNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.bookings.getAll();
      setAssignedBookings(data);
    } catch (err) {
      console.error('Failed to load technician jobs', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleUpdateStatus = async (
    bookingId: string,
    newStatus: BookingStatus,
    note?: string
  ) => {
    setIsUpdating(true);
    try {
      const res = await api.bookings.updateStatus(bookingId, newStatus, note);
      setActionSuccessMsg(`Job status updated to "${newStatus}" and customer notified.`);
      setCompletionModalBooking(null);
      setCompletionNote('');
      loadJobs();
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update job status');
    } finally {
      setIsUpdating(false);
    }
  };

  const activeJobs = assignedBookings.filter((b) =>
    ['Assigned', 'On the Way', 'In Progress'].includes(b.status)
  );
  const completedJobs = assignedBookings.filter((b) => b.status === 'Completed');

  const displayedJobs = activeTab === 'active' ? activeJobs : completedJobs;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Technician Profile Bar */}
      <div className="bg-neutral-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.name?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{user?.name}</h1>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-neutral-800 text-amber-400 px-2 py-0.5 rounded border border-neutral-700">
                Verified Technician
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Specialty: <span className="text-neutral-200">{user?.specialty || 'General Home Services'}</span> · Phone: {user?.phone}
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 text-xs font-mono">
          <div>
            <div className="text-neutral-400 text-[10px] uppercase font-sans">Active Tasks</div>
            <div className="text-xl font-bold text-white tabular-nums">{activeJobs.length}</div>
          </div>
          <div>
            <div className="text-neutral-400 text-[10px] uppercase font-sans">Jobs Completed</div>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">{completedJobs.length}</div>
          </div>
          <div>
            <div className="text-neutral-400 text-[10px] uppercase font-sans">Specialist Rating</div>
            <div className="text-xl font-bold text-amber-400 flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>4.9</span>
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs & Controls */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'active'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Active Field Assignments ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'completed'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            Work History ({completedJobs.length})
          </button>
        </div>

        <button
          onClick={loadJobs}
          className="p-2 border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-600 transition-colors"
          title="Refresh assignments"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-neutral-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
          Loading your assigned service requests...
        </div>
      ) : displayedJobs.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="text-base font-bold text-neutral-800">
            {activeTab === 'active' ? 'No pending assignments' : 'No completed jobs yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeTab === 'active'
              ? 'New service bookings matching your trade and service areas will automatically appear here once dispatched.'
              : 'Completed jobs and customer ratings will be archived here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 p-5 shadow-sm space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                      {job.reference}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        job.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : job.status === 'On the Way'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">{job.serviceName}</h3>
                  <div className="text-xs text-neutral-500 font-medium">{job.subService}</div>
                </div>

                <div className="text-right text-xs">
                  <div className="font-bold text-neutral-900 font-mono">₹{job.priceEstimate?.baseVisit || 199}</div>
                  <div className="text-[10px] text-neutral-400">Base visit fee</div>
                </div>
              </div>

              {/* Customer Contact & Address (Protected - authorized technicians only) */}
              <div className="bg-neutral-50 rounded-xl p-3.5 text-xs space-y-2 border border-neutral-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-neutral-900 font-semibold">
                    <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{job.customerName}</span>
                  </div>
                  <a
                    href={`tel:${job.customerPhone}`}
                    className="flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{job.customerPhone}</span>
                  </a>
                </div>

                <div className="flex items-start gap-2 text-neutral-700">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                  <span>{job.address}, {job.locality}</span>
                </div>

                <div className="flex items-center gap-2 text-neutral-600">
                  <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>Scheduled: <strong>{job.preferredDate} ({job.preferredTimeSlot})</strong></span>
                </div>

                <div className="pt-1.5 border-t border-neutral-200/60">
                  <span className="text-neutral-500 block text-[11px] font-semibold">Problem Notes:</span>
                  <p className="text-neutral-800 italic mt-0.5">"{job.problemDescription}"</p>
                </div>

                {job.photoUrl && (
                  <div className="pt-1">
                    <span className="text-neutral-500 block text-[10px]">Customer Attached Photo:</span>
                    <img src={job.photoUrl} alt="Attached" className="h-20 w-32 object-cover rounded border mt-1" />
                  </div>
                )}
              </div>

              {/* Status Action Buttons for Authorized Technicians */}
              <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenBookingTracker(job)}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>

                <div className="flex items-center gap-2">
                  {job.status === 'Assigned' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleUpdateStatus(
                          job.id,
                          'On the Way',
                          'Technician has departed and is travelling to customer location.'
                        )
                      }
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Start Trip (On the Way)</span>
                    </button>
                  )}

                  {job.status === 'On the Way' && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleUpdateStatus(
                          job.id,
                          'In Progress',
                          'Technician arrived on site and started diagnosis / repairs.'
                        )
                      }
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Arrived (In Progress)</span>
                    </button>
                  )}

                  {job.status === 'In Progress' && (
                    <button
                      type="button"
                      onClick={() => setCompletionModalBooking(job)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Job</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completion Modal */}
      {completionModalBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              Mark Job Completed ({completionModalBooking.reference})
            </h3>
            <p className="text-xs text-neutral-600">
              Record brief notes of the work completed and any parts replaced before closing the task. Customer will be notified and invited to rate the service.
            </p>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Completion Summary / Notes
              </label>
              <textarea
                rows={3}
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder="e.g. Diagnosed loose wire connection, replaced 32A MCB switch, tested under load with zero tripping..."
                className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setCompletionModalBooking(null)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  handleUpdateStatus(
                    completionModalBooking.id,
                    'Completed',
                    completionNote.trim() || 'Work successfully completed and tested on-site.'
                  )
                }
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                {isUpdating ? 'Completing...' : 'Confirm Job Finished'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
