import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  INITIAL_SERVICES,
  INITIAL_SERVICE_AREAS,
  INITIAL_USERS,
  INITIAL_TECHNICIANS,
  INITIAL_BOOKINGS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
} from './src/data/initialData.ts';
import {
  Booking,
  BookingStatus,
  Review,
  AppNotification,
  Technician,
  User,
  ServiceCategory,
  ServiceArea,
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: User[];
  services: ServiceCategory[];
  serviceAreas: ServiceArea[];
  technicians: Technician[];
  bookings: Booking[];
  reviews: Review[];
  notifications: AppNotification[];
}

// Ensure data directory and initialize DB file
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialDb(): DatabaseSchema {
  return {
    users: INITIAL_USERS,
    services: INITIAL_SERVICES,
    serviceAreas: INITIAL_SERVICE_AREAS,
    technicians: INITIAL_TECHNICIANS,
    bookings: INITIAL_BOOKINGS,
    reviews: INITIAL_REVIEWS,
    notifications: INITIAL_NOTIFICATIONS,
  };
}

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDb();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, resetting to initial state', err);
    const initial = getInitialDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json', err);
  }
}

const app = express();
app.use(express.json({ limit: '15mb' }));

// Auth Middleware
function getUserFromRequest(req: Request, db: DatabaseSchema): User | null {
  const authHeader = req.headers.authorization;
  const customUserId = req.headers['x-user-id'] as string;

  if (customUserId) {
    const found = db.users.find((u) => u.id === customUserId);
    if (found) return found;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      if (userId) {
        const found = db.users.find((u) => u.id === userId);
        if (found) return found;
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

// --- API ROUTES ---

// 1. Auth routes
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, address, locality, password } = req.body;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and verified phone number are required.' });
  }

  const db = readDb();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const newUser: User = {
    id: `usr-customer-${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    phone: phone.trim(),
    role: 'customer',
    address: address?.trim() || '',
    locality: locality?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  writeDb(db);

  const token = Buffer.from(`${newUser.id}:${newUser.role}:${Date.now()}`).toString('base64');
  return res.status(201).json({
    user: newUser,
    token,
    message: 'Customer registration successful!',
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, phone } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Please enter your email or phone number to sign in.' });
  }

  const db = readDb();
  const user = db.users.find((u) => {
    if (email && u.email.toLowerCase() === email.toLowerCase().trim()) return true;
    if (phone && u.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')) return true;
    return false;
  });

  if (!user) {
    return res.status(401).json({ error: 'Account not found. Please check your credentials or register.' });
  }

  const token = Buffer.from(`${user.id}:${user.role}:${Date.now()}`).toString('base64');
  return res.json({
    user,
    token,
    message: `Welcome back, ${user.name}!`,
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized or session expired' });
  }
  return res.json({ user });
});

app.get('/api/auth/users', (_req: Request, res: Response) => {
  const db = readDb();
  // Safe user list for quick account switching & admin
  const sanitized = db.users.map(({ id, name, email, phone, role, specialty, area }) => ({
    id,
    name,
    email,
    phone,
    role,
    specialty,
    area,
  }));
  return res.json(sanitized);
});

// 2. Services
app.get('/api/services', (_req: Request, res: Response) => {
  const db = readDb();
  return res.json(db.services);
});

app.get('/api/services/:id', (req: Request, res: Response) => {
  const db = readDb();
  const service = db.services.find((s) => s.id === req.params.id || s.slug === req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service category not found' });
  }
  const relatedReviews = db.reviews.filter((r) => r.serviceId === service.id);
  return res.json({ service, reviews: relatedReviews });
});

// 3. Service Areas
app.get('/api/service-areas', (_req: Request, res: Response) => {
  const db = readDb();
  return res.json(db.serviceAreas.filter((a) => a.active));
});

// 4. Technicians
app.get('/api/technicians', (_req: Request, res: Response) => {
  const db = readDb();
  return res.json(db.technicians);
});

// 5. Bookings
app.get('/api/bookings', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required to view bookings' });
  }

  let list: Booking[] = [];

  if (user.role === 'admin') {
    list = [...db.bookings];
  } else if (user.role === 'technician') {
    // Find technician profile linked to this user
    const techProfile = db.technicians.find((t) => t.userId === user.id);
    const techId = techProfile ? techProfile.id : null;
    list = db.bookings.filter((b) => b.technicianId === techId || (techProfile && b.technicianName === user.name));
  } else {
    // Customer can only view their own bookings
    list = db.bookings.filter((b) => b.customerId === user.id || b.customerPhone === user.phone);
  }

  // Filter query parameters
  const { status, serviceId, date } = req.query;
  if (status && typeof status === 'string') {
    list = list.filter((b) => b.status.toLowerCase() === status.toLowerCase());
  }
  if (serviceId && typeof serviceId === 'string') {
    list = list.filter((b) => b.serviceId === serviceId);
  }
  if (date && typeof date === 'string') {
    list = list.filter((b) => b.preferredDate === date);
  }

  // Sort newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(list);
});

app.get('/api/bookings/:id', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const booking = db.bookings.find((b) => b.id === req.params.id || b.reference === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  // Check authorization
  if (user.role === 'customer' && booking.customerId !== user.id && booking.customerPhone !== user.phone) {
    return res.status(403).json({ error: 'Access denied: You can only view your own bookings' });
  }

  if (user.role === 'technician') {
    const techProfile = db.technicians.find((t) => t.userId === user.id);
    if (!techProfile || booking.technicianId !== techProfile.id) {
      return res.status(403).json({ error: 'Access denied: Booking not assigned to you' });
    }
  }

  return res.json(booking);
});

// Create Booking
app.post('/api/bookings', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Customer login required before booking a service.' });
  }

  const {
    serviceId,
    subService,
    customerName,
    customerPhone,
    address,
    locality,
    preferredDate,
    preferredTimeSlot,
    problemDescription,
    photoUrl,
  } = req.body;

  if (!serviceId || !address || !locality || !preferredDate || !preferredTimeSlot || !problemDescription) {
    return res.status(400).json({ error: 'All booking fields including address, locality, date, time slot, and problem description are required.' });
  }

  const service = db.services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: 'Invalid service selected.' });
  }

  const reference = `ATOZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const bookingId = `book-${Date.now()}`;
  const now = new Date().toISOString();

  // Find matching available technician for this service and area
  const matchedTech = db.technicians.find(
    (t) =>
      t.isAvailable &&
      t.specialtyCategories.includes(service.id) &&
      t.serviceAreas.some((area) => locality.toLowerCase().includes(area.toLowerCase()) || area.toLowerCase().includes(locality.toLowerCase()))
  );

  const initialStatus: BookingStatus = matchedTech ? 'Assigned' : 'Pending';

  const newBooking: Booking = {
    id: bookingId,
    reference,
    customerId: user.id,
    customerName: customerName || user.name,
    customerPhone: customerPhone || user.phone,
    customerEmail: user.email,
    serviceId: service.id,
    serviceName: service.name,
    subService: subService || service.commonIssues[0] || 'General inspection',
    address,
    locality,
    preferredDate,
    preferredTimeSlot,
    problemDescription,
    photoUrl: photoUrl || undefined,
    priceEstimate: {
      baseVisit: service.basePrice,
      estimatedRange: `₹${service.basePrice} - ₹${service.basePrice * 3}`,
      currency: 'INR',
    },
    status: initialStatus,
    technicianId: matchedTech ? matchedTech.id : undefined,
    technicianName: matchedTech ? matchedTech.name : undefined,
    technicianPhone: matchedTech ? matchedTech.phone : undefined,
    statusHistory: [
      {
        id: `hist-${Date.now()}-1`,
        bookingId,
        status: 'Pending',
        updatedByUserId: user.id,
        updatedByName: user.name,
        updatedByRole: 'customer',
        timestamp: now,
        note: 'Customer requested booking with confirmed summary.',
      },
      ...(matchedTech
        ? [
            {
              id: `hist-${Date.now()}-2`,
              bookingId,
              status: 'Assigned' as BookingStatus,
              updatedByUserId: 'system',
              updatedByName: 'Auto-Dispatch System',
              updatedByRole: 'system' as const,
              timestamp: now,
              note: `Direct match: Assigned to specialist ${matchedTech.name} for ${locality}.`,
            },
          ]
        : [
            {
              id: `hist-${Date.now()}-3`,
              bookingId,
              status: 'Pending' as BookingStatus,
              updatedByUserId: 'system',
              updatedByName: 'Auto-Dispatch System',
              updatedByRole: 'system' as const,
              timestamp: now,
              note: 'Booking awaiting technician assignment by operations dispatch.',
            },
          ]),
    ],
    createdAt: now,
    updatedAt: now,
    hasReviewed: false,
  };

  db.bookings.unshift(newBooking);

  // Generate verified in-app and dispatch notifications
  const notifId1 = `notif-${Date.now()}-cust`;
  const customerNotif: AppNotification = {
    id: notifId1,
    recipientUserId: user.id,
    recipientRole: 'customer',
    title: matchedTech ? 'Booking Confirmed & Technician Assigned' : 'Booking Received — Awaiting Assignment',
    message: matchedTech
      ? `Your booking ${reference} for ${service.name} has been assigned to ${matchedTech.name}. Scheduled for ${preferredDate} (${preferredTimeSlot}).`
      : `Your booking ${reference} for ${service.name} was successfully received. Our operations desk is assigning the nearest certified technician.`,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    bookingId,
    bookingReference: reference,
    timestamp: now,
    isRead: false,
    deliveryLog: {
      channel: 'SMS',
      recipientContact: user.phone,
      dispatchedAt: now,
      status: 'SUCCESS',
      providerId: `SMS-GATEWAY-TX-${Math.floor(100000 + Math.random() * 900000)}`,
    },
  };
  db.notifications.unshift(customerNotif);

  // If technician matched, notify technician
  if (matchedTech) {
    const notifId2 = `notif-${Date.now()}-tech`;
    const techNotif: AppNotification = {
      id: notifId2,
      recipientUserId: matchedTech.userId,
      recipientRole: 'technician',
      title: 'New Service Job Assigned',
      message: `Job ${reference}: ${service.name} at ${address}, ${locality}. Preferred slot: ${preferredDate} (${preferredTimeSlot}).`,
      channel: 'in_app',
      deliveryStatus: 'delivered',
      bookingId,
      bookingReference: reference,
      timestamp: now,
      isRead: false,
      deliveryLog: {
        channel: 'WhatsApp',
        recipientContact: matchedTech.phone,
        dispatchedAt: now,
        status: 'SUCCESS',
        providerId: `WA-DISPATCH-${Math.floor(100000 + Math.random() * 900000)}`,
      },
    };
    db.notifications.unshift(techNotif);
  }

  // Also notify admin desk
  const notifId3 = `notif-${Date.now()}-admin`;
  const adminNotif: AppNotification = {
    id: notifId3,
    recipientUserId: 'usr-admin-1',
    recipientRole: 'admin',
    title: `New Booking ${reference}`,
    message: `${user.name} booked ${service.name} in ${locality}. Status: ${initialStatus}.`,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    bookingId,
    bookingReference: reference,
    timestamp: now,
    isRead: false,
  };
  db.notifications.unshift(adminNotif);

  writeDb(db);

  return res.status(201).json({
    booking: newBooking,
    message: `Booking ${reference} submitted successfully!`,
  });
});

