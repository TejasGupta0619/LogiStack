/**
 * @file types.ts
 *
 * types for client end application*/

/**
 * ShipmentPriority
 *
 * @type {{ readonly All: 0; readonly Medium: 1; readonly High: 2; readonly Urgent: 3; }}
 */
export const ShipmentPriority = {
  All: 0,
  Medium: 1,
  High: 2,
  Urgent: 3,
} as const;

/**
 * type ShipmentPriority: exposes types for ShipmentPriority
 *
 * @export
 * @typedef {ShipmentPriority}
 */
export type ShipmentPriority =
  (typeof ShipmentPriority)[keyof typeof ShipmentPriority];

/**
 * interface Shipment
 *
 * @export
 * @interface Shipment
 * @typedef {Shipment}
 *
 * id: string (shipmentId)
 * name: string (shipmentName)
 * weight: number (shipmentWeight)
 * priority: ShipmentPriority (excludes All)
 * origin: string (shipmentPickup)
 * destination: string (shipmentDropoff)
 * shipmentCost: number (shipmentCost)
 * shipmentSize: [number, number, number] (shipmentSize LxWxH(cm))
 */
export interface Shipment {
  id: string;
  name: string;
  weight: number;
  priority: Exclude<ShipmentPriority, 0>;
  origin: string;
  destination: string;
  shipmentCost: number;
  shipmentSize: [number, number, number];
}

/**
 * interface Container
 *
 * @export
 * @interface Container
 * @typedef {Container}
 *
 * id: string (containerId)
 * name: string (containerName)
 * maxWeight: number (containerMaxWeight)
 * currentWeight: number (containerWeight)
 * containerSize: [number, number, number] (containerSize LxWxH(cm))
 * shipments: string[] (array shipmentId)
 * cost: number (containerCost)
 */
export interface Container {
  id: string;
  name: string;
  maxWeight: number;
  currentWeight: number;
  containerSize: [number, number, number]; // L x W x H (cm)
  shipments: string[]; // shipment IDs
  cost: number;
}

// API Responses

/**
 * CollisionResponse
 *
 * @export
 * @interface CollisionResponse
 * @typedef {CollisionResponse}
 */
export interface CollisionResponse {
  error: "STATE_CONFLICT";
  collisionMs: number;
  missedCapacity: number;
  computeWasteMs: number;
  message: string;
  currentContainer?: string;
}

/**
 * AssignResponse
 *
 * @export
 * @interface AssignResponse
 * @typedef {AssignResponse}
 */
export interface AssignResponse {
  success: true;
  shipmentId: string;
  containerId: string;
  newWeight: number;
}

// SSE Events

/**
 * SSEEventType
 *
 * @type {{ readonly shipment_assigned: 0; readonly shipment_unassigned: 1; readonly container_updated: 2; readonly initial_state: 3; }}
 */
export const SSEEventType = {
  shipment_assigned: 0,
  shipment_unassigned: 1,
  container_updated: 2,
  initial_state: 3,
} as const;

/**
 * type SSEEventType
 *
 * @export
 * @typedef {SSEEventType}
 */
export type SSEEventType = (typeof SSEEventType)[keyof typeof SSEEventType];

/**
 * type SSEEvent
 *
 * @export
 * @typedef {SSEEvent}
 */
export type SSEEvent =
  | {
      type: typeof SSEEventType.shipment_assigned;
      payload: { shipmentId: string; containerId: string; timestamp: number };
    }
  | {
      type: typeof SSEEventType.shipment_unassigned;
      payload: { shipmentId: string; timestamp: number };
    }
  | {
      type: typeof SSEEventType.container_updated;
      payload: {
        containerId: string;
        currentWeight: number;
        shipments: string[];
      };
    }
  | {
      type: typeof SSEEventType.initial_state;
      payload: { shipments: Shipment[]; containers: Container[] };
    };

// UI State

/**
 * AssignmentStatus
 *
 * @type {{ readonly idle: 0; readonly pending: 1; readonly success: 2; readonly failed: 3; readonly removing: 4; }}
 */
export const AssignmentStatus = {
  idle: 0,
  pending: 1,
  success: 2,
  failed: 3,
  removing: 4,
} as const;

/**
 * type AssignmentStatus
 *
 * @export
 * @typedef {AssignmentStatus}
 */
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

/**
 * PendingAssignment
 *
 * @export
 * @interface PendingAssignment
 * @typedef {PendingAssignment}
 */
export interface PendingAssignment {
  shipmentId: string;
  targetContainerId: string;
  status: AssignmentStatus;
  startedAt: number;
}

/**
 * PRIORITY_META
 *
 * @type {Record<
 *   ShipmentPriority,
 *   { label: string; className: string; order: number }
 * >}
 */
export const PRIORITY_META: Record<
  ShipmentPriority,
  { label: string; className: string; order: number }
> = {
  [ShipmentPriority.Urgent]: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200",
    order: 0,
  },
  [ShipmentPriority.High]: {
    label: "High",
    className: "bg-orange-100 text-orange-700 border-orange-200",
    order: 1,
  },
  [ShipmentPriority.Medium]: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    order: 2,
  },
  [ShipmentPriority.All]: {
    label: "All",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    order: 3,
  },
};

export const ListPages = {
  Dashboard: 0,
  Report: 1,
};

export type ListPagesType = (typeof ListPages)[keyof typeof ListPages];
