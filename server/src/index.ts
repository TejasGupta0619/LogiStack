/**
 * @file index.ts
 *
 * main file node express server*/
import express from "express";
import cors from "cors";
import type { Request, Response } from "express";
import {
  initializeData,
  shipments,
  containers,
  acquireLock,
  releaseLock,
  assignShipment,
  getStateSnapshot,
  getCurrentContainer,
} from "./state.js";
import {
  SSEEventType,
  type AssignRequest,
  type CollisionPayload,
  type SSEEvent,
} from "./types.js";
import path from "path";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 4000;

// fixed in development
app.use(cors({ origin: ["https://logi-stack-cnt.vercel.app"] }));
app.use(express.json());

let sseClients: Response[] = [];

/**
 * function broadcast
 *
 * @param {SSEEvent} event
 */
function broadcast(event: SSEEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(data);
    } catch (e) {}
  });
}

app.get("/report", (_req, _res) => {
  try {
    const reportFilePath = path.resolve(process.cwd(), "./report.md");

    const markdownContent = fs.readFileSync(reportFilePath, "utf-8");

    _res.setHeader("Content-Type", "text/plain");
    _res.send(markdownContent);
  } catch (error) {
    console.log("Error while getting report, " + error);
    return _res.send("Report Not found.");
  }
});

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", time: new Date().toISOString() }),
);

app.get("/api/shipments", (_req, res) => {
  const available = Object.values(shipments).filter(
    (s) => !Object.values(containers).some((c) => c.shipments.includes(s.id)),
  );
  res.json(available);
});

app.get("/api/containers", (_req, res) => res.json(Object.values(containers)));

app.get("/api/state", (_req, res) => res.json(getStateSnapshot()));

app.post("/api/shipments/assign", async (req: Request, res: Response) => {
  const { shipmentId, containerId } = req.body as AssignRequest;
  const startTime = Date.now();

  if (!shipmentId || !containerId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const lockResult = acquireLock(shipmentId);
  if (!lockResult.success) {
    const current = getCurrentContainer(shipmentId);
    return res.status(409).json({
      error: "STATE_CONFLICT",
      collisionMs: Date.now(),
      missedCapacity: 0,
      computeWasteMs: Date.now() - startTime,
      message:
        lockResult.reason === "ALREADY_ASSIGNED"
          ? "Shipment already assigned"
          : "Shipment currently locked",
      currentContainer: current || undefined,
    } as CollisionPayload);
  }

  try {
    await new Promise((r) => setTimeout(r, 2500));

    const shipment = shipments[shipmentId];
    const container = containers[containerId];
    if (!shipment || !container) {
      releaseLock(shipmentId);
      return res.status(404).json({ error: "Not found" });
    }

    const projected = container.currentWeight + shipment.weight;
    if (projected > container.maxWeight) {
      const payload: CollisionPayload = {
        error: "STATE_CONFLICT",
        collisionMs: Date.now(),
        missedCapacity: projected - container.maxWeight,
        computeWasteMs: Date.now() - startTime,
        message: `${container.name} capacity exceeded`,
        currentContainer: containerId,
      };
      releaseLock(shipmentId);
      return res.status(409).json(payload);
    }

    const result = assignShipment(shipmentId, containerId);
    if (!result.success) {
      releaseLock(shipmentId);
      return res.status(409).json({
        error: "STATE_CONFLICT",
        collisionMs: Date.now(),
        missedCapacity: 0,
        computeWasteMs: Date.now() - startTime,
        message: result.error || "Failed",
      });
    }

    releaseLock(shipmentId);

    broadcast({
      type: SSEEventType.shipment_assigned,
      payload: { shipmentId, containerId, timestamp: Date.now() },
    });
    broadcast({
      type: SSEEventType.container_updated,
      payload: {
        containerId,
        currentWeight: result.newWeight!,
        shipments: containers[containerId].shipments,
      },
    });

    return res.json({
      success: true,
      shipmentId,
      containerId,
      newWeight: result.newWeight,
    });
  } catch (e) {
    releaseLock(shipmentId);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/events", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.write(
    `data: ${JSON.stringify({ type: "initial_state", payload: getStateSnapshot() })}\n\n`,
  );

  sseClients.push(res);
  console.log(`[SSE] Client connected (${sseClients.length})`);

  const heartbeat = setInterval(() => {
    if (!res.writableEnded) res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter((c) => c !== res);
    console.log(`[SSE] Client left`);
  });
});

setInterval(() => {
  Object.values(containers).forEach((c) => {
    broadcast({
      type: SSEEventType.container_updated,
      payload: {
        containerId: c.id,
        currentWeight: c.currentWeight,
        shipments: c.shipments,
      },
    });
  });
}, 8000);

initializeData();

app.listen(PORT, () => {
  console.log(`\n Backend: http://localhost:${PORT}`);
  console.log(` SSE: http://localhost:${PORT}/api/events\n`);
});