// Admin assign/reassign technician
app.patch('/api/bookings/:id/assign', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Only authorized administrators can assign technicians.' });
  }

  const { technicianId, note } = req.body;
  if (!technicianId) {
    return res.status(400).json({ error: 'Technician ID is required.' });
  }

  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const tech = db.technicians.find((t) => t.id === technicianId);
  if (!tech) {
    return res.status(404).json({ error: 'Technician not found.' });
  }

  const now = new Date().toISOString();
  booking.technicianId = tech.id;
  booking.technicianName = tech.name;
  booking.technicianPhone = tech.phone;
  booking.status = 'Assigned';
  booking.updatedAt = now;

  booking.statusHistory.push({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    status: 'Assigned',
    updatedByUserId: user.id,
    updatedByName: user.name,
    updatedByRole: 'admin',
    timestamp: now,
    note: note || `Technician ${tech.name} assigned by admin operations.`,
  });

  // Notify customer
  db.notifications.unshift({
    id: `notif-${Date.now()}-c`,
    recipientUserId: booking.customerId,
    recipientRole: 'customer',
    title: 'Technician Assigned',
    message: `${tech.name} (${tech.phone}) has been assigned to your booking ${booking.reference}.`,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    bookingId: booking.id,
    bookingReference: booking.reference,
    timestamp: now,
    isRead: false,
    deliveryLog: {
      channel: 'SMS',
      recipientContact: booking.customerPhone,
      dispatchedAt: now,
      status: 'SUCCESS',
      providerId: `SMS-ASSIGN-${Math.floor(100000 + Math.random() * 900000)}`,
    },
  });

  // Notify technician
  db.notifications.unshift({
    id: `notif-${Date.now()}-t`,
    recipientUserId: tech.userId,
    recipientRole: 'technician',
    title: 'New Service Job Assigned',
    message: `Admin assigned you to ${booking.reference}: ${booking.serviceName} at ${booking.address}, ${booking.locality}.`,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    bookingId: booking.id,
    bookingReference: booking.reference,
    timestamp: now,
    isRead: false,
    deliveryLog: {
      channel: 'WhatsApp',
      recipientContact: tech.phone,
      dispatchedAt: now,
      status: 'SUCCESS',
      providerId: `WA-ASSIGN-${Math.floor(100000 + Math.random() * 900000)}`,
    },
  });

  writeDb(db);
  return res.json({ booking, message: `Assigned to ${tech.name} successfully.` });
});

