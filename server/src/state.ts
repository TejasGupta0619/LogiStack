/**
 * @file state.ts
 *
 * state management and locking using mutex*/
import { type Shipment, type Container, ShipmentPriority } from "./types.js";

// In-memory state
export const shipments: Record<string, Shipment> = {};
export const containers: Record<string, Container> = {};

// Custom mutex / lock system
// Key = shipmentId, value = { acquiredAt: number }
const activeLocks = new Map<string, { acquiredAt: number }>();

// Static list of locations to generate realistic infinite data
const INDIAN_CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Pune",
  "Kolkata",
  "Surat",
  "Ahmedabad",
  "Jaipur",
];

// Sample data generator

/**
 * function initializeData
 *
 * @export
 */
export function initializeData() {
  // Clear previous data
  Object.keys(shipments).forEach((key) => delete shipments[key]);
  Object.keys(containers).forEach((key) => delete containers[key]);
  activeLocks.clear();

  // 3 Containers with strict capacities
  const containerData: Container[] = [
    {
      id: "container-1",
      name: "Express Container A",
      maxWeight: 500,
      currentWeight: 0,
      cost: 1200,
      containerSize: [300, 200, 200],
      shipments: [],
    },
    {
      id: "container-2",
      name: "Heavy Duty Container B",
      maxWeight: 750,
      currentWeight: 0,
      cost: 1850,
      containerSize: [400, 250, 250],
      shipments: [],
    },
    {
      id: "container-3",
      name: "Premium Container C",
      maxWeight: 1000,
      currentWeight: 0,
      cost: 2450,
      containerSize: [500, 300, 300],
      shipments: [],
    },
  ];

  containerData.forEach((c) => {
    containers[c.id] = { ...c };
  });

  // Track the next incremental unique ID index globally
  let globalShipmentIndex = 1;

  // Generates and appends a single random shipment tracking to your new structure
  function generateRandomShipment(): Shipment {
    const randomCityPair = () => {
      const orig =
        INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      let dest =
        INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      while (dest === orig) {
        dest = INDIAN_CITIES[Math.floor(Math.random() * INDIAN_CITIES.length)];
      }
      return { origin: orig, destination: dest };
    };

    const priorities = [
      ShipmentPriority.Urgent,
      ShipmentPriority.High,
      ShipmentPriority.Medium,
    ];
    const selectedPriority =
      priorities[Math.floor(Math.random() * priorities.length)];
    const cities = randomCityPair();
    const id = `ship-${globalShipmentIndex.toString().padStart(3, "0")}`;
    globalShipmentIndex++;

    // Generate random values maintaining the structure from your reference block
    const weight = Math.floor(Math.random() * 200) + 20;
    const shipmentCost = Math.floor(Math.random() * 50000) + 5000;
    const shipmentSize: [number, number, number] = [
      Math.floor(Math.random() * 150) + 50,
      Math.floor(Math.random() * 100) + 40,
      Math.floor(Math.random() * 100) + 40,
    ];

    const names = [
      "Industrial Compressor",
      "Server Rack Assembly",
      "Textile Bale Pack",
      "Medical Cold Chain",
      "Auto Parts Crate",
      "Electronics Bundle",
    ];
    const baseName = names[Math.floor(Math.random() * names.length)];

    return {
      id,
      name: `${baseName} #${Math.floor(Math.random() * 9000) + 1000}`,
      weight,
      priority: selectedPriority,
      origin: cities.origin,
      destination: cities.destination,
      shipmentCost,
      shipmentSize,
    };
  }

  // 12 Initial valid shipments
  const sampleShipments: Omit<Shipment, "id">[] = [
    {
      name: "Urgent Pharma Shipment #U-4821",
      weight: 42,
      priority: ShipmentPriority.Urgent,
      origin: "Delhi",
      destination: "Mumbai",
      shipmentCost: 45000,
      shipmentSize: [180, 90, 90],
    },
    {
      name: "Perishable Goods #P-9912",
      weight: 128,
      priority: ShipmentPriority.Urgent,
      origin: "Mumbai",
      destination: "Bangalore",
      shipmentCost: 32000,
      shipmentSize: [120, 60, 200],
    },
    {
      name: "Electronics Batch #E-3301",
      weight: 95,
      priority: ShipmentPriority.High,
      origin: "Chennai",
      destination: "Hyderabad",
      shipmentCost: 8500,
      shipmentSize: [100, 80, 60],
    },
    {
      name: "Auto Parts #A-7156",
      weight: 215,
      priority: ShipmentPriority.High,
      origin: "Pune",
      destination: "Delhi",
      shipmentCost: 75000,
      shipmentSize: [60, 60, 60],
    },
    {
      name: "Medical Equipment #M-2245",
      weight: 67,
      priority: ShipmentPriority.Urgent,
      origin: "Bangalore",
      destination: "Kolkata",
      shipmentCost: 28000,
      shipmentSize: [200, 120, 100],
    },
    {
      name: "Textile Cargo #T-8834",
      weight: 180,
      priority: ShipmentPriority.Medium,
      origin: "Surat",
      destination: "Mumbai",
      shipmentCost: 15000,
      shipmentSize: [80, 50, 40],
    },
    {
      name: "Fresh Produce #F-5590",
      weight: 55,
      priority: ShipmentPriority.Urgent,
      origin: "Nashik",
      destination: "Delhi",
      shipmentCost: 12000,
      shipmentSize: [90, 60, 50],
    },
    {
      name: "Industrial Tools #I-1023",
      weight: 143,
      priority: ShipmentPriority.High,
      origin: "Ludhiana",
      destination: "Chennai",
      shipmentCost: 31000,
      shipmentSize: [110, 70, 80],
    },
    {
      name: "Consumer Goods #C-4477",
      weight: 78,
      priority: ShipmentPriority.Medium,
      origin: "Ahmedabad",
      destination: "Pune",
      shipmentCost: 9500,
      shipmentSize: [70, 70, 60],
    },
    {
      name: "Hazardous Materials #H-6691",
      weight: 91,
      priority: ShipmentPriority.High,
      origin: "Visakhapatnam",
      destination: "Hyderabad",
      shipmentCost: 62000,
      shipmentSize: [130, 80, 90],
    },
    {
      name: "Retail Inventory #R-3382",
      weight: 34,
      priority: ShipmentPriority.Medium,
      origin: "Jaipur",
      destination: "Delhi",
      shipmentCost: 11000,
      shipmentSize: [85, 55, 45],
    },
    {
      name: "Cold Chain Vaccine #V-9918",
      weight: 29,
      priority: ShipmentPriority.Urgent,
      origin: "Hyderabad",
      destination: "Bangalore",
      shipmentCost: 89000,
      shipmentSize: [50, 50, 50],
    },
  ];

  sampleShipments.forEach((s, index) => {
    const id = `ship-${(index + 1).toString().padStart(3, "0")}`;
    shipments[id] = {
      id,
      ...s,
    };
  });

  // loop every time a container leaves or queue counts fall low
  (globalThis as any).replenishShipmentQueue = function (threshold = 3) {
    const activeCount = Object.keys(shipments).length;
    if (activeCount <= threshold) {
      // Top up with 6 fresh items infinitely
      for (let i = 0; i < 6; i++) {
        const nextShip = generateRandomShipment();
        shipments[nextShip.id] = nextShip;
      }
      console.log(
        `[QUEUE] Automatically refilled workspace. Current queue size: ${Object.keys(shipments).length}`,
      );
    }
  };

  console.log(
    `[STATE] Initialized ${Object.keys(shipments).length} shipments and ${Object.keys(containers).length} containers`,
  );
}

