/** 
 * @file App.tsx
 * 
 * Main app component */
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Toaster } from 'sonner';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useLogisticsState } from './hooks/useLogisticsState';
import ShipmentCard from './components/ShipmentCard';
import ContainerSlot from './components/ContainerSlot';
import ShipmentDrawer from './components/ShipmentDrawer';
import { type Shipment, type PendingAssignment, AssignmentStatus, type ListPagesType, ListPages } from './types';
import Footer from './components/Footer';
import ReportPage from './Report';


/**
 * App component
 *
 * @export
 * @returns {React.JSX.Element} 
 */
export default function App() {
  const {
    containers,
    availableShipments,
    disappearingIds,
    loading,
    connected,
    pendingMap,
    assignShipment,
    getContainerShipments,
    shipments,
  } = useLogisticsState();

  const [currentPage, setCurrentPage] = useState<ListPagesType>(ListPages.Dashboard);

  // Track which shipment is currently being dragged (for DragOverlay)
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const ship = shipments[String(event.active.id)];
      if (ship) setActiveShipment(ship);
    },
    [shipments]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveShipment(null);

      const { active, over } = event;
      if (!over) return; // dropped in dead zone - overlay disappears, nothing changes

      const shipmentId = String(active.id);
      const targetId = String(over.id);

      // Dropped back on unassigned pool - no-op
      if (targetId === 'unassigned-pool') return;

      await assignShipment(shipmentId, targetId);
    },
    [assignShipment]
  );

  // Group pending assignments by target container
  const pendingByContainer = useCallback(
    (containerId: string): PendingAssignment[] => {
      return Object.values(pendingMap).filter(
        p => p.targetContainerId === containerId
      );
    },
    [pendingMap]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Loading logistics data…</span>
        </div>
      </div>
    );
  }

  if (currentPage === ListPages.Dashboard) {
    return (
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
          <Toaster position="top-center" richColors closeButton expand />

          {/* Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Operational Warp
                </h1>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Collaborative Shipment Dispatch Dashboard
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${connected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                >
                  {connected ? (
                    <Wifi className="w-3.5 h-3.5" />
                  ) : (
                    <WifiOff className="w-3.5 h-3.5" />
                  )}
                  {connected ? 'Connected' : 'Offline'}
                </div>
              </div>
            </div>
          </header>

          {/* Main Layout */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-5">
            <div className="flex gap-5 h-[calc(100vh-80px)]">
              {/* Desktop Sidebar (hidden on mobile) */}
              <div className="hidden lg:flex lg:flex-col w-72 shrink-0 h-full">
                <ShipmentDrawer
                  shipments={availableShipments}
                  pendingMap={pendingMap}
                  disappearingIds={disappearingIds}
                  isOpen={true}
                  onToggle={() => { }}
                  isMobile={false}
                />
              </div>

              {/* Container Grid */}
              <div className="flex-1 overflow-y-auto">
                {/* Stats bar */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {containers.reduce((s, c) => s + c.shipments.length, 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned shipments
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {availableShipments.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Awaiting dispatch
                    </p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-900">
                      {containers.length}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Active containers
                    </p>
                  </div>
                </div>

                {/* Container grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {containers.map(container => (
                    <ContainerSlot
                      key={container.id}
                      container={container}
                      shipments={getContainerShipments(container)}
                      pendingForContainer={pendingByContainer(container.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </main>

          {/* Mobile Drawer (hidden on desktop) */}
          <div className="lg:hidden">
            <ShipmentDrawer
              shipments={availableShipments}
              pendingMap={pendingMap}
              disappearingIds={disappearingIds}
              isOpen={drawerOpen}
              onToggle={() => setDrawerOpen(p => !p)}
              isMobile={true}
            />
          </div>

          {/* Footer: project info */}
          <Footer onViewChange={setCurrentPage} />

          {/* DragOverlay: the card that follows your cursor */}
          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}
          >
            {activeShipment ? (
              <ShipmentCard
                shipment={activeShipment}
                status={AssignmentStatus.idle}

                isOverlay
              />
            ) : null}
          </DragOverlay>
        </div>
      </DndContext>
    );
  }

  if (currentPage === ListPages.Report) {
    return (
      <ReportPage onViewChange={setCurrentPage}></ReportPage>
    );
  }
}