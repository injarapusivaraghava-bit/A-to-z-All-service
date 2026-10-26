import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Wrench,
  ShieldCheck,
  CalendarCheck,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { INITIAL_USERS } from '../data/initialData.ts';

interface HeaderProps {
  activeTab: 'services' | 'customer' | 'technician' | 'admin' | 'about';
  setActiveTab: (tab: 'services' | 'customer' | 'technician' | 'admin' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, openAuthModal, switchUser } = useAuth();
  const { unreadCount, setIsOpen: setNotifOpen } = useNotifications();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('services')}
              className="flex items-center gap-2 text-left group focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-neutral-800 transition-colors">
                A<span className="text-amber-400 font-extrabold">Z</span>
              </div>
              <div>
                <span className="text-base font-bold text-neutral-900 tracking-tight leading-none block">
                  A to Z All Service
                </span>
                <span className="text-[11px] text-neutral-500 font-medium tracking-normal block leading-tight">
                  Automatic Home Service Booking
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <button
              onClick={() => setActiveTab('services')}
              className={`hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'services'
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Home Services
            </button>
            <button
              onClick={() => setActiveTab('customer')}
              className={`hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'customer'
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('technician')}
              className={`hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'technician'
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Technician Portal
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`hover:text-neutral-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'admin'
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent'
              }`}
            >
              Operations Admin
            </button>
          </nav>

          {/* Zone 3: Actions & Account Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Notification Bell */}
            <button
              onClick={() => setNotifOpen(true)}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors focus:outline-none"
              title="Notifications & SMS/WhatsApp logs"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile or Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors border border-neutral-200"
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[11px] font-bold uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block max-w-[120px]">
                    <div className="truncate font-semibold text-neutral-900 leading-tight">
                      {user.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold leading-none">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {/* Dropdown Menu & Quick Account Switcher for reviewers */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <div className="font-semibold text-neutral-900 text-sm truncate">{user.name}</div>
                      <div className="text-neutral-500 truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-neutral-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Role: <span className="capitalize font-bold text-neutral-900">{user.role}</span>
                      </div>
                    </div>

                    {/* Quick Demo Switcher */}
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                        Switch Persona (One-Click Test)
                      </div>
                      <div className="space-y-1">
                        {INITIAL_USERS.map((u) => {
                          const isCurrent = u.id === user.id;
                          return (
                            <button
                              key={u.id}
                              onClick={() => {
                                switchUser(u);
                                setIsUserMenuOpen(false);
                                if (u.role === 'technician') setActiveTab('technician');
                                else if (u.role === 'admin') setActiveTab('admin');
                                else setActiveTab('customer');
                              }}
                              className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${
                                isCurrent
                                  ? 'bg-neutral-900 text-white font-medium'
                                  : 'hover:bg-neutral-100 text-neutral-700'
                              }`}
                            >
                              <div className="truncate">
                                <div className="font-medium truncate">{u.name}</div>
                                <div className="text-[10px] opacity-75 capitalize">
                                  {u.role} {u.specialty ? `· ${u.specialty}` : ''}
                                </div>
                              </div>
                              {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation shortcuts */}
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setActiveTab('customer');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <CalendarCheck className="w-4 h-4 text-neutral-500" />
                        My Service Bookings
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('technician');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <Wrench className="w-4 h-4 text-neutral-500" />
                        Technician Jobs Portal
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('admin');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-2 text-neutral-700"
                      >
                        <ShieldCheck className="w-4 h-4 text-neutral-500" />
                        Operations Dispatch Center
                      </button>
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-neutral-100 text-xs font-medium text-neutral-600">
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center py-1 ${activeTab === 'services' ? 'text-neutral-900 font-bold' : ''}`}
          >
            <Home className="w-4 h-4 mb-0.5" />
            Services
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`flex flex-col items-center py-1 ${activeTab === 'customer' ? 'text-neutral-900 font-bold' : ''}`}
          >
            <CalendarCheck className="w-4 h-4 mb-0.5" />
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('technician')}
            className={`flex flex-col items-center py-1 ${activeTab === 'technician' ? 'text-neutral-900 font-bold' : ''}`}
          >
            <Wrench className="w-4 h-4 mb-0.5" />
            Technician
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center py-1 ${activeTab === 'admin' ? 'text-neutral-900 font-bold' : ''}`}
          >
            <ShieldCheck className="w-4 h-4 mb-0.5" />
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
