import React from 'react';
import { ServiceCategory } from '../types/index.ts';
import {
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Layers,
  Tv,
  Cpu,
  Sparkles,
  Wrench,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface ServiceCardProps {
  service: ServiceCategory;
  onSelectService: (service: ServiceCategory, issue?: string) => void;
  onViewDetails: (service: ServiceCategory) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onSelectService,
  onViewDetails,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-6 h-6 text-amber-500" />;
      case 'Droplets':
        return <Droplets className="w-6 h-6 text-sky-500" />;
      case 'Hammer':
        return <Hammer className="w-6 h-6 text-amber-700" />;
      case 'BrickWall':
        return <Layers className="w-6 h-6 text-stone-600" />;
      case 'Paintbrush':
        return <Paintbrush className="w-6 h-6 text-indigo-500" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-emerald-600" />;
      case 'Tv':
        return <Tv className="w-6 h-6 text-blue-600" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-violet-600" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-teal-500" />;
      case 'Wrench':
      default:
        return <Wrench className="w-6 h-6 text-neutral-700" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200/90 hover:border-neutral-300 transition-all duration-200 hover:shadow-md flex flex-col justify-between p-5 group">
      <div>
        {/* Header: Icon + Category metadata */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            {getIcon(service.iconName)}
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">
              {service.categoryGroup}
            </span>
            <div className="text-sm font-bold text-neutral-900 font-mono tabular-nums">
              ₹{service.basePrice}
            </div>
            <span className="text-[10px] text-neutral-400 block leading-tight">
              {service.priceUnit}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-neutral-900 mb-1.5 leading-snug group-hover:text-neutral-800">
          {service.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-neutral-600 mb-3.5 line-clamp-2 leading-relaxed">
          {service.shortDesc}
        </p>

        {/* Turnaround Time */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-3">
          <Clock className="w-3.5 h-3.5 text-neutral-400" />
          <span>Turnaround: <strong className="text-neutral-700 font-medium">{service.estimatedTime}</strong></span>
        </div>

        {/* Common Issues Selection (Instant Pre-fill) */}
        <div className="mb-4">
          <div className="text-[11px] font-medium text-neutral-500 mb-1.5">Common Fixes:</div>
          <div className="space-y-1">
            {service.commonIssues.slice(0, 3).map((issue, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectService(service, issue)}
                className="w-full text-left text-[11px] text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 px-2 py-1 rounded transition-colors flex items-center gap-1.5 truncate group/item"
              >
                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate group-hover/item:underline">{issue}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-neutral-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(service)}
          className="flex-1 px-3 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg transition-colors text-center"
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => onSelectService(service)}
          className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>Book Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