// Mutex: Acquire lock for a shipment

/**
 * function acquireLock
 *
 * @export
 * @param {string} shipmentId
 * @returns {{
 *   success: boolean;
 *   lockInfo?: any;
 *   reason?: string;
 * }}
 */
export function acquireLock(shipmentId: string): {
  success: boolean;
  lockInfo?: any;
  reason?: string;
} {
  if (activeLocks.has(shipmentId)) {
    const existing = activeLocks.get(shipmentId)!;
    return {
      success: false,
      reason: "ALREADY_LOCKED",
      lockInfo: existing,
    };
  }

  // Also check if shipment already assigned
  const isAssigned = Object.values(containers).some((c) =>
    c.shipments.includes(shipmentId),
  );
  if (isAssigned) {
    return { success: false, reason: "ALREADY_ASSIGNED" };
  }

  const lockInfo = { acquiredAt: Date.now() };
  activeLocks.set(shipmentId, lockInfo);
  return { success: true, lockInfo };
}

// Release lock

/**
 * function releaseLock
 *
 * @export
 * @param {string} shipmentId
 */
export function releaseLock(shipmentId: string) {
  activeLocks.delete(shipmentId);
}

// Check if shipment is locked

/**
 * function isShipmentLocked
 *
 * @export
 * @param {string} shipmentId
 * @returns {boolean}
 */
export function isShipmentLocked(shipmentId: string): boolean {
  return activeLocks.has(shipmentId);
}

// Get current container for a shipment

/**
 * function getCurrentContainer
 *
 * @export
 * @param {string} shipmentId
 * @returns {(string | null)}
 */
export function getCurrentContainer(shipmentId: string): string | null {
  for (const [containerId, container] of Object.entries(containers)) {
    if (container.shipments.includes(shipmentId)) {
      return containerId;
    }
  }
  return null;
}

// Assign shipment to container (must be called after acquiring lock)

/**
 * function assignShipment
 *
 * @export
 * @param {string} shipmentId
 * @param {string} containerId
 * @returns {{
 *   success: boolean;
 *   newWeight?: number;
 *   error?: string;
 *   currentWeight?: number;
 * }}
 */
export function assignShipment(
  shipmentId: string,
  containerId: string,
): {
  success: boolean;
  newWeight?: number;
  error?: string;
  currentWeight?: number;
} {
  const shipment = shipments[shipmentId];
  const container = containers[containerId];

  if (!shipment || !container) {
    return { success: false, error: "NOT_FOUND" };
  }

  // Double-check capacity (race condition safety)
  const projectedWeight = container.currentWeight + shipment.weight;
  if (projectedWeight > container.maxWeight) {
    return {
      success: false,
      error: "CAPACITY_EXCEEDED",
      currentWeight: container.currentWeight,
    };
  }

  // Check again if shipment was assigned in the meantime
  if (getCurrentContainer(shipmentId)) {
    return { success: false, error: "ALREADY_ASSIGNED" };
  }

  // Perform the assignment
  container.shipments.push(shipmentId);
  container.currentWeight = projectedWeight;

  return {
    success: true,
    newWeight: container.currentWeight,
  };
}

// Get snapshot for clients

/**
 * function getStateSnapshot
 *
 * @export
 * @returns {{ shipments: any; containers: any; }}
 */
export function getStateSnapshot() {
  return {
    shipments: Object.values(shipments),
    containers: Object.values(containers),
  };
}
