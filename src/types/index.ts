export type UserRole = 'customer' | 'technician' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  address?: string;
  locality?: string;
  avatar?: string;
  specialty?: string;
  area?: string;
  createdAt: string;
}

export type BookingStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Assigned'
  | 'On the Way'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  categoryGroup: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  basePrice: number;
  priceUnit: string;
  estimatedTime: string;
  commonIssues: string[];
  priceNote?: string;
  features: string[];
}

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
  pincode: string;
  active: boolean;
}

export interface Technician {
  id: string;
  userId: string;
  name: string;
  phone: string;
  specialtyCategories: string[];
  serviceAreas: string[];
  rating: number;
  reviewCount: number;
  jobsCompleted: number;
  isAvailable: boolean;
  avatar?: string;
  experienceYears?: number;
}

export interface StatusHistoryEntry {
  id: string;
  bookingId: string;
  status: BookingStatus;
  updatedByUserId: string;
  updatedByName: string;
  updatedByRole: 'customer' | 'technician' | 'admin' | 'system';
  timestamp: string;
  note?: string;
}

export interface PriceEstimate {
  baseVisit: number;
  estimatedRange: string;
  currency: string;
}

export interface Booking {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  serviceName: string;
  subService?: string;
  address: string;
  locality: string;
  preferredDate: string;
  preferredTimeSlot: string;
  problemDescription: string;
  photoUrl?: string;
  priceEstimate: PriceEstimate;
  status: BookingStatus;
  technicianId?: string;
  technicianName?: string;
  technicianPhone?: string;
  cancellationReason?: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  hasReviewed?: boolean;
}

export interface AppNotification {
  id: string;
  recipientUserId: string;
  recipientRole: UserRole | 'all';
  title: string;
  message: string;
  channel: 'in_app' | 'sms' | 'whatsapp' | 'email';
  deliveryStatus: 'delivered' | 'read' | 'pending';
  bookingId?: string;
  bookingReference?: string;
  timestamp: string;
  isRead: boolean;
  deliveryLog?: {
    channel: 'SMS' | 'WhatsApp' | 'Email' | 'In-App';
    recipientContact: string;
    dispatchedAt: string;
    status: 'SUCCESS' | 'QUEUED';
    providerId: string;
  };
}

export interface Review {
  id: string;
  bookingId: string;
  bookingReference: string;
  customerId: string;
  customerName: string;
  technicianId?: string;
  technicianName?: string;
  serviceId: string;
  serviceName: string;
  rating: number; // 1 to 5
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingStats {
  totalBookings: number;
  pendingCount: number;
  assignedCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  activeTechniciansCount: number;
  averageRating: number;
  totalReviews: number;
}