// Update Booking Status (Technician or Admin)
app.patch('/api/bookings/:id/status', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { status, note, cancellationReason } = req.body;
  const validStatuses: BookingStatus[] = [
    'Pending',
    'Confirmed',
    'Assigned',
    'On the Way',
    'In Progress',
    'Completed',
    'Cancelled',
  ];

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Valid booking status required.' });
  }

  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Authorization check
  if (user.role === 'customer') {
    // Customers can only cancel their own pending/confirmed bookings
    if (booking.customerId !== user.id && booking.customerPhone !== user.phone) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (status !== 'Cancelled') {
      return res.status(403).json({ error: 'Customers can only cancel bookings.' });
    }
    if (booking.status === 'In Progress' || booking.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel a booking that is already in progress or completed.' });
    }
  } else if (user.role === 'technician') {
    // Technicians can update bookings assigned to them
    const tech = db.technicians.find((t) => t.userId === user.id);
    if (!tech || booking.technicianId !== tech.id) {
      return res.status(403).json({ error: 'You are only authorized to update bookings assigned to you.' });
    }
  }

  const now = new Date().toISOString();
  booking.status = status;
  booking.updatedAt = now;
  if (cancellationReason) {
    booking.cancellationReason = cancellationReason;
  }

  // If completed, update technician jobs completed count
  if (status === 'Completed' && booking.technicianId) {
    const tech = db.technicians.find((t) => t.id === booking.technicianId);
    if (tech) {
      tech.jobsCompleted = (tech.jobsCompleted || 0) + 1;
    }
  }

  booking.statusHistory.push({
    id: `hist-${Date.now()}`,
    bookingId: booking.id,
    status,
    updatedByUserId: user.id,
    updatedByName: user.name,
    updatedByRole: user.role,
    timestamp: now,
    note: note || cancellationReason || `Status updated to ${status}`,
  });

  // Notify customer
  db.notifications.unshift({
    id: `notif-${Date.now()}-status`,
    recipientUserId: booking.customerId,
    recipientRole: 'customer',
    title: `Booking Status: ${status}`,
    message: `Your service booking ${booking.reference} is now "${status}". ${note ? `Note: ${note}` : ''}`,
    channel: 'in_app',
    deliveryStatus: 'delivered',
    bookingId: booking.id,
    bookingReference: booking.reference,
    timestamp: now,
    isRead: false,
    deliveryLog: {
      channel: 'SMS',
      recipientContact: booking.customerPhone,
      dispatchedAt: now,
      status: 'SUCCESS',
      providerId: `SMS-STATUS-${Math.floor(100000 + Math.random() * 900000)}`,
    },
  });

  writeDb(db);
  return res.json({ booking, message: `Status updated to ${status}` });
});

