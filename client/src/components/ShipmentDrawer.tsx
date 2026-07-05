/** 
 * @file ShipmentDrawer.tsx
 * 
 * ShipmentDrawer component*/
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Package,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import type { Shipment, PendingAssignment, ShipmentPriority as ShipmentPriorityType } from '../types';
import { AssignmentStatus, PRIORITY_META, ShipmentPriority } from '../types';
import ShipmentCard from './ShipmentCard';

/**
 * ShipmentDrawerProps
 *
 * @interface ShipmentDrawerProps
 * @typedef {ShipmentDrawerProps}
 */
interface ShipmentDrawerProps {
    shipments: Shipment[];
    pendingMap: Record<string, PendingAssignment>;
    disappearingIds: Set<string>;
    isOpen: boolean;
    onToggle: () => void;
    isMobile: boolean;
}


/**
 * ShipmentDrawer component
 *
 * @export
 * @param {ShipmentDrawerProps} paramMain 
 * @param {{}} paramMain.shipments 
 * @param {Record<string, PendingAssignment>} paramMain.pendingMap 
 * @param {Set<string>} paramMain.disappearingIds 
 * @param {boolean} paramMain.isOpen 
 * @param {() => void} paramMain.onToggle 
 * @param {boolean} paramMain.isMobile 
 * @returns {React.JSX.Element} 
 */
export default function ShipmentDrawer({
    shipments,
    pendingMap,
    disappearingIds,
    isOpen,
    onToggle,
    isMobile,
}: ShipmentDrawerProps) {
    const [filter, setFilter] = useState<ShipmentPriorityType>(
        ShipmentPriority.All // default filter all
    );

    const normalShipments = shipments.filter(s => !disappearingIds.has(s.id));
    const disappearingShipments = shipments.filter(s =>
        disappearingIds.has(s.id)
    ); // remove disappearingShipments

    const applyFilter = (list: Shipment[]) =>
        filter === ShipmentPriority.All
            ? list
            : list.filter(s => s.priority === filter);

    const filteredNormal = applyFilter(normalShipments);
    const urgentCount = normalShipments.filter(
        s => s.priority === ShipmentPriority.Urgent
    ).length;
    const displayCount = normalShipments.length;

    const content = (
        <div className="flex flex-col h-full">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="font-semibold text-slate-900 text-sm">
                        Unassigned Cargo
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-medium">
                        {displayCount}
                    </span>
                    {urgentCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {urgentCount} urgent
                        </span>
                    )}
                    {disappearingShipments.length > 0 && (
                        <span className="text-[10px] text-slate-400 italic">
                            {disappearingShipments.length} dispatching . . .
                        </span>
                    )}
                </div>
                {isMobile && (
                    <button
                        onClick={onToggle}
                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Priority Filter Tabs */}
            <div className="flex gap-1 px-3 py-2 border-b border-slate-100 shrink-0 overflow-x-auto">
                {([ShipmentPriority.All, ShipmentPriority.Urgent, ShipmentPriority.High, ShipmentPriority.Medium] as const).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors whitespace-nowrap ${filter === f
                            ? f === ShipmentPriority.All
                                ? 'bg-slate-800 text-white'
                                : `${PRIORITY_META[f]?.className ?? ''} border`
                            : 'text-slate-500 hover:bg-slate-100'
                            }`}
                    >
                        {Object.keys(ShipmentPriority).find(
                            key => ShipmentPriority[key as keyof typeof ShipmentPriority] === f
                        ) ?? ''}
                    </button>
                ))}
            </div>

            {/* Shipment List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                <AnimatePresence mode="popLayout">
                    {/* Empty state */}
                    {filteredNormal.length === 0 && disappearingShipments.length === 0 && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-32 text-slate-400"
                        >
                            <Package className="w-8 h-8 mb-2 opacity-40" />
                            <p className="text-sm">
                                {filter === ShipmentPriority.All
                                    ? 'All cargo dispatched'
                                    : `No ${filter} shipments`}
                            </p>
                        </motion.div>
                    )}

                    {/* Normal (available) shipments */}
                    {filteredNormal.map(shipment => (
                        <motion.div
                            key={shipment.id}
                            layout
                            initial={{ opacity: 0, x: -12, height: 0 }}
                            animate={{ opacity: 1, x: 0, height: 'auto' }}
                            exit={{
                                opacity: 0,
                                x: -20,
                                height: 0,
                                marginBottom: 0,
                                transition: { duration: 0.35, ease: 'easeInOut' },
                            }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="mb-2 overflow-hidden"
                        >
                            <ShipmentCard
                                shipment={shipment}
                                status={pendingMap[shipment.id]?.status ?? 'idle'}
                            />
                        </motion.div>
                    ))}

                    {/* Disappearing shipments (assigned, playing exit) */}
                    {disappearingShipments.map(shipment => (
                        <motion.div
                            key={`removing-${shipment.id}`}
                            layout
                            initial={{ opacity: 1, height: 'auto' }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{
                                opacity: 0,
                                height: 0,
                                marginBottom: 0,
                                transition: { duration: 0.4, ease: 'easeInOut' },
                            }}
                            transition={{ duration: 0.3 }}
                            className="mb-2 overflow-hidden"
                        >
                            <ShipmentCard
                                shipment={shipment}
                                status={AssignmentStatus.removing}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Footer summary */}
            <div className="px-4 py-3 border-t border-slate-100 shrink-0 bg-slate-50/80">
                <div className="flex justify-between text-xs text-slate-500">
                    <span>
                        Weight:{' '}
                        <strong className="text-slate-700">
                            {shipments.reduce((sum, s) => sum + s.weight, 0)} kg
                        </strong>
                    </span>
                    <span>
                        Value:{' '}
                        <strong className="text-slate-700">
                            ₹{shipments
                                .reduce((sum, s) => sum + s.shipmentCost, 0)
                                .toLocaleString()}
                        </strong>
                    </span>
                </div>
            </div>
        </div>
    );

    // Desktop: static sidebar
    if (!isMobile) {
        return (
            <aside className="w-72 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full">
                {content}
            </aside>
        );
    }

    // Mobile: bottom drawer
    return (
        <>
            <button
                onClick={onToggle}
                className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg text-sm font-medium"
            >
                <Package className="w-4 h-4" />
                {displayCount} shipments
                {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronUp className="w-4 h-4" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="fixed inset-0 bg-black/30 z-40"
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="drawer"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl flex flex-col"
                        style={{ maxHeight: '70vh' }}
                    >
                        <div className="flex justify-center pt-2.5 pb-1 shrink-0">
                            <div className="w-10 h-1 bg-slate-200 rounded-full" />
                        </div>
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}