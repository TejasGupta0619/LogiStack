/**
 * @file types.ts
 *
 * types for server*/

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
  containerSize: [number, number, number];
  shipments: string[];
  cost: number;
}

/**
 * CollisionPayload
 *
 * @export
 * @interface CollisionPayload
 * @typedef {CollisionPayload}
 */
export interface CollisionPayload {
  error: "STATE_CONFLICT";
  collisionMs: number;
  missedCapacity: number;
  computeWasteMs: number;
  message: string;
  currentContainer?: string;
}

/**
 * AssignRequest
 *
 * @export
 * @interface AssignRequest
 * @typedef {AssignRequest}
 */
export interface AssignRequest {
  shipmentId: string;
  containerId: string;
}

/**
 * AssignSuccess
 *
 * @export
 * @interface AssignSuccess
 * @typedef {AssignSuccess}
 */
export interface AssignSuccess {
  success: true;
  shipmentId: string;
  containerId: string;
  newWeight: number;
}

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