// 6. Reviews & Ratings
app.get('/api/reviews', (req: Request, res: Response) => {
  const db = readDb();
  const { serviceId, technicianId } = req.query;
  let reviews = [...db.reviews];
  if (serviceId) {
    reviews = reviews.filter((r) => r.serviceId === serviceId);
  }
  if (technicianId) {
    reviews = reviews.filter((r) => r.technicianId === technicianId);
  }
  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json(reviews);
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.status(401).json({ error: 'Customer login required to submit a review' });
  }

  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valid booking ID and a star rating between 1 and 5 are required.' });
  }

  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  // Must be the customer who made the booking
  if (booking.customerId !== user.id && booking.customerPhone !== user.phone) {
    return res.status(403).json({ error: 'You can only review bookings made under your account.' });
  }

  // Requirement: Allow customer to rate a booking only after it is marked Completed
  if (booking.status !== 'Completed') {
    return res.status(400).json({ error: 'Ratings can only be submitted for completed services.' });
  }

  // Requirement: Allow only one rating per completed booking (or safe edit if already exists)
  const existingReviewIndex = db.reviews.findIndex((r) => r.bookingId === booking.id);
  const now = new Date().toISOString();

  let review: Review;
  if (existingReviewIndex >= 0) {
    // Safe update
    review = db.reviews[existingReviewIndex];
    review.rating = Number(rating);
    review.comment = comment?.trim() || '';
    review.updatedAt = now;
  } else {
    review = {
      id: `rev-${Date.now()}`,
      bookingId: booking.id,
      bookingReference: booking.reference,
      customerId: user.id,
      customerName: user.name,
      technicianId: booking.technicianId,
      technicianName: booking.technicianName,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      rating: Number(rating),
      comment: comment?.trim() || '',
      createdAt: now,
    };
    db.reviews.unshift(review);
    booking.hasReviewed = true;
  }

  // Recalculate technician rating aggregate if assigned
  if (booking.technicianId) {
    const tech = db.technicians.find((t) => t.id === booking.technicianId);
    if (tech) {
      const techReviews = db.reviews.filter((r) => r.technicianId === tech.id);
      const totalScore = techReviews.reduce((sum, r) => sum + r.rating, 0);
      tech.reviewCount = techReviews.length;
      tech.rating = Number((totalScore / techReviews.length).toFixed(2));
    }
  }

  writeDb(db);
  return res.status(201).json({ review, message: 'Thank you for your rating!' });
});

