import {
  Booking,
  BookingStatus,
  BookingStats,
  Review,
  AppNotification,
  ServiceCategory,
  ServiceArea,
  Technician,
  User,
} from '../types/index.ts';

const TOKEN_KEY = 'atoz_auth_token';
const USER_KEY = 'atoz_auth_user';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  getUser(): User | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser(user: User) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const user = authStorage.getUser();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user?.id) {
    headers['x-user-id'] = user.id;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    async register(data: {
      name: string;
      email: string;
      phone: string;
      address?: string;
      locality?: string;
      password?: string;
    }): Promise<{ user: User; token: string; message: string }> {
      return request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async login(data: { email?: string; phone?: string; password?: string }): Promise<{
      user: User;
      token: string;
      message: string;
    }> {
      return request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async me(): Promise<{ user: User }> {
      return request('/api/auth/me');
    },

    async getUsers(): Promise<User[]> {
      return request('/api/auth/users');
    },
  },

  services: {
    async getAll(): Promise<ServiceCategory[]> {
      return request('/api/services');
    },

    async getById(id: string): Promise<{ service: ServiceCategory; reviews: Review[] }> {
      return request(`/api/services/${id}`);
    },
  },

  serviceAreas: {
    async getAll(): Promise<ServiceArea[]> {
      return request('/api/service-areas');
    },
  },

  technicians: {
    async getAll(): Promise<Technician[]> {
      return request('/api/technicians');
    },
  },

  bookings: {
    async getAll(params?: { status?: string; serviceId?: string; date?: string }): Promise<Booking[]> {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.serviceId) query.set('serviceId', params.serviceId);
      if (params?.date) query.set('date', params.date);

      const url = `/api/bookings${query.toString() ? `?${query.toString()}` : ''}`;
      return request(url);
    },

    async getById(id: string): Promise<Booking> {
      return request(`/api/bookings/${id}`);
    },

    async create(data: {
      serviceId: string;
      subService?: string;
      customerName: string;
      customerPhone: string;
      address: string;
      locality: string;
      preferredDate: string;
      preferredTimeSlot: string;
      problemDescription: string;
      photoUrl?: string;
    }): Promise<{ booking: Booking; message: string }> {
      return request('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async assignTechnician(bookingId: string, technicianId: string, note?: string): Promise<{ booking: Booking; message: string }> {
      return request(`/api/bookings/${bookingId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId, note }),
      });
    },

    async updateStatus(
      bookingId: string,
      status: BookingStatus,
      note?: string,
      cancellationReason?: string
    ): Promise<{ booking: Booking; message: string }> {
      return request(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, note, cancellationReason }),
      });
    },
  },

  reviews: {
    async getAll(params?: { serviceId?: string; technicianId?: string }): Promise<Review[]> {
      const query = new URLSearchParams();
      if (params?.serviceId) query.set('serviceId', params.serviceId);
      if (params?.technicianId) query.set('technicianId', params.technicianId);

      const url = `/api/reviews${query.toString() ? `?${query.toString()}` : ''}`;
      return request(url);
    },

    async create(data: {
      bookingId: string;
      rating: number;
      comment?: string;
    }): Promise<{ review: Review; message: string }> {
      return request('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  notifications: {
    async getAll(): Promise<AppNotification[]> {
      return request('/api/notifications');
    },

    async markAsRead(id: string): Promise<{ success: boolean }> {
      return request(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    async markAllRead(): Promise<{ success: boolean }> {
      return request('/api/notifications/mark-all-read', {
        method: 'POST',
      });
    },
  },

  admin: {
    async getStats(): Promise<BookingStats> {
      return request('/api/admin/stats');
    },
  },
};
