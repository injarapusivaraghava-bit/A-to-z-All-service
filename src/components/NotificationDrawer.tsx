import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext.tsx';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  Smartphone,
  Mail,
  ShieldCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const { notifications, unreadCount, isOpen, setIsOpen, markAsRead, markAllAsRead } =
    useNotifications();
  const [tab, setTab] = useState<'notifications' | 'dispatchLogs'>('notifications');

  if (!isOpen) return null;

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  const getChannelIcon = (ch?: string) => {
    switch (ch?.toLowerCase()) {
      case 'sms':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-green-600" />;
      case 'email':
        return <Mail className="w-4 h-4 text-blue-600" />;
      case 'in_app':
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-neutral-900/50 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-neutral-900" />
              <h2 className="text-base font-bold text-neutral-900">Notifications & Dispatch</h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-neutral-100 text-xs font-semibold px-4 pt-2">
            <button
              onClick={() => setTab('notifications')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                tab === 'notifications'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              In-App Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setTab('dispatchLogs')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                tab === 'dispatchLogs'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              SMS & WhatsApp Logs ({notifications.filter((n) => n.deliveryLog).length})
            </button>
          </div>

          {/* Subheader action */}
          {tab === 'notifications' && notifications.length > 0 && (
            <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-medium">Automatic updates</span>
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            </div>
          )}

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
            {tab === 'notifications' ? (
              notifications.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-xs">
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 transition-colors cursor-pointer ${
                      n.isRead ? 'bg-white hover:bg-neutral-50/70' : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-neutral-100 shrink-0">
                        {getChannelIcon(n.deliveryLog?.channel || n.channel)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-900 leading-snug">
                            {n.title}
                          </h4>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono pt-1">
                          {n.bookingReference && (
                            <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 font-medium">
                              {n.bookingReference}
                            </span>
                          )}
                          <span>{formatTime(n.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              // Verified Dispatch Logs (SMS / WhatsApp / Email)
              notifications.filter((n) => n.deliveryLog).length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-xs">
                  No external message dispatch records yet.
                </div>
              ) : (
                notifications
                  .filter((n) => n.deliveryLog)
                  .map((n) => (
                    <div key={n.id} className="p-4 space-y-2 text-xs bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                          {getChannelIcon(n.deliveryLog?.channel)}
                          <span>{n.deliveryLog?.channel} Gateway Dispatch</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>{n.deliveryLog?.status}</span>
                        </span>
                      </div>

                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-100 text-[11px] font-mono space-y-1 text-neutral-600">
                        <div>Recipient: <strong>{n.deliveryLog?.recipientContact}</strong></div>
                        <div>Provider ID: {n.deliveryLog?.providerId}</div>
                        <div>Dispatched: {formatTime(n.deliveryLog?.dispatchedAt || n.timestamp)}</div>
                      </div>

                      <p className="text-[11px] text-neutral-700 italic border-l-2 border-neutral-300 pl-2">
                        "{n.message}"
                      </p>
                    </div>
                  ))
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
