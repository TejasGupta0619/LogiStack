/** 
 * @file ShipmentCard.tsx 
 * 
 * ShipmentCard Component */
import { motion } from 'framer-motion';
import { Package, MapPin, Weight, DollarSign } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { type Shipment, AssignmentStatus } from '../types';
import { PRIORITY_META } from '../types';


/**
 * ShipmentCardProps
 *
 * @interface ShipmentCardProps
 * @typedef {ShipmentCardProps}
 */
interface ShipmentCardProps {
  shipment: Shipment;
  status?: AssignmentStatus;
  isOverlay?: boolean;
  isAssigned?: boolean;
}


/**
 * ShipmentCard Component
 *
 * @export
 * @param {ShipmentCardProps} paramMain 
 * @param {Shipment} paramMain.shipment 
 * @param {AssignmentStatus} [paramMain.status=AssignmentStatus.idle] 
 * @param {boolean} [paramMain.isOverlay=false] 
 * @param {boolean} [paramMain.isAssigned=false] 
 * @returns {React.JSX.Element} 
 */
export default function ShipmentCard({
  shipment,
  status = AssignmentStatus.idle,
  isOverlay = false,
  isAssigned = false,
}: ShipmentCardProps) {
  const isDisabled = isAssigned || status === AssignmentStatus.pending;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: shipment.id,
      disabled: isDisabled || isOverlay, // overlay never registers as draggable
    });

  const priority = PRIORITY_META[shipment.priority];

  // Only apply dnd transform when NOT overlay (overlay is positioned by DragOverlay itself)
  const dndStyle = isOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform) };

  // state management
  const isRemoving = status === AssignmentStatus.removing;
  const isPending = status === AssignmentStatus.pending;
  const isFailed = status === AssignmentStatus.failed;
  const isSuccess = status === AssignmentStatus.success;

  return (
    <motion.div
      ref={isOverlay ? undefined : setNodeRef}
      style={dndStyle}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      layout={!isOverlay && !isDragging && !isRemoving} // animation only when settled
      initial={false}
      animate={
        isFailed
          ? { x: [0, -8, 8, -6, 6, -3, 3, 0], opacity: 1 }
          : isSuccess
            ? { scale: [1, 1.02, 1], opacity: 1 }
            : isRemoving
              ? { opacity: 0.4, scale: 0.97, filter: 'grayscale(60%)' }
              : { opacity: 1, scale: 1, x: 0 }
      }
      transition={
        isFailed
          ? { duration: 0.35, ease: 'easeInOut' }
          : isRemoving
            ? { duration: 0.3, ease: 'easeOut' }
            : { duration: 0.2 }
      }
      className={[
        'relative rounded-xl border p-3.5 select-none touch-none',
        'transition-shadow duration-150',
        isOverlay
          ? 'bg-white border-blue-400 shadow-2xl ring-2 ring-blue-400 cursor-grabbing'
          : '',
        isDragging && !isOverlay ? 'opacity-30 border-dashed bg-slate-50' : '',
        isRemoving
          ? 'bg-slate-50 border-slate-200 cursor-default pointer-events-none opacity-50'
          : '',
        !isDragging && !isOverlay && !isDisabled && !isRemoving
          ? 'bg-white border-slate-200 cursor-grab hover:border-slate-300 hover:shadow-md active:cursor-grabbing'
          : '',
        isAssigned ? 'bg-slate-50 border-slate-200 cursor-default' : '',
        isPending && !isOverlay ? 'bg-blue-50 border-blue-300 cursor-wait' : '',
        isFailed ? 'bg-red-50 border-red-300' : '',
        isSuccess ? 'bg-emerald-50 border-emerald-300' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Package
            className={`w-3.5 h-3.5 shrink-0 ${isRemoving ? 'text-slate-300' : 'text-slate-400'}`}
          />
          <span
            className={`font-semibold text-sm truncate ${isRemoving ? 'text-slate-400' : 'text-slate-800'
              }`}
          >
            {shipment.name}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border shrink-0 ${isRemoving
            ? 'bg-slate-100 text-slate-400 border-slate-200'
            : priority.className
            }`}
        >
          {isRemoving ? 'DISPATCHED' : priority.label}
        </span>
      </div>

      {/* Route */}
      <div
        className={`flex items-center gap-1 text-xs mb-2 truncate ${isRemoving ? 'text-slate-400' : 'text-slate-500'
          }`}
      >
        <MapPin className="w-3 h-3 shrink-0 text-slate-300" />
        <span className="truncate">
          {shipment.origin}
          <span className="mx-1 text-slate-300">→</span>
          {shipment.destination}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Weight className="w-3 h-3 text-slate-300" />
          <span className={isRemoving ? 'text-slate-400' : 'text-slate-700 font-medium'}>
            {shipment.weight} kg
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-slate-300" />
          <span className={isRemoving ? 'text-slate-400' : ''}>
            ₹{shipment.shipmentCost.toLocaleString()}
          </span>
        </div>
        <div className="text-[10px] text-slate-300 ml-auto">
          {shipment.shipmentSize[0]}×{shipment.shipmentSize[1]}×
          {shipment.shipmentSize[2]} cm
        </div>
      </div>

      {/* Pending overlay */}
      {isPending && !isOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-xl bg-blue-50/85 flex items-center justify-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="text-xs font-semibold text-blue-700">
            Locking slot…
          </span>
        </motion.div>
      )}

      {/* Success flash overlay */}
      {isSuccess && !isOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 rounded-xl bg-emerald-50/85 flex items-center justify-center gap-2"
        >
          <span className="text-xs font-semibold text-emerald-700">
            ✓ Assigned!
          </span>
        </motion.div>
      )}

      {/* Removing overlay */}
      {isRemoving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl bg-slate-100/60 flex items-center justify-center"
        >
          <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
            Dispatched
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}