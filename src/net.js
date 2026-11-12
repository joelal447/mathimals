/* ============================================================
   Mathimal Quest — two-player link.
   One laptop HOSTS a room and shows a 4-letter code; the other JOINS with it.
   Transport: WebRTC via PeerJS (the free PeerJS cloud server only introduces
   the two laptops; game messages then go directly between them).
   Test transport: add ?net=local to the URL and open two tabs in the same
   browser — they talk through a BroadcastChannel, no internet needed.
   Own signalling server: ?peerhost=192.168.1.20&peerport=9000&peersecure=0
   ============================================================ */
import { Peer } from "peerjs";

const ID_PREFIX = "mathimal-quest-v5-";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I/L mix-ups
export const NET_PROTOCOL = 3; // v5.2: duels (v5.1 added transaction IDs + confirmations)

export function makeRoomCode() {
  let c = "";
  for (let i = 0; i < 4; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return c;
}
export const cleanRoomCode = (s) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);

function urlParams() {
  try { return new URLSearchParams(window.location.search); } catch (e) { return new URLSearchParams(""); }
}
export function netMode() { return urlParams().get("net") === "local" ? "local" : "peer"; }

function peerOptions() {
  const q = urlParams();
  const opts = { debug: 0 };
  if (q.get("peerhost")) {
    opts.host = q.get("peerhost");
    opts.port = Number(q.get("peerport") || 9000);
    opts.path = q.get("peerpath") || "/";
    opts.secure = q.get("peersecure") === "1";
  }
  return opts;
}

/* Wraps either transport in one small interface:
   room.send(msg) · room.close() · onMsg(msg) · onStatus(status, detail)
   status: "starting" | "waiting" (host, nobody yet) | "connected" | "lost" | "error" | "closed" */
export function openRoom({ role, code, onMsg, onStatus }) {
  const room = { role, code, closed: false, open: false };
  let lastHeard = Date.now();
  let beat = null;
  const status = (s, d) => { if (!room.closed || s === "closed") onStatus(s, d); };
  const deliver = (m) => {
    lastHeard = Date.now();
    if (!m || typeof m !== "object" || typeof m.t !== "string") return;
    if (m.t === "ping") return;
    if (m.t === "bye") { room.open = false; status(role === "host" ? "waiting" : "lost"); return; }
    try { onMsg(m); } catch (e) { /* a bad message must never crash the game */ }
  };
  const startBeat = () => {
    clearInterval(beat);
    lastHeard = Date.now();
    beat = setInterval(() => {
      if (!room.open) return;
      room.send({ t: "ping" });
      if (Date.now() - lastHeard > 9000) { room.open = false; status(role === "host" ? "waiting" : "lost", "Partner stopped answering"); }
    }, 3000);
  };

  if (netMode() === "local") {
    const me = Math.random().toString(36).slice(2);
    let partnerId = null;
    const bc = new BroadcastChannel("mathimal-room-" + code);
    room.send = (m) => { if (!room.closed && partnerId) bc.postMessage({ from: me, to: partnerId, m }); };
    bc.onmessage = (ev) => {
      const { from, to, m, hello, helloBack } = ev.data || {};
      if (hello && role === "host") {
        if (partnerId && partnerId !== from && room.open) { bc.postMessage({ from: me, to: from, full: true }); return; }
        const already = room.open && partnerId === from; // a repeated knock: answer it, but don't "connect" twice
        partnerId = from; room.open = true;
        bc.postMessage({ from: me, to: from, helloBack: true });
        if (!already) { status("connected"); startBeat(); }
        return;
      }
      if (to !== me) return;
      if (ev.data.full) { status("error", "That game already has two players."); return; }
      if (helloBack && role === "guest") { if (room.open) return; partnerId = from; room.open = true; status("connected"); startBeat(); return; }
      if (from === partnerId) deliver(m);
    };
    room.close = () => { if (room.closed) return; room.send({ t: "bye" }); room.closed = true; clearInterval(beat); bc.close(); status("closed"); };
    if (role === "host") status("waiting");
    else {
      status("starting");
      let tries = 0;
      const knock = () => { if (room.open || room.closed) return; bc.postMessage({ from: me, hello: true }); if (++tries < 8) setTimeout(knock, 700); else status("error", "No game with that code. Check the code on the other screen."); };
      knock();
    }
    return room;
  }

  // ---- PeerJS (WebRTC) ----
  let conn = null;
  const peer = role === "host" ? new Peer(ID_PREFIX + code, peerOptions()) : new Peer(peerOptions());
  const attach = (c) => {
    conn = c;
    c.on("open", () => { room.open = true; status("connected"); startBeat(); });
    c.on("data", deliver);
    c.on("close", () => { if (conn === c) { room.open = false; status(role === "host" ? "waiting" : "lost"); } });
    c.on("error", () => { if (conn === c) { room.open = false; status(role === "host" ? "waiting" : "lost"); } });
  };
  room.send = (m) => { try { if (conn && conn.open) conn.send(m); } catch (e) { /* ignore */ } };
  room.close = () => {
    if (room.closed) return;
    room.send({ t: "bye" });
    room.closed = true; clearInterval(beat);
    setTimeout(() => { try { peer.destroy(); } catch (e) { /* ignore */ } }, 150);
    status("closed");
  };
  status("starting");
  peer.on("open", () => {
    if (role === "host") { status("waiting"); return; }
    attach(peer.connect(ID_PREFIX + code, { reliable: true, serialization: "json" }));
  });
  peer.on("connection", (c) => {
    if (role !== "host") { c.close(); return; }
    if (conn && conn.open && room.open) { c.on("open", () => { c.send({ t: "full" }); setTimeout(() => c.close(), 300); }); return; }
    attach(c);
  });
  peer.on("disconnected", () => { if (!room.closed) { try { peer.reconnect(); } catch (e) { /* ignore */ } } });
  peer.on("error", (err) => {
    const type = err && err.type;
    const why = type === "unavailable-id" ? "That room code is busy. Press HOST again for a new code."
      : type === "peer-unavailable" ? "No game with that code. Check the code on the other screen."
      : type === "network" || type === "server-error" || type === "socket-error" ? "Can't reach the internet to link up. Check the Wi-Fi."
      : type === "browser-incompatible" ? "This browser can't link games. Use Chrome or Edge."
      : "Couldn't link: " + (type || "unknown problem");
    if (type === "peer-unavailable" || type === "unavailable-id" || type === "browser-incompatible" || !room.open) status("error", why);
  });
  return room;
}
