/** 
 * @file ContainerSlot.tsx 
 *
 * Container Slot component 
 * */
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, TrendingUp, Lock, CheckCircle2, Ruler } from 'lucide-react';
import { type Container, type Shipment, type PendingAssignment, AssignmentStatus } from '../types';
import ShipmentCard from './ShipmentCard';


/**
 * Props for ContainerSlot
 *
 * @interface ContainerSlotProps
 * @typedef {ContainerSlotProps}
 * 
 * container
 * shipments
 * pendingForContainer
 */
interface ContainerSlotProps {
  container: Container;
  shipments: Shipment[];
  pendingForContainer: PendingAssignment[];
}


/**
 * ContainerSlot Component
 *
 * @export
 * @param {ContainerSlotProps} paramsObj 
 * @param {Container} paramsObj.container 
 * @param {Shipment[]} paramsObj.shipments 
 * @param {PendingAssignment[]} paramsObj.pendingForContainer 
 * @returns {React.JSX.Element} 
 */
export default function ContainerSlot({
  container,
  shipments,
  pendingForContainer,
}: ContainerSlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: container.id });

  const usagePercent = Math.min(
    Math.round((container.currentWeight / container.maxWeight) * 100),
    100
  );

  // Already locked or succeed
  const isLocking = pendingForContainer.some(p => p.status === AssignmentStatus.pending);
  const isSuccess = pendingForContainer.some(p => p.status === AssignmentStatus.success);

  // Container capacity
  const cappedPercent = Math.min(usagePercent, 100);
  const isNearFull = cappedPercent >= 85;
  const isOverCapacity = container.currentWeight > container.maxWeight;

  const barColor = isOverCapacity
    ? 'bg-red-500'
    : isNearFull
      ? 'bg-amber-400'
      : 'bg-emerald-500';

  const borderClass = isLocking
    ? 'border-amber-400 bg-amber-50/30'
    : isSuccess
      ? 'border-emerald-400 bg-emerald-50/30'
      : isOver
        ? 'border-blue-400 bg-blue-50/50'
        : 'border-slate-200 bg-white';

  return (
    <div
      ref={setNodeRef}
      className={`
        relative flex flex-col rounded-2xl border-2 p-4 transition-colors duration-150
        ${borderClass}
      `}
    >
      {/* Locking overlay */}
      <AnimatePresence>
        {isLocking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-2xl z-10 flex flex-col items-center justify-center gap-2 bg-amber-50/90 backdrop-blur-[1px]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              <Lock className="w-7 h-7 text-amber-500" />
            </motion.div>
            <p className="text-sm font-semibold text-amber-700">
              Acquiring slot lock…
            </p>
            <p className="text-xs text-amber-600">Processing on server</p>
          </motion.div>
        )}

        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 rounded-2xl z-10 flex flex-col items-center justify-center gap-2 bg-emerald-50/90"
          >
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">
              Shipment locked in!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-blue-500 shrink-0" />
            <h3 className="font-semibold text-slate-900 leading-tight">
              {container.name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Ruler className="w-3 h-3" />
            {container.containerSize[0]}×{container.containerSize[1]}×
            {container.containerSize[2]} cm
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-600">
            ₹{container.cost.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400">Slot cost</p>
        </div>
      </div>

      {/* Capacity Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">
            {container.currentWeight} / {container.maxWeight} kg
          </span>
          <span
            className={`font-semibold ${isOverCapacity
              ? 'text-red-600'
              : isNearFull
                ? 'text-amber-600'
                : 'text-emerald-600'
              }`}
          >
            {cappedPercent}%
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            animate={{ width: `${cappedPercent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`
          flex-1 min-h-30 rounded-xl border border-dashed p-2 overflow-y-auto
          transition-colors duration-150
          ${isOver
            ? 'border-blue-400 bg-blue-50/60'
            : 'border-slate-200 bg-slate-50/50'
          }
        `}
      >
        {shipments.length === 0 && !isOver ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6">
            <Box className="w-6 h-6 mb-1 opacity-40" />
            <p className="text-xs">Drop shipments here</p>
          </div>
        ) : isOver && shipments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="border-2 border-dashed border-blue-400 rounded-lg px-4 py-3 text-xs text-blue-500 font-medium">
              Release to assign
            </div>
          </motion.div>
        ) : (
          <div className="space-y-1.5">
            <AnimatePresence>
              {shipments.map(shipment => (
                <motion.div
                  key={shipment.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <ShipmentCard shipment={shipment} isAssigned />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Drop hint when something is dragged over a non-empty container */}
            {isOver && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-2 border-dashed border-blue-400 rounded-lg p-2 text-center text-xs text-blue-500"
              >
                + Add to container
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex justify-between text-[11px] text-slate-400">
        <span>{shipments.length} shipment{shipments.length !== 1 ? 's' : ''}</span>
        <span className="flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" />
          {cappedPercent}% capacity
        </span>
      </div>
    </div>
  );
}