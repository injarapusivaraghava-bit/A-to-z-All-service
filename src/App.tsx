import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { Header } from './components/Header.tsx';
import { ServiceCard } from './components/ServiceCard.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { ServiceDetailModal } from './components/ServiceDetailModal.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { TechnicianDashboard } from './components/TechnicianDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { BookingTrackerModal } from './components/BookingTrackerModal.tsx';
import { ReviewModal } from './components/ReviewModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { NotificationDrawer } from './components/NotificationDrawer.tsx';
import { ServiceCategory, Booking, Review } from './types/index.ts';
import { api } from './services/api.ts';
import {
  ShieldCheck,
  Clock,
  Award,
  PhoneCall,
  Search,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

function MainApp() {
  const { user, pendingService, setPendingService, openAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'services' | 'customer' | 'technician' | 'admin' | 'about'>('services');
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // Modals state
  const [bookingModalService, setBookingModalService] = useState<ServiceCategory | null>(null);
  const [bookingModalIssue, setBookingModalIssue] = useState<string | undefined>(undefined);
  const [detailModalService, setDetailModalService] = useState<ServiceCategory | null>(null);
  const [trackerBooking, setTrackerBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);

  // Load services
  useEffect(() => {
    async function fetchServices() {
      setIsLoadingServices(true);
      try {
        const data = await api.services.getAll();
        setServices(data);
      } catch (err) {
        console.error('Error fetching services', err);
      } finally {
        setIsLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // Return to pending service after login
  useEffect(() => {
    if (user && pendingService) {
      setBookingModalService(pendingService);
      setPendingService(null);
    }
  }, [user, pendingService, setPendingService]);

  const handleOpenBooking = (service: ServiceCategory, issue?: string) => {
    if (!user) {
      openAuthModal('login', service);
      return;
    }
    setBookingModalService(service);
    setBookingModalIssue(issue);
  };

  const handleBookingSuccess = (newBooking: Booking) => {
    // When customer books, direct them to My Bookings tab so they can track the status
    setActiveTab('customer');
  };

  // Group filter options
  const serviceGroups = [
    { id: 'all', label: 'All Services' },
    { id: 'electrical', label: 'Electrical & Power' },
    { id: 'plumbing', label: 'Piping & Drainage' },
    { id: 'appliances', label: 'Appliance Repairs' },
    { id: 'masonry', label: 'Civil & Masonry' },
    { id: 'finishing', label: 'Painting & Tiles' },
    { id: 'hygiene', label: 'Cleaning & General' },
  ];

  const filteredServices = services.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        s.name.toLowerCase().includes(q) ||
        s.shortDesc.toLowerCase().includes(q) ||
        s.commonIssues.some((issue) => issue.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (selectedGroup !== 'all') {
      if (selectedGroup === 'electrical' && s.slug !== 'electrician') return false;
      if (selectedGroup === 'plumbing' && s.slug !== 'plumber') return false;
      if (
        selectedGroup === 'appliances' &&
        !['ac-refrigerator-washing-machine-repairs', 'fan-mixer-motor-gas-stove-repairs'].includes(s.slug)
      ) {
        return false;
      }
      if (selectedGroup === 'masonry' && s.slug !== 'mason-and-civil-work') return false;
      if (
        selectedGroup === 'finishing' &&
        !['painting-and-putty', 'tiles-and-granite', 'carpenter'].includes(s.slug)
      ) {
        return false;
      }
      if (
        selectedGroup === 'hygiene' &&
        !['cleaning-and-housekeeping', 'other-home-services'].includes(s.slug)
      ) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 selection:bg-amber-100 selection:text-amber-900">
      {/* 3-Zone Clean Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'services' && (
          <div>
            {/* Hero Section */}
            <section className="bg-white border-b border-neutral-200 py-12 sm:py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-md text-xs font-semibold text-neutral-800 mb-4">
                    <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Verified Doorstep Technicians · Transparent Upfront Estimates</span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-extrabold text-neutral-900 tracking-tight leading-[1.15] text-balance">
                    Reliable home repairs and maintenance, booked in seconds.
                  </h1>

                  <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
                    Select from certified electricians, plumbers, carpenters, civil masons, and appliance technicians. Real-time automatic dispatch with verified SMS tracking.
                  </p>

                  {/* Search Bar */}
                  <div className="mt-8 flex flex-col sm:flex-row items-stretch gap-3 max-w-xl">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search issue (e.g. MCB tripping, AC gas, tap leak)..."
                        className="w-full pl-11 pr-4 py-3 text-sm bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:bg-white transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-3 text-xs text-neutral-400 hover:text-neutral-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4-Item Trust Metrics Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-neutral-100 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">45-Min Response</div>
                      <div className="text-neutral-500">Auto-dispatched to nearest technician</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">Certified Experts</div>
                      <div className="text-neutral-500">Background verified & trade tested</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">30-Day Guarantee</div>
                      <div className="text-neutral-500">Post-service warranty on workmanship</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-neutral-100 text-neutral-900 shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900">Verified Updates</div>
                      <div className="text-neutral-500">Instant SMS & WhatsApp alerts</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Services Grid Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">
                    Home Service Categories
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Choose a trade below to view common diagnosis issues and book an inspection slot.
                  </p>
                </div>

                {/* Category Segmented Tabs */}
                <div className="flex items-center gap-1 p-1 bg-neutral-200/60 rounded-lg overflow-x-auto max-w-full">
                  {serviceGroups.map((grp) => (
                    <button
                      key={grp.id}
                      onClick={() => setSelectedGroup(grp.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        selectedGroup === grp.id
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      {grp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Cards Grid (All 10 Categories) */}
              {isLoadingServices ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl border border-neutral-200 p-6 h-64 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-2xl p-12 text-center text-xs text-neutral-500">
                  No service matched your search query "{searchQuery}".
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGroup('all');
                    }}
                    className="block mx-auto mt-2 font-bold text-neutral-900 underline"
                  >
                    View All Services
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onSelectService={handleOpenBooking}
                      onViewDetails={(s) => setDetailModalService(s)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. Customer Dashboard */}
        {activeTab === 'customer' && (
          <CustomerDashboard
            onOpenBookingTracker={(b) => setTrackerBooking(b)}
            onOpenReview={(b) => setReviewBooking(b)}
            onGoToServices={() => setActiveTab('services')}
          />
        )}

        {/* 3. Technician Dashboard */}
        {activeTab === 'technician' && (
          <TechnicianDashboard
            onOpenBookingTracker={(b) => setTrackerBooking(b)}
          />
        )}

        {/* 4. Admin Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            onOpenBookingTracker={(b) => setTrackerBooking(b)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-10 mt-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
              A<span className="text-amber-400">Z</span>
            </div>
            <span className="font-bold text-neutral-800">A to Z All Service</span>
            <span>· Doorstep Home Services & Automated Dispatch</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Customer Helpline: <strong>1800-ATOZ-CARE</strong></span>
            <span>·</span>
            <span>Coverage: 6 Metro Service Zones</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {bookingModalService && (
        <BookingModal
          service={bookingModalService}
          preselectedIssue={bookingModalIssue}
          isOpen={!!bookingModalService}
          onClose={() => {
            setBookingModalService(null);
            setBookingModalIssue(undefined);
          }}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {detailModalService && (
        <ServiceDetailModal
          service={detailModalService}
          isOpen={!!detailModalService}
          onClose={() => setDetailModalService(null)}
          onBookNow={(s, issue) => {
            setDetailModalService(null);
            handleOpenBooking(s, issue);
          }}
        />
      )}

      {trackerBooking && (
        <BookingTrackerModal
          booking={trackerBooking}
          isOpen={!!trackerBooking}
          onClose={() => setTrackerBooking(null)}
          onRateBooking={(b) => {
            setTrackerBooking(null);
            setReviewBooking(b);
          }}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          isOpen={!!reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewSubmitted={() => {
            // refresh data
          }}
        />
      )}

      <AuthModal />
      <NotificationDrawer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  );
}
