import React from 'react';
import { ServiceCategory } from '../types/index.ts';
import {
  X,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ServiceDetailModalProps {
  service: ServiceCategory | null;
  isOpen: boolean;
  onClose: () => void;
  onBookNow: (service: ServiceCategory, issue?: string) => void;
}

export const ServiceDetailModal: React.FC<ServiceDetailModalProps> = ({
  service,
  isOpen,
  onClose,
  onBookNow,
}) => {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {service.categoryGroup}
            </span>
            <h2 className="text-xl font-bold text-neutral-900">{service.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Service Overview
            </h4>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {service.fullDesc}
            </p>
          </div>

          {/* Pricing & Time */}
          <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200/80">
            <div>
              <div className="text-[11px] text-neutral-500">Inspection & Visit Charge</div>
              <div className="text-lg font-bold text-neutral-900 font-mono tabular-nums">
                ₹{service.basePrice}
              </div>
              <div className="text-[10px] text-neutral-400">{service.priceUnit}</div>
            </div>
            <div>
              <div className="text-[11px] text-neutral-500">Estimated Turnaround</div>
              <div className="text-base font-bold text-neutral-800 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span>{service.estimatedTime}</span>
              </div>
            </div>
          </div>

          {/* Common Issues Covered */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Common Issues & Diagnostic Checks
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {service.commonIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-neutral-50/70 hover:bg-neutral-100/70 rounded-lg border border-neutral-100 text-xs text-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{issue}</span>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onBookNow(service, issue);
                    }}
                    className="text-[11px] font-semibold text-neutral-900 hover:underline shrink-0 ml-2"
                  >
                    Book This
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Features / Assurance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Service Guarantees
            </h4>
            <div className="space-y-1.5">
              {service.features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-neutral-600">
                  <ShieldCheck className="w-4 h-4 text-neutral-500" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Note */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {service.priceNote ||
                'Transparent pricing promise: Any required parts or components will be quoted to you with genuine bill before technician starts the physical repair.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onBookNow(service);
            }}
            className="px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Proceed to Booking</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
