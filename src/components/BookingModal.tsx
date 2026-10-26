import React, { useState, useEffect } from 'react';
import { ServiceCategory, ServiceArea, Booking } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import { api } from '../services/api.ts';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Camera,
  Check,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Upload,
} from 'lucide-react';

interface BookingModalProps {
  service: ServiceCategory;
  preselectedIssue?: string;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  service,
  preselectedIssue,
  isOpen,
  onClose,
  onBookingSuccess,
}) => {
  const { user, openAuthModal } = useAuth();
  const { refreshNotifications } = useNotifications();

  const [step, setStep] = useState<'form' | 'summary' | 'success'>('form');
  const [serviceAreas, setServiceAreas] = useState<ServiceArea[]>([]);

  // Form state
  const [subService, setSubService] = useState<string>(preselectedIssue || service.commonIssues[0] || '');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(user?.phone || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [locality, setLocality] = useState<string>(user?.locality || '');
  const [preferredDate, setPreferredDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>('10:00 AM - 01:00 PM');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Sync user info if user changes or logs in
  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerPhone) setCustomerPhone(user.phone);
      if (!address && user.address) setAddress(user.address);
      if (!locality && user.locality) setLocality(user.locality);
    }
  }, [user]);

  // Load service areas
  useEffect(() => {
    async function loadAreas() {
      try {
        const areas = await api.serviceAreas.getAll();
        setServiceAreas(areas);
        if (!locality && areas.length > 0) {
          setLocality(areas[0].name);
        }
      } catch (err) {
        console.warn('Could not load service areas', err);
      }
    }
    loadAreas();
  }, []);

  // Update subService when preselectedIssue changes
  useEffect(() => {
    if (preselectedIssue) {
      setSubService(preselectedIssue);
    }
  }, [preselectedIssue]);

  if (!isOpen) return null;

  // Handle Photo upload / preview
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photo size should be less than 5MB.');
      return;
    }

    setIsPhotoLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      setIsPhotoLoading(false);
      setErrorMessage(null);
    };
    reader.onerror = () => {
      setIsPhotoLoading(false);
      setErrorMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleProceedToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Require login check first
    if (!user) {
      openAuthModal('login', service);
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please provide your name and verified phone number.');
      return;
    }

    if (!address.trim() || !locality.trim()) {
      setErrorMessage('Please enter the service delivery address and select your locality.');
      return;
    }

    if (!preferredDate || !preferredTimeSlot) {
      setErrorMessage('Please select a preferred service date and time slot.');
      return;
    }

    if (!problemDescription.trim() || problemDescription.trim().length < 10) {
      setErrorMessage('Please describe the problem in at least 10 characters so the technician arrives prepared.');
      return;
    }

    setStep('summary');
  };

  const handleConfirmAndSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.bookings.create({
        serviceId: service.id,
        subService,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        address: address.trim(),
        locality: locality.trim(),
        preferredDate,
        preferredTimeSlot,
        problemDescription: problemDescription.trim(),
        photoUrl: photoUrl || undefined,
      });

      setConfirmedBooking(res.booking);
      setStep('success');
      await refreshNotifications();
      onBookingSuccess(res.booking);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    '09:00 AM - 12:00 PM (Morning)',
    '12:00 PM - 03:00 PM (Afternoon)',
    '03:00 PM - 06:00 PM (Evening)',
    '06:00 PM - 08:30 PM (Late Evening)',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
        {/* Top Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {step === 'form' && 'Step 1 of 2 · Booking Details'}
              {step === 'summary' && 'Step 2 of 2 · Confirm Booking'}
              {step === 'success' && 'Booking Confirmed'}
            </div>
            <h2 className="text-lg font-bold text-neutral-900 leading-snug">
              {service.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth prompt banner if not logged in */}
        {!user && step === 'form' && (
          <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Customer login required to book. Sign in now and we will save your inputs.</span>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login', service)}
              className="text-xs font-bold text-amber-950 underline hover:text-black ml-2 whitespace-nowrap"
            >
              Sign In / Register
            </button>
          </div>
        )}

        {/* Error notice */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Content By Step */}
        {step === 'form' && (
          <form onSubmit={handleProceedToSummary} className="p-6 space-y-5">
            {/* 1. Sub-service / Common Issue */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Service Issue / Focus Area
              </label>
              <select
                value={subService}
                onChange={(e) => setSubService(e.target.value)}
                className="w-full text-xs font-medium border border-neutral-300 rounded-lg px-3 py-2.5 bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              >
                {service.commonIssues.map((issue, idx) => (
                  <option key={idx} value={issue}>
                    {issue}
                  </option>
                ))}
                <option value="Other customized issue">Other / Custom inspection</option>
              </select>
            </div>

            {/* 2. Customer Contact details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Customer Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Verified Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            </div>

            {/* 3. Address and Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Door / Flat / Street Address *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat / House No., Building Name, Street"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Locality / Service Area *
                </label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full py-2 px-3 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                >
                  {serviceAreas.map((area) => (
                    <option key={area.id} value={area.name}>
                      {area.name} ({area.pincode})
                    </option>
                  ))}
                  {serviceAreas.length === 0 && (
                    <option value="Central City & Downtown">Central City & Downtown</option>
                  )}
                </select>
              </div>
            </div>

            {/* 4. Preferred Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Preferred Service Date *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Preferred Time Slot *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <select
                    value={preferredTimeSlot}
                    onChange={(e) => setPreferredTimeSlot(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    {timeSlots.map((slot, idx) => (
                      <option key={idx} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 5. Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Detailed Problem Description *
              </label>
              <textarea
                required
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Explain the issue (e.g. MCB sparks whenever the heater is turned on, tap has continuous drip from base)..."
                className="w-full p-3 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <div className="text-[11px] text-neutral-400 mt-1">
                Minimum 10 characters. Helps technician bring the correct spare parts.
              </div>
            </div>

            {/* 6. Optional Photo */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Optional Photo of the Problem
              </label>
              {photoUrl ? (
                <div className="relative inline-block border border-neutral-200 rounded-lg overflow-hidden group">
                  <img
                    src={photoUrl}
                    alt="Problem attachment"
                    className="h-28 w-44 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="absolute top-1.5 right-1.5 bg-neutral-900/80 hover:bg-neutral-900 text-white rounded-full p-1"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 bg-neutral-50/50 cursor-pointer transition-colors">
                  <Camera className="w-5 h-5 text-neutral-500" />
                  <div className="text-xs text-neutral-600">
                    <span className="font-semibold text-neutral-900">Upload or snap photo</span> (JPEG/PNG up to 5MB)
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Price Estimate Card */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-neutral-700">Estimated Inspection & Visiting Fee:</span>
                <span className="font-bold text-neutral-900 text-sm font-mono tabular-nums">
                  ₹{service.basePrice}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                {service.priceNote ||
                  'Visiting charge covers expert diagnosis and travel. Spare parts and extensive repairs are quoted transparently on-site before work begins.'}
              </p>
            </div>

            {/* Form Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Review Booking Summary</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Summary & Confirmation */}
        {step === 'summary' && (
          <div className="p-6 space-y-5">
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-3.5 text-xs">
              <div className="flex justify-between border-b border-neutral-200/70 pb-2.5">
                <span className="text-neutral-500">Service Category:</span>
                <span className="font-bold text-neutral-900">{service.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200/70 pb-2.5">
                <span className="text-neutral-500">Specific Issue:</span>
                <span className="font-medium text-neutral-800">{subService}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200/70 pb-2.5">
                <span className="text-neutral-500">Customer:</span>
                <span className="font-medium text-neutral-800">{customerName} ({customerPhone})</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200/70 pb-2.5">
                <span className="text-neutral-500">Service Location:</span>
                <span className="font-medium text-neutral-800 text-right max-w-xs">{address}, {locality}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200/70 pb-2.5">
                <span className="text-neutral-500">Scheduled Slot:</span>
                <span className="font-semibold text-neutral-900">{preferredDate} · {preferredTimeSlot}</span>
              </div>
              <div>
                <span className="text-neutral-500 block mb-1">Issue Details:</span>
                <p className="bg-white p-2.5 rounded border border-neutral-200 text-neutral-700 italic">
                  "{problemDescription}"
                </p>
              </div>
              {photoUrl && (
                <div className="pt-1">
                  <span className="text-neutral-500 block mb-1">Attached Photo:</span>
                  <img src={photoUrl} alt="Issue" className="h-20 w-32 object-cover rounded border" />
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-neutral-200 text-neutral-900">
                <span className="font-bold">Base Visit & Inspection Fee:</span>
                <span className="font-bold text-sm font-mono tabular-nums">₹{service.basePrice}</span>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/70 rounded-lg p-3 text-xs text-emerald-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>Automatic Dispatch & SMS Notification:</strong> Once confirmed, an automated SMS/WhatsApp dispatch record will be created and the nearest available technician in {locality} will be notified.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAndSubmit}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <span>Submitting & Dispatching...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Confirm & Book Service</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success Screen */}
        {step === 'success' && confirmedBooking && (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-1">
                Booking Successfully Placed!
              </h3>
              <p className="text-xs text-neutral-600">
                Your booking reference number is:
              </p>
              <div className="inline-block mt-2 px-4 py-1.5 bg-neutral-100 border border-neutral-200 rounded-lg font-mono font-bold text-base text-neutral-900 tracking-wider">
                {confirmedBooking.reference}
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left text-xs max-w-md mx-auto space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Initial Status:</span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {confirmedBooking.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Service:</span>
                <span className="font-semibold text-neutral-900">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Scheduled:</span>
                <span className="font-semibold text-neutral-900">{confirmedBooking.preferredDate} ({confirmedBooking.preferredTimeSlot.split(' ')[0]})</span>
              </div>
              {confirmedBooking.technicianName ? (
                <div className="flex justify-between text-emerald-700 font-medium pt-1 border-t border-neutral-200">
                  <span>Assigned Specialist:</span>
                  <span>{confirmedBooking.technicianName} ({confirmedBooking.technicianPhone})</span>
                </div>
              ) : (
                <div className="flex justify-between text-amber-700 font-medium pt-1 border-t border-neutral-200">
                  <span>Technician:</span>
                  <span>Awaiting assignment by Operations desk</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-500 max-w-sm mx-auto">
              An automated notification has been logged and sent to your contact {confirmedBooking.customerPhone}. You can track technician arrival and status in the My Bookings portal.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
