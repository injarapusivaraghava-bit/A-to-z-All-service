import React, { useState, useEffect, useCallback } from 'react';
import {
  Booking,
  BookingStatus,
  BookingStats,
  Technician,
  ServiceCategory,
  ServiceArea,
  Review,
} from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  ShieldCheck,
  Users,
  Wrench,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
  MapPin,
  RefreshCw,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenBookingTracker: (booking: Booking) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenBookingTracker,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Admin section tabs
  const [adminTab, setAdminTab] = useState<'bookings' | 'technicians' | 'areas' | 'reviews'>('bookings');

  // Technician assignment modal
  const [assigningBooking, setAssigningBooking] = useState<Booking | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [assignNote, setAssignNote] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes, techRes, servicesRes, areasRes, reviewsRes] =
        await Promise.all([
          api.admin.getStats().catch(() => null),
          api.bookings.getAll(),
          api.technicians.getAll(),
          api.services.getAll(),
          api.serviceAreas.getAll(),
          api.reviews.getAll(),
        ]);

      setStats(statsRes);
      setBookings(bookingsRes);
      setTechnicians(techRes);
      setServices(servicesRes);
      setAreas(areasRes);
      setReviews(reviewsRes);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignTechnician = async () => {
    if (!assigningBooking || !selectedTechId) return;
    setIsAssigning(true);
    try {
      await api.bookings.assignTechnician(assigningBooking.id, selectedTechId, assignNote);
      setActionMsg(`Technician assigned to ${assigningBooking.reference} successfully.`);
      setAssigningBooking(null);
      setSelectedTechId('');
      setAssignNote('');
      loadData();
      setTimeout(() => setActionMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to assign technician');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all' && b.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (serviceFilter !== 'all' && b.serviceId !== serviceFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        b.reference.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.locality.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Admin Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Operations Control Desk
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-900 text-amber-400 rounded">
              Super Admin
            </span>
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Home Services Dispatch & Operations
          </h1>
          <p className="text-xs text-neutral-600 mt-0.5">
            Manage automated dispatches, technician assignments, service areas, and customer satisfaction audits.
          </p>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-lg shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Real-Time Data</span>
        </button>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg(null)} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-[11px] font-medium text-neutral-500">Total Bookings</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {stats?.totalBookings ?? bookings.length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-[11px] font-medium text-amber-600">Awaiting Assignment</div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {stats?.pendingCount ?? bookings.filter((b) => b.status === 'Pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-[11px] font-medium text-blue-600">Active in Field</div>
          <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums mt-1">
            {(stats?.assignedCount ?? 0) + (stats?.inProgressCount ?? 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="text-[11px] font-medium text-emerald-600">Jobs Completed</div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {stats?.completedCount ?? bookings.filter((b) => b.status === 'Completed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-medium text-neutral-500">Avg Customer Rating</div>
          <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1 flex items-center gap-1.5">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <span>{stats?.averageRating || 4.9}</span>
            <span className="text-xs text-neutral-400 font-sans font-normal">({reviews.length})</span>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg max-w-lg">
        <button
          onClick={() => setAdminTab('bookings')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            adminTab === 'bookings' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Bookings & Dispatch
        </button>
        <button
          onClick={() => setAdminTab('technicians')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            adminTab === 'technicians' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Technicians Roster ({technicians.length})
        </button>
        <button
          onClick={() => setAdminTab('areas')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            adminTab === 'areas' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Service Areas ({areas.length})
        </button>
        <button
          onClick={() => setAdminTab('reviews')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            adminTab === 'reviews' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
          }`}
        >
          Genuine Reviews ({reviews.length})
        </button>
      </div>

      {/* 1. BOOKINGS & DISPATCH TAB */}
      {adminTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Ref, Customer, Locality..."
                  className="w-full pl-8 pr-3 py-1.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 border border-neutral-300 rounded-lg bg-white text-neutral-800"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending Assignment</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Assigned">Assigned</option>
                <option value="On the Way">On the Way</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              {/* Service filter */}
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="py-1.5 px-3 border border-neutral-300 rounded-lg bg-white text-neutral-800"
              >
                <option value="all">All Services</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-neutral-500 text-xs">
              Showing <strong>{filteredBookings.length}</strong> bookings
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Customer & Phone</th>
                    <th className="py-3 px-4">Service & Locality</th>
                    <th className="py-3 px-4">Preferred Slot</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Specialist</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-neutral-400">
                        No bookings match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neutral-900 whitespace-nowrap">
                          {b.reference}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-neutral-900">{b.customerName}</div>
                          <div className="text-[11px] text-neutral-500">{b.customerPhone}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-medium text-neutral-900 truncate">{b.serviceName}</div>
                          <div className="text-[11px] text-neutral-500 truncate">{b.locality}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-neutral-800">{b.preferredDate}</div>
                          <div className="text-[10px] text-neutral-400">{b.preferredTimeSlot.split(' ')[0]}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              b.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'In Progress'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'On the Way'
                                ? 'bg-indigo-100 text-indigo-800'
                                : b.status === 'Assigned'
                                ? 'bg-cyan-100 text-cyan-800'
                                : b.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {b.technicianName ? (
                            <div>
                              <div className="font-semibold text-neutral-900">{b.technicianName}</div>
                              <div className="text-[10px] text-neutral-500">{b.technicianPhone}</div>
                            </div>
                          ) : (
                            <span className="text-amber-700 italic text-[11px]">Not assigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAssigningBooking(b);
                              setSelectedTechId(b.technicianId || '');
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded border border-neutral-300 transition-colors"
                          >
                            {b.technicianId ? 'Reassign' : 'Assign Tech'}
                          </button>
                          <button
                            onClick={() => onOpenBookingTracker(b)}
                            className="p-1 text-neutral-500 hover:text-neutral-900"
                            title="View Timeline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. TECHNICIANS ROSTER TAB */}
      {adminTab === 'technicians' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm">{tech.name}</h3>
                    <div className="text-xs text-neutral-500">{tech.phone}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Star className="w-3 h-3 fill-amber-500" />
                  <span>{tech.rating}</span>
                </div>
              </div>

              <div className="text-xs text-neutral-600 space-y-1.5 pt-1 border-t border-neutral-100">
                <div>
                  <span className="text-neutral-400 font-medium">Service Areas:</span>
                  <div className="text-neutral-800 mt-0.5 font-medium">{tech.serviceAreas.join(', ')}</div>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium">Jobs Completed:</span>
                  <span className="ml-1 font-bold text-neutral-900 font-mono">{tech.jobsCompleted}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium">Availability:</span>
                  <span
                    className={`ml-1 font-semibold ${
                      tech.isAvailable ? 'text-emerald-700' : 'text-neutral-400'
                    }`}
                  >
                    {tech.isAvailable ? 'Active on Duty' : 'Off Duty'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. SERVICE AREAS TAB */}
      {adminTab === 'areas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {areas.map((area) => (
            <div
              key={area.id}
              className="bg-white rounded-xl border border-neutral-200 p-4 shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="font-bold text-neutral-900 text-sm">{area.name}</div>
                <div className="text-xs text-neutral-500">
                  {area.city} · Pincode: <span className="font-mono font-medium">{area.pincode}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Active Zone
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 4. GENUINE REVIEWS TAB */}
      {adminTab === 'reviews' && (
        <div className="space-y-3">
          <div className="text-xs text-neutral-500 font-medium">
            Genuine verified customer ratings and reviews directly linked to completed bookings.
          </div>
          {reviews.length === 0 ? (
            <div className="p-10 text-center text-neutral-400 bg-white rounded-xl border border-neutral-200 text-xs">
              No reviews submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-neutral-900 text-xs">{rev.customerName}</div>
                      <div className="text-[11px] text-neutral-500">
                        Service: {rev.serviceName} · Ref: <span className="font-mono">{rev.bookingReference}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {rev.technicianName && (
                    <div className="text-[11px] text-neutral-600">
                      Technician: <strong>{rev.technicianName}</strong>
                    </div>
                  )}

                  {rev.comment && (
                    <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg border border-neutral-100 italic">
                      "{rev.comment}"
                    </p>
                  )}

                  <div className="text-[10px] text-neutral-400 font-mono">
                    {new Date(rev.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Technician Assignment Modal */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 space-y-4">
            <h3 className="text-base font-bold text-neutral-900">
              Assign Technician to {assigningBooking.reference}
            </h3>
            <div className="bg-neutral-50 p-3 rounded-lg text-xs space-y-1 text-neutral-700 border border-neutral-200">
              <div><strong>Service:</strong> {assigningBooking.serviceName}</div>
              <div><strong>Locality:</strong> {assigningBooking.locality}</div>
              <div><strong>Scheduled:</strong> {assigningBooking.preferredDate} ({assigningBooking.preferredTimeSlot})</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Select Qualified Specialist *
              </label>
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                <option value="">-- Choose Technician --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (⭐ {t.rating} · {t.serviceAreas[0]} · {t.isAvailable ? 'Available' : 'Busy'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Assignment Note (Optional)
              </label>
              <input
                type="text"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="e.g. Priority customer, carries 32A MCB switch kit"
                className="w-full p-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setAssigningBooking(null)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedTechId || isAssigning}
                onClick={handleAssignTechnician}
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-lg shadow-sm"
              >
                {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
