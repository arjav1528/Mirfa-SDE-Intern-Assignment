import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import type { TxSecureRecord } from "@repo/crypto";
import { encrypt, decrypt } from "@repo/crypto";
import { config } from "dotenv";

if (!process.env.VERCEL) {
  config({ path: path.resolve(process.cwd(), "../../.env") });
}

const PORT = Number(process.env.PORT) || 3001;
const store = new Map<string, TxSecureRecord>();

async function createApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });

  app.get("/", async (_request, reply) => {
    return reply.send({ message: "Hello World" });
  });

  app.post<{
    Body: { partyId?: string; payload?: object };
  }>("/tx/encrypt", async (request, reply) => {
    const { partyId, payload } = request.body ?? {};
    if (!partyId || typeof partyId !== "string" || partyId.trim() === "") {
      return reply.status(400).send({ error: "partyId is required and must be non-empty" });
    }
    if (payload === undefined || payload === null || typeof payload !== "object") {
      return reply.status(400).send({ error: "payload is required and must be an object" });
    }
    try {
      const record = encrypt(partyId.trim(), payload);
      store.set(record.id, record);
      return reply.status(201).send(record);
    } catch (err) {
      request.log.error(err);
      return reply.status(500).send({ error: "Encryption failed" });
    }
  });

  app.get<{ Params: { id: string } }>("/tx/:id", async (request, reply) => {
    const record = store.get(request.params.id);
    if (!record) return reply.status(404).send({ error: "Not found" });
    return reply.send(record);
  });

  app.post<{ Params: { id: string } }>("/tx/:id/decrypt", async (request, reply) => {
    const record = store.get(request.params.id);
    if (!record) return reply.status(404).send({ error: "Not found" });
    try {
      const payload = decrypt(record);
      return reply.send({ payload });
    } catch {
      return reply.status(400).send({ error: "Decryption failed" });
    }
  });

  return app;
}

const appPromise = createApp();

async function handler(req: import("http").IncomingMessage, res: import("http").ServerResponse) {
  const app = await appPromise;
  await app.ready();
  const url = req.url || "/";
  const path = url.startsWith("/api") ? url.slice(4) || "/" : url;
  const normalizedReq = Object.create(req, { url: { value: path } });
  app.server.emit("request", normalizedReq, res);
}

if (!process.env.VERCEL) {
  appPromise.then((app) => app.listen({ port: PORT, host: "0.0.0.0" }));
}

module.exports = handler;