// 7. Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user) {
    return res.json([]);
  }

  // Filter by user ID or user role or 'all'
  const notifs = db.notifications.filter(
    (n) => n.recipientUserId === user.id || n.recipientRole === user.role || n.recipientRole === 'all'
  );

  notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return res.json(notifs);
});

app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
  const db = readDb();
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    notif.deliveryStatus = 'read';
    writeDb(db);
  }
  return res.json({ success: true });
});

app.post('/api/notifications/mark-all-read', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);
  if (user) {
    db.notifications.forEach((n) => {
      if (n.recipientUserId === user.id || n.recipientRole === user.role) {
        n.isRead = true;
      }
    });
    writeDb(db);
  }
  return res.json({ success: true });
});

// 8. Admin Statistics
app.get('/api/admin/stats', (req: Request, res: Response) => {
  const db = readDb();
  const user = getUserFromRequest(req, db);

  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin permission required' });
  }

  const totalBookings = db.bookings.length;
  const pendingCount = db.bookings.filter((b) => b.status === 'Pending').length;
  const assignedCount = db.bookings.filter((b) => b.status === 'Assigned' || b.status === 'Confirmed').length;
  const inProgressCount = db.bookings.filter((b) => b.status === 'On the Way' || b.status === 'In Progress').length;
  const completedCount = db.bookings.filter((b) => b.status === 'Completed').length;
  const cancelledCount = db.bookings.filter((b) => b.status === 'Cancelled').length;
  const activeTechniciansCount = db.technicians.filter((t) => t.isAvailable).length;

  const totalReviews = db.reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((db.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2))
      : 5.0;

  return res.json({
    totalBookings,
    pendingCount,
    assignedCount,
    inProgressCount,
    completedCount,
    cancelledCount,
    activeTechniciansCount,
    averageRating: avgRating,
    totalReviews,
  });
});

// Mount Vite or serve static
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`A to Z All Service Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
