import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { INITIAL_USERS } from '../data/initialData.ts';
import { X, Lock, Mail, Phone, User as UserIcon, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    pendingService,
    login,
    register,
    switchUser,
    closeAuthModal,
    error,
    isLoading,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [locality, setLocality] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sync mode if changed by openAuthModal
  React.useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (mode === 'login') {
        if (!email && !phone) {
          setFormError('Please enter your email or phone number.');
          return;
        }
        await login({ email: email.trim(), phone: phone.trim() });
      } else {
        if (!name.trim()) {
          setFormError('Please provide your full name.');
          return;
        }
        if (!email.trim() || !phone.trim()) {
          setFormError('Email and phone number are required for booking notifications.');
          return;
        }
        await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          locality: locality.trim(),
        });
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              A to Z All Service
            </div>
            <h3 className="text-lg font-bold text-neutral-900">
              {mode === 'login' ? 'Customer Sign In' : 'Create Customer Account'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pending service banner (Returning customer directly to selected service!) */}
        {pendingService && (
          <div className="bg-amber-50 border-b border-amber-200/70 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Sign in to proceed directly with your booking for{' '}
              <strong className="font-semibold">{pendingService.name}</strong>.
            </span>
          </div>
        )}

        <div className="p-6 space-y-5">
          {(formError || error) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Email Address {mode === 'login' ? '(or Phone)' : '*'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. customer@atozservice.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>

            {mode === 'register' ? (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Verified Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>
            ) : null}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Default Street / Flat Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Lotus Residency"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Locality / Area
                  </label>
                  <input
                    type="text"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="e.g. Central City & Downtown"
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {isLoading ? (
                <span>Please wait...</span>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Book' : 'Register & Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center text-xs text-neutral-600">
            {mode === 'login' ? (
              <span>
                New to A to Z Service?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setFormError(null);
                  }}
                  className="font-bold text-neutral-900 underline hover:text-black ml-1"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setFormError(null);
                  }}
                  className="font-bold text-neutral-900 underline hover:text-black ml-1"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          {/* Fast One-Click Demo Switcher */}
          <div className="pt-4 border-t border-neutral-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2 text-center">
              Or Quick Test with Demo Profiles
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => switchUser(INITIAL_USERS[0])}
                className="p-2 border border-neutral-200 hover:border-neutral-400 rounded-lg text-left bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <div className="font-bold text-neutral-900">Priya Sharma</div>
                <div className="text-[10px] text-neutral-500">Customer</div>
              </button>
              <button
                type="button"
                onClick={() => switchUser(INITIAL_USERS[1])}
                className="p-2 border border-neutral-200 hover:border-neutral-400 rounded-lg text-left bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <div className="font-bold text-neutral-900">Ramesh Kumar</div>
                <div className="text-[10px] text-neutral-500">Electrician Tech</div>
              </button>
              <button
                type="button"
                onClick={() => switchUser(INITIAL_USERS[3])}
                className="p-2 border border-neutral-200 hover:border-neutral-400 rounded-lg text-left bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <div className="font-bold text-neutral-900">Manoj Verma</div>
                <div className="text-[10px] text-neutral-500">Appliance Tech</div>
              </button>
              <button
                type="button"
                onClick={() => switchUser(INITIAL_USERS[4])}
                className="p-2 border border-neutral-200 hover:border-neutral-400 rounded-lg text-left bg-neutral-50/50 hover:bg-neutral-100 transition-colors"
              >
                <div className="font-bold text-neutral-900">Vikas Rao</div>
                <div className="text-[10px] text-neutral-500">Operations Admin</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
