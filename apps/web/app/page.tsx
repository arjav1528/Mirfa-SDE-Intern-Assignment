"use client";

import { useState } from "react";

const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function Home() {
  const [partyId, setPartyId] = useState("");
  const [payloadJson, setPayloadJson] = useState('{ "amount": 100, "currency": "AED" }');
  const [recordId, setRecordId] = useState("");
  const [encryptedRecord, setEncryptedRecord] = useState<object | null>(null);
  const [decryptedPayload, setDecryptedPayload] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEncrypt() {
    setError(null);
    setEncryptedRecord(null);
    setDecryptedPayload(null);
    let payload: object;
    try {
      payload = JSON.parse(payloadJson);
    } catch {
      setError("Invalid JSON in payload");
      return;
    }
    if (!partyId.trim()) {
      setError("partyId is required");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/tx/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: partyId.trim(), payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Encryption failed");
        return;
      }
      setRecordId(data.id);
      setEncryptedRecord(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
  }

  async function handleFetch() {
    setError(null);
    setEncryptedRecord(null);
    setDecryptedPayload(null);
    const id = recordId.trim();
    if (!id) {
      setError("Enter a record id to fetch");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/tx/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Not found");
        return;
      }
      setEncryptedRecord(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
  }

  async function handleDecrypt() {
    setError(null);
    setDecryptedPayload(null);
    const id = recordId.trim();
    if (!id) {
      setError("Enter a record id to decrypt");
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/tx/${encodeURIComponent(id)}/decrypt`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Decryption failed");
        return;
      }
      setDecryptedPayload(data.payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: "1rem" }}>Secure transactions</h1>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: 4 }}>Party ID</label>
        <input
          type="text"
          value={partyId}
          onChange={(e) => setPartyId(e.target.value)}
          placeholder="e.g. user-123"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: 4 }}>Payload (JSON)</label>
        <textarea
          value={payloadJson}
          onChange={(e) => setPayloadJson(e.target.value)}
          rows={4}
          style={{ width: "100%", padding: 8, boxSizing: "border-box", fontFamily: "monospace" }}
        />
      </div>

      <div style={{ marginBottom: "1rem", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={handleEncrypt} style={{ padding: "8px 16px" }}>
          Encrypt &amp; Save
        </button>
        <button type="button" onClick={handleFetch} style={{ padding: "8px 16px" }}>
          Fetch
        </button>
        <button type="button" onClick={handleDecrypt} style={{ padding: "8px 16px" }}>
          Decrypt
        </button>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: 4 }}>Record ID (from Encrypt or type)</label>
        <input
          type="text"
          value={recordId}
          onChange={(e) => setRecordId(e.target.value)}
          placeholder="id from Encrypt & Save"
          style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
        />
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: "1rem" }}>{error}</div>
      )}

      {encryptedRecord && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Encrypted record</strong>
          <pre style={{
            background: "#1e1e1e",
            color: "#e0e0e0",
            padding: 12,
            overflow: "auto",
            fontSize: 12,
            borderRadius: 6,
            border: "1px solid #333",
          }}>
            {JSON.stringify(encryptedRecord, null, 2)}
          </pre>
        </div>
      )}

      {decryptedPayload !== null && (
        <div style={{ marginBottom: "1rem" }}>
          <strong>Decrypted payload</strong>
          <pre style={{
            background: "#1e1e1e",
            color: "#e0e0e0",
            padding: 12,
            overflow: "auto",
            borderRadius: 6,
            border: "1px solid #333",
          }}>
            {JSON.stringify(decryptedPayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
