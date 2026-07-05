/**
 * @file useLogisticsState.ts
 *
 * Custom Hook useLogisticsState*/
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  type Shipment,
  type Container,
  type CollisionResponse,
  type SSEEvent,
  type PendingAssignment,
  AssignmentStatus,
  SSEEventType,
} from "../types";

//backend url hardcode in development
const API_BASE = "https://logi-stack-svr.vercel.app";

// duration exit animation plays before the card is truly gone
const REMOVE_ANIMATION_MS = 500;

/**
 * useLogisticsState
 *
 * returns object
 *
 * @export
 * @returns {{ shipments: Record<string, Shipment>; containers: Container[]; availableShipments: Shipment[]; disappearingIds: Set<string>; loading: boolean; connected: boolean; pendingMap: Record<string, PendingAssignment>; assignShipment: (shipmentId: string, containerId: string) => Promise<boolean>; getContainerShipments: (container: Container) => Shipment[] }}
 */
export function useLogisticsState() {
  // States
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  // Per-shipment assignment tracking
  const [pendingMap, setPendingMap] = useState<
    Record<string, PendingAssignment>
  >({});

  /**
   * disappearingIds: shipment IDs that have been assigned (either by this
   * client or another via SSE) and are currently playing their exit
   * animation in the drawer before being removed from the DOM.
   *
   * Lifecycle:
   *   assigned -> add to disappearingIds (status: 'removing')
   *            -> REMOVE_ANIMATION_MS later -> remove from disappearingIds
   *            -> AnimatePresence detects exit -> plays exit animation
   */
  const [disappearingIds, setDisappearingIds] = useState<Set<string>>(
    new Set(),
  );

  // Timers so we can cancel if needed
  const removeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  // Snapshots for rollback
  const snapshots = useRef<
    Map<
      string,
      { shipments: Record<string, Shipment>; containers: Container[] }
    >
  >(new Map());

  //  Helpers

  /**
   * Marks a shipment as "removing" so the drawer plays exit animation,
   * then after REMOVE_ANIMATION_MS it disappears from the list naturally
   * (because availableShipments derivation already excludes assigned ones).
   */
  const scheduleRemoval = useCallback((shipmentId: string) => {
    // If already scheduled, don't double-schedule
    if (removeTimers.current.has(shipmentId)) return;

    // Set removing status immediately
    setPendingMap((prev) => ({
      ...prev,
      [shipmentId]: {
        ...(prev[shipmentId] ?? {
          shipmentId,
          targetContainerId: "",
          startedAt: Date.now(),
        }),
        status: AssignmentStatus.removing,
      },
    }));

    setDisappearingIds((prev) => new Set([...prev, shipmentId]));

    // After animation, clear the pending entry
    // (the card will already be gone from availableShipments
    //  via the containers state, AnimatePresence handles DOM removal)
    const timer = setTimeout(() => {
      setPendingMap((prev) => {
        const next = { ...prev };
        delete next[shipmentId];
        return next;
      });
      setDisappearingIds((prev) => {
        const next = new Set(prev);
        next.delete(shipmentId);
        return next;
      });
      removeTimers.current.delete(shipmentId);
    }, REMOVE_ANIMATION_MS);

    removeTimers.current.set(shipmentId, timer);
  }, []);

  /**
   * Cancel a scheduled removal (used on rollback).
   */
  const cancelRemoval = useCallback((shipmentId: string) => {
    const timer = removeTimers.current.get(shipmentId);
    if (timer) {
      clearTimeout(timer);
      removeTimers.current.delete(shipmentId);
    }
    setDisappearingIds((prev) => {
      const next = new Set(prev);
      next.delete(shipmentId);
      return next;
    });
  }, []);

  //  Initial Fetch

  const fetchInitialData = useCallback(async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`${API_BASE}/api/shipments`),
        fetch(`${API_BASE}/api/containers`),
      ]);

      if (!sRes.ok || !cRes.ok) throw new Error("Server error");

      const shipmentsList: Shipment[] = await sRes.json();
      const containersList: Container[] = await cRes.json();

      const map: Record<string, Shipment> = {};
      shipmentsList.forEach((s) => {
        map[s.id] = s;
      });

      setShipments(map);
      setContainers(containersList);
    } catch {
      toast.error("Failed to load logistics data");
    } finally {
      setLoading(false);
    }
  }, []);

  //  SSE

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/events`);

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data);

        switch (data.type) {
          case SSEEventType.initial_state: {
            const map: Record<string, Shipment> = {};
            data.payload.shipments.forEach((s) => {
              map[s.id] = s;
            });
            setShipments(map);
            setContainers(data.payload.containers);
            setLoading(false);
            break;
          }

          case SSEEventType.shipment_assigned: {
            const { shipmentId, containerId } = data.payload;

            setContainers((prev) =>
              prev.map((c) => {
                if (c.id === containerId) {
                  if (c.shipments.includes(shipmentId)) return c;
                  return {
                    ...c,
                    shipments: [...c.shipments, shipmentId],
                  };
                }
                return {
                  ...c,
                  shipments: c.shipments.filter((id) => id !== shipmentId),
                };
              }),
            );

            /**
             * This SSE fires for ALL clients including the one who
             * triggered it. For the originating client, the shipment
             * is already in 'success' -> 'removing' pipeline.
             * For OTHER clients, we need to trigger removal here.
             *
             * We check: if this shipmentId is NOT already in our
             * pendingMap (meaning we didn't originate this drag),
             * schedule the removal animation now.
             */
            setPendingMap((prev) => {
              if (!prev[shipmentId]) {
                // External assignment from another client
                scheduleRemoval(shipmentId);
              }
              return prev; // no change to map itself here
            });

            break;
          }

          case SSEEventType.container_updated: {
            const { containerId, currentWeight, shipments: ids } = data.payload;
            setContainers((prev) =>
              prev.map((c) =>
                c.id === containerId
                  ? { ...c, currentWeight, shipments: ids }
                  : c,
              ),
            );
            break;
          }
        }
      } catch (e) {
        console.error("SSE parse error", e);
      }
    };

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [scheduleRemoval]); // scheduleRemoval is stable (useCallback + no deps)

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      removeTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  //  Assign Action

  const assignShipment = useCallback(
    async (shipmentId: string, containerId: string): Promise<boolean> => {
      const shipment = shipments[shipmentId];
      if (!shipment) return false;

      if (pendingMap[shipmentId]?.status === AssignmentStatus.pending) {
        toast.warning("This shipment is already being processed");
        return false;
      }

      // Snapshot
      snapshots.current.set(shipmentId, {
        shipments: { ...shipments },
        containers: structuredClone(containers),
      });

      // Mark pending in drawer
      setPendingMap((prev) => ({
        ...prev,
        [shipmentId]: {
          shipmentId,
          targetContainerId: containerId,
          status: AssignmentStatus.pending,
          startedAt: Date.now(),
        },
      }));

      // Optimistic update to containers
      setContainers((prev) =>
        prev.map((c) => {
          const hadShipment = c.shipments.includes(shipmentId);
          const updatedShipments = c.shipments.filter(
            (id) => id !== shipmentId,
          );
          let updatedWeight = hadShipment
            ? Math.max(0, c.currentWeight - shipment.weight)
            : c.currentWeight;

          if (c.id === containerId) {
            return {
              ...c,
              shipments: [...updatedShipments, shipmentId],
              currentWeight: updatedWeight + shipment.weight,
            };
          }
          return {
            ...c,
            shipments: updatedShipments,
            currentWeight: updatedWeight,
          };
        }),
      );

      try {
        const res = await fetch(`${API_BASE}/api/shipments/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shipmentId, containerId }),
        });

        if (res.ok) {
          // Flash success status briefly
          setPendingMap((prev) => ({
            ...prev,
            [shipmentId]: {
              ...prev[shipmentId],
              status: AssignmentStatus.success,
            },
          }));

          // After brief success flash, start the removal animation
          setTimeout(() => {
            scheduleRemoval(shipmentId);
          }, 400); // 400ms success flash before starting exit

          toast.success(`${shipment.name} assigned successfully`);
          snapshots.current.delete(shipmentId);
          return true;
        } else {
          // rollback
          const errorData: CollisionResponse = await res.json();

          const snap = snapshots.current.get(shipmentId);
          if (snap) {
            setShipments(snap.shipments);
            setContainers(snap.containers);
            snapshots.current.delete(shipmentId);
          }

          // Cancel any removal that might have been triggered
          cancelRemoval(shipmentId);

          // Shake animation
          setPendingMap((prev) => ({
            ...prev,
            [shipmentId]: {
              ...prev[shipmentId],
              status: AssignmentStatus.failed,
            },
          }));

          toast.error(
            `Conflict: ${errorData.message ?? "Container locked by another dispatch"}`,
            { duration: 4000 },
          );

          // Return to idle after shake
          setTimeout(() => {
            setPendingMap((prev) => {
              const next = { ...prev };
              // Only clear if still in 'failed' (not re-triggered)
              if (next[shipmentId]?.status === AssignmentStatus.failed) {
                delete next[shipmentId];
              }
              return next;
            });
          }, 800);

          return false;
        }
      } catch {
        // Network failure
        const snap = snapshots.current.get(shipmentId);
        if (snap) {
          setShipments(snap.shipments);
          setContainers(snap.containers);
          snapshots.current.delete(shipmentId);
        }

        cancelRemoval(shipmentId);

        setPendingMap((prev) => ({
          ...prev,
          [shipmentId]: {
            ...prev[shipmentId],
            status: AssignmentStatus.failed,
          },
        }));

        toast.error("Network failure - assignment rolled back");

        setTimeout(() => {
          setPendingMap((prev) => {
            const next = { ...prev };
            if (next[shipmentId]?.status === AssignmentStatus.failed) {
              delete next[shipmentId];
            }
            return next;
          });
        }, 800);

        return false;
      }
    },
    [shipments, containers, pendingMap, scheduleRemoval, cancelRemoval],
  );

  //  Derived State

  const assignedIds = new Set(containers.flatMap((c) => c.shipments));

  /**
   * availableShipments: unassigned ones PLUS ones currently in
   * disappearingIds (so they can play their exit animation in the drawer
   * before being gone). They're excluded from assignedIds check only
   * while animating out.
   *
   * Without this: assigned shipment immediately vanishes from the array
   * -> AnimatePresence never gets to play exit -> card jumps away.
   *
   * With this: shipment stays in list with status='removing' for
   * REMOVE_ANIMATION_MS, then cleanly exits.
   */
  const availableShipments = Object.values(shipments)
    .filter((s) => !assignedIds.has(s.id) || disappearingIds.has(s.id))
    .sort((a, b) => {
      return a.priority - b.priority;
    });

  const getContainerShipments = (container: Container): Shipment[] =>
    container.shipments
      .map((id) => shipments[id])
      .filter(Boolean) as Shipment[];

  return {
    shipments,
    containers,
    availableShipments,
    disappearingIds,
    loading,
    connected,
    pendingMap,
    assignShipment,
    getContainerShipments,
  };
}
