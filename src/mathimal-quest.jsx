import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { genGkQuestion, gkTierFor, GK_CATS, GK_BANK } from "./gk.js";
import { openRoom, makeRoomCode, cleanRoomCode, netMode, NET_PROTOCOL } from "./net.js";

/* ============================================================
   MATHIMAL QUEST
   Two regions · rival trainer · shop & items · save codes
   evolutions · shinies · word problems · parent dashboard (P)
   battle music · day/night cycle
   ============================================================ */

/* ---------------- Pixel sprite engine ---------------- */

const SPRITES = {
  embercub: {
    colors: { R: "#f97316", r: "#c2410c", c: "#fde68a", k: "#1c1917" },
    rows: [
      ".rr......rr.",
      ".rRr....rRr.",
      "..RRRRRRRR..",
      ".RRRRRRRRRR.",
      ".RRkRRRRkRR.",
      ".RRRRRRRRRR.",
      ".RRRccccRRR.",
      "..RRckkcRR..",
      "..RRRccRRR..",
      "..RRRRRRRR..",
      "..rRR..RRr..",
      "..rr....rr..",
    ],
  },
  bublip: {
    colors: { B: "#38bdf8", b: "#0369a1", k: "#0c1222", p: "#fb7185" },
    rows: [
      "....BBBB....",
      "..BBBBBBBB..",
      ".pBBBBBBBBp.",
      ".BBkBBBBkBB.",
      "pBBBBBBBBBBp",
      ".BBBkkkkBBB.",
      "..BBBBBBBB..",
      "..bBBBBBBb..",
      "...BBBBBB...",
      "...BBBBBB...",
      "....bBBb....",
      "...bb..bb...",
    ],
  },
  thornling: {
    colors: { G: "#4ade80", g: "#15803d", L: "#bbf7d0", k: "#14201a" },
    rows: [
      ".....gg.....",
      "....gLLg....",
      "..gLLggLLg..",
      "....gGGg....",
      "...GGGGGG...",
      "..GGkGGkGG..",
      ".GGGGGGGGGG.",
      ".GGGkkkkGGG.",
      "..GGGGGGGG..",
      "..gGGGGGGg..",
      "...GGGGGG...",
      "...gg..gg...",
    ],
  },
  sparkit: {
    colors: { Y: "#facc15", y: "#a16207", k: "#1c1917" },
    rows: [
      ".y........y.",
      ".yy......yy.",
      ".yYy....yYy.",
      ".YYYYYYYYYY.",
      ".YYkYYYYkYY.",
      ".YYYYYYYYYY.",
      "..YYYkkYYY..",
      "..YYYYYYYY..",
      ".yYYYYYYYYy.",
      "..YYY..YYY..",
      "..yy....yy..",
      "...y.yy.y...",
    ],
  },
  rockle: {
    colors: { m: "#78716c", s: "#44403c", k: "#0f0d0c" },
    rows: [
      "....ssss....",
      "...smmmms...",
      "..smmmmmms..",
      ".smmsmmsmms.",
      ".smmmmmmmms.",
      ".smkmmmmkms.",
      ".smmmmmmmms.",
      ".smmkkkkmms.",
      "..smmmmmms..",
      "..ssmmmmss..",
      "...ssssss...",
      "..ss....ss..",
    ],
  },
  wispur: {
    colors: { P: "#c084fc", p: "#7e22ce", k: "#170b24", w: "#f5f3ff" },
    rows: [
      "....PPPP....",
      "..PPPPPPPP..",
      ".PPPPPPPPPP.",
      ".PPkkPPkkPP.",
      ".PPkwPPkwPP.",
      "PPPPPPPPPPPP",
      "PPPPkkkkPPPP",
      ".PPPPPPPPPP.",
      ".PPPPPPPPPP.",
      ".PP.PPPP.PP.",
      "..P..PP..P..",
      ".P....P...P.",
    ],
  },
  drakelet: {
    colors: { T: "#2dd4bf", t: "#0f766e", k: "#082423", h: "#fb7185" },
    rows: [
      "..t......t..",
      ".tht....tht.",
      ".tTTTTTTTTt.",
      ".TTTTTTTTTT.",
      ".TTkTTTTkTT.",
      ".TTTTTTTTTT.",
      "hTTTkkkkTTTh",
      "hhTTTTTTTThh",
      ".hTTTTTTTTh.",
      "..TTTTTTTT..",
      "..tTT..TTt..",
      "..tt....tt..",
    ],
  },
  magmite: {
    colors: { M: "#ef4444", m: "#7f1d1d", o: "#fb923c", k: "#1c0a0a" },
    rows: [
      "....oo..o...",
      "...oMMo.oo..",
      "..oMMMMoMo..",
      ".oMMMMMMMo..",
      ".MMkMMMMkM..",
      ".MMMMMMMMM..",
      ".MMMkkkkMM..",
      ".mMMMMMMMm..",
      ".mmMMMMMmm..",
      "..mmMMMmm...",
      "...mmmmm....",
      "..mm...mm...",
    ],
  },
  finblade: {
    colors: { F: "#60a5fa", f: "#1d4ed8", w: "#f8fafc", k: "#0c1430" },
    rows: [
      ".....f......",
      "....fFf.....",
      "...fFFFf....",
      "..fFFFFFf...",
      ".fFFkFFFkF..",
      "fFFFFFFFFFf.",
      ".wwFkkkkFww.",
      "..wwwwwwww..",
      "..fFFFFFFf..",
      "...fFFFFf...",
      "....fFf.ff..",
      ".....f.ff...",
    ],
  },
  batvolt: {
    colors: { B: "#8b5cf6", b: "#4c1d95", Y: "#fde047", k: "#120826" },
    rows: [
      "b..........b",
      "bb..bbbb..bb",
      "bBbbBBBBbbBb",
      "bBBBBBBBBBBb",
      ".BBkBBBBkBB.",
      ".BBBBBBBBBB.",
      "..BBkkkkBB..",
      "..BBBYYBBB..",
      "...BBBBBB...",
      "....BBBB....",
      "...b.bb.b...",
      "..b......b..",
    ],
  },
  crystix: {
    colors: { C: "#67e8f9", c: "#0e7490", w: "#ecfeff", k: "#082f3a" },
    rows: [
      ".....cc.....",
      "....cCCc....",
      "...cCwCCc...",
      "..cCCCCCCc..",
      ".cCCwCCCCCc.",
      ".cCkCCCCkCc.",
      ".cCCCCCCCCc.",
      ".cCCkkkkCCc.",
      "..cCCCCCCc..",
      "...cCCCCc...",
      "....cCCc....",
      "...cc..cc...",
    ],
  },
  frostpup: {
    colors: { I: "#a5f3fc", i: "#0891b2", w: "#f0fdff", k: "#083344" },
    rows: [
      ".iw......wi.",
      ".iIw....wIi.",
      "..IIIIIIII..",
      ".IIIIIIIIII.",
      ".IIkIIIIkII.",
      ".IIIIIIIIII.",
      ".IIIwwwwIII.",
      "..IIwkkwII..",
      "..IIIwwIII..",
      "..IIIIIIII..",
      "..iII..IIi..",
      "..ii....ii..",
    ],
  },
  glacior: {
    colors: { B: "#7dd3fc", b: "#0369a1", w: "#e0f2fe", k: "#082f49" },
    rows: [
      "....wwww....",
      "...wBBBBw...",
      "..wBBBBBBw..",
      ".wBBBBBBBBw.",
      ".BBkBBBBkBB.",
      ".BBBBBBBBBB.",
      "wBBBwwwwBBBw",
      "wBBBBBBBBBBw",
      ".bBBBBBBBBb.",
      "..bBBBBBBb..",
      "...bb..bb...",
      "..bb....bb..",
    ],
  },
  yetai: {
    colors: { W: "#f8fafc", w: "#cbd5e1", B: "#38bdf8", k: "#1e293b" },
    rows: [
      "..W......W..",
      ".WWW....WWW.",
      ".WWWWWWWWWW.",
      "WWWWWWWWWWWW",
      "WWkWWWWWWkWW",
      "WWWWWWWWWWWW",
      "WWWBBBBBBWWW",
      "WWWBkkkkBWWW",
      ".WWWWWWWWWW.",
      ".wWWWWWWWWw.",
      ".wWW....WWw.",
      ".ww......ww.",
    ],
  },
  trainer: {
    colors: { C: "#ef4444", N: "#fcd7b0", B: "#3b82f6", D: "#1e3a5f", k: "#1c1917" },
    rows: [
      "....CCCC....",
      "...CCCCCC...",
      "...NNNNNN...",
      "...NkNNkN...",
      "...NNNNNN...",
      "....NNNN....",
      "..BBBBBBBB..",
      ".NBBBBBBBBN.",
      ".NBBBBBBBBN.",
      "...DDDDDD...",
      "...DD..DD...",
      "...kk..kk...",
    ],
  },
  prime: {
    colors: { C: "#7c3aed", N: "#fcd7b0", B: "#1f2937", D: "#374151", k: "#111", w: "#f9fafb" },
    rows: [
      "....wwww....",
      "...wwwwww...",
      "...NNNNNN...",
      "...NkNNkN...",
      "...NNwwNN...",
      "....NNNN....",
      "..CBBBBBBC..",
      ".NCBBBBBBCN.",
      ".NCBBBBBBCN.",
      "...DDDDDD...",
      "...DD..DD...",
      "...kk..kk...",
    ],
  },
};

/* Rival and second gym leader reuse body shapes with new palettes */
SPRITES.rival = {
  colors: { C: "#22c55e", N: "#fcd7b0", B: "#f97316", D: "#374151", k: "#1c1917" },
  rows: SPRITES.trainer.rows,
};
SPRITES.magna = {
  colors: { C: "#f59e0b", N: "#e8b88a", B: "#b91c1c", D: "#1c1917", k: "#111", w: "#fde047" },
  rows: SPRITES.prime.rows,
};
/* Elite Four + Grandmaster */
SPRITES.elite1 = {
  colors: { C: "#06b6d4", N: "#fcd7b0", B: "#0e7490", D: "#164e63", k: "#1c1917" },
  rows: SPRITES.trainer.rows,
};
SPRITES.elite2 = {
  colors: { C: "#a855f7", N: "#e8b88a", B: "#6b21a8", D: "#3b0764", k: "#1c1917" },
  rows: SPRITES.trainer.rows,
};
SPRITES.elite3 = {
  colors: { C: "#ec4899", N: "#fcd7b0", B: "#9d174d", D: "#500724", k: "#1c1917" },
  rows: SPRITES.trainer.rows,
};
SPRITES.grandmaster = {
  colors: { C: "#e0f2fe", N: "#e8b88a", B: "#0ea5e9", D: "#0c4a6e", k: "#111", w: "#fde047" },
  rows: SPRITES.prime.rows,
};
SPRITES.aurion = {
  colors: { T: "#fcd34d", t: "#d97706", k: "#451a03", h: "#f9fafb" },
  rows: SPRITES.drakelet.rows,
};
/* PokeJosh — designed by the young trainer this game was made for. Psychic fire dragon with a psychic gem */
SPRITES.pokejosh = {
  colors: { R: "#f97316", r: "#b91c1c", P: "#a855f7", k: "#2a0a0a", w: "#fde68a" },
  rows: [
    "..r......r..",
    ".rwr....rwr.",
    ".rRRRPPRRRr.",
    ".RRRRPPRRRR.",
    ".RRkRRRRkRR.",
    ".RRRRRRRRRR.",
    "wRRRkkkkRRRw",
    "wwRRRRRRRRww",
    ".wRRRRRRRRw.",
    "..RRRRRRRR..",
    "..rRR..RRr..",
    "..rr.PP.rr..",
  ],
};

function Sprite({ name, size = 96, flip = false, hue = 0, colorsOverride = null, style = {} }) {
  const data = SPRITES[name];
  if (!data) return null;
  const colors = colorsOverride ? { ...data.colors, ...colorsOverride } : data.colors;
  const px = size / 12;
  const rects = [];
  data.rows.forEach((row, y) => {
    row.split("").forEach((ch, x) => {
      const c = colors[ch];
      if (c)
        rects.push(
          <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px + 0.4} height={px + 0.4} fill={c} />
        );
    });
  });
  return (
    <svg
      width={size}
      height={size}
      style={{
        imageRendering: "pixelated",
        transform: flip ? "scaleX(-1)" : "none",
        filter: hue ? `hue-rotate(${hue}deg) saturate(1.35)` : "none",
        ...style,
      }}
    >
      {rects}
    </svg>
  );
}

/* ---------------- Creature dex with evolutions ---------------- */

const TYPE_COLORS = {
  fire: "#f97316", water: "#38bdf8", grass: "#4ade80",
  electric: "#facc15", rock: "#a8a29e", ghost: "#c084fc", dragon: "#2dd4bf",
  ice: "#7dd3fc", psychic: "#f472b6",
};

const TYPE_BEATS = {
  fire: ["grass", "ice"], grass: ["water", "rock"], water: ["fire", "rock"],
  electric: ["water"], rock: ["fire", "electric", "ice"], ghost: [], dragon: [],
  ice: ["grass", "dragon"], psychic: ["ghost", "rock"],
};

function typeMult(att, def) {
  if (TYPE_BEATS[att]?.includes(def)) return 1.5;
  if (TYPE_BEATS[def]?.includes(att)) return 0.75;
  return 1;
}

const DEX = {
  embercub: {
    name: "Embercub", type: "fire", hp: 24, atk: 6, sprite: "embercub",
    moves: ["Ember Dash", "Flame Burst"],
    evoName: "Blazebear", evoColors: { R: "#dc2626", r: "#7f1d1d", c: "#fbbf24" },
  },
  bublip: {
    name: "Bublip", type: "water", hp: 27, atk: 5, sprite: "bublip",
    moves: ["Bubble Pop", "Tidal Splash"],
    evoName: "Tidemaw", evoColors: { B: "#2563eb", b: "#1e3a8a", p: "#f43f5e" },
  },
  thornling: {
    name: "Thornling", type: "grass", hp: 26, atk: 5, sprite: "thornling",
    moves: ["Leaf Flick", "Vine Whirl"],
    evoName: "Bramblion", evoColors: { G: "#16a34a", g: "#14532d", L: "#fde047" },
  },
  sparkit: {
    name: "Sparkit", type: "electric", hp: 22, atk: 6, sprite: "sparkit",
    moves: ["Static Zap", "Thunder Pounce"],
    evoName: "Voltrix", evoColors: { Y: "#fb923c", y: "#7c2d12" },
  },
  rockle: {
    name: "Rockle", type: "rock", hp: 32, atk: 4, sprite: "rockle",
    moves: ["Pebble Toss", "Boulder Roll"],
    evoName: "Boulderon", evoColors: { m: "#a16207", s: "#451a03" },
  },
  wispur: {
    name: "Wispur", type: "ghost", hp: 21, atk: 7, sprite: "wispur",
    moves: ["Spook Tap", "Shadow Swirl"],
    evoName: "Phantomane", evoColors: { P: "#818cf8", p: "#3730a3", w: "#fde047" },
  },
  drakelet: {
    name: "Drakelet", type: "dragon", hp: 34, atk: 7, sprite: "drakelet",
    moves: ["Tail Snap", "Dragon Gust"],
    evoName: "Dragonyx", evoColors: { T: "#0ea5e9", t: "#075985", h: "#fde047" },
  },
  magmite: {
    name: "Magmite", type: "fire", hp: 28, atk: 6, sprite: "magmite",
    moves: ["Spark Spit", "Lava Lob"],
    evoName: "Magmagore", evoColors: { M: "#f97316", m: "#431407", o: "#fde047" },
  },
  finblade: {
    name: "Finblade", type: "water", hp: 25, atk: 7, sprite: "finblade",
    moves: ["Fin Slash", "Riptide Rush"],
    evoName: "Finrazor", evoColors: { F: "#2dd4bf", f: "#115e59" },
  },
  batvolt: {
    name: "Batvolt", type: "electric", hp: 23, atk: 7, sprite: "batvolt",
    moves: ["Echo Zap", "Storm Wing"],
    evoName: "Thunderwing", evoColors: { B: "#facc15", b: "#713f12", Y: "#8b5cf6" },
  },
  crystix: {
    name: "Crystix", type: "rock", hp: 30, atk: 5, sprite: "crystix",
    moves: ["Shard Shot", "Crystal Crush"],
    evoName: "Crystalon", evoColors: { C: "#e879f9", c: "#86198f", w: "#fdf4ff" },
  },
  frostpup: {
    name: "Frostpup", type: "ice", hp: 25, atk: 6, sprite: "frostpup",
    moves: ["Frost Nip", "Ice Fang"],
    evoName: "Frostfang", evoColors: { I: "#38bdf8", i: "#1e40af", w: "#f0fdff" },
  },
  glacior: {
    name: "Glacior", type: "ice", hp: 33, atk: 5, sprite: "glacior",
    moves: ["Snow Puff", "Blizzard Blast"],
    evoName: "Glaciatron", evoColors: { B: "#22d3ee", b: "#155e75", w: "#ecfeff" },
  },
  yetai: {
    name: "Yetai", type: "ice", hp: 30, atk: 7, sprite: "yetai",
    moves: ["Snowball", "Avalanche"],
    evoName: "Yetaint", evoColors: { W: "#bae6fd", w: "#60a5fa", B: "#1d4ed8" },
  },
  aurion: {
    name: "Aurion", type: "dragon", hp: 42, atk: 9, sprite: "aurion",
    moves: ["Golden Claw", "Solar Roar"],
    legendary: true,
    evoName: "Aurion", evoColors: { T: "#fbbf24", t: "#b45309", h: "#f9fafb" },
  },
  pokejosh: {
    name: "PokeJosh", type: "psychic", hp: 30, atk: 8, sprite: "pokejosh",
    moves: ["Mind Flare", "Psy Inferno"],
    gift: true,
    evoName: "Mega PokeJosh", evoColors: { R: "#dc2626", r: "#7f1d1d", P: "#e879f9", w: "#fbbf24" },
  },
};

const SPECIES_LIST = Object.keys(DEX);
const REGULAR_SPECIES = SPECIES_LIST.filter((s) => !DEX[s].legendary && !DEX[s].gift);
const LEGEND_UNLOCK_COUNT = REGULAR_SPECIES.length; // catch every regular species

const MON_ID_MAX = 9999999;
let monUid = 1;
const nextMonId = () => { if (monUid > MON_ID_MAX) monUid = 1; return monUid++; };
let battleSeq = 1;
const nextBattleId = () => battleSeq++;

/* ---------------- Version & persistence ---------------- */

const GAME_VERSION = "v5.2";

/* Player profile: the name shown in the game, and which questions battles ask.
   "maths" = adaptive maths (the original game); "gk" = grown-up general knowledge. */
const NAME_MAX = 12;
const DEFAULT_NAME = "TRAINER";
// Letters from any language (so Ā, Ē, Ō, É… all work), digits and spaces; 12 characters max
const NAME_CHAR = /[\p{L}\p{M}\p{N} ]/u;
const nameFilter = (n) => Array.from(String(n == null ? "" : n).normalize("NFC").toUpperCase()).filter((ch) => NAME_CHAR.test(ch)).join("");
const cleanName = (n) => {
  const t = Array.from(nameFilter(n).replace(/\s+/g, " ").trim()).slice(0, NAME_MAX).join("").trim();
  return t || DEFAULT_NAME;
};
const titleCase = (n) => String(n).toLowerCase().replace(/(^|\s)(\p{L})/gu, (m, sp, c) => sp + c.toUpperCase());
const possessive = (n) => (n.endsWith("S") ? `${n}'` : `${n}'S`);
const QMODES = ["maths", "gk"];

/* Playing together */
const REGION_NAMES = ["Meadow", "Ember Caves", "Frozen Peaks"];
const EMOTES = ["👋", "😄", "👍", "❤️", "🎉", "❓"];
const monSig = (m) => (m ? [m.id, m.species, m.level, m.xp, m.atk, m.maxHp, m.shiny ? 1 : 0, m.evolved ? 1 : 0].join(".") : "-");
const monWire = (m) => ({ id: m.id, species: m.species, level: m.level, xp: m.xp, maxHp: m.maxHp, hp: m.hp, atk: m.atk, shiny: !!m.shiny, evolved: !!m.evolved });
const TX_LOG_MAX = 80;
const TX_PENDING_MAX = 20;
const GIFTS = [
  { id: "c25", label: "🪙 25 coins", coins: 25 },
  { id: "c100", label: "🪙 100 coins", coins: 100 },
  { id: "potion1", label: "🧪 1 Potion", items: { potion: 1 } },
  { id: "potion3", label: "🧪 3 Potions", items: { potion: 3 } },
  { id: "great1", label: "◓ 1 Great Ball", items: { greatball: 1 } },
  { id: "great3", label: "◓ 3 Great Balls", items: { greatball: 3 } },
  { id: "superpotion", label: "💖 1 Super Potion", items: { superpotion: 1 } },
  { id: "megaball", label: "🌟 1 Mega Ball", items: { megaball: 1 } },
];
/* ?slot=2 in the address keeps a second adventure on the same computer
   (e.g. two windows side by side, or testing two players on one laptop). */
const SAVE_SLOT = (() => { try { const v = new URLSearchParams(window.location.search).get("slot"); return /^[2-9]$/.test(v || "") ? "-slot" + v : ""; } catch (e) { return ""; } })();
const AUTOSAVE_KEY = "mathimal-quest-autosave" + SAVE_SLOT;

const HAS_STORAGE = (() => {
  try {
    const k = "__mq_test";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch (e) { return false; } // e.g. sandboxed artifact iframe — save codes still work
})();

function readAutoSave(key = AUTOSAVE_KEY) {
  if (!HAS_STORAGE) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return validateState(JSON.parse(raw)); // null if it isn't a playable save
  } catch (e) { return null; }
}

/* Returns true only if the save really reached storage. */
function writeAutoSave(state) {
  if (!HAS_STORAGE) return false;
  try { window.localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state)); return true; } catch (e) { return false; }
}

/* A small rolling history: one snapshot every 10+ minutes of play, newest first, 5 kept */
const RING_KEY = AUTOSAVE_KEY + "-history";
const RING_EVERY_MS = 10 * 60 * 1000;
function readRing() {
  if (!HAS_STORAGE) return [];
  try { const r = JSON.parse(window.localStorage.getItem(RING_KEY) || "[]"); return Array.isArray(r) ? r.filter((e) => e && isInt(e.at) && e.state) : []; } catch (e) { return []; }
}
function pushRing(state) {
  if (!HAS_STORAGE) return;
  try {
    const ring = readRing();
    if (ring.length && Date.now() - ring[0].at < RING_EVERY_MS) return;
    window.localStorage.setItem(RING_KEY, JSON.stringify([{ at: Date.now(), state }, ...ring].slice(0, 5)));
  } catch (e) { /* history is a bonus; never block the real save */ }
}

function backupAutoSave() {
  if (!HAS_STORAGE) return;
  try {
    const cur = window.localStorage.getItem(AUTOSAVE_KEY);
    if (cur) window.localStorage.setItem(BACKUP_KEY, cur);
  } catch (e) {}
}

/* Parent reward codes — one-time redeemable secrets (shop counter).
   Only salted hashes are stored, so the codes can't be read from the page source.
   To make your own: fnv32("mathimal-reward:" + CODE).toString(36) */
const rewardHash = (entry) => fnv32("mathimal-reward:" + entry).toString(36);
const REWARD_CODES = [
  { code: "r1", h: "pl1r6t", label: "250 coins", apply: (g) => g.addCoins(250) },
  { code: "r2", h: "1rdz4kh", label: "150 coins", apply: (g) => g.addCoins(150) },
  { code: "r3", h: "fassg6", label: "100 coins", apply: (g) => g.addCoins(100) },
  { code: "r4", h: "mdjxcc", label: "3 Potions + 3 Great Balls", apply: (g) => g.addItems({ potion: 3, greatball: 3 }) },
  { code: "r5", h: "1t6sh9i", label: "3 Super Potions", apply: (g) => g.addItems({ superpotion: 3 }) },
  { code: "r6", h: "1trb0l2", label: "a surprise SHINY Mathimal!", apply: (g) => g.giftShiny() },
];
/* Older saves stored the plain code text: map it to its id by hash */
const rewardId = (c) => {
  if (typeof c !== "string") return null;
  const byId = REWARD_CODES.find((r) => r.code === c);
  if (byId) return byId.code;
  const byHash = REWARD_CODES.find((r) => r.h === rewardHash(c.toUpperCase()));
  return byHash ? byHash.code : null;
};

function applyEvolution(mon) {
  const d = DEX[mon.species];
  mon.evolved = true;
  mon.name = d.evoName;
  mon.maxHp += 6;
  mon.atk += 3;
  mon.hp = mon.maxHp;
}

function makeMon(species, level, shiny = false) {
  const base = DEX[species];
  const mon = {
    id: nextMonId(),
    species,
    name: base.name,
    type: base.type,
    level,
    xp: 0,
    maxHp: base.hp + level * 3,
    hp: base.hp + level * 3,
    atk: base.atk + Math.floor(level * 1.4) + (shiny ? 1 : 0),
    evolved: false,
    shiny,
  };
  if (level >= 8) applyEvolution(mon);
  return mon;
}

function xpToNext(mon) { return mon.level * 24; }

function monVisual(mon) {
  return {
    sprite: DEX[mon.species].sprite,
    colorsOverride: mon.evolved ? DEX[mon.species].evoColors : null,
    hue: mon.shiny ? 150 : 0,
  };
}

function displayName(mon) { return (mon.shiny ? "✨" : "") + mon.name; }

/* ---------------- World maps ----------------
   Region 0 (Meadow): X tree  G grass  T tall grass  P path  W water
                      F flowers  H heal  D gym1  M shop  > east bridge
   Region 1 (Ember Caves): C wall  R rock floor  A ash grass  L lava
                      E gym2  H heal  < west bridge  } east bridge
   Region 2 (Frozen Peaks): I ice wall  S snow floor  N snow grass  Z frozen lake
                      Q Elite hall  H heal  M shop  { west bridge
   Topic gyms (v4.3): $ Coin Gym  @ Clock Tower (Meadow) · % Fraction Forge (Caves) · # Number Vault (Peaks) */

const MAPS = [
  [
    "XXXXXXXXXXXXXXXXXXXX",
    "XG@GGGGGGHPPPPPPDGGX",
    "XGTTTGGGGGPGGGGGGGGX",
    "XGTTTGGGGGPGGWWGGGGX",
    "XGTTTGGGGGPGGWWGGGGX",
    "XGGGGGGYGGPGGGGTTGGX",
    "XGGGFFGGGGPGGGGTTGGX",
    "XPPPPPPPPPPPPPPTTGG>",
    "XGGGFFGGGGPGGGGGYGGX",
    "XGVGGGGGGGPGGTTTGGGX",
    "XGTTGGGGGGPGGTTTGGGX",
    "XGTTYGGGGGPGGGGGGGGX",
    "XGGGGGGGKMPGGGGGG$GX",
    "XXXXXXXXXXXXXXXXXXXX",
  ].map((r) => r.split("")),
  [
    "CCCCCCCCCCCCCCCCCCCC",
    "CRRRRRRRRRRRRRRRERRC",
    "CRAARRLLRRRRRRRRRRRC",
    "CRAARRLLRRRAARRLLRRC",
    "CRAARRRRRRRAARRLLRR}",
    "CRRRRORRRRRAARRRRRRC",
    "CRRLLRRRRRRRRRRRAARC",
    "<RRLLRRRRRRRRRRRAARC",
    "CRRRRRRAARRRRRORAARC",
    "CRRRRRRAARRRLLRRRRRC",
    "CRAARRRAARRRLLRRRRRC",
    "CRAARRRRRRRRRRRRHRRC",
    "CR%RRRRRRRRRRRRRRORC",
    "CCCCCCCCCCCCCCCCCCCC",
  ].map((r) => r.split("")),
  [
    "IIIIIIIIIIIIIIIIIIII",
    "ISSSSSSSSSSSSSSSQSSI",
    "ISNNSSUSZZSSSSSSSSSI",
    "ISNNSSSSZZSSSNNSSSSI",
    "{SSSSSSSSSSSSNNSSSSI",
    "ISSSSNNSSSSSSSSSSSSI",
    "ISSSSNNSSSSZZSSSNNSI",
    "ISSSSSSSSSSZZSSSNNSI",
    "ISSZZSSSSSSSSSSSSUSI",
    "ISSZZSSSNNSSSSSSSSSI",
    "ISSSSSSSNNSSSSHSSSSI",
    "IS#SSSSSSSSSSSSSSSMI",
    "ISSSSSSSSSSUSSSSSSSI",
    "IIIIIIIIIIIIIIIIIIII",
  ].map((r) => r.split("")),
];

const ROWS = MAPS[0].length;
const COLS = MAPS[0][0].length;
const SOLID = new Set(["X", "W", "C", "L", "I", "Z"]);
const ENCOUNTER_TILES = new Set(["T", "A", "N"]);

const RIVAL_SPOTS = [
  { stage: 0, region: 0, x: 7, y: 7 },
  { stage: 1, region: 1, x: 13, y: 1 },
  { stage: 2, region: 0, x: 7, y: 7 },
];

/* Rarity tiers — weights are relative chances within a biome/time.
   common 60 · uncommon 28 · rare 12 (per entry, then normalised) */
const RARITY = { common: 60, uncommon: 28, rare: 12 };
const RARITY_LABEL = { common: "", uncommon: "Uncommon", rare: "RARE" };

const SPAWN_TABLES = {
  "0-day": [
    ["thornling", "common"], ["bublip", "common"], ["sparkit", "common"],
    ["embercub", "uncommon"], ["rockle", "uncommon"], ["wispur", "rare"],
  ],
  "0-night": [
    ["wispur", "common"], ["sparkit", "common"], ["rockle", "uncommon"],
    ["thornling", "uncommon"], ["batvolt", "rare"],
  ],
  "1-day": [
    ["magmite", "common"], ["rockle", "common"], ["crystix", "uncommon"],
    ["embercub", "uncommon"], ["finblade", "rare"],
  ],
  "1-night": [
    ["batvolt", "common"], ["magmite", "common"], ["wispur", "uncommon"],
    ["crystix", "uncommon"], ["finblade", "rare"],
  ],
  "2-day": [
    ["frostpup", "common"], ["glacior", "common"], ["crystix", "uncommon"],
    ["yetai", "uncommon"], ["bublip", "rare"],
  ],
  "2-night": [
    ["glacior", "common"], ["frostpup", "common"], ["yetai", "uncommon"],
    ["batvolt", "uncommon"], ["drakelet", "rare"],
  ],
};

function rollWild(region, night) {
  const table = SPAWN_TABLES[`${region}-${night ? "night" : "day"}`];
  const total = table.reduce((s, [, r]) => s + RARITY[r], 0);
  let roll = Math.random() * total;
  for (const [sp, rar] of table) {
    roll -= RARITY[rar];
    if (roll <= 0) return { species: sp, rarity: rar };
  }
  const last = table[table.length - 1];
  return { species: last[0], rarity: last[1] };
}

/* ---------------- Save codes ---------------- */

function checksum(s) {
  let ck = 0;
  for (let i = 0; i < s.length; i++) ck = (ck + s.charCodeAt(i) * (i + 1)) % 89;
  return ck;
}

const OUTFITS = [
  { id: "classic", name: "Classic", price: 0, colors: null },
  { id: "forest", name: "Forest Ranger", price: 400, colors: { C: "#16a34a", B: "#166534", D: "#3f3f46" } },
  { id: "midnight", name: "Midnight", price: 600, colors: { C: "#4c1d95", B: "#1e1b4b", D: "#0f172a" } },
  { id: "lava", name: "Lava Hunter", price: 800, colors: { C: "#f97316", B: "#b91c1c", D: "#451a03" } },
  { id: "golden", name: "Golden Champion", price: 5000, colors: { C: "#fde047", B: "#f59e0b", D: "#92400e" } },
];
const outfitColors = (id) => (OUTFITS.find((o) => o.id === id) || OUTFITS[0]).colors;

function encodeSave(st) {
  const flags =
    (st.badge1 ? 1 : 0) +
    (st.badge2 ? 2 : 0) +
    (st.champion ? 4 : 0) +
    (st.xpShare ? 8 : 0);
  const ownedOutfits = st.ownedOutfits || ["classic"];
  const outfitMask = OUTFITS.reduce((acc, o, i) => acc + (ownedOutfits.includes(o.id) ? Math.pow(2, i) : 0), 0);
  const outfitIdx = Math.max(0, OUTFITS.findIndex((o) => o.id === st.outfit));
  const seenMask = SPECIES_LIST.reduce((acc, sp, i) => acc + (st.seen[sp] ? Math.pow(2, i) : 0), 0);
  const caughtMask = SPECIES_LIST.reduce((acc, sp, i) => acc + (st.caught[sp] ? Math.pow(2, i) : 0), 0);
  const tablesMask = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
    (acc, t, i) => acc + ((st.tables[t] || 0) >= 10 ? Math.pow(2, i) : 0), 0);
  const nums = [
    6, st.skill, Math.min(99999, st.coins), flags,
    st.inv.potion, st.inv.superpotion, st.inv.greatball,
    st.rivalStage, seenMask, caughtMask,
    Math.min(999, st.towerBest || 0), tablesMask,
    outfitMask, outfitIdx, Math.min(99, st.luckyWins || 0),
  ];
  st.team.forEach((m) => {
    nums.push(SPECIES_LIST.indexOf(m.species), m.level, Math.min(599, m.xp), m.shiny ? 1 : 0);
  });
  const body = nums.join(".");
  return "MQ" + body + "Z" + checksum(body);
}

function maskToSet(mask) {
  const out = {};
  SPECIES_LIST.forEach((sp, i) => { if (mask & Math.pow(2, i)) out[sp] = true; });
  return out;
}

function tablesFromMask(mask) {
  const out = {};
  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((t, i) => { if (mask & Math.pow(2, i)) out[t] = 10; });
  return out;
}

function decodeSave(code) {
  try {
    const m = String(code).trim().toUpperCase().match(/^MQ([\d.]+)Z(\d+)$/);
    if (!m) return null;
    if (checksum(m[1]) !== Number(m[2])) return null;
    const n = m[1].split(".").map(Number);
    const ver = n[0];

    if (ver === 6 || ver === 5 || ver === 3) {
      const teamStart = ver === 6 ? 15 : ver === 5 ? 12 : 10;
      const team = [];
      for (let i = teamStart; i + 3 < n.length && team.length < 4; i += 4) {
        const sp = SPECIES_LIST[n[i]];
        if (!sp) return null;
        const mon = makeMon(sp, Math.max(1, Math.min(100, n[i + 1])), n[i + 3] === 1);
        mon.xp = n[i + 2];
        team.push(mon);
      }
      if (!team.length) return null;
      const seen = maskToSet(n[8]);
      const caught = maskToSet(n[9]);
      team.forEach((mn) => { seen[mn.species] = true; caught[mn.species] = true; });
      return {
        skill: Math.max(1, Math.min(10, n[1])),
        coins: Math.max(0, Math.min(99999, n[2])),
        badge1: (n[3] & 1) === 1,
        badge2: (n[3] & 2) === 2,
        champion: (n[3] & 4) === 4,
        inv: { potion: Math.min(99, n[4]), superpotion: Math.min(99, n[5]), greatball: Math.min(99, n[6]) },
        rivalStage: Math.max(0, Math.min(3, n[7])),
        towerBest: ver >= 5 ? Math.max(0, Math.min(999, n[10])) : 0,
        tables: ver >= 5 ? tablesFromMask(n[11]) : {},
        xpShare: (n[3] & 8) === 8,
        ownedOutfits: ver === 6 ? OUTFITS.filter((o, i) => o.id === "classic" || (n[12] & Math.pow(2, i))).map((o) => o.id) : ["classic"],
        outfit: ver === 6 && OUTFITS[n[13]] && (n[12] & Math.pow(2, n[13])) ? OUTFITS[n[13]].id : "classic",
        luckyWins: ver === 6 ? Math.max(0, Math.min(99, n[14])) : 0,
        seen, caught, team,
      };
    }

    /* legacy v2 */
    if (ver === 2 && n.length >= 12) {
      const team = [];
      for (let i = 8; i + 3 < n.length && team.length < 4; i += 4) {
        const sp = SPECIES_LIST[n[i]];
        if (!sp) return null;
        const mon = makeMon(sp, Math.max(1, Math.min(40, n[i + 1])), n[i + 3] === 1);
        mon.xp = n[i + 2];
        team.push(mon);
      }
      if (!team.length) return null;
      const seen = {}, caught = {};
      team.forEach((mn) => { seen[mn.species] = true; caught[mn.species] = true; });
      return {
        skill: Math.max(1, Math.min(10, n[1])),
        coins: Math.max(0, Math.min(99999, n[2])),
        badge1: (n[3] & 1) === 1,
        badge2: (n[3] & 2) === 2,
        champion: false,
        inv: { potion: Math.min(99, n[4]), superpotion: Math.min(99, n[5]), greatball: Math.min(99, n[6]) },
        rivalStage: Math.max(0, Math.min(3, n[7])),
        seen, caught, team,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

/* ---------------- Durable save state (v4.2) ----------------
   ONE format for both auto-save and save codes, and every load goes through
   validateState() before anything in the game changes. */

const MAX_LEVEL = 100;
const TEAM_MAX = 4;
const BOX_MAX = 400;      // catching and hatching stop here (Box full message)
const BOX_STORE_MAX = 450; // saves/codes accept a little more, so gifts that arrive when full are never lost
/* One set of limits shared by gameplay, saves and save codes, so nothing earned is ever trimmed on reload */
const COIN_MAX = 999999;
const ITEM_MAX = 999;
const RES_MAX = 99999;
const addCap = (have, n, max) => Math.min(max, (have || 0) + n);
const ITEM_KEYS = ["potion", "superpotion", "greatball", "megaball", "duskball", "netball", "timerball", "healball"];
const ITEM_NAMES = { potion: "Potion", superpotion: "Super Potion", greatball: "Great Ball", megaball: "Mega Ball", duskball: "Dusk Ball", netball: "Net Ball", timerball: "Timer Ball", healball: "Heal Ball" };
const RES_KEYS = ["wood", "ore", "crystal"];
const TABLE_NUMS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const BACKUP_KEY = "mathimal-quest-autosave-previous" + SAVE_SLOT;

const isInt = (v) => Number.isSafeInteger(v);
const clampInt = (v, lo, hi, dflt) => (isInt(v) ? Math.min(hi, Math.max(lo, v)) : dflt);

/* Rebuild one creature from untrusted data; returns null if it isn't a real Mathimal. */
function cleanMon(raw, usedIds) {
  if (!raw || typeof raw !== "object") return null;
  const sp = raw.species;
  if (typeof sp !== "string" || !Object.prototype.hasOwnProperty.call(DEX, sp)) return null;
  const level = clampInt(raw.level, 1, MAX_LEVEL, null);
  if (level === null) return null;
  const d = DEX[sp];
  const shiny = raw.shiny === true;
  const evolved = raw.evolved === true || level >= 8;
  const ref = makeMon(sp, level, shiny); // fallback stats if the saved ones are missing
  const maxHp = clampInt(raw.maxHp, 1, 9999, ref.maxHp);
  const atk = clampInt(raw.atk, 1, 9999, ref.atk);
  const hp = clampInt(raw.hp, 0, maxHp, maxHp);
  const xp = level >= MAX_LEVEL ? 0 : clampInt(raw.xp, 0, level * 24 - 1, 0);
  // IDs are small whole numbers; anything odd (huge, negative, duplicate) is simply re-numbered
  let id = isInt(raw.id) && raw.id > 0 && raw.id <= MON_ID_MAX && !usedIds.has(raw.id) ? raw.id : ref.id;
  for (let guard = 0; usedIds.has(id) && guard < 100000; guard++) id = nextMonId();
  usedIds.add(id);
  return { id, species: sp, name: evolved ? d.evoName : d.name, type: d.type, level, xp, maxHp, hp, atk, evolved, shiny };
}

/* Validate a whole save. Returns a clean, playable state or null (nothing applied). */
function validateState(raw) {
  if (!raw || typeof raw !== "object") return null;
  const used = new Set();
  const mons = (arr, max) => (Array.isArray(arr) ? arr.slice(0, max) : []).map((m) => cleanMon(m, used)).filter(Boolean);
  let team = mons(raw.team, 50);
  let box = mons(raw.box, BOX_STORE_MAX);
  if (!team.length && box.length) team = box.splice(0, 1);
  if (!team.length) return null;
  if (team.length > TEAM_MAX) { box = [...team.slice(TEAM_MAX), ...box].slice(0, BOX_STORE_MAX); team = team.slice(0, TEAM_MAX); }
  let healed = false;
  if (!team.some((m) => m.hp > 0)) { team = team.map((m) => ({ ...m, hp: m.maxHp })); healed = true; }
  const maxId = [...team, ...box].reduce((mx, m) => Math.max(mx, m.id), 0);
  if (maxId >= monUid) monUid = maxId + 1;
  if (monUid > MON_ID_MAX) monUid = maxId + 1; // never let a bad save poison the counter
  const pickSet = (o) => {
    const out = {};
    if (o && typeof o === "object") SPECIES_LIST.forEach((sp) => { if (o[sp]) out[sp] = true; });
    return out;
  };
  const seenAny = pickSet(raw.seen), caughtAny = pickSet(raw.caught);
  [...team, ...box].forEach((m) => { seenAny[m.species] = true; caughtAny[m.species] = true; });
  const seen = {}, caught = {}; // one consistent order, whatever the source
  SPECIES_LIST.forEach((sp) => { if (seenAny[sp] || caughtAny[sp]) seen[sp] = true; if (caughtAny[sp]) caught[sp] = true; });
  const inv = {};
  ITEM_KEYS.forEach((k) => { inv[k] = clampInt(raw.inv && raw.inv[k], 0, ITEM_MAX, 0); });
  const resources = {};
  RES_KEYS.forEach((k) => { resources[k] = clampInt(raw.resources && raw.resources[k], 0, RES_MAX, 0); });
  const tables = {};
  TABLE_NUMS.forEach((t) => { const v = raw.tables && raw.tables[t]; if (isInt(v) && v > 0) tables[t] = Math.min(999, v); });
  const eggs = (Array.isArray(raw.eggs) ? raw.eggs : []).filter((n) => isInt(n) && n >= 1 && n <= 40).slice(0, 3);
  const codes = REWARD_CODES.map((c) => c.code);
  const redeemed = [...new Set((Array.isArray(raw.redeemed) ? raw.redeemed : []).map(rewardId).filter((c) => c && codes.includes(c)))];
  const outfitIds = OUTFITS.map((o) => o.id);
  const ownedOutfits = [...new Set(["classic", ...(Array.isArray(raw.ownedOutfits) ? raw.ownedOutfits : []).filter((o) => outfitIds.includes(o))])];
  const outfit = ownedOutfits.includes(raw.outfit) ? raw.outfit : "classic";
  const topicBadges = {}, topicProgress = {}, feats = {};
  TOPIC_IDS.forEach((t) => {
    if (raw.topicBadges && raw.topicBadges[t] === true) topicBadges[t] = true;
    topicProgress[t] = clampInt(raw.topicProgress && raw.topicProgress[t], 0, 99999, 0);
  });
  FEAT_KEYS.forEach((k) => { feats[k] = clampInt(raw.feats && raw.feats[k], 0, 9999999, 0); });
  const medals = MEDAL_IDS.filter((id) => Array.isArray(raw.medals) && raw.medals.includes(id));
  return {
    team, box, inv, resources, tables, eggs, redeemed, ownedOutfits, outfit, seen, caught, healed,
    topicBadges, topicProgress, feats, medals,
    coins: clampInt(raw.coins, 0, COIN_MAX, 0),
    badge1: raw.badge1 === true, badge2: raw.badge2 === true, champion: raw.champion === true,
    rivalStage: clampInt(raw.rivalStage, 0, 3, 0),
    towerBest: clampInt(raw.towerBest, 0, 999, 0),
    skill: clampInt(raw.skill, 1, 10, 2),
    luckyWins: clampInt(raw.luckyWins, 0, 999, 0),
    xpShare: raw.xpShare === true,
    playerName: cleanName(raw.playerName),
    qmode: QMODES.includes(raw.qmode) ? raw.qmode : "maths",
    gkCorrect: clampInt(raw.gkCorrect, 0, 9999999, 0),
    txLog: (Array.isArray(raw.txLog) ? raw.txLog : []).filter((x) => typeof x === "string" && x.length <= 24).slice(0, TX_LOG_MAX),
    pendingTx: cleanPending(raw.pendingTx),
    duelRec: { w: clampInt(raw.duelRec && raw.duelRec.w, 0, 99999, 0), l: clampInt(raw.duelRec && raw.duelRec.l, 0, 99999, 0), s: clampInt(raw.duelRec && raw.duelRec.s, 0, 99999, 0) },
  };
}

/* Transactions still waiting for the other laptop (kept in the auto-save, not in save codes) */
function cleanPending(list) {
  const out = [];
  (Array.isArray(list) ? list : []).slice(0, TX_PENDING_MAX).forEach((r) => {
    if (!r || typeof r.id !== "string" || r.id.length > 24) return;
    const to = typeof r.to === "string" ? r.to.slice(0, 40) : "";
    if (r.k === "gift") {
      const items = {};
      if (r.items && typeof r.items === "object") ITEM_KEYS.forEach((k) => { const n = clampInt(r.items[k], 0, 10, 0); if (n) items[k] = n; });
      out.push({ k: "gift", id: r.id, to, coins: clampInt(r.coins, 0, 1000, 0), items });
    } else if (r.k === "trade" && isInt(r.giveId) && isInt(r.takeId) && DEX[r.giveSpecies] && DEX[r.takeSpecies] && r.take && DEX[r.take.species]) {
      out.push({ k: "trade", id: r.id, to, giveId: r.giveId, giveSpecies: r.giveSpecies, takeId: r.takeId, takeSpecies: r.takeSpecies, take: r.take });
    }
  });
  return out;
}

/* 32-bit FNV-1a: a much stronger typo check than the old one */
function fnv32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

/* Save code v7: digits and dots only (so capitals don't matter), and it holds
   EVERYTHING auto-save does — box, items, resources, eggs, exact stats, partial tables. */
function encodeFullCode(st) {
  const flags = (st.badge1 ? 1 : 0) + (st.badge2 ? 2 : 0) + (st.champion ? 4 : 0) + (st.xpShare ? 8 : 0);
  const mask = (keys, has) => keys.reduce((acc, k, i) => acc + (has(k) ? Math.pow(2, i) : 0), 0);
  const monNums = (m) => [SPECIES_LIST.indexOf(m.species), m.level, m.xp, m.maxHp, Math.max(0, m.hp), m.atk, (m.shiny ? 1 : 0) + (m.evolved ? 2 : 0)];
  const nums = [
    9, st.skill, st.coins, flags,
    ...ITEM_KEYS.map((k) => st.inv[k] || 0),
    ...RES_KEYS.map((k) => st.resources[k] || 0),
    st.rivalStage, mask(SPECIES_LIST, (sp) => st.seen[sp]), mask(SPECIES_LIST, (sp) => st.caught[sp]),
    st.towerBest, ...TABLE_NUMS.map((t) => st.tables[t] || 0),
    st.eggs.length, ...st.eggs, st.luckyWins,
    mask(REWARD_CODES.map((c) => c.code), (c) => st.redeemed.includes(c)),
    Math.max(0, OUTFITS.findIndex((o) => o.id === st.outfit)), mask(OUTFITS.map((o) => o.id), (o) => st.ownedOutfits.includes(o)),
    st.team.length, ...st.team.flatMap(monNums),
    st.box.length, ...st.box.flatMap(monNums),
    // v8 additions: topic badges, topic progress, feats, medals
    mask(TOPIC_IDS, (t) => st.topicBadges && st.topicBadges[t]),
    ...TOPIC_IDS.map((t) => Math.min(99999, (st.topicProgress && st.topicProgress[t]) || 0)),
    ...FEAT_KEYS.map((k) => Math.min(9999999, (st.feats && st.feats[k]) || 0)),
    (st.medals || []).length, ...(st.medals || []).map((id) => MEDAL_IDS.indexOf(id)),
    // v9 additions: question mode, general-knowledge progress, player name (as character codes)
    Math.max(0, QMODES.indexOf(st.qmode)), Math.min(9999999, st.gkCorrect || 0),
    ...(() => { const cps = Array.from(cleanName(st.playerName)).map((ch) => ch.codePointAt(0)); return [cps.length, ...cps]; })(),
  ];
  const body = nums.join(".");
  return "MQ" + body + "Z" + fnv32(body);
}

function decodeFullCode(n) {
  let i = 0;
  const take = () => { if (i >= n.length) throw new Error("short"); return n[i++]; };
  const raw = {};
  take(); // version
  raw.skill = take(); raw.coins = take();
  const flags = take();
  raw.badge1 = (flags & 1) === 1; raw.badge2 = (flags & 2) === 2; raw.champion = (flags & 4) === 4; raw.xpShare = (flags & 8) === 8;
  raw.inv = {}; ITEM_KEYS.forEach((k) => { raw.inv[k] = take(); });
  raw.resources = {}; RES_KEYS.forEach((k) => { raw.resources[k] = take(); });
  raw.rivalStage = take();
  raw.seen = maskToSet(take()); raw.caught = maskToSet(take());
  raw.towerBest = take();
  raw.tables = {}; TABLE_NUMS.forEach((t) => { raw.tables[t] = take(); });
  const eggN = take(); if (eggN > 3) throw new Error("eggs");
  raw.eggs = []; for (let k = 0; k < eggN; k++) raw.eggs.push(take());
  raw.luckyWins = take();
  const rm = take(); raw.redeemed = REWARD_CODES.filter((c, k) => rm & Math.pow(2, k)).map((c) => c.code);
  const oi = take(), om = take();
  raw.ownedOutfits = OUTFITS.filter((o, k) => om & Math.pow(2, k)).map((o) => o.id);
  raw.outfit = OUTFITS[oi] ? OUTFITS[oi].id : "classic";
  const readMons = (count, max) => {
    if (count > max) throw new Error("too many");
    const out = [];
    for (let k = 0; k < count; k++) {
      const [s, level, xp, maxHp, hp, atk, f] = [take(), take(), take(), take(), take(), take(), take()];
      out.push({ species: SPECIES_LIST[s], level, xp, maxHp, hp, atk, shiny: (f & 1) === 1, evolved: (f & 2) === 2 });
    }
    return out;
  };
  raw.team = readMons(take(), TEAM_MAX);
  raw.box = readMons(take(), BOX_STORE_MAX);
  if (n[0] >= 8) {
    const tm = take();
    raw.topicBadges = {}; TOPIC_IDS.forEach((t, k) => { if (tm & Math.pow(2, k)) raw.topicBadges[t] = true; });
    raw.topicProgress = {}; TOPIC_IDS.forEach((t) => { raw.topicProgress[t] = take(); });
    raw.feats = {}; FEAT_KEYS.forEach((k) => { raw.feats[k] = take(); });
    const mc = take(); if (mc > MEDALS.length) throw new Error("medals");
    raw.medals = []; for (let k = 0; k < mc; k++) { const id = MEDAL_IDS[take()]; if (!id) throw new Error("medal"); raw.medals.push(id); }
  }
  if (n[0] >= 9) {
    raw.qmode = QMODES[take()] || "maths";
    raw.gkCorrect = take();
    const nl = take(); if (nl > NAME_MAX) throw new Error("name");
    let nm = ""; for (let k = 0; k < nl; k++) { const c = take(); if (c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff)) throw new Error("name"); nm += String.fromCodePoint(c); }
    raw.playerName = nm;
  }
  if (i !== n.length) throw new Error("extra");
  return raw;
}

/* Read any save code (new or older). Returns { state, legacy } or null — never throws. */
function readSaveCode(code) {
  try {
    const m = String(code).replace(/\s+/g, "").toUpperCase().match(/^MQ([\d.]+)Z(\d+)$/);
    if (!m) return null;
    const tokens = m[1].split(".");
    // every number must be a real, sensible whole number (blocks empty or giant values)
    if (!tokens.every((t) => /^\d{1,7}$/.test(t))) return null;
    const n = tokens.map(Number);
    if (n[0] === 7 || n[0] === 8 || n[0] === 9) {
      if (fnv32(m[1]) !== Number(m[2])) return null;
      const state = validateState(decodeFullCode(n));
      return state ? { state, legacy: false } : null;
    }
    const old = decodeSave(code);
    if (!old) return null;
    const state = validateState({ ...old, box: [], resources: {}, eggs: [], redeemed: [] });
    return state ? { state, legacy: true } : null;
  } catch (e) {
    return null;
  }
}

const SPECIES_TO_CATCH = 8; // unlock condition for Frozen Peaks

/* ---------------- Adaptive maths engine ---------------- */

const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[ri(0, arr.length - 1)];

const WP_NAMES = ["Sparkit", "Bublip", "Embercub", "Thornling", "Rockle", "Wispur", "Magmite", "Crystix"];

function wordProblem(L) {
  const name = pick(WP_NAMES);
  const v = Math.random();
  if (L <= 5) {
    if (v < 0.5) {
      const a = ri(10, 40), b = ri(5, 20);
      return { text: `${name} has ${a} berries and finds ${b} more. How many berries now?`, answer: a + b, op: "word" };
    }
    const a = ri(20, 60), b = ri(5, 18);
    return { text: `${name} had ${a} coins and spent ${b} at the shop. How many are left?`, answer: a - b, op: "word" };
  }
  if (L <= 7) {
    if (v < 0.5) {
      const a = ri(20, 70), b = ri(10, 30);
      return { text: `${name} has ${a} berries and finds ${b} more. How many altogether?`, answer: a + b, op: "word" };
    }
    const n = ri(3, 6), m = ri(3, 6);
    return { text: `${n} Mathimals each eat ${m} berries. How many berries in total?`, answer: n * m, op: "word" };
  }
  if (v < 0.4) {
    const n = ri(3, 7), m = ri(4, 9);
    return { text: `${n} Mathimals each eat ${m} berries. How many berries in total?`, answer: n * m, op: "word" };
  }
  if (v < 0.7) {
    const b = pick([2, 3, 4, 5]), each = ri(4, 9);
    return { text: `${b * each} berries are shared equally between ${b} friends. How many each?`, answer: each, op: "word" };
  }
  const a = ri(3, 7), m = ri(3, 8), c = ri(5, 20);
  return { text: `${name} wins ${a} battles worth ${m} coins each, then finds ${c} more. Total coins?`, answer: a * m + c, op: "word" };
}

/*
  Progressive maths — 10 finely-graded levels, age ~6-10 (NZ Yr 2-6).
  Each level keeps earlier skills in the mix and adds ONE new idea, with
  number sizes growing gently. Word problems fold in from L6+.

  L1  add/sub within 10
  L2  add/sub within 20
  L3  add to 50, sub within 30 (mostly no regrouping)
  L4  add/sub within 100; ×2 ×10 introduced lightly
  L5  ×2 ×5 ×10 tables; 2-digit add/sub
  L6  ×3 ×4 tables; bigger 2-digit add/sub; word problems begin
  L7  ×2-×6 tables; ÷ by 2,5,10; missing-number (+)
  L8  ×2-×9 tables; ÷ by 2,3,4,5; missing-number (+/−)
  L9  full tables to ×10; ÷ to ÷10; missing-number (×)
  L10 2-step (× then +); ×/÷ to 12; harder missing-number
*/
function genQuestion(level, topics = null, progress = {}) {
  // Topics won at a Topic Gym join the mix in wild/trainer battles (about 1 in 4 questions)
  if (topics && topics.length && Math.random() < 0.25) return genTopicQuestion(pick(topics), level, progress);
  const L = Math.max(1, Math.min(10, level));
  if (L >= 6 && Math.random() < 0.25) return wordProblem(L);
  const m = Math.random();
  let text, answer, op;
  const addsub = (maxA, maxB, allowNeg = false) => {
    if (m < 0.55) { const a = ri(2, maxA), b = ri(1, maxB); return [`${a} + ${b}`, a + b, "add"]; }
    const a = ri(Math.ceil(maxA / 2), maxA), b = ri(1, Math.min(a, maxB)); return [`${a} − ${b}`, a - b, "sub"];
  };

  if (L === 1) {
    [text, answer, op] = addsub(9, 8);
  } else if (L === 2) {
    [text, answer, op] = addsub(20, 9);
  } else if (L === 3) {
    if (m < 0.5) { const a = ri(10, 45), b = ri(2, 9); [text, answer, op] = [`${a} + ${b}`, a + b, "add"]; }
    else { const a = ri(12, 30), b = ri(2, Math.min(a, 12)); [text, answer, op] = [`${a} − ${b}`, a - b, "sub"]; }
  } else if (L === 4) {
    if (m < 0.4) { const a = ri(20, 80), b = ri(5, 20); [text, answer, op] = [`${a} + ${b}`, a + b, "add"]; }
    else if (m < 0.8) { const a = ri(25, 99), b = ri(5, 24); [text, answer, op] = [`${a} − ${b}`, a - b, "sub"]; }
    else { const t = pick([2, 10]), a = ri(2, 10); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
  } else if (L === 5) {
    if (m < 0.5) { const t = pick([2, 5, 10]), a = ri(2, 12); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
    else if (m < 0.78) { const a = ri(20, 80), b = ri(10, 30); [text, answer, op] = [`${a} + ${b}`, a + b, "add"]; }
    else { const a = ri(30, 90), b = ri(10, 28); [text, answer, op] = [`${a} − ${b}`, a - b, "sub"]; }
  } else if (L === 6) {
    if (m < 0.5) { const t = pick([2, 3, 4, 5, 10]), a = ri(2, 12); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
    else if (m < 0.78) { const a = ri(30, 99), b = ri(15, 45); [text, answer, op] = [`${a} + ${b}`, a + b, "add"]; }
    else { const a = ri(40, 99), b = ri(12, 38); [text, answer, op] = [`${a} − ${b}`, a - b, "sub"]; }
  } else if (L === 7) {
    if (m < 0.45) { const t = pick([2, 3, 4, 5, 6]), a = ri(2, 12); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
    else if (m < 0.75) { const t = pick([2, 5, 10]), q = ri(2, 10); [text, answer, op] = [`${t * q} ÷ ${t}`, q, "div"]; }
    else { const a = ri(5, 15), b = ri(20, 50); [text, answer, op] = [`? + ${a} = ${a + b}`, b, "missing"]; }
  } else if (L === 8) {
    if (m < 0.45) { const t = pick([2, 3, 4, 5, 6, 7, 8, 9]), a = ri(2, 12); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
    else if (m < 0.72) { const t = pick([2, 3, 4, 5]), q = ri(2, 10); [text, answer, op] = [`${t * q} ÷ ${t}`, q, "div"]; }
    else if (m < 0.86) { const a = ri(8, 20), b = ri(20, 60); [text, answer, op] = [`? + ${a} = ${a + b}`, b, "missing"]; }
    else { const a = ri(30, 80), b = ri(10, 28); [text, answer, op] = [`? − ${b} = ${a}`, a + b, "missing"]; }
  } else if (L === 9) {
    if (m < 0.4) { const t = pick([3, 4, 6, 7, 8, 9, 10, 11, 12]), a = ri(3, 10); [text, answer, op] = [`${a} × ${t}`, a * t, "mul"]; }
    else if (m < 0.7) { const t = pick([3, 4, 5, 6, 7, 8, 9, 10]), q = ri(2, 10); [text, answer, op] = [`${t * q} ÷ ${t}`, q, "div"]; }
    else { const t = ri(2, 9), q = ri(3, 10); [text, answer, op] = [`? × ${t} = ${t * q}`, q, "missing"]; }
  } else { // L10
    if (m < 0.4) { const a = ri(3, 9), b = ri(3, 9), c = ri(2, 20); [text, answer, op] = [`${a} × ${b} + ${c}`, a * b + c, "mul"]; }
    else if (m < 0.7) { const t = pick([3, 4, 6, 7, 8, 9, 11, 12]), q = ri(3, 12); [text, answer, op] = [`${t * q} ÷ ${t}`, q, "div"]; }
    else if (m < 0.85) { const a = ri(6, 12), b = ri(6, 12); [text, answer, op] = [`${a} × ${b}`, a * b, "mul"]; }
    else { const t = ri(3, 9), q = ri(4, 12); [text, answer, op] = [`? × ${t} = ${t * q}`, q, "missing"]; }
  }
  // Tag times-table questions with which table they exercise (2-12),
  // parsed from the standard forms "a × t", "x ÷ t", "? × t = y".
  let table = null;
  const tm = text.match(/(?:×|÷) (\d+)/);
  if (tm && op !== "word") {
    const t = Number(tm[1]);
    if (t >= 2 && t <= 12) table = t;
  }
  return { text, answer, op, table };
}

const OP_LABELS = {
  add: "Addition", sub: "Subtraction", mul: "Multiplication",
  div: "Division", missing: "Missing number", word: "Word problems",
  money: "Money ($)", time: "Telling time", fraction: "Fractions", place: "Place value & patterns",
  gk: "General knowledge",
};

/* ---------------- Topic questions (v4.3) ----------------
   Four new topics, each with its own Topic Gym. Beating a gym adds that topic
   to wild battles. Difficulty comes in 3 tiers that follow Maths Power:
   tier 1 = Maths Power 1-4, tier 2 = 5-7, tier 3 = 8-10. */

const TOPICS = [
  { id: "money", name: "Money", emoji: "💰", badge: "Coin Badge", gym: "Coin Gym", leader: "Banker Bea", tile: "$", region: 0, pos: { x: 17, y: 12 },
    sprite: "prime", hue: 90, team: [["sparkit", 1], ["rockle", 2]],
    hello: '"Welcome to the COIN GYM! Count your dollars and cents carefully — every question here is about MONEY!"',
    again: '"Back for more coin-counting? Let\'s see if you can still make the right change!"' },
  { id: "time", name: "Time", emoji: "🕒", badge: "Clock Badge", gym: "Clock Tower", leader: "Tick-Tock Theo", tile: "@", region: 0, pos: { x: 2, y: 1 },
    sprite: "elite2", hue: 200, team: [["wispur", 1], ["batvolt", 2]],
    hello: '"Tick... tock... I\'m Theo of the CLOCK TOWER! Read my clocks right to win the Clock Badge!"',
    again: '"Time for a rematch! My clocks have been practising!"' },
  { id: "fraction", name: "Fractions", emoji: "🍕", badge: "Slice Badge", gym: "Fraction Forge", leader: "Chef Fran", tile: "%", region: 1, pos: { x: 2, y: 12 },
    sprite: "elite3", hue: 40, team: [["magmite", 1], ["embercub", 2]],
    hello: '"I\'m Chef Fran! At the FRACTION FORGE we cut everything into halves, quarters and thirds. Ready?"',
    again: '"Another slice of battle? Coming right up!"' },
  { id: "place", name: "Place value", emoji: "🔢", badge: "Digit Badge", gym: "Number Vault", leader: "Professor Digit", tile: "#", region: 2, pos: { x: 2, y: 11 },
    sprite: "elite1", hue: 270, team: [["glacior", 1], ["crystix", 2], ["frostpup", 3]],
    hello: '"The NUMBER VAULT opens only for trainers who know their ones, tens and hundreds — and can spot a pattern!"',
    again: '"Back to the Vault? My patterns have grown trickier!"' },
];
const TOPIC_IDS = TOPICS.map((t) => t.id);
const TOPIC_BY_TILE = Object.fromEntries(TOPICS.map((t) => [t.tile, t]));
const topicTier = (L) => (L <= 4 ? 1 : L <= 7 ? 2 : 3);

/* Multiple-choice helper: always 4 unique choices (answer included), shuffled. */
function mcq(text, answer, wrongs, extra = {}, filler = null) {
  const set = [String(answer)];
  // a choice is a duplicate if it's the same text OR the same fraction value (1/2 vs 2/4)
  const dup = (s) => set.some((x) => x === s || sameFraction(x, s));
  for (const w of wrongs) { const s = String(w); if (!dup(s) && set.length < 4) set.push(s); }
  let guard = 0;
  while (filler && set.length < 4 && guard++ < 80) { const s = String(filler()); if (!dup(s)) set.push(s); }
  const choices = set.sort(() => Math.random() - 0.5);
  return { text, answer: String(answer), choices, ...extra };
}

// "2/4" and "1/2" are the same amount: a/b == c/d when a*d == c*b
const fracParts = (s) => { const m = /^(\d+)\/(\d+)$/.exec(String(s)); return m ? [Number(m[1]), Number(m[2])] : null; };
const sameFraction = (x, y) => { const a = fracParts(x), b = fracParts(y); return !!(a && b && a[1] && b[1] && a[0] * b[1] === b[0] * a[1]); };

const dollars = (c) => `$${Math.floor(c / 100)}.${String(c % 100).padStart(2, "0")}`;
const SHOP_ITEMS = ["a Potion", "a Great Ball", "a berry pie", "a Mathimal sticker", "a toy pickaxe", "a snow cone"];

function moneyQ(t) {
  const v = Math.random();
  const op = "money";
  if (t === 1) {
    if (v < 0.34) {
      const twos = ri(1, 4), ones = ri(1, 4);
      return { text: `You have ${twos} × $2 coin${twos > 1 ? "s" : ""} and ${ones} × $1 coin${ones > 1 ? "s" : ""}. How many dollars is that?`, answer: twos * 2 + ones, op };
    }
    if (v < 0.67) {
      const a = ri(2, 9), b = ri(2, 9);
      const i1 = pick(SHOP_ITEMS), i2 = pick(SHOP_ITEMS.filter((s) => s !== i1));
      return { text: `${cap(i1)} costs $${a} and ${i2} costs $${b}. How many dollars for both?`, answer: a + b, op };
    }
    const p = ri(2, 9);
    return { text: `You pay with a $10 note for ${pick(SHOP_ITEMS)} that costs $${p}. How many dollars change?`, answer: 10 - p, op };
  }
  if (t === 2) {
    if (v < 0.25) {
      const p = ri(11, 19);
      return { text: `You pay with a $20 note for something that costs $${p}. How many dollars change?`, answer: 20 - p, op };
    }
    if (v < 0.5) {
      const c = pick([10, 20, 50]), d = pick([1, 2, 3]);
      return { text: `How many ${c}c coins make $${d}?`, answer: (d * 100) / c, op };
    }
    if (v < 0.75) {
      const n = ri(2, 5), each = pick([2, 3, 4, 5, 10]);
      return { text: `${n} Mathimal treats cost $${each} each. How many dollars altogether?`, answer: n * each, op };
    }
    const c = pick([10, 20, 50]), k = ri(2, 6);
    return { text: `You have ${k} × ${c}c coins. How many cents is that?`, answer: k * c, op };
  }
  // tier 3: dollars AND cents
  if (v < 0.35) {
    const a = ri(11, 45) * 10, b = ri(11, 45) * 10, s = a + b;
    return mcq(`${dollars(a)} + ${dollars(b)} = ?`, dollars(s), [dollars(s + 10), dollars(s - 10), dollars(s + 100), dollars(s - 100), dollars(s + 50)], { op });
  }
  if (v < 0.7) {
    const p = ri(51, 95) * 10, ch = 1000 - p;
    return mcq(`You pay with a $10 note for something that costs ${dollars(p)}. How much change?`, dollars(ch),
      [dollars(ch + 10), dollars(ch - 10), dollars(ch + 100), dollars(Math.max(10, ch - 100)), dollars(1100 - p)], { op });
  }
  const c = ri(11, 49) * 10;
  return { text: `How many cents is ${dollars(c)}?`, answer: c, op };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const h12 = (h) => ((h - 1 + 12) % 12) + 1;

function timeLabel(h, m) {
  if (m === 0) return `${h} o'clock`;
  if (m === 30) return `half past ${h}`;
  if (m === 15) return `quarter past ${h}`;
  if (m === 45) return `quarter to ${h12(h + 1)}`;
  return `${h}:${String(m).padStart(2, "0")}`;
}
const digital = (h, m) => `${h12(h)}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`;

function timeQ(t) {
  const v = Math.random();
  const op = "time";
  const h = ri(1, 12);
  if (t === 1) {
    if (v < 0.15) return { text: "How many minutes are in one hour?", answer: 60, op };
    const m = pick([0, 30]);
    const all = [0, 30].flatMap((mm) => [h, h12(h + 1), h12(h - 1)].map((hh) => timeLabel(hh, mm)));
    return mcq("What time does the clock show?", timeLabel(h, m), all.sort(() => Math.random() - 0.5), { op, clock: { h, m } });
  }
  if (t === 2) {
    if (v < 0.15) {
      const [w, a] = pick([["half an hour", 30], ["a quarter of an hour", 15], ["two hours", 120]]);
      return { text: `How many minutes are in ${w}?`, answer: a, op };
    }
    const m = pick([15, 45, 15, 45, 0, 30]);
    const wrongs = [timeLabel(h, (m + 30) % 60), m === 15 ? `quarter to ${h}` : m === 45 ? `quarter past ${h}` : timeLabel(h12(h + 1), m),
      timeLabel(h12(h + 1), m), timeLabel(h12(h - 1), m), `quarter past ${h12(h + 1)}`];
    return mcq("What time does the clock show?", timeLabel(h, m), wrongs, { op, clock: { h, m } });
  }
  // tier 3: five-minute times, and "how long until"
  if (v < 0.3) {
    const m0 = ri(0, 5) * 5, d = pick([10, 15, 20, 25, 30]);
    return { text: `It is ${digital(h, m0)}. How many minutes until ${digital(h, m0 + d)}?`, answer: d, op };
  }
  const m = ri(1, 11) * 5;
  if (v < 0.55) {
    const d = pick([10, 15, 20, 30]);
    const tm = m + d, hh = tm >= 60 ? h + 1 : h;
    const ans = digital(hh, tm);
    return mcq(`The clock shows the time now. What time will it be in ${d} minutes?`, ans,
      [digital(hh, tm + 5), digital(hh, tm - 5), digital(h, m), digital(hh + 1, tm), digital(hh, tm + 10)], { op, clock: { h, m } });
  }
  const swapped = `${m / 5}:${String((h * 5) % 60).padStart(2, "0")}`;
  return mcq("What time does the clock show?", digital(h, m),
    [swapped, digital(h, m + 5), digital(h, m - 5), digital(h + 1, m), digital(h - 1, m)], { op, clock: { h, m } });
}

const FRAC = { "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "1/6": "⅙", "1/8": "⅛", "1/10": "⅒" };
const fracSym = (n, d) => FRAC[`${n}/${d}`] || `${n}/${d}`;

function fractionQ(t) {
  const v = Math.random();
  const op = "fraction";
  const ofQ = (n, d) => {
    const k = ri(t === 1 ? 1 : 2, t === 3 ? 8 : 6), total = d * k;
    return { text: `${fracSym(n, d)} of ${total}`, answer: n * k, op };
  };
  const barQ = (maxParts) => {
    const p = pick([2, 3, 4, 5, 6, 8].filter((d) => d <= maxParts)), s = ri(1, p - 1);
    const proper = (w) => { const [a, b] = w.split("/").map(Number); return a > 0 && a < b; };
    const wrongs = [`${p - s}/${p}`, `${s}/${p + 1}`, `${s + 1}/${p}`, `${s}/${p - 1}`].filter((w) => w !== `${s}/${p}` && proper(w));
    const filler = () => { const d = ri(2, maxParts + 1); return `${ri(1, d - 1)}/${d}`; };
    return mcq("What fraction of the bar is coloured in?", `${s}/${p}`, wrongs, { op, bar: { parts: p, shaded: s } }, filler);
  };
  if (t === 1) {
    if (v < 0.5) return ofQ(1, 2);
    if (v < 0.75) return barQ(4);
    const n = ri(2, 6) * 2;
    return { text: `${n} berries are shared in half between 2 Mathimals. How many does each one get?`, answer: n / 2, op };
  }
  if (t === 2) {
    if (v < 0.25) return ofQ(1, 4);
    if (v < 0.5) return ofQ(1, 3);
    if (v < 0.75) return barQ(6);
    const slices = pick([4, 8, 12]);
    return { text: `A pizza has ${slices} slices. Sam eats ¼ of it. How many slices does he eat?`, answer: slices / 4, op };
  }
  if (v < 0.2) return ofQ(3, 4);
  if (v < 0.4) return ofQ(2, 3);
  if (v < 0.55) return ofQ(1, pick([5, 10]));
  if (v < 0.75) return barQ(8);
  const [a, b] = pick([[2, 3], [2, 4], [3, 4], [2, 5], [4, 8], [3, 6], [5, 10]]);
  const bigger = Math.random() < 0.5;
  return mcq(`Which fraction is ${bigger ? "BIGGER" : "SMALLER"}?`, bigger ? fracSym(1, a) : fracSym(1, b), [bigger ? fracSym(1, b) : fracSym(1, a)], { op });
}

// a number whose digits are all different, so "what is the 6 worth?" has one answer
function distinctDigits(lo, hi) {
  for (let k = 0; k < 200; k++) { const n = ri(lo, hi); if (new Set(String(n)).size === String(n).length) return n; }
  return lo;
}

function placeQ(t) {
  const v = Math.random();
  const op = "place";
  const pattern = (start, step, len = 4) => {
    const seq = Array.from({ length: len }, (_, i) => start + step * i);
    return { text: `What comes next? ${seq.join(", ")}, ?`, answer: start + step * len, op };
  };
  if (t === 1) {
    if (v < 0.25) { const n = ri(21, 98); return { text: `What is the TENS digit in ${n}?`, answer: Math.floor(n / 10), op }; }
    if (v < 0.45) { const n = ri(12, 85); return { text: `What is 10 more than ${n}?`, answer: n + 10, op }; }
    if (v < 0.6) { const n = ri(20, 95); return { text: `What is 10 less than ${n}?`, answer: n - 10, op }; }
    if (v < 0.8) { const tn = ri(1, 9), on = ri(0, 9); return { text: `${tn} ten${tn > 1 ? "s" : ""} and ${on} one${on === 1 ? "" : "s"} make what number?`, answer: tn * 10 + on, op }; }
    const step = pick([2, 5, 10]); return pattern(step * ri(0, 4), step);
  }
  if (t === 2) {
    if (v < 0.2) { const n = ri(12, 98); if (n % 10 === 0) return pattern(n, 10); return { text: `Round ${n} to the nearest 10.`, answer: Math.round(n / 10) * 10, op }; }
    if (v < 0.4) {
      const n = distinctDigits(102, 987), d = pick([0, 1, 2]), digit = String(n)[d], val = Number(digit) * [100, 10, 1][d];
      if (digit === "0") return { text: `What is the HUNDREDS digit in ${n}?`, answer: Math.floor(n / 100), op };
      return { text: `In ${n}, what is the ${digit} worth?`, answer: val, op };
    }
    if (v < 0.55) { const hd = ri(1, 9), tn = ri(0, 9), on = ri(0, 9); return { text: `${hd} hundred${hd > 1 ? "s" : ""}, ${tn} ten${tn === 1 ? "" : "s"} and ${on} one${on === 1 ? "" : "s"} make what number?`, answer: hd * 100 + tn * 10 + on, op }; }
    if (v < 0.7) { const n = ri(110, 880); return { text: `What is 100 more than ${n}?`, answer: n + 100, op }; }
    if (v < 0.85) { const step = pick([3, 4, 5]); return pattern(ri(1, 10), step); }
    const step = pick([2, 5, 10]); return pattern(step * ri(8, 12), -step);
  }
  if (v < 0.2) { const n = ri(110, 990); if (n % 100 === 0) return pattern(n, 100); return { text: `Round ${n} to the nearest 100.`, answer: Math.round(n / 100) * 100, op }; }
  if (v < 0.35) {
    const n = distinctDigits(1023, 9876), d = pick([0, 1, 2]), digit = String(n)[d], val = Number(digit) * [1000, 100, 10][d];
    if (digit === "0") return { text: `What is the THOUSANDS digit in ${n}?`, answer: Math.floor(n / 1000), op };
    return { text: `In ${n}, what is the ${digit} worth?`, answer: val, op };
  }
  if (v < 0.5) { const n = ri(1100, 8800); return { text: `What is 1000 more than ${n}?`, answer: n + 1000, op }; }
  if (v < 0.65) { const s = pick([1, 2, 3, 5]); return { text: `What comes next? ${[s, s * 2, s * 4, s * 8].join(", ")}, ?`, answer: s * 16, op }; }
  if (v < 0.8) return pattern(pick([25, 50, 75, 100]), 25);
  const step = pick([6, 7, 9, 11]); return pattern(ri(2, 20), step);
}

const TOPIC_GEN = { money: moneyQ, time: timeQ, fraction: fractionQ, place: placeQ };
// Each topic starts gently whatever the Maths Power: tier 2 after 8 correct
// answers in that topic, tier 3 after 20 — and never above what Maths Power allows.
const TOPIC_STEPS = [8, 20];
const progressTier = (n) => (n >= TOPIC_STEPS[1] ? 3 : n >= TOPIC_STEPS[0] ? 2 : 1);
function genTopicQuestion(topic, level, progress = {}) {
  const L = Math.max(1, Math.min(10, level));
  const tier = Math.min(topicTier(L), progressTier((progress && progress[topic]) || 0));
  const q = TOPIC_GEN[topic](tier);
  return { table: null, ...q, tier };
}

/* ---------------- Medals (v4.3) ----------------
   Each medal pays coins once. `check` and `prog` read a plain context object
   built by the App, so they're easy to test. */
const FEAT_KEYS = ["correct", "bestStreak", "fast", "wins", "catches", "mined", "crafted"];
const MEDALS = [
  // Maths
  { id: "first", emoji: "✏️", name: "First Answer", desc: "Answer a question correctly", coins: 10, need: ["correct", 1] },
  { id: "c100", emoji: "💯", name: "Century", desc: "100 correct answers", coins: 50, need: ["correct", 100] },
  { id: "c500", emoji: "🧠", name: "Maths Machine", desc: "500 correct answers", coins: 150, need: ["correct", 500] },
  { id: "c1000", emoji: "🌟", name: "Maths Legend", desc: "1,000 correct answers", coins: 300, need: ["correct", 1000] },
  { id: "s10", emoji: "🔥", name: "On Fire", desc: "10 correct in a row", coins: 40, need: ["bestStreak", 10] },
  { id: "s25", emoji: "☄️", name: "Unstoppable", desc: "25 correct in a row", coins: 100, need: ["bestStreak", 25] },
  { id: "fast", emoji: "⚡", name: "Lightning Brain", desc: "25 correct answers in under 5 seconds", coins: 60, need: ["fast", 25] },
  { id: "tbl1", emoji: "⭐", name: "Star Pupil", desc: "Master a times table", coins: 30, need: ["stars", 1] },
  { id: "tbl6", emoji: "🌠", name: "Table Titan", desc: "Master 6 times tables", coins: 100, need: ["stars", 6] },
  { id: "tbl11", emoji: "🏅", name: "Times-Table Champion", desc: "Master all 11 times tables", coins: 250, need: ["stars", 11] },
  { id: "mp5", emoji: "📈", name: "Rising Star", desc: "Reach Maths Power 5", coins: 50, need: ["skill", 5] },
  { id: "mp10", emoji: "🚀", name: "Maths Power MAX", desc: "Reach Maths Power 10", coins: 200, need: ["skill", 10] },
  // Topic gyms
  { id: "t_money", emoji: "💰", name: "Money Master", desc: "Win the Coin Badge", coins: 40, need: ["topic_money", 1] },
  { id: "t_time", emoji: "🕒", name: "Time Keeper", desc: "Win the Clock Badge", coins: 40, need: ["topic_time", 1] },
  { id: "t_fraction", emoji: "🍕", name: "Fraction Hero", desc: "Win the Slice Badge", coins: 40, need: ["topic_fraction", 1] },
  { id: "t_place", emoji: "🔢", name: "Number Wizard", desc: "Win the Digit Badge", coins: 40, need: ["topic_place", 1] },
  { id: "t_all", emoji: "🎖️", name: "Topic Grand Slam", desc: "Win all 4 Topic Badges", coins: 150, need: ["topics", 4] },
  { id: "t_pro", emoji: "🎓", name: "Topic Pro", desc: "Reach the top level in any topic (20 correct)", coins: 75, need: ["topicBest", 20] },
  // Adventure
  { id: "b1", emoji: "🔢", name: "Number Badge", desc: "Beat Professor Prime", coins: 30, need: ["badge1", 1] },
  { id: "b2", emoji: "🏆", name: "Champion", desc: "Beat Captain Magna", coins: 50, need: ["badge2", 1] },
  { id: "gc", emoji: "👑", name: "Grand Champion", desc: "Beat Grandmaster Aria", coins: 200, need: ["champion", 1] },
  { id: "rival", emoji: "😤", name: "Rival Crusher", desc: "Beat Rival Max twice", coins: 50, need: ["rivalStage", 2] },
  { id: "tw5", emoji: "🏢", name: "Tower Climber", desc: "Clear 5 Tower floors", coins: 50, need: ["towerBest", 5] },
  { id: "tw15", emoji: "🌆", name: "Sky Scraper", desc: "Clear 15 Tower floors", coins: 150, need: ["towerBest", 15] },
  { id: "w100", emoji: "⚔️", name: "Battle Veteran", desc: "Win 100 battles", coins: 100, need: ["wins", 100] },
  // Collecting
  { id: "catch1", emoji: "◓", name: "Gotcha!", desc: "Catch a wild Mathimal", coins: 10, need: ["catches", 1] },
  { id: "catch50", emoji: "🎒", name: "Super Catcher", desc: "Catch 50 wild Mathimals", coins: 100, need: ["catches", 50] },
  { id: "sp8", emoji: "📕", name: "Collector", desc: "Catch 8 different species", coins: 50, need: ["species", 8] },
  { id: "spall", emoji: "📚", name: "Dex Complete", desc: "Catch every regular species", coins: 200, need: ["allRegular", 1] },
  { id: "legend", emoji: "⚡", name: "Golden Legend", desc: "Catch Aurion", coins: 200, need: ["legend", 1] },
  { id: "shiny", emoji: "✨", name: "Shiny Hunter", desc: "Own a shiny Mathimal", coins: 75, need: ["shiny", 1] },
  { id: "lv30", emoji: "💪", name: "Strong Bond", desc: "Raise a Mathimal to Lv30", coins: 60, need: ["maxLevel", 30] },
  { id: "lv50", emoji: "🦾", name: "Mega Trainer", desc: "Raise a Mathimal to Lv50", coins: 150, need: ["maxLevel", 50] },
  // Crafting
  { id: "mine20", emoji: "⛏", name: "Miner", desc: "Mine 20 times", coins: 30, need: ["mined", 20] },
  { id: "craft10", emoji: "🔨", name: "Crafter", desc: "Craft 10 items", coins: 40, need: ["crafted", 10] },
  // Duels (added at the end so medal numbers in older save codes stay valid)
  { id: "duel1", emoji: "🤺", name: "Duellist", desc: "Win a duel against your partner", coins: 40, need: ["duelWins", 1] },
  { id: "duel10", emoji: "🥇", name: "Duel Master", desc: "Win 10 duels", coins: 150, need: ["duelWins", 10] },
];
const MEDAL_IDS = MEDALS.map((m) => m.id);
const medalProgress = (m, ctx) => { const [k, n] = m.need; return [Math.min(n, ctx[k] || 0), n]; };
const medalEarned = (m, ctx) => (ctx[m.need[0]] || 0) >= m.need[1];

/* ---------------- Sound & music ---------------- */

let audioCtx = null;
function tone(freq, dur = 0.12, type = "square", vol = 0.08, when = 0) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  } catch (e) {}
}

const SFX = {
  step: () => tone(180, 0.04, "triangle", 0.025),
  select: () => tone(660, 0.07),
  encounter: () => { tone(330, 0.1); tone(262, 0.1, "square", 0.08, 0.1); tone(196, 0.18, "square", 0.08, 0.2); },
  hit: () => { tone(150, 0.12, "sawtooth", 0.1); },
  correct: () => { tone(523, 0.09); tone(659, 0.09, "square", 0.08, 0.09); tone(784, 0.14, "square", 0.08, 0.18); },
  wrong: () => { tone(200, 0.18, "sawtooth", 0.09); tone(150, 0.22, "sawtooth", 0.09, 0.12); },
  catchBall: () => { tone(880, 0.08); tone(660, 0.08, "square", 0.07, 0.1); },
  caught: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.08, i * 0.11)); },
  victory: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "square", 0.09, i * 0.12)); },
  faint: () => { tone(300, 0.15, "sawtooth", 0.08); tone(200, 0.2, "sawtooth", 0.08, 0.13); tone(120, 0.3, "sawtooth", 0.08, 0.28); },
  heal: () => { [659, 784, 880].forEach((f, i) => tone(f, 0.1, "triangle", 0.08, i * 0.09)); },
  levelup: () => { [523, 587, 659, 880].forEach((f, i) => tone(f, 0.1, "square", 0.08, i * 0.08)); },
  coin: () => { tone(988, 0.07, "square", 0.07); tone(1319, 0.12, "square", 0.07, 0.07); },
  sparkle: () => { [1047, 1319, 1568].forEach((f, i) => tone(f, 0.09, "triangle", 0.06, i * 0.07)); },
};

let MUTED = false;
function play(name) { if (!MUTED && SFX[name]) SFX[name](); }



/* ---------------- Shared UI ---------------- */

const FONT = "'Press Start 2P', 'Courier New', monospace";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
@keyframes flashHit { 0%,100%{opacity:1} 25%{opacity:0.2} 50%{opacity:1} 75%{opacity:0.2} }
@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
@keyframes popIn { 0%{transform:scale(0.3);opacity:0} 100%{transform:scale(1);opacity:1} }
@keyframes confetti { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(460px) rotate(720deg);opacity:0} }
@keyframes ballWiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-20deg)} 75%{transform:rotate(20deg)} }
@keyframes lavaGlow { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.35)} }
@keyframes sparklePulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }
@keyframes flyToEnemy { 0%{left:24%;top:58%;opacity:1;transform:scale(0.6)} 60%{transform:scale(1.15)} 100%{left:71%;top:20%;opacity:0.95;transform:scale(1.35)} }
@keyframes flyToPlayer { 0%{left:71%;top:20%;opacity:1;transform:scale(0.6)} 60%{transform:scale(1.15)} 100%{left:24%;top:58%;opacity:0.95;transform:scale(1.35)} }
@keyframes ripple { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.6)} 50%{box-shadow:0 0 18px 6px rgba(74,222,128,0.55)} }
@keyframes impactBurst { 0%{transform:scale(0.4);opacity:1} 100%{transform:scale(2.4);opacity:0} }
`;

function HPBar({ hp, maxHp, width = 160 }) {
  const pct = Math.max(0, hp / maxHp);
  const color = pct > 0.5 ? "#4ade80" : pct > 0.25 ? "#facc15" : "#ef4444";
  return (
    <div style={{ width, height: 12, background: "#1f2937", border: "2px solid #0f172a", borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: `${pct * 100}%`, height: "100%", background: color, transition: "width 0.5s ease, background 0.5s" }} />
    </div>
  );
}

function StatCard({ mon }) {
  return (
    <div style={{
      background: "#fffbe6", border: "3px solid #1f2937", borderRadius: 8, padding: "8px 12px",
      boxShadow: "3px 3px 0 rgba(0,0,0,0.35)", display: "inline-block", minWidth: 205,
    }}>
      <div style={{ fontSize: 9, marginBottom: 6, color: "#1f2937" }}>
        {displayName(mon)} <span style={{ color: "#6b7280" }}>Lv{mon.level}</span>
        <span style={{
          marginLeft: 8, fontSize: 7, padding: "2px 5px", borderRadius: 4,
          background: TYPE_COLORS[mon.type], color: "#1f2937", verticalAlign: "middle",
        }}>{mon.type.toUpperCase()}</span>
      </div>
      <HPBar hp={mon.hp} maxHp={mon.maxHp} />
      <div style={{ fontSize: 8, marginTop: 5, color: "#374151" }}>{Math.max(0, mon.hp)}/{mon.maxHp} HP</div>
    </div>
  );
}

function PixelButton({ children, onClick, color = "#fffbe6", disabled, small, hotkey }) {
  const keyLabel = hotkey ? (hotkey.split(" ")[0] === "escape" ? "Esc" : hotkey.split(" ")[0].toUpperCase()) : null;
  return (
    <button
      data-hotkey={hotkey || undefined}
      onClick={() => { if (!disabled) { play("select"); onClick(); } }}
      disabled={disabled}
      style={{
        fontFamily: FONT, fontSize: small ? 9 : 11, padding: small ? "8px 10px" : "12px 14px",
        paddingRight: keyLabel ? (keyLabel.length > 1 ? 34 : 24) : undefined,
        background: disabled ? "#d1d5db" : color, color: "#1f2937", position: "relative",
        border: "3px solid #1f2937", borderRadius: 8, cursor: disabled ? "default" : "pointer",
        boxShadow: disabled ? "none" : "3px 3px 0 rgba(0,0,0,0.35)", textAlign: "left",
      }}
    >
      {children}
      {keyLabel && (
        <span style={{
          position: "absolute", top: 4, right: 4, fontSize: 7, lineHeight: 1, padding: "2px 3px",
          borderRadius: 3, background: disabled ? "#e5e7eb" : "#1f2937", color: disabled ? "#9ca3af" : "#fde68a",
        }}>{keyLabel}</span>
      )}
    </button>
  );
}

/* Analogue clock for time questions. The hour hand moves between numbers
   (at half past 3 it sits halfway between 3 and 4), just like a real clock. */
function ClockFace({ h, m, size = 120 }) {
  const c = 50;
  const hand = (deg, len) => {
    const r = (deg - 90) * Math.PI / 180;
    return [c + Math.cos(r) * len, c + Math.sin(r) * len];
  };
  const [hx, hy] = hand(((h % 12) + m / 60) * 30, 25);
  const [mx, my] = hand(m * 6, 37);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="clock">
      <circle cx={c} cy={c} r={47} fill="#fff" stroke="#1f2937" strokeWidth={4} />
      {Array.from({ length: 60 }, (_, i) => {
        const [x1, y1] = hand(i * 6, i % 5 === 0 ? 39 : 42);
        const [x2, y2] = hand(i * 6, 44);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 5 === 0 ? "#1f2937" : "#9ca3af"} strokeWidth={i % 5 === 0 ? 2 : 0.8} />;
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const [x, y] = hand((i + 1) * 30, 32);
        return <text key={i} x={x} y={y + 3.6} textAnchor="middle" fontSize={10} fontFamily="Arial, sans-serif" fontWeight="bold" fill="#1f2937">{i + 1}</text>;
      })}
      <line x1={c} y1={c} x2={hx} y2={hy} stroke="#dc2626" strokeWidth={5} strokeLinecap="round" />
      <line x1={c} y1={c} x2={mx} y2={my} stroke="#2563eb" strokeWidth={3} strokeLinecap="round" />
      <circle cx={c} cy={c} r={3.5} fill="#1f2937" />
    </svg>
  );
}

function FractionBar({ parts, shaded }) {
  const w = Math.min(36, Math.floor(260 / parts));
  return (
    <div style={{ display: "flex", border: "3px solid #1f2937", borderRadius: 6, overflow: "hidden" }}>
      {Array.from({ length: parts }, (_, i) => (
        <div key={i} style={{
          width: w, height: 40, background: i < shaded ? "#f97316" : "#fff",
          borderLeft: i ? "3px solid #1f2937" : "none",
        }} />
      ))}
    </div>
  );
}

function MonSprite({ mon, size, flip, animStyle }) {
  const v = monVisual(mon);
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div style={animStyle}>
        <Sprite name={v.sprite} size={size} flip={flip} hue={v.hue} colorsOverride={v.colorsOverride} />
      </div>
      {mon.shiny && (
        <div style={{ position: "absolute", top: -4, right: -4, fontSize: size / 6, animation: "sparklePulse 1.4s infinite" }}>✨</div>
      )}
    </div>
  );
}

/* ---------------- Battle screen ---------------- */

function Battle({ team, setTeam, enemyQueue, kind, trainerName, skill, setSkill, skillFloor = 1, streakRef, inv, setInv, recordStat, isNight, rarity = "common", xpShare = false, lucky = false, use3D = false, region = 0, topics = [], topicGym = null, topicProgress = {}, onTopicProgress, boxFull = false, playerName = DEFAULT_NAME, qmode = "maths", gkCorrect = 0, onGkCorrect, coop = null, coopHp = null, onCoopHit, coopNote = null, partnerName = "", onCatch, onTableProgress, onEnd }) {
  const isTrainer = kind !== "wild";
  const isBoss = kind === "gym1" || kind === "gym2";
  const [enemyIdx, setEnemyIdx] = useState(0);
  const [enemy, setEnemy] = useState(() => ({ ...enemyQueue[0] }));
  const [activeIdx, setActiveIdx] = useState(() => Math.max(0, team.findIndex((m) => m.hp > 0)));
  const [phase, setPhase] = useState("intro"); // intro, menu, moves, catchmenu, bag, question, resolve, switch
  const [msg, setMsg] = useState("");
  const [question, setQuestion] = useState(null);
  const [pendingMove, setPendingMove] = useState(null);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(25);
  const [enemyHurt, setEnemyHurt] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [ballAnim, setBallAnim] = useState(false);
  const [catchFx, setCatchFx] = useState(null);
  const rootRef = useRef(null);
  const keyHandlerRef = useRef(null);
  const pausedRef = useRef(false);
  const answeredRef = useRef(true); // true = no question waiting for an answer
  // Every delayed battle step goes through later(): if the battle closes, pending steps are cancelled
  const timersRef = useRef(new Set());
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current.clear(); }, []);
  const later = (fn, ms) => {
    const id = setTimeout(() => { timersRef.current.delete(id); if (aliveRef.current) fn(); }, ms);
    timersRef.current.add(id);
    return id;
  };
  // One action per turn: a potion or switch can't be used twice before the battle moves on
  const actionLockRef = useRef(false);
  useEffect(() => { if (phase === "menu" || phase === "switch" || phase === "bag") actionLockRef.current = false; }, [phase]);
  const [combo, setCombo] = useState(0);
  const [turns, setTurns] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseStartRef = useRef(0);
  const [fx, setFx] = useState(null); // {to:'enemy'|'player', color, id}
  const [impact, setImpact] = useState(null); // {at:'enemy'|'player', color, id}
  const inputRef = useRef(null);

  function launchFx(to, color) {
    const id = Date.now() + Math.random();
    setFx({ to, color, id });
    later(() => {
      setFx((f) => (f && f.id === id ? null : f));
      setImpact({ at: to, color, id });
      later(() => setImpact((im) => (im && im.id === id ? null : im)), 380);
    }, 440);
  }
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  const active = team[activeIdx];

  const enemyRef = useRef(enemy);
  useEffect(() => { enemyRef.current = enemy; }, [enemy]);

  /* ---- Co-op: the enemy's HP is shared and kept by the host laptop ---- */
  const coopDoneRef = useRef(false);
  const [coopFlash, setCoopFlash] = useState(null); // { text, big, at }
  const [raidLeft, setRaidLeft] = useState(() => (coop && coop.endsAt ? Math.max(0, Math.round((coop.endsAt - Date.now()) / 1000)) : null));
  useEffect(() => {
    if (!coop || !coopHp || coopHp.id !== coop.id || !coopHp.seq) return;
    enemyRef.current = { ...enemyRef.current, hp: coopHp.hp };
    setEnemy((e) => ({ ...e, hp: coopHp.hp }));
    if (coopHp.by === "partner") {
      setEnemyHurt(true); play("hit");
      later(() => setEnemyHurt(false), 600);
      launchFx("enemy", "#fde047");
    }
    if (coopHp.bonus) {
      play("levelup");
      setCoopFlash({ text: `🤝 TEAM-UP ATTACK! −${coopHp.bonus}`, big: true, at: Date.now() });
    } else if (coopHp.by === "partner") {
      setCoopFlash({ text: `💥 ${partnerName} hit for ${coopHp.dmg}!`, at: Date.now() });
    }
    if (coopHp.hp <= 0 && !coopDoneRef.current) {
      coopDoneRef.current = true;
      answeredRef.current = true;
      clearInterval(timerRef.current);
      setPhase("resolve");
      later(() => enemyDefeated(), 1100);
    }
  }, [coopHp && coopHp.seq]); // eslint-disable-line
  useEffect(() => {
    if (!coopFlash) return;
    const t = setTimeout(() => setCoopFlash(null), coopFlash.big ? 2400 : 1700);
    return () => clearTimeout(t);
  }, [coopFlash]);
  // Raid clock: shared, so it keeps running even when paused
  useEffect(() => {
    if (!coop || !coop.endsAt) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((coop.endsAt - Date.now()) / 1000));
      setRaidLeft(left);
      if (left <= 0 && !coopDoneRef.current) {
        coopDoneRef.current = true;
        answeredRef.current = true;
        clearInterval(timerRef.current);
        clearInterval(id);
        setPhase("resolve");
        setMsg("⏱ Time's up! The raid boss escaped into the wild...");
        later(() => onEnd("raidfail"), 2400);
      }
    }, 500);
    return () => clearInterval(id);
  }, []); // eslint-disable-line
  const teamRef = useRef(team);
  useEffect(() => { teamRef.current = team; }, [team]);
  const activeIdxRef = useRef(activeIdx);
  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  useEffect(() => {
    if (!team.some((m) => m.hp > 0)) {
      setMsg("Your team is too tired to battle — rushing home to rest!");
      setPhase("resolve");
      const t = later(() => onEnd("blackout"), 1500);
      return () => clearTimeout(t);
    }
    play("encounter");
    const first = enemyQueue[0];
    const t = later(() => {
      setMsg(isTrainer
        ? `${trainerName} sent out ${displayName(first)}!`
        : `A wild ${displayName(first)} appeared!${first.shiny ? " It's SHINY!" : rarity === "rare" ? " It's RARE!" : rarity === "uncommon" ? " Uncommon find!" : ""}`);
      if (first.shiny || rarity === "rare") play("sparkle");
      later(() => setPhase("menu"), 1500);
    }, 400);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (phase === "question" && inputRef.current) inputRef.current.focus();
  }, [phase]);

  useEffect(() => { if (typeof window !== "undefined") window.__mqQ = question; }, [question]); // test hook

  // Reset the clock only when a NEW question appears
  useEffect(() => {
    if (phase !== "question" || !question) return;
    const dur = (question.choices || question.text.length > 14) ? 30 : 25;
    setTimeLeft(dur);
    startTimeRef.current = Date.now();
  }, [question]); // eslint-disable-line

  // Countdown — pausable without resetting
  useEffect(() => {
    if (phase !== "question" || paused) { clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current); handleAnswer(null, true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, question, paused]); // eslint-disable-line

  function togglePause() {
    pausedRef.current = !paused;
    if (!paused && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (paused) {
      startTimeRef.current += Date.now() - pauseStartRef.current; // don't penalise the speedy bonus
      setPaused(false);
    } else {
      pauseStartRef.current = Date.now();
      setPaused(true);
    }
  }

  // Maths Power moves up only on FLUENT answers: correct AND reasonably quick.
  // Slow-but-correct answers are neutral (no climb, no penalty); 2 misses in a row ease it down.
  function recordResult(correct, elapsed = 0, wordy = false) {
    const s = streakRef.current;
    const fluent = correct && elapsed <= (wordy ? 18 : 12);
    if (correct) { if (fluent) s.right += 1; s.wrong = 0; } else { s.wrong += 1; s.right = 0; }
    if (s.right >= 4) {
      s.right = 0;
      setSkill((k) => {
        const nk = Math.min(10, k + 1);
        if (nk > k) later(() => play("levelup"), 600);
        return nk;
      });
      return "up";
    }
    if (s.wrong >= 2) { s.wrong = 0; setSkill((k) => Math.max(skillFloor, k - 1)); return "down"; }
    return null;
  }

  function startQuestion(move) {
    const bossBump = (isBoss || kind.startsWith("elite") || kind === "grandmaster") ? 1 : 0;
    const lvl = Math.min(10,
      (move.isCatch ? skill : skill + (move.power > 1.2 ? 1 : 0)) + bossBump);
    answeredRef.current = false;
    const bossTier = bossBump || move.power > 1.2 ? 1 : 0;
    setQuestion(topicGym ? genTopicQuestion(topicGym, lvl, topicProgress)
      : qmode === "gk" ? genGkQuestion(gkTierFor(gkCorrect) + bossTier)
      : genQuestion(lvl, topics, topicProgress));
    setPendingMove(move);
    setInput("");
    setPhase("question");
  }

  function enemyAttack(afterMsgDelay = 1100) {
    later(() => {
      const e = enemyRef.current;
      if (e.hp <= 0) return;
      const idx = activeIdxRef.current;
      const mine = teamRef.current[idx];
      const movePow = Math.random() < 0.5 ? 1 : 1.25;
      const mult = typeMult(e.type, mine.type);
      const dmg = Math.max(2, Math.round((e.atk * 0.85 + e.level) * movePow * mult * (0.9 + Math.random() * 0.25) * 0.55));
      const moveName = DEX[e.species].moves[movePow === 1 ? 0 : 1];
      setMsg(`${displayName(e)} used ${moveName}! ${mult > 1 ? "Super effective!" : mult < 1 ? "Not very effective..." : ""}`);
      launchFx("player", TYPE_COLORS[e.type]);
      later(() => {
        setPlayerHurt(true); play("hit");
        later(() => setPlayerHurt(false), 600);
        setTeam((t) => t.map((m, i) => (i === idx ? { ...m, hp: Math.max(0, m.hp - dmg) } : m)));
      }, 430);
      later(() => checkPlayerFaint(), 1500);
    }, afterMsgDelay);
  }

  function checkPlayerFaint() {
    const t = teamRef.current;
    const idx = activeIdxRef.current;
    const me = t[idx];
    if (me.hp <= 0) {
      play("faint");
      const aliveIdx = t.findIndex((m) => m.hp > 0);
      if (aliveIdx === -1) {
        setMsg(`${displayName(me)} fainted! ${titleCase(playerName)}'s team needs a rest...`);
        later(() => onEnd("blackout"), 1800);
      } else {
        setMsg(`${displayName(me)} fainted! Choose your next Mathimal!`);
        setPhase("switch");
      }
    } else {
      setPhase("menu");
      setMsg("");
    }
  }

  function gainXp(t, amount) {
    const msgs = [];
    const out = t.map((m, i) => {
      const isActive = i === activeIdxRef.current;
      if (!isActive && !(xpShare && m.hp > 0)) return m;
      const gain = isActive ? amount : Math.floor(amount / 2); // XP Share: benched get half
      let mon = { ...m, xp: m.xp + gain };
      while (mon.level < MAX_LEVEL && mon.xp >= xpToNext(mon)) {
        mon.xp -= xpToNext(mon);
        mon.level += 1;
        mon.maxHp += 3;
        mon.atk += 2;
        mon.hp = Math.min(mon.maxHp, mon.hp + 3); // gain the new HP, but no free full heal!
        msgs.push(`${mon.name} grew to Lv${mon.level}!`);
        if (mon.level >= 8 && !mon.evolved) {
          applyEvolution(mon); // evolution still fully heals — a rare, earned moment
          msgs.push(`Whoa! It evolved into ${mon.name}!`);
        }
      }
      if (mon.level >= MAX_LEVEL) mon.xp = 0;
      return mon;
    });
    if (msgs.length) {
      play("levelup");
      later(() => setMsg(msgs.join(" ")), 1200);
    }
    return out;
  }

  function enemyDefeated() {
    play("victory");
    const e = enemyRef.current;
    const mine = teamRef.current[activeIdxRef.current];
    const xp = (e.level * 12 + (isBoss ? 15 : 0)) * (lucky ? 2 : 1);
    setMsg(`${displayName(e)} was defeated! ${displayName(mine)} gained ${xp} XP!${lucky ? " 🍀 Lucky Egg ×2!" : ""}${xpShare ? " (team shared XP)" : ""}`);
    setTeam((t) => gainXp(t, xp));
    later(() => {
      if (enemyIdx + 1 < enemyQueue.length) {
        const next = { ...enemyQueue[enemyIdx + 1] };
        setEnemyIdx((i) => i + 1);
        setEnemy(next);
        setMsg(`${trainerName} sent out ${displayName(next)}!`);
        later(() => { setPhase("menu"); setMsg(""); }, 1500);
      } else {
        onEnd("win");
      }
    }, 2300);
  }

  function useItem(item) {
    if (actionLockRef.current || pausedRef.current || inv[item] <= 0) return;
    actionLockRef.current = true;
    setInv((v) => ({ ...v, [item]: v[item] - 1 }));
    const healAmt = item === "potion" ? 25 : 9999;
    play("heal");
    setTeam((t) => t.map((m, i) =>
      i === activeIdx ? { ...m, hp: Math.min(m.maxHp, m.hp + healAmt) } : m
    ));
    setMsg(`${displayName(active)} drank a ${item === "potion" ? "Potion" : "Super Potion"}! HP restored!`);
    setPhase("resolve");
    enemyAttack(1300);
  }

  function handleAnswer(val, timedOut = false) {
    if (pausedRef.current || answeredRef.current) return; // paused, or this question is already answered
    const me = teamRef.current[activeIdxRef.current];
    if (!pendingMove.isCatch && (!me || me.hp <= 0)) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const isMC = !!question.choices;
    const correct = !timedOut && (isMC
      ? String(val) === String(question.answer) || sameFraction(val, question.answer)
      : Number(val) === question.answer);
    recordStat(question.op, correct, elapsed);
    setTurns((t) => t + 1);
    if (correct && question.table && onTableProgress) onTableProgress(question.table);
    if (correct && TOPIC_GEN[question.op] && onTopicProgress) onTopicProgress(question.op);
    if (correct && question.op === "gk" && onGkCorrect) onGkCorrect();
    const newCombo = correct ? combo + 1 : 0;
    setCombo(newCombo);
    const comboMult = 1 + Math.min(Math.max(0, newCombo - 1), 5) * 0.1; // ×1.1 at 2-streak up to ×1.5
    // Maths Power only tracks maths answers
    const skillMsg = question.op === "gk" ? null : recordResult(correct, elapsed, !!question.choices || question.text.length > 14);
    setPhase("resolve");

    if (pendingMove.isCatch) {
      const ball = pendingMove.ball;
      if (ball) setInv((v) => ({ ...v, [ball]: (v[ball] || 0) - 1 }));
      if (correct) {
        play("catchBall"); setBallAnim(true);
        later(() => setBallAnim(false), 1500);
        let bonus = 0; // plain Math Ball
        if (ball === "greatball") bonus = 0.25;
        else if (ball === "duskball") bonus = isNight ? 0.4 : 0.02;
        else if (ball === "netball") bonus = ["water", "ice"].includes(enemy.type) ? 0.4 : 0.02;
        else if (ball === "timerball") bonus = Math.min(0.4, turns * 0.06);
        else if (ball === "healball") bonus = 0.15;
        // Base: weak when healthy, strong when worn down. Ball bonus is what closes the gap.
        let chance = Math.min(0.98, (1 - enemy.hp / enemy.maxHp) * 0.75 + 0.12 + bonus);
        if (DEX[enemy.species].legendary) chance *= 0.5; // legends resist capture!
        if (ball === "megaball") chance = 1; // the Mega Ball NEVER fails
        setMsg(`${titleCase(playerName)} threw a ${pendingMove.name}...`);
        later(() => {
          if (Math.random() < chance) {
            play("caught");
            setCatchFx({ id: Date.now(), result: "caught" });
            const healed = ball === "healball";
            const caught = { ...enemy, hp: healed ? enemy.maxHp : Math.max(4, Math.round(enemy.maxHp * 0.5)) };
            const dest = onCatch(caught); // "team" | "box"
            setMsg((dest === "team"
              ? `Gotcha! ${displayName(enemy)} joined the team!`
              : `Gotcha! ${displayName(enemy)} was sent to the Box!`)
              + (healed ? " 💗 Fully healed!" : ""));
            later(() => onEnd("caught"), 1700);
          } else {
            setCatchFx({ id: Date.now(), result: "free" });
            setMsg(`Oh no! ${displayName(enemy)} broke free!`);
            enemyAttack(1300);
          }
        }, 1600);
      } else {
        play("wrong");
        setMsg(timedOut ? `Time's up! The answer was ${question.answer}.` : `Not quite — it was ${question.answer}. The ball missed!`);
        enemyAttack(1700);
      }
      return;
    }

    if (correct) {
      play("correct");
      const speedy = elapsed < (question.choices ? 12 : 9);
      const mult = typeMult(active.type, enemy.type);
      const dmg = Math.max(3, Math.round(
        (active.atk + active.level) * pendingMove.power * mult * (speedy ? 1.3 : 1) * comboMult * (0.9 + Math.random() * 0.25) * 0.7
      ));
      setMsg(
        `${displayName(active)} used ${pendingMove.name}!` +
        (speedy ? " SPEEDY BONUS!" : "") +
        (comboMult > 1 ? ` 🔥COMBO ×${comboMult.toFixed(1)}!` : "") +
        (mult > 1 ? " Super effective!" : mult < 1 ? " Not very effective..." : "") +
        (skillMsg === "up" ? " ⭐ Maths Power went UP!" : "")
      );
      launchFx("enemy", TYPE_COLORS[active.type]);
      if (coop) {
        // shared HP: the host laptop applies the hit (and spots TEAM-UPs)
        if (onCoopHit) onCoopHit(dmg);
        later(() => { setEnemyHurt(true); play("hit"); later(() => setEnemyHurt(false), 600); }, 430);
        later(() => { if (!coopDoneRef.current) enemyAttack(200); }, 1500);
        return;
      }
      const e = enemyRef.current;
      const ne = { ...e, hp: Math.max(0, e.hp - dmg) };
      // Wild Mathimals can't be knocked out from un-weakened health in one blow:
      // they cling on so there is always a catch window, however strong the team.
      if (!isTrainer && ne.hp <= 0 && e.hp / e.maxHp >= 0.7) {
        ne.hp = Math.max(1, Math.round(e.maxHp * 0.2));
        later(() => setMsg((m) => m + ` ${displayName(e)} is hanging on — now's your chance to catch it!`), 450);
      }
      later(() => {
        setEnemyHurt(true); play("hit");
        later(() => setEnemyHurt(false), 600);
        setEnemy(ne);
      }, 430);
      later(() => {
        if (ne.hp <= 0) enemyDefeated();
        else enemyAttack(200);
      }, 1500);
    } else {
      play("wrong");
      setMsg(
        (timedOut ? `Time's up! The answer was ${question.answer}.` : `Not quite — the answer was ${question.answer}.`) +
        ` ${displayName(active)}'s attack missed!` +
        (skillMsg === "down" ? " Maths Power eased down a bit — you've got this!" : "")
      );
      enemyAttack(1700);
    }
  }

  const moves = active ? [
    { name: DEX[active.species].moves[0], power: 1, label: "Quick", stars: "★" },
    { name: DEX[active.species].moves[1], power: 1.6, label: "Power", stars: "★★" },
  ] : [];

  const canCatch = !isTrainer && !boxFull && enemy.hp / enemy.maxHp < 0.7;
  // Keyboard play: each key presses the visible button labelled with it, so the
  // keys always match the buttons (and greyed-out buttons stay unavailable).
  keyHandlerRef.current = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key === "Escape" ? "escape" : e.key === "Enter" ? "enter" : e.key === "Backspace" ? "backspace" : e.key.toLowerCase();
    const inInput = e.target && e.target.tagName === "INPUT";
    if (paused && k !== "p") { e.preventDefault(); return; } // nothing under the pause screen can be pressed
    if (phase === "question" && !paused && !inInput && inputRef.current) {
      // typing an answer works even if the box lost focus
      if (/^[0-9]$/.test(k)) { e.preventDefault(); inputRef.current.focus(); setInput((v) => (v + k).slice(0, 6)); return; }
      if (k === "backspace") { e.preventDefault(); inputRef.current.focus(); setInput((v) => v.slice(0, -1)); return; }
      if (k === "enter") { e.preventDefault(); if (input !== "") handleAnswer(input); return; }
    }
    if (inInput && k !== "p") return; // digits and Enter belong to the answer box
    const root = rootRef.current;
    if (!root) return;
    const btn = [...root.querySelectorAll("button[data-hotkey]")].find((b) => b.dataset.hotkey.split(" ").includes(k));
    if (!btn) return;
    e.preventDefault();
    if (btn.disabled) { play("wrong"); return; }
    btn.click();
  };
  useEffect(() => {
    const h = (e) => keyHandlerRef.current && keyHandlerRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const isMCQ = question && !!question.choices;
  const isWordQ = question && !question.choices && question.text.length > 14;
  const qTime = (isMCQ || isWordQ) ? 30 : 25;

  return (
    <div ref={rootRef} style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: use3D ? "#0f172a" : isNight
        ? "linear-gradient(#1e293b 0%, #334155 55%, #3f4a31 55%, #4d5b3a 100%)"
        : "linear-gradient(#bae6fd 0%, #bae6fd 55%, #d9f99d 55%, #bef264 100%)",
      fontFamily: FONT,
    }}>
      {use3D && (
        <Battle3D enemy={enemy} active={active} region={region} isNight={isNight} kind={topicGym ? "topic_" + topicGym : kind}
          enemyHurt={enemyHurt} playerHurt={playerHurt} fx={fx} ballAnim={ballAnim} catchFx={catchFx} />
      )}
      {isNight && !use3D && <div style={{ position: "absolute", top: 14, left: "44%", fontSize: 26 }}>🌙</div>}

      {combo >= 2 && (
        <div style={{
          position: "absolute", top: 12, right: 52, zIndex: 5, fontFamily: FONT, fontSize: 10,
          background: "#7c2d12", color: "#fde047", border: "3px solid #fbbf24", borderRadius: 8,
          padding: "7px 10px", animation: "popIn 0.25s", boxShadow: "0 0 12px rgba(251,191,36,0.6)",
        }}>
          🔥 COMBO ×{(1 + Math.min(combo - 1, 5) * 0.1).toFixed(1)}
        </div>
      )}

      {(phase === "menu" || phase === "question" || phase === "moves") && !paused && (
        <button data-hotkey="p" onClick={() => { play("select"); togglePause(); }} style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 5,
          fontFamily: FONT, fontSize: 9, padding: "6px 9px", cursor: "pointer",
          background: "rgba(15,23,42,0.75)", color: "#e2e8f0", border: "2px solid #475569", borderRadius: 8,
        }}>⏸ P</button>
      )}

      {paused && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 40, background: "rgba(15,23,42,0.82)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18,
        }}>
          <div style={{ fontFamily: FONT, fontSize: 20, color: "#fde047" }}>⏸ PAUSED</div>
          <div style={{ fontFamily: FONT, fontSize: 8, color: "#94a3b8" }}>The question timer is stopped — take your time!</div>
          <PixelButton color="#fde047" hotkey="p" onClick={togglePause}>▶ RESUME</PixelButton>
        </div>
      )}

      {/* enemy side */}
      <div style={{ position: "absolute", top: 22, left: 22, animation: "popIn 0.4s", zIndex: 2 }}>
        <StatCard mon={enemy} />
        {isTrainer && (
          <div style={{ fontSize: 7, marginTop: 5, color: isNight || use3D ? "#e2e8f0" : "#374151", textShadow: use3D ? "1px 1px 0 #000" : "none" }}>
            {trainerName}{coop ? "" : ` · ${enemyIdx + 1}/${enemyQueue.length}`}
            {coop && raidLeft !== null && <span data-testid="raid-clock" style={{ marginLeft: 8, color: raidLeft <= 30 ? "#f87171" : "#fde047" }}>⏱ {Math.floor(raidLeft / 60)}:{String(raidLeft % 60).padStart(2, "0")}</span>}
          </div>
        )}
        {coopFlash && (
          <div data-testid="coop-flash" style={{
            marginTop: 8, display: "inline-block", fontSize: coopFlash.big ? 11 : 8, padding: "6px 10px", borderRadius: 8,
            background: coopFlash.big ? "#f59e0b" : "rgba(15,23,42,0.85)", color: coopFlash.big ? "#1f2937" : "#fde047",
            border: "3px solid " + (coopFlash.big ? "#92400e" : "#475569"), animation: "popIn 0.3s",
          }}>{coopFlash.text}</div>
        )}
        {coopNote && <div style={{ marginTop: 6, fontSize: 7, color: "#fbbf24", textShadow: "1px 1px 0 #000" }}>{coopNote}</div>}
        {!isTrainer && rarity !== "common" && (
          <div style={{
            display: "inline-block", marginTop: 5, fontSize: 7, padding: "3px 7px", borderRadius: 5,
            background: rarity === "rare" ? "#7c3aed" : "#0891b2", color: "#fff",
            border: "2px solid " + (rarity === "rare" ? "#4c1d95" : "#155e75"),
          }}>{rarity === "rare" ? "★ RARE FIND" : "◆ UNCOMMON"}</div>
        )}
      </div>
      {!use3D && <div style={{ position: "absolute", top: 56, right: 66, textAlign: "center" }}>
        <MonSprite mon={enemy} size={kind === "raid" ? 170 : 120}
          animStyle={{ animation: enemyHurt ? "flashHit 0.6s" : "bounce 2.2s infinite" }} />
        <div style={{ width: 140, height: 26, background: "rgba(50,70,30,0.4)", borderRadius: "50%", margin: "-8px auto 0" }} />
      </div>}

      {/* player side */}
      {active && (
        <>
          <div style={{ position: "absolute", bottom: 192, right: 22, textAlign: "right", zIndex: 2 }}>
            <StatCard mon={active} />
            <div style={{ fontSize: 7, marginTop: 4, color: isNight || use3D ? "#e2e8f0" : "#374151", textShadow: use3D ? "1px 1px 0 #000" : "none" }}>
              XP {active.xp}/{xpToNext(active)}
            </div>
          </div>
          {!use3D && <div style={{ position: "absolute", bottom: 172, left: 76, textAlign: "center", animation: playerHurt ? "shake 0.5s" : "none" }}>
            <MonSprite mon={active} size={148} flip
              animStyle={{ animation: playerHurt ? "flashHit 0.6s" : "none" }} />
            <div style={{ width: 170, height: 30, background: "rgba(50,70,30,0.4)", borderRadius: "50%", margin: "-10px auto 0" }} />
          </div>}
        </>
      )}

      {ballAnim && !use3D && (
        <div style={{
          position: "absolute", top: 108, right: 128, width: 26, height: 26, borderRadius: "50%",
          background: "linear-gradient(#ef4444 50%, #f9fafb 50%)", border: "3px solid #1f2937",
          animation: "ballWiggle 0.5s 3", zIndex: 3,
        }} />
      )}

      {fx && !use3D && (
        <div key={fx.id} style={{
          position: "absolute", width: 24, height: 24, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, #fff, ${fx.color})`,
          boxShadow: `0 0 16px 7px ${fx.color}`,
          animation: `${fx.to === "enemy" ? "flyToEnemy" : "flyToPlayer"} 0.45s linear forwards`,
          zIndex: 3, pointerEvents: "none",
        }} />
      )}
      {impact && !use3D && (
        <div key={"imp" + impact.id} style={{
          position: "absolute",
          left: impact.at === "enemy" ? "71%" : "24%",
          top: impact.at === "enemy" ? "20%" : "58%",
          width: 40, height: 40, borderRadius: "50%",
          border: `5px solid ${impact.color}`,
          animation: "impactBurst 0.38s ease-out forwards",
          zIndex: 3, pointerEvents: "none",
        }} />
      )}

      {/* picture card for clock / fraction questions — floats above the panel */}
      {phase === "question" && question && (question.clock || question.bar) && (
        <div data-testid="q-visual" style={{
          position: "absolute", left: "50%", bottom: 178, transform: "translateX(-50%)", zIndex: 5,
          background: "#fffbe6", border: "4px solid #0f172a", borderRadius: 14, padding: 10,
          boxShadow: "0 6px 0 rgba(15,23,42,0.45)", animation: "popIn 0.25s",
        }}>
          {question.clock && <ClockFace h={question.clock.h} m={question.clock.m} size={128} />}
          {question.clock && (
            <div style={{ fontFamily: FONT, fontSize: 6, color: "#6b7280", textAlign: "center", marginTop: 3 }}>
              <span style={{ color: "#dc2626" }}>short = hour</span> · <span style={{ color: "#2563eb" }}>long = minutes</span>
            </div>
          )}
          {question.bar && <FractionBar parts={question.bar.parts} shaded={question.bar.shaded} />}
        </div>
      )}

      {/* bottom panel */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 168,
        background: "#1e293b", borderTop: "5px solid #0f172a", padding: 12, boxSizing: "border-box", zIndex: 4,
      }}>
        <div style={{
          background: "#fffbe6", border: "3px solid #0f172a", borderRadius: 10, height: "100%",
          padding: 13, boxSizing: "border-box",
        }}>
          {(phase === "intro" || phase === "resolve") && (
            <div style={{ fontSize: 10.5, lineHeight: 1.9, color: "#1f2937" }}>{msg || "..."}</div>
          )}

          {phase === "menu" && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>
                What will {displayName(active)} do?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
                <PixelButton small hotkey="f" onClick={() => setPhase("moves")}>⚔ FIGHT</PixelButton>
                <PixelButton small hotkey="c" disabled={!canCatch} color="#fde68a"
                  onClick={() => setPhase("catchmenu")}>
                  ◓ CATCH
                </PixelButton>
                <PixelButton small hotkey="b" color="#bbf7d0"
                  disabled={inv.potion <= 0 && inv.superpotion <= 0}
                  onClick={() => setPhase("bag")}>🎒 BAG</PixelButton>
                <PixelButton small hotkey="s" disabled={team.filter((m) => m.hp > 0).length < 2}
                  onClick={() => setPhase("switch")}>⇄ SWITCH</PixelButton>
                <PixelButton small hotkey="r" disabled={isTrainer && !coop} color="#fecaca"
                  onClick={() => setPhase("runconfirm")}>➳ RUN</PixelButton>
              </div>
              <div style={{ fontSize: 7, marginTop: 7, color: "#9ca3af" }}>
                {boxFull && !isTrainer ? "Your Team and Box are full — no room to catch!  ·  " : !canCatch && !isTrainer ? "Weaken it a bit first to catch it!  ·  " : ""}⌨ Quick keys: F then F = Quick attack · C then C = Math Ball
              </div>
            </div>
          )}

          {phase === "runconfirm" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, marginBottom: 12, color: "#1f2937" }}>
                Really run away from {displayName(enemy)}?{enemy.shiny ? " It's SHINY! ✨" : ""}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small hotkey="y" color="#fecaca" onClick={() => {
                  if (Math.random() < 0.8) { setMsg("Got away safely!"); setPhase("resolve"); later(() => onEnd("ran"), 1000); }
                  else { setMsg("Couldn't escape!"); setPhase("resolve"); enemyAttack(1000); }
                }}>YES, RUN!</PixelButton>
                <PixelButton small hotkey="n escape" color="#bbf7d0" onClick={() => setPhase("menu")}>NO, KEEP BATTLING</PixelButton>
              </div>
            </div>
          )}

          {phase === "moves" && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>
                Pick a move — harder sums hit harder!
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {moves.map((mv, mi) => (
                  <PixelButton key={mv.name} small hotkey={mi === 0 ? "1 f" : "2"} onClick={() => startQuestion(mv)}
                    color={TYPE_COLORS[active.type] + "55"}>
                    {mv.name}
                    <div style={{ fontSize: 7, marginTop: 4, color: "#6b7280" }}>{mv.label} · difficulty {mv.stars}</div>
                  </PixelButton>
                ))}
                <PixelButton small hotkey="escape backspace" color="#e5e7eb" onClick={() => setPhase("menu")}>← BACK</PixelButton>
              </div>
            </div>
          )}

          {phase === "catchmenu" && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>Which ball?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
                <PixelButton small color="#fde68a"
                  hotkey="1 c" onClick={() => startQuestion({ isCatch: true, name: "Math Ball" })}>
                  ◓ Math <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>free</div>
                </PixelButton>
                <PixelButton small color="#a5b4fc" disabled={inv.greatball <= 0}
                  hotkey="2" onClick={() => startQuestion({ isCatch: true, ball: "greatball", name: "Great Ball" })}>
                  ◍ Great ×{inv.greatball} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>+25%</div>
                </PixelButton>
                <PixelButton small color="#c4b5fd" disabled={(inv.duskball || 0) <= 0}
                  hotkey="3" onClick={() => startQuestion({ isCatch: true, ball: "duskball", name: "Dusk Ball" })}>
                  🌙 Dusk ×{inv.duskball || 0} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>{isNight ? "+40% now!" : "night only"}</div>
                </PixelButton>
                <PixelButton small color="#bbf7d0" disabled={(inv.netball || 0) <= 0}
                  hotkey="4" onClick={() => startQuestion({ isCatch: true, ball: "netball", name: "Net Ball" })}>
                  🕸 Net ×{inv.netball || 0} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>{["water", "ice"].includes(enemy.type) ? "+40% now!" : "water/ice"}</div>
                </PixelButton>
                <PixelButton small color="#fed7aa" disabled={(inv.timerball || 0) <= 0}
                  hotkey="5" onClick={() => startQuestion({ isCatch: true, ball: "timerball", name: "Timer Ball" })}>
                  ⏱ Timer ×{inv.timerball || 0} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>+{Math.min(40, turns * 6)}% now</div>
                </PixelButton>
                <PixelButton small color="#fbcfe8" disabled={(inv.healball || 0) <= 0}
                  hotkey="6" onClick={() => startQuestion({ isCatch: true, ball: "healball", name: "Heal Ball" })}>
                  💗 Heal ×{inv.healball || 0} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>+heal</div>
                </PixelButton>
                <PixelButton small color="#f9a8d4" disabled={(inv.megaball || 0) <= 0}
                  hotkey="7" onClick={() => startQuestion({ isCatch: true, ball: "megaball", name: "Mega Ball" })}>
                  ◎ Mega ×{inv.megaball || 0} <div style={{ fontSize: 6, marginTop: 3, color: "#6b7280" }}>never fails</div>
                </PixelButton>
                <PixelButton small hotkey="escape backspace" color="#e5e7eb" onClick={() => setPhase("menu")}>← BACK</PixelButton>
              </div>
            </div>
          )}

          {phase === "bag" && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>{titleCase(playerName)}'s bag:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <PixelButton small hotkey="1" color="#bbf7d0" disabled={inv.potion <= 0} onClick={() => useItem("potion")}>
                  🧪 Potion ×{inv.potion} <div style={{ fontSize: 7, marginTop: 3, color: "#6b7280" }}>+25 HP</div>
                </PixelButton>
                <PixelButton small hotkey="2" color="#86efac" disabled={inv.superpotion <= 0} onClick={() => useItem("superpotion")}>
                  ⚗ Super ×{inv.superpotion} <div style={{ fontSize: 7, marginTop: 3, color: "#6b7280" }}>full HP</div>
                </PixelButton>
                <PixelButton small hotkey="escape backspace" color="#e5e7eb" onClick={() => setPhase("menu")}>← BACK</PixelButton>
              </div>
            </div>
          )}

          {phase === "question" && question && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 6 }}>
                {question.op === "gk" && GK_CATS[question.cat] ? `${GK_CATS[question.cat].emoji} ${GK_CATS[question.cat].name} · ` : ""}
                {isMCQ ? "Pick the right answer to power " : "Solve it to power "}
                {pendingMove.isCatch ? "the ball throw" : pendingMove.name}!
              </div>
              <div style={{
                fontSize: (isMCQ || isWordQ) ? 10 : 22, lineHeight: (isMCQ || isWordQ) ? 1.7 : 1.2,
                color: "#1f2937", marginBottom: 8, padding: (isMCQ || isWordQ) ? "0 18px" : 0,
              }}>
                {question.text}{(isMCQ || isWordQ) ? "" : " = ?"}
              </div>

              {isMCQ ? (
                <div style={{
                  display: "grid", gap: 7, padding: "0 8px",
                  gridTemplateColumns: question.choices.every((c) => c.length <= 9) ? `repeat(${question.choices.length}, 1fr)` : "1fr 1fr",
                }}>
                  {question.choices.map((c, ci) => (
                    <button key={c} data-hotkey={String(ci + 1)} disabled={paused} onClick={() => handleAnswer(c)} style={{
                      position: "relative",
                      fontFamily: FONT, fontSize: 9, padding: "9px 8px", lineHeight: 1.4,
                      background: "#fde68a", color: "#1f2937", border: "3px solid #1f2937",
                      borderRadius: 8, cursor: "pointer", boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                    }}>
                      {c}
                      <span style={{
                        position: "absolute", top: 3, left: 4, fontSize: 6, lineHeight: 1, padding: "2px 3px",
                        borderRadius: 3, background: "#1f2937", color: "#fde68a",
                      }}>{ci + 1}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <input
                    ref={inputRef}
                    value={input}
                    inputMode="numeric"
                    onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
                    disabled={paused}
                    onKeyDown={(e) => { if (e.key === "Enter" && input !== "" && !paused) handleAnswer(input); }}
                    style={{
                      fontFamily: FONT, fontSize: 17, width: 105, textAlign: "center", padding: 7,
                      border: "3px solid #1f2937", borderRadius: 8, outline: "none", background: "#fff",
                    }}
                  />
                  <button onClick={() => input !== "" && handleAnswer(input)} style={{
                    fontFamily: FONT, fontSize: 11, marginLeft: 10, padding: "10px 14px",
                    background: "#4ade80", border: "3px solid #1f2937", borderRadius: 8, cursor: "pointer",
                  }}>GO!</button>
                </div>
              )}

              <div style={{ width: "55%", height: 8, background: "#e5e7eb", borderRadius: 4, margin: "10px auto 0", overflow: "hidden" }}>
                <div style={{
                  width: `${(timeLeft / qTime) * 100}%`, height: "100%",
                  background: timeLeft > qTime * 0.4 ? "#4ade80" : "#ef4444", transition: "width 1s linear",
                }} />
              </div>
            </div>
          )}

          {phase === "switch" && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>Choose a Mathimal:</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {team.map((m, i) => (
                  <PixelButton key={m.id} small hotkey={String(i + 1)} disabled={m.hp <= 0 || i === activeIdx}
                    onClick={() => {
                      if (actionLockRef.current || pausedRef.current) return;
                      actionLockRef.current = true;
                      const wasFaint = team[activeIdx].hp <= 0;
                      setActiveIdx(i);
                      setMsg(`Go, ${displayName(m)}!`);
                      setPhase("resolve");
                      if (wasFaint) later(() => { setPhase("menu"); setMsg(""); }, 1100);
                      else enemyAttack(1100);
                    }}>
                    {displayName(m)} <span style={{ fontSize: 7 }}>Lv{m.level} · {Math.max(0, m.hp)}HP</span>
                  </PixelButton>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Duel (v5.2): player against player ----------------
   Both laptops answer their own kind of question at the same time. The laptop
   that sent the challenge (the "host") is the referee: it collects both answers,
   works out the round, and sends the result, so both screens always agree.
   Teams are level-matched copies; the real Mathimals are never hurt. */
const DUEL_LEVEL = 20;
const DUEL_SIZE = 3;
const DUEL_HANDICAPS = [0, 10, 20, 30, -10, -20, -30]; // > 0 boosts the challenged player, < 0 the challenger
function duelMon(raw, slot) {
  if (!raw || !DEX[raw.species]) return null;
  const d = DEX[raw.species];
  const evolved = raw.evolved === true;
  const maxHp = d.hp + DUEL_LEVEL * 3 + 6;
  return {
    id: slot, species: raw.species, name: evolved ? d.evoName : d.name, type: d.type, level: DUEL_LEVEL, xp: 0,
    maxHp, hp: maxHp, atk: d.atk + Math.floor(DUEL_LEVEL * 1.4) + 3, evolved, shiny: raw.shiny === true,
  };
}
const duelTeam = (list, side) => (Array.isArray(list) ? list : []).slice(0, DUEL_SIZE).map((m, i) => duelMon(m, side * 10 + i + 1)).filter(Boolean);
const duelWire = (mons) => mons.map((m) => ({ species: m.species, evolved: !!m.evolved, shiny: !!m.shiny }));
const duelQDur = (q) => ((q.choices || q.text.length > 14) ? 30 : 25);
function addXp(m, amount) {
  const mon = { ...m, xp: m.xp + amount };
  while (mon.level < MAX_LEVEL && mon.xp >= xpToNext(mon)) {
    mon.xp -= xpToNext(mon);
    mon.level += 1; mon.maxHp += 3; mon.atk += 2;
    mon.hp = Math.min(mon.maxHp, mon.hp + 3);
    if (mon.level >= 8 && !mon.evolved) applyEvolution(mon);
  }
  if (mon.level >= MAX_LEVEL) mon.xp = 0;
  return mon;
}

function Duel({ cfg, send, msgRef, connected, partnerName, qmode, skill, gkCorrect, topics, topicProgress, recordStat, onTableProgress, onTopicProgress, onGkCorrect, use3D, region, isNight, onEnd }) {
  const isHost = cfg.role === "host";
  const [mine, setMine] = useState(cfg.mine);
  const [theirs, setTheirs] = useState(cfg.theirs);
  const [myIdx, setMyIdx] = useState(0);
  const [thIdx, setThIdx] = useState(0);
  const [phase, setPhase] = useState("intro"); // intro, moves, quit, question, waiting, resolve, over
  const [msg, setMsg] = useState("");
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState(null);
  const [move, setMove] = useState(null);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(25);
  const [combo, setCombo] = useState(0);
  const [enemyHurt, setEnemyHurt] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [fx, setFx] = useState(null);
  const [impact, setImpact] = useState(null);
  const [result, setResult] = useState(null); // win | loss | draw
  const [rdyRound, setRdyRound] = useState(0); // the round the partner has already answered
  // live values for timers and message handlers (two messages can arrive before React re-renders)
  const st = useRef({ mine: cfg.mine, theirs: cfg.theirs, me: 0, them: 0, round: 1, combo: 0, answered: true, resolving: false, done: false, ans: { h: null, g: null }, lastRes: null, start: 0 }).current;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const keyHandlerRef = useRef(null);
  const answerRef = useRef(null);
  const resendRef = useRef(null);
  const timersRef = useRef(new Set());
  const aliveRef = useRef(true);
  useEffect(() => () => {
    aliveRef.current = false;
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current.clear();
    clearInterval(resendRef.current);
    if (msgRef) msgRef.current = null;
  }, []); // eslint-disable-line
  const later = (fn, ms) => {
    const id = setTimeout(() => { timersRef.current.delete(id); if (aliveRef.current) fn(); }, ms);
    timersRef.current.add(id);
    return id;
  };
  function launchFx(to, color) {
    const id = Date.now() + Math.random();
    setFx({ to, color, id });
    later(() => {
      setFx((f) => (f && f.id === id ? null : f));
      setImpact({ at: to, color, id });
      later(() => setImpact((im) => (im && im.id === id ? null : im)), 380);
    }, 440);
  }
  const setHp = (side, hp) => {
    if (side === "me") { st.mine = st.mine.map((m, i) => (i === st.me ? { ...m, hp } : m)); setMine(st.mine); }
    else { st.theirs = st.theirs.map((m, i) => (i === st.them ? { ...m, hp } : m)); setTheirs(st.theirs); }
  };
  const active = mine[myIdx];
  const enemy = theirs[thIdx];

  function finish(res, text) {
    if (st.done) return;
    st.done = true; st.answered = true;
    clearInterval(resendRef.current);
    timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current.clear();
    setResult(res); setMsg(text); setPhase("over");
    play(res === "win" ? "victory" : res === "loss" ? "faint" : "select");
  }

  useEffect(() => {
    play("encounter");
    setMsg(`🤺 DUEL! ${partnerName} sent out ${displayName(cfg.theirs[0])}!`);
    later(() => { if (!st.done) { setMsg(""); setPhase("moves"); } }, 1900);
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!connected) finish("draw", "📡 The link dropped — this duel ends in a draw.");
  }, [connected]); // eslint-disable-line

  useEffect(() => { if (phase === "question" && inputRef.current) inputRef.current.focus(); }, [phase, question]);
  useEffect(() => { if (typeof window !== "undefined") window.__mqQ = question; }, [question]); // test hook

  // Question clock, measured from the wall clock so a slow tab can't stretch it
  useEffect(() => {
    if (phase !== "question" || !question) return undefined;
    const dur = duelQDur(question);
    st.start = Date.now();
    setTimeLeft(dur);
    const id = setInterval(() => {
      const left = dur - Math.floor((Date.now() - st.start) / 1000);
      setTimeLeft(Math.max(0, left));
      if (left <= 0) { clearInterval(id); if (answerRef.current) answerRef.current(null, true); }
    }, 250);
    return () => clearInterval(id);
  }, [phase, question]); // eslint-disable-line

  function startQuestion(mv) {
    if (st.done || st.resolving) return;
    const hard = mv.power > 1.2 ? 1 : 0;
    st.answered = false;
    setQuestion(qmode === "gk" ? genGkQuestion(gkTierFor(gkCorrect) + hard) : genQuestion(Math.min(10, skill + hard), topics, topicProgress));
    setMove(mv); setInput(""); setPhase("question");
  }

  function handleAnswer(val, timedOut = false) {
    if (st.answered || st.done || !question) return;
    st.answered = true;
    const elapsed = (Date.now() - st.start) / 1000;
    const isMC = !!question.choices;
    const correct = !timedOut && (isMC
      ? String(val) === String(question.answer) || sameFraction(val, question.answer)
      : Number(val) === question.answer);
    recordStat(question.op, correct, elapsed);
    if (correct && question.table && onTableProgress) onTableProgress(question.table);
    if (correct && TOPIC_GEN[question.op] && onTopicProgress) onTopicProgress(question.op);
    if (correct && question.op === "gk" && onGkCorrect) onGkCorrect();
    st.combo = correct ? st.combo + 1 : 0;
    setCombo(st.combo);
    const ans = { ok: correct, pw: move && move.power > 1.2 ? 2 : 1, sp: correct && elapsed < (isMC ? 12 : 9), cb: st.combo, fr: Math.max(0, Math.min(1, elapsed / duelQDur(question))) };
    play(correct ? "correct" : "wrong");
    setMsg(correct ? "✔ Correct! Your attack is ready…" : timedOut ? `⏱ Time's up! The answer was ${question.answer}.` : `✖ Not quite — the answer was ${question.answer}.`);
    setPhase("waiting");
    send({ t: "duelRdy", id: cfg.id, r: st.round });
    if (isHost) { st.ans.h = ans; hostResolve(); }
    else {
      const m = { t: "duelAns", id: cfg.id, r: st.round, ...ans };
      send(m);
      clearInterval(resendRef.current);
      resendRef.current = setInterval(() => send(m), 3000); // until the referee's result arrives
    }
  }
  answerRef.current = handleAnswer;

  // Referee (host only): both answers are in, so work out the round
  function hostResolve() {
    const a = st.ans;
    if (!isHost || !a.h || !a.g || st.done) return;
    const H = { ...st.mine[st.me] }, G = { ...st.theirs[st.them] };
    const order = a.h.fr === a.g.fr ? (Math.random() < 0.5 ? ["h", "g"] : ["g", "h"]) : a.h.fr < a.g.fr ? ["h", "g"] : ["g", "h"];
    const ev = [];
    order.forEach((by) => {
      const att = by === "h" ? H : G, def = by === "h" ? G : H, an = a[by];
      if (!an.ok) { ev.push({ by, ok: 0 }); return; }
      if (att.hp <= 0) { ev.push({ by, ok: 1, ko: 1 }); return; }
      const mult = typeMult(att.type, def.type);
      const comboMult = 1 + Math.min(Math.max(0, an.cb - 1), 5) * 0.1;
      const boost = by === "g" ? (cfg.hc > 0 ? 1 + cfg.hc / 100 : 1) : (cfg.hc < 0 ? 1 - cfg.hc / 100 : 1);
      const dmg = Math.max(3, Math.round((att.atk + att.level) * (an.pw === 2 ? 1.6 : 1) * mult * (an.sp ? 1.3 : 1) * comboMult * (0.9 + Math.random() * 0.25) * 0.4 * boost));
      def.hp = Math.max(0, def.hp - dmg);
      ev.push({ by, ok: 1, dmg, pw: an.pw, sp: an.sp ? 1 : 0, cb: an.cb, ef: mult > 1 ? 1 : mult < 1 ? -1 : 0 });
    });
    const res = { t: "duelRes", id: cfg.id, r: st.round, ev, hp: { h: H.hp, g: G.hp } };
    st.lastRes = res;
    st.ans = { h: null, g: null };
    send(res);
    applyRes(res);
  }

  // Both laptops play the same result back
  function applyRes(res) {
    if (res.r !== st.round || st.resolving || st.done) return;
    st.resolving = true; st.answered = true;
    clearInterval(resendRef.current);
    setPhase("resolve");
    const bothHit = res.ev.length === 2 && res.ev.every((e) => e.ok && !e.ko);
    let t = 500;
    res.ev.forEach((e, i) => {
      later(() => showEvent(e, bothHit && i === 0), t);
      t += e.ok && !e.ko ? 2100 : 1700;
    });
    later(() => finishRound(res), t);
  }

  function showEvent(e, first) {
    const mineEv = (e.by === "h") === isHost;
    const att = mineEv ? st.mine[st.me] : st.theirs[st.them];
    const label = `${mineEv ? "Your" : partnerName + "'s"} ${displayName(att)}`;
    if (!e.ok) { setMsg(`${label} missed — ${mineEv ? "your" : "their"} answer wasn't right.`); return; }
    if (e.ko) { setMsg(`${label} was knocked out before it could attack!`); return; }
    const cm = 1 + Math.min(Math.max(0, e.cb - 1), 5) * 0.1;
    setMsg(
      (first ? "⚡ FIRST STRIKE! " : "") + `${label} used ${DEX[att.species].moves[e.pw === 2 ? 1 : 0]}!` +
      (e.sp ? " SPEEDY BONUS!" : "") + (cm > 1 ? ` 🔥COMBO ×${cm.toFixed(1)}!` : "") +
      (e.ef > 0 ? " Super effective!" : e.ef < 0 ? " Not very effective..." : "") + ` −${e.dmg} HP`
    );
    launchFx(mineEv ? "enemy" : "player", TYPE_COLORS[att.type]);
    later(() => {
      play("hit");
      if (mineEv) { setEnemyHurt(true); later(() => setEnemyHurt(false), 600); setHp("them", Math.max(0, st.theirs[st.them].hp - e.dmg)); }
      else { setPlayerHurt(true); later(() => setPlayerHurt(false), 600); setHp("me", Math.max(0, st.mine[st.me].hp - e.dmg)); }
    }, 430);
  }

  function finishRound(res) {
    const myHp = isHost ? res.hp.h : res.hp.g, thHp = isHost ? res.hp.g : res.hp.h;
    setHp("me", myHp); setHp("them", thHp); // the referee's numbers are final
    const meDown = myHp <= 0, themDown = thHp <= 0;
    const meOut = meDown && st.me + 1 >= st.mine.length, themOut = themDown && st.them + 1 >= st.theirs.length;
    const nextRound = () => {
      st.round = res.r + 1; st.resolving = false;
      setRound(st.round); setMsg(""); setPhase("moves");
    };
    if (!meDown && !themDown) { nextRound(); return; }
    play("faint");
    setMsg(meDown ? `Your ${displayName(st.mine[st.me])} fainted!` : `${partnerName}'s ${displayName(st.theirs[st.them])} fainted!`);
    later(() => {
      if (meOut) { finish("loss", `${partnerName} won the duel. Good battle — ask for a rematch!`); return; }
      if (themOut) { finish("win", "🏆 YOU WON THE DUEL!"); return; }
      if (meDown) { st.me += 1; setMyIdx(st.me); setMsg(`Go, ${displayName(st.mine[st.me])}!`); }
      else { st.them += 1; setThIdx(st.them); setMsg(`${partnerName} sent out ${displayName(st.theirs[st.them])}!`); }
      later(nextRound, 1400);
    }, 1700);
  }

  // Messages from the other laptop (already checked to belong to this duel)
  if (msgRef) msgRef.current = (m) => {
    if (st.done) return;
    switch (m.t) {
      case "duelAns": {
        if (!isHost || !isInt(m.r)) break;
        const done = st.lastRes ? st.lastRes.r : 0;
        if (m.r <= done) { if (m.r === done) send(st.lastRes); break; } // our result got lost: send it again
        if (m.r !== done + 1 || st.ans.g) break;
        st.ans.g = { ok: m.ok === true, pw: m.pw === 2 ? 2 : 1, sp: m.sp === true && m.ok === true, cb: clampInt(m.cb, 0, 99, 0), fr: Number.isFinite(m.fr) ? Math.max(0, Math.min(1, m.fr)) : 1 };
        hostResolve();
        break;
      }
      case "duelRes": {
        if (isHost || !isInt(m.r) || !Array.isArray(m.ev) || !m.hp) break;
        applyRes({
          r: m.r,
          ev: m.ev.slice(0, 2).map((e) => ({
            by: e && e.by === "h" ? "h" : "g", ok: !!(e && e.ok), ko: !!(e && e.ko), dmg: clampInt(e && e.dmg, 0, 9999, 0),
            pw: e && e.pw === 2 ? 2 : 1, sp: !!(e && e.sp), cb: clampInt(e && e.cb, 0, 99, 0), ef: clampInt(e && e.ef, -1, 1, 0),
          })),
          hp: { h: clampInt(m.hp.h, 0, 9999, 0), g: clampInt(m.hp.g, 0, 9999, 0) },
        });
        break;
      }
      case "duelRdy":
        if (isInt(m.r)) setRdyRound((r) => Math.max(r, m.r));
        break;
      case "duelQuit":
        if (m.void) finish("draw", "The duel couldn't start properly — send a new challenge!");
        else finish("win", `🏆 ${partnerName} forfeited — you win the duel!`);
        break;
      default:
    }
  };

  const moves = active ? [
    { name: DEX[active.species].moves[0], power: 1, label: "Quick", stars: "★" },
    { name: DEX[active.species].moves[1], power: 1.6, label: "Power", stars: "★★" },
  ] : [];

  keyHandlerRef.current = (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key === "Escape" ? "escape" : e.key === "Enter" ? "enter" : e.key === "Backspace" ? "backspace" : e.key.toLowerCase();
    const inInput = e.target && e.target.tagName === "INPUT";
    if (phase === "question" && !inInput && inputRef.current) {
      if (/^[0-9]$/.test(k)) { e.preventDefault(); inputRef.current.focus(); setInput((v) => (v + k).slice(0, 6)); return; }
      if (k === "backspace") { e.preventDefault(); inputRef.current.focus(); setInput((v) => v.slice(0, -1)); return; }
      if (k === "enter") { e.preventDefault(); if (input !== "") handleAnswer(input); return; }
    }
    if (inInput) return;
    const root = rootRef.current;
    if (!root) return;
    const btn = [...root.querySelectorAll("button[data-hotkey]")].find((b) => b.dataset.hotkey.split(" ").includes(k));
    if (!btn) return;
    e.preventDefault();
    if (btn.disabled) { play("wrong"); return; }
    btn.click();
  };
  useEffect(() => {
    const h = (e) => keyHandlerRef.current && keyHandlerRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const isMCQ = question && !!question.choices;
  const isWordQ = question && !question.choices && question.text.length > 14;
  const qTime = question ? duelQDur(question) : 25;
  const pips = (t) => t.map((m) => (m.hp > 0 ? "●" : "○")).join("");
  const light = isNight || use3D;
  const partnerAnswered = rdyRound >= round && (phase === "moves" || phase === "question" || phase === "quit");
  const boostMine = (cfg.hc > 0) !== isHost; // who the handicap helps
  const comboMult = 1 + Math.min(Math.max(0, combo - 1), 5) * 0.1;

  return (
    <div ref={rootRef} data-testid="duel" style={{
      width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: use3D ? "#0f172a" : isNight
        ? "linear-gradient(#1e293b 0%, #334155 55%, #3f4a31 55%, #4d5b3a 100%)"
        : "linear-gradient(#bae6fd 0%, #bae6fd 55%, #d9f99d 55%, #bef264 100%)",
      fontFamily: FONT,
    }}>
      {use3D && enemy && (
        <Battle3D enemy={enemy} active={active} region={region} isNight={isNight} kind="duel"
          enemyHurt={enemyHurt} playerHurt={playerHurt} fx={fx} ballAnim={false} catchFx={null} />
      )}

      <div style={{
        position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 5, fontSize: 8, textAlign: "center",
        background: "rgba(15,23,42,0.85)", color: "#fde047", border: "3px solid #475569", borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap",
      }}>
        🤺 DUEL · ROUND {round}
        {cfg.hc !== 0 && <span style={{ color: "#93c5fd" }}> · {boostMine ? "YOU" : partnerName.toUpperCase()} +{Math.abs(cfg.hc)}%</span>}
      </div>
      {partnerAnswered && (
        <div data-testid="duel-rdy" style={{
          position: "absolute", top: 44, left: "50%", transform: "translateX(-50%)", zIndex: 5, fontSize: 8, whiteSpace: "nowrap",
          background: "#f59e0b", color: "#1f2937", border: "3px solid #92400e", borderRadius: 8, padding: "6px 10px", animation: "popIn 0.3s",
        }}>⚡ {partnerName.toUpperCase()} HAS ANSWERED!</div>
      )}
      {combo >= 2 && (
        <div style={{
          position: "absolute", top: 12, right: 52, zIndex: 5, fontSize: 10,
          background: "#7c2d12", color: "#fde047", border: "3px solid #fbbf24", borderRadius: 8,
          padding: "7px 10px", animation: "popIn 0.25s", boxShadow: "0 0 12px rgba(251,191,36,0.6)",
        }}>🔥 COMBO ×{comboMult.toFixed(1)}</div>
      )}

      {/* partner's side */}
      {enemy && (
        <div style={{ position: "absolute", top: 22, left: 22, animation: "popIn 0.4s", zIndex: 2 }}>
          <StatCard mon={enemy} />
          <div style={{ fontSize: 7, marginTop: 5, color: light ? "#e2e8f0" : "#374151", textShadow: use3D ? "1px 1px 0 #000" : "none" }}>
            {partnerName} <span data-testid="duel-pips-them" style={{ letterSpacing: 2, marginLeft: 6, fontSize: 11 }}>{pips(theirs)}</span>
          </div>
        </div>
      )}
      {!use3D && enemy && <div style={{ position: "absolute", top: 56, right: 66, textAlign: "center" }}>
        <MonSprite mon={enemy} size={120}
          animStyle={{ animation: enemyHurt ? "flashHit 0.6s" : enemy.hp <= 0 ? "none" : "bounce 2.2s infinite", opacity: enemy.hp <= 0 ? 0.25 : 1 }} />
        <div style={{ width: 140, height: 26, background: "rgba(50,70,30,0.4)", borderRadius: "50%", margin: "-8px auto 0" }} />
      </div>}

      {/* my side */}
      {active && (
        <>
          <div style={{ position: "absolute", bottom: 192, right: 22, textAlign: "right", zIndex: 2 }}>
            <StatCard mon={active} />
            <div style={{ fontSize: 7, marginTop: 4, color: light ? "#e2e8f0" : "#374151", textShadow: use3D ? "1px 1px 0 #000" : "none" }}>
              YOU <span data-testid="duel-pips-me" style={{ letterSpacing: 2, marginLeft: 6, fontSize: 11 }}>{pips(mine)}</span>
            </div>
          </div>
          {!use3D && <div style={{ position: "absolute", bottom: 172, left: 76, textAlign: "center", animation: playerHurt ? "shake 0.5s" : "none" }}>
            <MonSprite mon={active} size={148} flip
              animStyle={{ animation: playerHurt ? "flashHit 0.6s" : "none", opacity: active.hp <= 0 ? 0.25 : 1 }} />
            <div style={{ width: 170, height: 30, background: "rgba(50,70,30,0.4)", borderRadius: "50%", margin: "-10px auto 0" }} />
          </div>}
        </>
      )}

      {fx && !use3D && (
        <div key={fx.id} style={{
          position: "absolute", width: 24, height: 24, borderRadius: "50%",
          background: `radial-gradient(circle at 35% 35%, #fff, ${fx.color})`,
          boxShadow: `0 0 16px 7px ${fx.color}`,
          animation: `${fx.to === "enemy" ? "flyToEnemy" : "flyToPlayer"} 0.45s linear forwards`,
          zIndex: 3, pointerEvents: "none",
        }} />
      )}
      {impact && !use3D && (
        <div key={"imp" + impact.id} style={{
          position: "absolute",
          left: impact.at === "enemy" ? "71%" : "24%",
          top: impact.at === "enemy" ? "20%" : "58%",
          width: 40, height: 40, borderRadius: "50%",
          border: `5px solid ${impact.color}`,
          animation: "impactBurst 0.38s ease-out forwards",
          zIndex: 3, pointerEvents: "none",
        }} />
      )}

      {phase === "question" && question && (question.clock || question.bar) && (
        <div data-testid="q-visual" style={{
          position: "absolute", left: "50%", bottom: 178, transform: "translateX(-50%)", zIndex: 5,
          background: "#fffbe6", border: "4px solid #0f172a", borderRadius: 14, padding: 10,
          boxShadow: "0 6px 0 rgba(15,23,42,0.45)", animation: "popIn 0.25s",
        }}>
          {question.clock && <ClockFace h={question.clock.h} m={question.clock.m} size={128} />}
          {question.clock && (
            <div style={{ fontFamily: FONT, fontSize: 6, color: "#6b7280", textAlign: "center", marginTop: 3 }}>
              <span style={{ color: "#dc2626" }}>short = hour</span> · <span style={{ color: "#2563eb" }}>long = minutes</span>
            </div>
          )}
          {question.bar && <FractionBar parts={question.bar.parts} shaded={question.bar.shaded} />}
        </div>
      )}

      {/* bottom panel */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 168,
        background: "#1e293b", borderTop: "5px solid #0f172a", padding: 12, boxSizing: "border-box", zIndex: 4,
      }}>
        <div style={{
          background: "#fffbe6", border: "3px solid #0f172a", borderRadius: 10, height: "100%",
          padding: 13, boxSizing: "border-box",
        }}>
          {(phase === "intro" || phase === "resolve") && (
            <div data-testid="duel-msg" style={{ fontSize: 10.5, lineHeight: 1.9, color: "#1f2937" }}>{msg || "..."}</div>
          )}

          {phase === "waiting" && (
            <div>
              <div data-testid="duel-msg" style={{ fontSize: 10.5, lineHeight: 1.9, color: "#1f2937" }}>{msg}</div>
              <div style={{ fontSize: 8, marginTop: 10, color: "#6b7280", animation: "bounce 1.6s infinite" }}>⏳ Waiting for {partnerName} to answer…</div>
            </div>
          )}

          {phase === "moves" && active && (
            <div>
              <div style={{ fontSize: 10, marginBottom: 9, color: "#1f2937" }}>
                Round {round}: choose {displayName(active)}'s attack!
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 0.7fr", gap: 8 }}>
                {moves.map((mv, i) => (
                  <PixelButton key={mv.label} small hotkey={String(i + 1)} color={i ? "#fecaca" : "#bbf7d0"} onClick={() => startQuestion(mv)}>
                    {mv.name} <div style={{ fontSize: 7, marginTop: 4, color: "#6b7280" }}>{mv.stars} {mv.label}{i ? " · harder question, bigger hit" : ""}</div>
                  </PixelButton>
                ))}
                <PixelButton small hotkey="r" color="#e5e7eb" onClick={() => setPhase("quit")}>🏳 FORFEIT</PixelButton>
              </div>
              <div style={{ fontSize: 7, marginTop: 8, color: "#9ca3af" }}>
                You both answer at the same time. The faster correct answer strikes first!
              </div>
            </div>
          )}

          {phase === "quit" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, marginBottom: 12, color: "#1f2937" }}>Really give up this duel? {partnerName} will win.</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small hotkey="y" color="#fecaca" onClick={() => { send({ t: "duelQuit", id: cfg.id }); finish("loss", "You forfeited the duel."); }}>YES, FORFEIT</PixelButton>
                <PixelButton small hotkey="n escape" color="#bbf7d0" onClick={() => setPhase("moves")}>NO, KEEP DUELLING</PixelButton>
              </div>
            </div>
          )}

          {phase === "question" && question && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 6 }}>
                {question.op === "gk" && GK_CATS[question.cat] ? `${GK_CATS[question.cat].emoji} ${GK_CATS[question.cat].name} · ` : ""}
                {isMCQ ? "Pick the right answer to power " : "Solve it to power "}{move ? move.name : "your attack"}!
              </div>
              <div style={{
                fontSize: (isMCQ || isWordQ) ? 10 : 22, lineHeight: (isMCQ || isWordQ) ? 1.7 : 1.2,
                color: "#1f2937", marginBottom: 8, padding: (isMCQ || isWordQ) ? "0 18px" : 0,
              }}>
                {question.text}{(isMCQ || isWordQ) ? "" : " = ?"}
              </div>
              {isMCQ ? (
                <div style={{
                  display: "grid", gap: 7, padding: "0 8px",
                  gridTemplateColumns: question.choices.every((c) => c.length <= 9) ? `repeat(${question.choices.length}, 1fr)` : "1fr 1fr",
                }}>
                  {question.choices.map((c, ci) => (
                    <button key={c} data-hotkey={String(ci + 1)} onClick={() => handleAnswer(c)} style={{
                      position: "relative",
                      fontFamily: FONT, fontSize: 9, padding: "9px 8px", lineHeight: 1.4,
                      background: "#fde68a", color: "#1f2937", border: "3px solid #1f2937",
                      borderRadius: 8, cursor: "pointer", boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
                    }}>
                      {c}
                      <span style={{
                        position: "absolute", top: 3, left: 4, fontSize: 6, lineHeight: 1, padding: "2px 3px",
                        borderRadius: 3, background: "#1f2937", color: "#fde68a",
                      }}>{ci + 1}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <input
                    ref={inputRef}
                    value={input}
                    inputMode="numeric"
                    onChange={(e) => setInput(e.target.value.replace(/[^0-9-]/g, ""))}
                    onKeyDown={(e) => { if (e.key === "Enter" && input !== "") handleAnswer(input); }}
                    style={{
                      fontFamily: FONT, fontSize: 17, width: 105, textAlign: "center", padding: 7,
                      border: "3px solid #1f2937", borderRadius: 8, outline: "none", background: "#fff",
                    }}
                  />
                  <button onClick={() => input !== "" && handleAnswer(input)} style={{
                    fontFamily: FONT, fontSize: 11, marginLeft: 10, padding: "10px 14px",
                    background: "#4ade80", border: "3px solid #1f2937", borderRadius: 8, cursor: "pointer",
                  }}>GO!</button>
                </div>
              )}
              <div style={{ width: "55%", height: 8, background: "#e5e7eb", borderRadius: 4, margin: "10px auto 0", overflow: "hidden" }}>
                <div style={{
                  width: `${(timeLeft / qTime) * 100}%`, height: "100%",
                  background: timeLeft > qTime * 0.4 ? "#4ade80" : "#ef4444", transition: "width 0.25s linear",
                }} />
              </div>
            </div>
          )}

          {phase === "over" && (
            <div style={{ textAlign: "center" }}>
              <div data-testid="duel-over" data-result={result} style={{ fontSize: 11, lineHeight: 1.8, color: "#1f2937", marginBottom: 12 }}>{msg}</div>
              <PixelButton small hotkey="enter" color="#86efac" onClick={() => onEnd(result)}>CONTINUE</PixelButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Overworld tiles ---------------- */

const TILE = 38;

function TileView({ ch, x, y }) {
  const base = { position: "absolute", left: x * TILE, top: y * TILE, width: TILE, height: TILE };
  const checker = (x + y) % 2 === 0;
  switch (ch) {
    case "G":
      return <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }} />;
    case "T":
      return (
        <div style={{ ...base, background: "#3f9142", display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 14 + (i % 2) * 5, background: "#2f7233", borderRadius: "50% 50% 0 0", marginBottom: 3 }} />
          ))}
        </div>
      );
    case "P":
      return <div style={{ ...base, background: checker ? "#e7cf9f" : "#e0c693" }} />;
    case "W":
      return (
        <div style={{ ...base, background: checker ? "#4aa7e0" : "#3f9bd6", overflow: "hidden" }}>
          <div style={{ width: 14, height: 3, background: "#bfe6fb", borderRadius: 2, margin: "12px 0 0 8px", opacity: 0.8 }} />
        </div>
      );
    case "X":
      return (
        <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }}>
          <div style={{ width: 8, height: 10, background: "#7a5230", margin: "24px auto 0" }} />
          <div style={{ position: "absolute", top: 2, left: 4, width: 30, height: 26, background: "#2e7d32", borderRadius: "45%" }} />
          <div style={{ position: "absolute", top: 6, left: 9, width: 12, height: 8, background: "#43a047", borderRadius: "50%" }} />
        </div>
      );
    case "F":
      return (
        <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }}>
          {[[6, 8, "#f472b6"], [22, 18, "#fde047"], [12, 24, "#f9fafb"]].map(([l, t, c], i) => (
            <div key={i} style={{ position: "absolute", left: l, top: t, width: 7, height: 7, background: c, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.25)" }} />
          ))}
        </div>
      );
    case "H":
      return (
        <div style={{ ...base, background: "#e7cf9f" }}>
          <div style={{ position: "absolute", left: 3, top: 14, width: 32, height: 20, background: "#fef3c7", border: "2px solid #92400e", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 0, top: 2, width: 0, height: 0, borderLeft: "19px solid transparent", borderRight: "19px solid transparent", borderBottom: "14px solid #ec4899" }} />
          <div style={{ position: "absolute", left: 15, top: 20, width: 8, height: 8, background: "#ec4899", clipPath: "polygon(50% 100%, 0 35%, 25% 10%, 50% 35%, 75% 10%, 100% 35%)" }} />
        </div>
      );
    case "D":
      return (
        <div style={{ ...base, background: "#e7cf9f" }}>
          <div style={{ position: "absolute", left: 2, top: 6, width: 34, height: 28, background: "#7c3aed", border: "2px solid #4c1d95", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 13, top: 20, width: 12, height: 14, background: "#fde047" }} />
          <div style={{ position: "absolute", left: 6, top: 10, fontSize: 7, fontFamily: FONT, color: "#fde047" }}>GYM</div>
        </div>
      );
    case "$": case "@": case "%": case "#": {
      const st = { "$": ["#7bc96f", "#15803d", "#14532d", "💰"], "@": ["#7bc96f", "#0e7490", "#164e63", "🕒"],
        "%": ["#57534e", "#c2410c", "#7c2d12", "🍕"], "#": ["#e3eef6", "#6d28d9", "#3b0764", "🔢"] }[ch];
      return (
        <div style={{ ...base, background: st[0] }}>
          <div style={{ position: "absolute", left: 3, top: 7, width: 32, height: 27, background: st[1], border: "2px solid " + st[2], boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 0, top: 1, width: 0, height: 0, borderLeft: "19px solid transparent", borderRight: "19px solid transparent", borderBottom: "9px solid " + st[2] }} />
          <div style={{ position: "absolute", left: 14, top: 22, width: 10, height: 12, background: "#fde047" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 8, textAlign: "center", fontSize: 11 }}>{st[3]}</div>
        </div>
      );
    }
    case "M":
      return (
        <div style={{ ...base, background: "#e7cf9f" }}>
          <div style={{ position: "absolute", left: 2, top: 8, width: 34, height: 26, background: "#2563eb", border: "2px solid #1e3a8a", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 2, top: 4, width: 34, height: 8, background: "repeating-linear-gradient(90deg,#ef4444 0 6px,#f9fafb 6px 12px)" }} />
          <div style={{ position: "absolute", left: 13, top: 22, width: 12, height: 12, background: "#bfdbfe" }} />
        </div>
      );
    case ">":
    case "<":
    case "}":
    case "{":
      return (
        <div style={{ ...base, background: "#92400e" }}>
          {[5, 14, 23, 31].map((t) => (
            <div key={t} style={{ position: "absolute", top: t, left: 2, width: 34, height: 3, background: "#b45309" }} />
          ))}
          <div style={{ position: "absolute", top: 13, left: 12, fontFamily: FONT, fontSize: 11, color: "#fde047" }}>{(ch === ">" || ch === "}") ? "→" : "←"}</div>
        </div>
      );
    case "C":
      return (
        <div style={{ ...base, background: checker ? "#292524" : "#1c1917" }}>
          <div style={{ position: "absolute", top: 8, left: 10, width: 8, height: 5, background: "#44403c", borderRadius: 2 }} />
          <div style={{ position: "absolute", top: 24, left: 22, width: 6, height: 4, background: "#44403c", borderRadius: 2 }} />
        </div>
      );
    case "R":
      return <div style={{ ...base, background: checker ? "#57534e" : "#504b46" }} />;
    case "A":
      return (
        <div style={{ ...base, background: "#3f3a35", display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 13 + (i % 2) * 5, background: "#4d7c0f", borderRadius: "50% 50% 0 0", marginBottom: 3, opacity: 0.85 }} />
          ))}
        </div>
      );
    case "L":
      return (
        <div style={{ ...base, background: "radial-gradient(circle at 40% 40%, #fbbf24, #ea580c 65%, #b91c1c)", animation: "lavaGlow 1.8s infinite" }}>
          <div style={{ position: "absolute", top: 10, left: 8, width: 9, height: 4, background: "#fde047", borderRadius: "50%", opacity: 0.8 }} />
        </div>
      );
    case "E":
      return (
        <div style={{ ...base, background: "#57534e" }}>
          <div style={{ position: "absolute", left: 2, top: 6, width: 34, height: 28, background: "#b91c1c", border: "2px solid #7f1d1d", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 13, top: 20, width: 12, height: 14, background: "#fde047" }} />
          <div style={{ position: "absolute", left: 6, top: 10, fontSize: 7, fontFamily: FONT, color: "#fde047" }}>GYM</div>
        </div>
      );
    case "I":
      return (
        <div style={{ ...base, background: checker ? "#bae6fd" : "#a5d8f3" }}>
          <div style={{ position: "absolute", top: 6, left: 8, width: 10, height: 6, background: "#e0f2fe", borderRadius: 2, opacity: 0.7 }} />
          <div style={{ position: "absolute", top: 22, left: 20, width: 8, height: 5, background: "#e0f2fe", borderRadius: 2, opacity: 0.7 }} />
        </div>
      );
    case "S":
      return <div style={{ ...base, background: checker ? "#eef6fb" : "#e3eef6" }} />;
    case "N":
      return (
        <div style={{ ...base, background: "#dbeafe", display: "flex", alignItems: "flex-end", justifyContent: "space-around" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 13 + (i % 2) * 5, background: "#93c5fd", borderRadius: "50% 50% 0 0", marginBottom: 3 }} />
          ))}
          <div style={{ position: "absolute", top: 4, left: 14, width: 4, height: 4, background: "#fff", borderRadius: "50%" }} />
        </div>
      );
    case "Z":
      return (
        <div style={{ ...base, background: "linear-gradient(135deg, #7dd3fc 0%, #bae6fd 50%, #93c5fd 100%)" }}>
          <div style={{ position: "absolute", top: 8, left: 6, width: 18, height: 2, background: "#e0f2fe", transform: "rotate(20deg)", opacity: 0.8 }} />
        </div>
      );
    case "Q":
      return (
        <div style={{ ...base, background: "#dbeafe" }}>
          <div style={{ position: "absolute", left: 2, top: 4, width: 34, height: 30, background: "#1e3a8a", border: "2px solid #1e293b", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, borderLeft: "19px solid transparent", borderRight: "19px solid transparent", borderBottom: "12px solid #312e81" }} />
          <div style={{ position: "absolute", left: 13, top: 20, width: 12, height: 14, background: "#fde047" }} />
          <div style={{ position: "absolute", left: 3, top: 8, fontSize: 6, fontFamily: FONT, color: "#fde047" }}>ELITE</div>
        </div>
      );
    case "V":
      return (
        <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }}>
          <div style={{ position: "absolute", left: 6, top: 2, width: 26, height: 32, background: "#64748b", border: "2px solid #334155", boxSizing: "border-box" }} />
          {[8, 15, 22].map((l) => (
            <div key={l} style={{ position: "absolute", left: l, top: 0, width: 5, height: 6, background: "#334155" }} />
          ))}
          <div style={{ position: "absolute", left: 14, top: 24, width: 10, height: 10, background: "#fde047" }} />
          <div style={{ position: "absolute", left: 11, top: 10, width: 6, height: 6, background: "#93c5fd" }} />
          <div style={{ position: "absolute", left: 21, top: 10, width: 6, height: 6, background: "#93c5fd" }} />
        </div>
      );
    case "Y":
      return (
        <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }}>
          <div style={{ position: "absolute", left: 7, top: 10, width: 24, height: 20, background: "#92400e", borderRadius: "45%", border: "2px solid #451a03" }} />
          <div style={{ position: "absolute", left: 13, top: 15, width: 12, height: 10, background: "#b45309", borderRadius: "50%" }} />
          <div style={{ position: "absolute", left: 17, top: 18, width: 4, height: 4, background: "#78350f", borderRadius: "50%" }} />
        </div>
      );
    case "O":
      return (
        <div style={{ ...base, background: checker ? "#57534e" : "#504b46" }}>
          <div style={{ position: "absolute", left: 6, top: 9, width: 26, height: 22, background: "#78716c", borderRadius: "40%", border: "2px solid #292524" }} />
          {[[11, 14], [20, 13], [15, 21]].map(([l, t], i) => (
            <div key={i} style={{ position: "absolute", left: l, top: t, width: 6, height: 6, background: "#fb923c", borderRadius: "50%", boxShadow: "0 0 4px #fb923c" }} />
          ))}
        </div>
      );
    case "U":
      return (
        <div style={{ ...base, background: checker ? "#eef6fb" : "#e3eef6" }}>
          {[[10, 10, 12, 20], [20, 14, 9, 16], [15, 8, 7, 12]].map(([l, t, w, h], i) => (
            <div key={i} style={{
              position: "absolute", left: l, top: t, width: w, height: h,
              background: "linear-gradient(160deg, #a5f3fc, #22d3ee)", border: "1px solid #0e7490",
              clipPath: "polygon(50% 0, 100% 30%, 80% 100%, 20% 100%, 0 30%)",
              boxShadow: "0 0 6px rgba(34,211,238,0.7)",
            }} />
          ))}
        </div>
      );
    case "K":
      return (
        <div style={{ ...base, background: checker ? "#7bc96f" : "#74c069" }}>
          <div style={{ position: "absolute", left: 4, top: 10, width: 30, height: 18, background: "#a16207", border: "2px solid #451a03", boxSizing: "border-box" }} />
          <div style={{ position: "absolute", left: 8, top: 13, width: 10, height: 10, background: "repeating-linear-gradient(0deg,#78350f 0 3px,#a16207 3px 6px)" }} />
          <div style={{ position: "absolute", left: 21, top: 13, width: 8, height: 3, background: "#e5e7eb", transform: "rotate(35deg)" }} />
          <div style={{ position: "absolute", left: 6, top: 28, width: 5, height: 8, background: "#451a03" }} />
          <div style={{ position: "absolute", left: 27, top: 28, width: 5, height: 8, background: "#451a03" }} />
        </div>
      );
    default:
      return <div style={{ ...base, background: "#7bc96f" }} />;
  }
}

const WorldGrid = React.memo(function WorldGrid({ region }) {
  const map = MAPS[region];
  const tiles = [];
  for (let y = 0; y < ROWS; y++)
    for (let x = 0; x < COLS; x++)
      tiles.push(<TileView key={`${x}-${y}`} ch={map[y][x]} x={x} y={y} />);
  return <>{tiles}</>;
});

/* ---------------- Modal shell ---------------- */

function Modal({ children, wide }) {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "#fffbe6", border: "4px solid #1f2937", borderRadius: 14, padding: 22,
        fontFamily: FONT, textAlign: "center", maxWidth: wide ? 560 : 430, width: "90%",
        animation: "popIn 0.3s", maxHeight: "85%", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Main App ---------------- */

export default function App() {
  const [screen, setScreen] = useState("title"); // title, starter, world, battle, badge, champion
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pos, setPos] = useState({ x: 10, y: 12 });
  const [facing, setFacing] = useState(1);
  const [region, setRegion] = useState(0);
  const [skill, setSkill] = useState(2);
  // "Power" shown on the HUD: Maths Power for maths players, Brain Power (from correct GK answers) for grown-ups
  const gkPower = (n) => Math.min(10, 1 + Math.floor(n / 12));
  const [badge1, setBadge1] = useState(false);
  const [badge2, setBadge2] = useState(false);
  const [champion, setChampion] = useState(false);
  const [coins, setCoins] = useState(30);
  const [inv, setInv] = useState({ potion: 2, superpotion: 0, greatball: 1, megaball: 0, duskball: 0, netball: 0, timerball: 0, healball: 0 });
  // Spending reads these refs (updated synchronously on each spend) so two clicks before a re-render can't overspend
  const coinsRef = useRef(coins);
  const invRef = useRef(inv);
  useEffect(() => { coinsRef.current = coins; }, [coins]);
  useEffect(() => { invRef.current = inv; }, [inv]);
  const [rivalStage, setRivalStage] = useState(0);
  const [steps, setSteps] = useState(0);
  const [seen, setSeen] = useState({});
  const [caught, setCaught] = useState({});
  const [toast, setToast] = useState("");
  const [muted, setMuted] = useState(false);
  const [battleConfig, setBattleConfig] = useState(null);
  const [gymPrompt, setGymPrompt] = useState(null); // 'gym1' | 'gym2'
  const [elitePrompt, setElitePrompt] = useState(false);
  const [rivalPrompt, setRivalPrompt] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const [dexOpen, setDexOpen] = useState(false);
  const [boxOpen, setBoxOpen] = useState(false);
  const [tablesOpen, setTablesOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [sessionWins, setSessionWins] = useState(0);
  const [riding, setRiding] = useState(null); // mon id being ridden
  const [use3D, setUse3D] = useState(() => {
    if (!hasWebGL()) return false;
    try { return window.localStorage.getItem("mq-render") !== "2d"; } catch (e) { return true; }
  });
  useEffect(() => {
    const onFail = () => { setUse3D(false); showToast("3D graphics couldn't start on this computer — switched to the 2D view.", 4200); };
    window.addEventListener("mq-3d-failed", onFail);
    return () => window.removeEventListener("mq-3d-failed", onFail);
  }, []); // eslint-disable-line
  const toggle3D = () => {
    if (!hasWebGL()) { showToast("3D isn't supported on this computer — using 2D."); return; }
    setUse3D((v) => {
      try { window.localStorage.setItem("mq-render", v ? "2d" : "3d"); } catch (e) {}
      return !v;
    });
  };
  const [hudMin, setHudMin] = useState(false);
  const [hudHover, setHudHover] = useState(false);
  const [redeemed, setRedeemed] = useState([]);
  const [playerName, setPlayerName] = useState(DEFAULT_NAME);
  const [qmode, setQmode] = useState("maths");
  const [gkCorrect, setGkCorrect] = useState(0);
  const [txLog, setTxLog] = useState([]); // IDs this laptop has applied (newest first)
  const [pendingTx, setPendingTx] = useState([]); // what this laptop is still waiting to have confirmed
  const power = qmode === "gk" ? gkPower(gkCorrect) : skill;
  const [nameDraft, setNameDraft] = useState("");
  const [modeDraft, setModeDraft] = useState("maths");
  const [codeInput, setCodeInput] = useState("");
  const [codeMsg, setCodeMsg] = useState(null); // {ok, text}
  const [autoSnap] = useState(() => readAutoSave());
  const [backupSnap] = useState(() => readAutoSave(BACKUP_KEY));
  const [saveFailed, setSaveFailed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [ringOpen, setRingOpen] = useState(false);
  const [ring] = useState(() => readRing());

  /* ---- One adventure, one tab: the newest tab to start playing takes over;
     the older one saves straight away and pauses, so they never overwrite each other. ---- */
  const tabIdRef = useRef(Math.random().toString(36).slice(2));
  const tabChanRef = useRef(null);
  const activeRef = useRef(false); // this tab has started playing
  const frozenRef = useRef(false);
  const [frozen, setFrozen] = useState(false);
  const latestSaveRef = useRef(null); // the newest full state, for instant flushes
  const flushNowRef = useRef(false);
  function flushSave() {
    if (frozenRef.current || !HAS_STORAGE || !latestSaveRef.current) return;
    const ok = writeAutoSave(latestSaveRef.current);
    if (ok) pushRing(latestSaveRef.current);
  }
  function claimSlot() {
    activeRef.current = true;
    try { if (tabChanRef.current) tabChanRef.current.postMessage({ t: "claim", id: tabIdRef.current }); } catch (e) { /* ignore */ }
  }
  useEffect(() => {
    const BC = typeof window !== "undefined" ? window.BroadcastChannel : undefined;
    if (!BC) return undefined;
    const ch = new BC("mq-tabs:" + AUTOSAVE_KEY);
    tabChanRef.current = ch;
    ch.onmessage = (ev) => {
      const m = ev.data || {};
      if (m.t === "claim" && m.id !== tabIdRef.current && activeRef.current && !frozenRef.current) {
        flushSave();
        frozenRef.current = true;
        setFrozen(true);
        if (leaveRoomRef.current) leaveRoomRef.current();
      }
    };
    const onHide = () => flushSave();
    const onVis = () => { if (document.visibilityState === "hidden") flushSave(); };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVis);
    return () => { ch.close(); window.removeEventListener("pagehide", onHide); document.removeEventListener("visibilitychange", onVis); };
  }, []); // eslint-disable-line
  const leaveRoomRef = useRef(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [resources, setResources] = useState({ wood: 0, ore: 0, crystal: 0 });
  const [eggs, setEggs] = useState([]); // steps left until each Mystery Egg hatches
  const [luckyWins, setLuckyWins] = useState(0); // battles left with double XP
  const [xpShare, setXpShare] = useState(false);
  const [ownedOutfits, setOwnedOutfits] = useState(["classic"]);
  const [outfit, setOutfit] = useState("classic");
  const [minePrompt, setMinePrompt] = useState(null); // {x,y,kind,q,input,msg}
  const [craftOpen, setCraftOpen] = useState(false);
  const minedRef = useRef({}); // "region:x,y" -> step count when mined (regrows after 60 steps)
  const [tables, setTables] = useState({}); // {2: correctCount, ...} mastery at 10
  const [topicBadges, setTopicBadges] = useState({}); // {money: true, ...}
  const [topicProgress, setTopicProgress] = useState({}); // correct answers per topic
  const [feats, setFeats] = useState({}); // lifetime counters for medals
  const [duelRec, setDuelRec] = useState({ w: 0, l: 0, s: 0 }); // duels won, lost, current winning streak (auto-save only)
  const [medals, setMedals] = useState([]); // earned medal ids
  const [medalPop, setMedalPop] = useState(null); // {list:[medal], coins}
  const [medalsOpen, setMedalsOpen] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState(null); // {topic, back:{x,y}}
  const [towerBest, setTowerBest] = useState(0);
  const [towerPrompt, setTowerPrompt] = useState(null); // null | {mode:'enter'} | {mode:'next', nextFloor, reward}
  const [legendAwake, setLegendAwake] = useState(false);
  const [loadCode, setLoadCode] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFail, setCopyFail] = useState(false);

  const streakRef = useRef({ right: 0, wrong: 0 });
  const graceRef = useRef(0);
  const rivalCooldownRef = useRef(0);
  const toastTimer = useRef(null);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const appTeamRef = useRef(team);
  useEffect(() => { appTeamRef.current = team; }, [team]);
  const boxRef = useRef(box);
  useEffect(() => { boxRef.current = box; }, [box]);
  const statsRef = useRef({ ops: {} });

  const night = Math.floor(steps / 80) % 2 === 1;

  const runRef = useRef(0); // correct answers in a row, across battles
  const recordStat = useCallback((op, correct, sec) => {
    const o = statsRef.current.ops;
    if (!o[op]) o[op] = { n: 0, c: 0, t: 0 };
    o[op].n += 1;
    if (correct) o[op].c += 1;
    o[op].t += Math.min(sec, 25);
    runRef.current = correct ? runRef.current + 1 : 0;
    const run = runRef.current;
    if (correct) setFeats((f) => ({
      ...f, correct: (f.correct || 0) + 1,
      fast: (f.fast || 0) + (sec < 5 ? 1 : 0),
      bestStreak: Math.max(f.bestStreak || 0, run),
    }));
  }, []);
  const bumpFeat = useCallback((k, n = 1) => setFeats((f) => ({ ...f, [k]: (f[k] || 0) + n })), []);
  const handleTopicProgress = useCallback((t) => {
    setTopicProgress((tp) => {
      const n = (tp[t] || 0) + 1;
      if (TOPIC_STEPS.includes(n)) {
        const tp0 = TOPICS.find((x) => x.id === t);
        setTimeout(() => showToast(`${tp0.emoji} ${tp0.name} levelled up! Trickier ${tp0.name.toLowerCase()} questions unlocked.`, 3400), 2600);
      }
      return { ...tp, [t]: n };
    });
  }, []); // eslint-disable-line

  const showToast = useCallback((t, ms = 2400) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), ms);
  }, []);

  const markSeen = useCallback((sp) => setSeen((s) => (s[sp] ? s : { ...s, [sp]: true })), []);
  const markCaught = useCallback((sp) => {
    setSeen((s) => ({ ...s, [sp]: true }));
    setCaught((c) => (c[sp] ? c : { ...c, [sp]: true }));
  }, []);
  const caughtCount = Object.keys(caught).length;
  const regularCaughtCount = REGULAR_SPECIES.filter((s) => caught[s]).length;

  // Questions get harder as the adventure progresses: Maths Power can't drop
  // below a floor that rises with badges, the championship, and tower feats.
  const skillFloor = Math.min(8,
    1 + (badge1 ? 1 : 0) + (badge2 ? 1 : 0) + (champion ? 2 : 0) + (towerBest >= 10 ? 1 : 0));
  useEffect(() => {
    setSkill((s) => Math.max(s, skillFloor));
  }, [skillFloor]);

  // Times-table mastery: 10 correct answers per table earns a star + coins
  const handleTableProgress = useCallback((t) => {
    setTables((tb) => {
      const n = (tb[t] || 0) + 1;
      if (n === 10) {
        play("levelup");
        setCoins((c) => addCap(c, 25, COIN_MAX));
        showToast(`⭐ ${t}× table MASTERED! +25 coins`, 3000);
      }
      return { ...tb, [t]: n };
    });
  }, [showToast]);

  // Legendary awakens once every regular species is caught
  useEffect(() => {
    if (screen === "world" && !legendAwake && regularCaughtCount >= LEGEND_UNLOCK_COUNT && !caught.aurion) {
      setLegendAwake(true);
      play("sparkle");
      showToast("⚡ A legend stirs... a GOLDEN Mathimal now roams the tall grass!", 4200);
    }
  }, [screen, regularCaughtCount, legendAwake, caught, showToast]);

  // Medals: checked whenever the player is back in the world. The first check after
  // loading a save quietly awards anything already earned in one combined pop-up.
  const medalsLoadedRef = useRef(false);
  const awardedRef = useRef(new Set()); // medals already paid out (guards against a double award between renders)
  const medalCtx = () => {
    const all = [...team, ...box];
    const ctx = {
      ...feats,
      duelWins: duelRec.w,
      stars: TABLE_NUMS.filter((t) => (tables[t] || 0) >= 10).length,
      skill: power, towerBest, rivalStage,
      badge1: badge1 ? 1 : 0, badge2: badge2 ? 1 : 0, champion: champion ? 1 : 0,
      topics: TOPIC_IDS.filter((t) => topicBadges[t]).length,
      topicBest: Math.max(0, ...TOPIC_IDS.map((t) => topicProgress[t] || 0)),
      species: caughtCount,
      allRegular: regularCaughtCount >= REGULAR_SPECIES.length ? 1 : 0,
      legend: caught.aurion ? 1 : 0,
      shiny: all.some((m) => m.shiny) ? 1 : 0,
      maxLevel: all.reduce((mx, m) => Math.max(mx, m.level), 0),
    };
    TOPIC_IDS.forEach((t) => { ctx["topic_" + t] = topicBadges[t] ? 1 : 0; });
    return ctx;
  };
  useEffect(() => {
    if (screen !== "world") return;
    const ctx = medalCtx();
    medals.forEach((id) => awardedRef.current.add(id));
    const fresh = MEDALS.filter((m) => !awardedRef.current.has(m.id) && medalEarned(m, ctx));
    fresh.forEach((m) => awardedRef.current.add(m.id));
    const first = !medalsLoadedRef.current;
    medalsLoadedRef.current = true;
    if (!fresh.length) return;
    const total = fresh.reduce((sum, m) => sum + m.coins, 0);
    setMedals((list) => [...list, ...fresh.map((m) => m.id).filter((id) => !list.includes(id))]);
    setCoins((c) => addCap(c, total, COIN_MAX));
    setTimeout(() => {
      play("victory");
      setMedalPop((prev) => (prev && Date.now() - prev.at < 1500
        ? { ...prev, list: [...prev.list, ...fresh], coins: prev.coins + total }
        : { list: fresh, coins: total, catchUp: first && fresh.length > 1, at: Date.now() }));
    }, first ? 900 : 700);
  }); // eslint-disable-line
  useEffect(() => {
    if (!medalPop) return;
    const t = setTimeout(() => setMedalPop(null), medalPop.list.length > 1 ? 5200 : 3600);
    return () => clearTimeout(t);
  }, [medalPop]);

  // Returns "team" if added to active team, else "box". Always records the species.
  const handleCatch = useCallback((mon) => {
    markCaught(mon.species);
    const dest = appTeamRef.current.length < TEAM_MAX ? "team" : "box";
    // update the refs straight away so a second arrival in the same moment sees the new count
    if (dest === "team") { appTeamRef.current = [...appTeamRef.current, mon]; setTeam((t) => (t.length < TEAM_MAX ? [...t, mon] : t)); }
    if (dest === "box") {
      if (boxRef.current.length >= BOX_STORE_MAX) return "full"; // never store more than a save can hold
      boxRef.current = [...boxRef.current, mon]; setBox((b) => (b.length < BOX_STORE_MAX ? [...b, mon] : b));
    }
    return dest;
  }, [markCaught]);

  // Move a boxed creature into an empty team slot (team < 4)
  const boxToTeam = useCallback((boxIdx) => {
    setBox((b) => {
      const mon = b[boxIdx];
      if (!mon || appTeamRef.current.length >= 4) return b;
      setTeam((t) => (t.length < 4 ? [...t, mon] : t));
      return b.filter((_, i) => i !== boxIdx);
    });
  }, []);

  // Swap a specific team member with a specific box member
  const swapTeamBox = useCallback((teamIdx, boxIdx) => {
    setTeam((t) => {
      const tMon = t[teamIdx];
      const bMon = boxRef.current[boxIdx];
      if (!tMon || !bMon) return t;
      setBox((b) => { const nb = [...b]; nb[boxIdx] = tMon; return nb; });
      const nt = [...t]; nt[teamIdx] = bMon; return nt;
    });
  }, []);

  // Send a team member to the box (only if more than 1 remains in team)
  const teamToBox = useCallback((teamIdx) => {
    setTeam((t) => {
      if (t.length <= 1) return t;
      setBox((b) => [...b, t[teamIdx]]);
      return t.filter((_, i) => i !== teamIdx);
    });
  }, []);

  const avgLevel = team.length
    ? Math.round(team.reduce((s, m) => s + m.level, 0) / team.length)
    : 3;
  const topLevel = team.length
    ? Math.max(...team.map((m) => m.level))
    : 3;

  // PokeJosh gift: fires after Badge 1 (also covers saves that earned it earlier)
  useEffect(() => {
    if (screen === "world" && badge1 && !caught.pokejosh) {
      const gift = makeMon("pokejosh", Math.max(4, avgLevel));
      const dest = handleCatch(gift);
      play("caught");
      showToast(dest === "team"
        ? "✨ A mysterious Mathimal appears... PokeJosh joined your team!"
        : "✨ A mysterious Mathimal appears... PokeJosh was sent to your Box!", 4200);
    }
  }, [screen, badge1, caught, avgLevel, handleCatch, showToast]);

  // Auto-save (standalone/local builds; silently unavailable in the sandboxed artifact)
  useEffect(() => {
    if (!HAS_STORAGE) return;
    if (screen === "title" || screen === "starter") return;
    if (!team.length || frozenRef.current) return;
    const delay = flushNowRef.current ? 0 : 800; // trades, gifts and rewards save at once
    flushNowRef.current = false;
    const id = setTimeout(() => {
      if (frozenRef.current) return;
      const st = { v: 2, ...durableState() };
      const ok = writeAutoSave(st);
      setSaveFailed(!ok);
      if (ok) { pushRing(st); setLastSavedAt(Date.now()); }
      sendQueuedAcks(); // confirmations go out only after the change is stored
    }, delay);
    return () => clearTimeout(id);
  }, [screen, team, box, coins, inv, badge1, badge2, champion, rivalStage, seen, caught, towerBest, tables, skill, redeemed, resources, eggs, luckyWins, xpShare, ownedOutfits, outfit, topicBadges, topicProgress, feats, medals, playerName, qmode, gkCorrect, txLog, pendingTx, duelRec]);

  // Everything that makes up an adventure — used for auto-save AND save codes.
  function durableState() {
    return { team, box, coins, inv, badge1, badge2, champion, rivalStage, seen, caught, towerBest, tables, skill, redeemed, resources, eggs, luckyWins, xpShare, ownedOutfits, outfit, topicBadges, topicProgress, feats, medals, playerName, qmode, gkCorrect, txLog, pendingTx, duelRec };
  }

  // Apply a state that has ALREADY passed validateState().
  function applyState(st) {
    claimSlot();
    setTeam(st.team); setBox(st.box); setCoins(st.coins); setInv(st.inv);
    setResources(st.resources); setEggs(st.eggs); setLuckyWins(st.luckyWins); setXpShare(st.xpShare);
    setOwnedOutfits(st.ownedOutfits); setOutfit(st.outfit);
    setBadge1(st.badge1); setBadge2(st.badge2); setChampion(st.champion); setRivalStage(st.rivalStage);
    setSeen(st.seen); setCaught(st.caught); setTowerBest(st.towerBest); setTables(st.tables);
    setSkill(st.skill); setRedeemed(st.redeemed);
    setPlayerName(st.playerName || DEFAULT_NAME); setQmode(st.qmode || "maths"); setGkCorrect(st.gkCorrect || 0);
    txLogRef.current = st.txLog || []; setTxLog(st.txLog || []);
    pendingRef.current = st.pendingTx || []; setPendingTx(st.pendingTx || []);
    setTopicBadges(st.topicBadges || {}); setTopicProgress(st.topicProgress || {});
    setDuelRec(st.duelRec || { w: 0, l: 0, s: 0 });
    setFeats(st.feats || {}); setMedals(st.medals || []); medalsLoadedRef.current = false; awardedRef.current = new Set(st.medals || []);
    setLegendAwake(false);
    setRegion(0); setPos({ x: 10, y: 12 }); setSteps(0);
    play("caught");
    setScreen("world");
    if (st.healed) setTimeout(() => showToast("💗 Your team was resting — everyone is healed and ready!", 3500), 300);
  }

  function restoreAutoSave() {
    if (!autoSnap) return;
    claimSlot();
    // give an older tab a moment to save its latest progress, then load the freshest copy
    setTimeout(() => applyState(readAutoSave() || autoSnap), 250);
  }

  function restorePrevious() {
    if (!backupSnap) return;
    backupAutoSave(); // the adventure being replaced becomes the new "previous" one
    applyState(backupSnap);
  }

  function redeemCode() {
    const entry = codeInput.trim().toUpperCase();
    if (!entry) return;
    const eh = rewardHash(entry);
    const found = REWARD_CODES.find((c) => c.h === eh);
    if (!found) { setCodeMsg({ ok: false, text: "Hmm, that's not a secret code..." }); play("wrong"); return; }
    if (redeemed.includes(found.code)) { setCodeMsg({ ok: false, text: "That code has already been used!" }); play("wrong"); return; }
    const gifts = {
      addCoins: (n) => setCoins((c) => addCap(c, n, COIN_MAX)),
      addItems: (items) => setInv((v) => {
        const nv = { ...v };
        Object.entries(items).forEach(([k, n]) => { nv[k] = addCap(nv[k], n, ITEM_MAX); });
        return nv;
      }),
      giftShiny: () => {
        const sp = pick(REGULAR_SPECIES);
        const mon = makeMon(sp, Math.max(3, avgLevel), true);
        const dest = handleCatch(mon);
        showToast(`✨ A SHINY ${DEX[sp].name} appeared${dest === "team" ? " and joined your team" : " — sent to your Box"}!`, 3800);
      },
    };
    found.apply(gifts);
    setRedeemed((r) => [...r, found.code]);
    setCodeMsg({ ok: true, text: `🎉 Code accepted: ${found.label}!` });
    setCodeInput("");
    play("caught");
  }

  /* ---- Mining ---- */
  const RES_META = {
    wood: { emoji: "🪵", name: "Wood" },
    ore: { emoji: "🪨", name: "Iron Ore" },
    crystal: { emoji: "💎", name: "Ice Crystal" },
  };

  function answerMine() {
    const mp = minePrompt;
    if (!mp || mp.input === "") return;
    const correct = Number(mp.input) === mp.q.answer;
    recordStat(mp.q.op, correct, 10);
    if (correct && mp.q.table) handleTableProgress(mp.q.table);
    if (correct) {
      const amount = ri(1, 2);
      play("coin");
      setResources((r) => ({ ...r, [mp.kind]: addCap(r[mp.kind], amount, RES_MAX) }));
      bumpFeat("mined");
      minedRef.current[mp.key] = steps;
      setMinePrompt(null);
      showToast(`⛏ Mined ${amount}× ${RES_META[mp.kind].emoji} ${RES_META[mp.kind].name}!`);
    } else {
      play("wrong");
      setMinePrompt({ ...mp, q: genQuestion(skill), input: "", msg: `Not quite — it was ${mp.q.answer}. The ${RES_META[mp.kind].name.toLowerCase()} resisted! Try again:` });
    }
  }

  /* ---- Crafting ---- */
  const RECIPES = [
    { id: "potion", name: "🧪 Potion", cost: { wood: 3 }, give: { potion: 1 }, note: "+25 HP" },
    { id: "greatball", name: "◍ Great Ball", cost: { wood: 2, ore: 2 }, give: { greatball: 1 }, note: "+25% catch" },
    { id: "duskball", name: "🌙 Dusk Ball", cost: { wood: 2, ore: 1 }, give: { duskball: 1 }, note: "amazing at NIGHT" },
    { id: "netball", name: "🕸 Net Ball", cost: { wood: 3, ore: 1 }, give: { netball: 1 }, note: "great vs water & ice" },
    { id: "timerball", name: "⏱ Timer Ball", cost: { wood: 1, ore: 3 }, give: { timerball: 1 }, note: "stronger each turn" },
    { id: "healball", name: "💗 Heal Ball", cost: { wood: 2, crystal: 2 }, give: { healball: 1 }, note: "catch + full heal" },
    { id: "superpotion", name: "⚗ Super Potion", cost: { ore: 2, crystal: 2 }, give: { superpotion: 1 }, note: "full HP" },
    { id: "megaball", name: "◎ MEGA BALL", cost: { wood: 2, ore: 4, crystal: 4 }, give: { megaball: 1 }, note: "NEVER fails!" },
  ];

  function canCraft(rec) {
    return Object.entries(rec.cost).every(([k, n]) => (resources[k] || 0) >= n);
  }

  function craft(rec) {
    if (!canCraft(rec)) return;
    setResources((r) => {
      const nr = { ...r };
      Object.entries(rec.cost).forEach(([k, n]) => { nr[k] -= n; });
      return nr;
    });
    setInv((v) => {
      const nv = { ...v };
      Object.entries(rec.give).forEach(([k, n]) => { nv[k] = addCap(nv[k], n, ITEM_MAX); });
      return nv;
    });
    play("levelup");
    bumpFeat("crafted");
    showToast(`🔨 Crafted ${rec.name}!`);
  }

  useEffect(() => {
    if (riding && !team.some((m) => m.id === riding)) setRiding(null);
  }, [riding, team]);

  // Mystery Eggs count down as you walk, then hatch — favouring species you haven't caught yet
  const lastStepRef = useRef(steps);
  useEffect(() => {
    if (steps === lastStepRef.current) return;
    lastStepRef.current = steps;
    if (!eggs.length) return;
    // only hatch as many eggs as there is room for; the rest wait at 1 step
    const room = Math.max(0, TEAM_MAX - appTeamRef.current.length) + Math.max(0, BOX_MAX - boxRef.current.length);
    let ready = 0;
    const left = eggs.map((n) => {
      const next = n - 1;
      if (next > 0) return next;
      if (ready < room) { ready++; return 0; }
      return 1;
    });
    const hatching = ready;
    if (left.some((n, k) => n === 1 && eggs[k] === 1)) showToast(`🥚 An egg is ready, but your Team and Box are full (${BOX_MAX} in the Box!) — it will wait in your bag.`, 3800);
    setEggs(left.filter((n) => n > 0));
    for (let h = 0; h < hatching; h++) {
      const missing = REGULAR_SPECIES.filter((sp) => !caught[sp]);
      const sp = missing.length && Math.random() < 0.5 ? pick(missing) : pick(REGULAR_SPECIES);
      const shiny = Math.random() < 0.1;
      const mon = makeMon(sp, Math.max(3, avgLevel - 2), shiny);
      const dest = handleCatch(mon);
      play("sparkle");
      showToast(`🥚 Your egg hatched into ${shiny ? "a SHINY " : ""}${DEX[sp].name}!${dest === "box" ? " (sent to Box)" : ""}`, 4000);
    }
  }, [steps]); // eslint-disable-line

  const activeRivalSpot = (() => {
    if (rivalStage === 0) return RIVAL_SPOTS[0];
    if (rivalStage === 1 && badge1) return RIVAL_SPOTS[1];
    if (rivalStage >= 2 && badge2 && steps >= rivalCooldownRef.current) return RIVAL_SPOTS[2];
    return null;
  })();

  function startWild() {
    let sp, lvl, shiny, rarity = "common";
    if (legendAwake && !caught.aurion && Math.random() < 0.08) {
      sp = "aurion";
      lvl = avgLevel + 4;
      shiny = false;
      rarity = "rare";
    } else {
      const roll = rollWild(region, night);
      sp = roll.species;
      rarity = roll.rarity;
      // rarer finds run a little stronger
      const rareBump = rarity === "rare" ? 2 : rarity === "uncommon" ? 1 : 0;
      lvl = Math.max(1, avgLevel + ri(-1, 1) + region + rareBump);
      shiny = Math.random() < 0.05;
    }
    markSeen(sp);
    setBattleConfig({
      enemies: [makeMon(sp, lvl, shiny)], kind: "wild", trainerName: "",
      rarity, battleId: nextBattleId(),
    });
    setScreen("battle");
  }

  function startGym(which) {
    let enemies;
    if (which === "gym1") {
      const bump = badge1 ? 3 : 0;
      enemies = [makeMon("rockle", topLevel + 1 + bump), makeMon("drakelet", topLevel + 2 + bump)];
    } else {
      const bump = badge2 ? 3 : 0;
      enemies = [
        makeMon("magmite", topLevel + 1 + bump),
        makeMon("crystix", topLevel + 2 + bump),
        makeMon("drakelet", topLevel + 3 + bump),
      ];
    }
    setBattleConfig({
      enemies, kind: which,
      trainerName: which === "gym1" ? "Professor Prime" : "Captain Magna",
      battleId: nextBattleId(),
    });
    setGymPrompt(null);
    setScreen("battle");
  }

  function startTopicGym(topicId) {
    const tp = TOPICS.find((t) => t.id === topicId);
    const bump = topicBadges[topicId] ? 3 : 0;
    const enemies = tp.team.map(([sp, plus]) => makeMon(sp, Math.max(2, topLevel + plus + bump)));
    setBattleConfig({ enemies, kind: "topic", topic: topicId, trainerName: tp.leader, battleId: nextBattleId() });
    setTopicPrompt(null);
    setScreen("battle");
  }

  function startRival() {
    let enemies;
    if (rivalStage === 0) enemies = [makeMon("sparkit", Math.max(2, topLevel))];
    else if (rivalStage === 1) enemies = [makeMon("wispur", topLevel), makeMon("drakelet", topLevel + 1)];
    else enemies = [makeMon("sparkit", topLevel + 2), makeMon("crystix", topLevel + 2), makeMon("drakelet", topLevel + 3)];
    setBattleConfig({ enemies, kind: "rival", trainerName: "Rival Max", battleId: nextBattleId() });
    setRivalPrompt(false);
    setScreen("battle");
  }

  const ELITE = [
    { kind: "elite1", name: "Elite Frost", sprite: "elite1",
      team: [["glacior", 2], ["frostpup", 3]] },
    { kind: "elite2", name: "Elite Shade", sprite: "elite2",
      team: [["wispur", 3], ["batvolt", 3]] },
    { kind: "elite3", name: "Elite Blaze", sprite: "elite3",
      team: [["magmite", 3], ["embercub", 4]] },
    { kind: "grandmaster", name: "Grandmaster Aria", sprite: "grandmaster",
      team: [["yetai", 4], ["drakelet", 4], ["glacior", 5]] },
  ];

  function startElite(stageIdx) {
    const cfg = ELITE[stageIdx];
    if (!cfg) { setScreen("world"); return; } // safety: never crash on bad index
    const bump = champion ? 4 : 0;
    const enemies = cfg.team.map(([sp, plus]) => makeMon(sp, topLevel + plus + bump));
    setBattleConfig({
      enemies, kind: cfg.kind, trainerName: cfg.name,
      eliteStage: stageIdx,
      battleId: nextBattleId(),
    });
    setElitePrompt(false);
    setScreen("battle");
  }

  const TOWER_NAMES = ["Kai", "Aroha", "Nikau", "Mia", "Tane", "Ruby", "Leo", "Zoe", "Ari", "Pip"];

  function startTower(floor) {
    const count = floor <= 2 ? 1 : floor <= 5 ? 2 : 3;
    const lvl = Math.min(70, topLevel + Math.floor(floor / 2) + Math.max(0, floor - 5));
    const enemies = Array.from({ length: count }, () =>
      makeMon(pick(REGULAR_SPECIES), Math.max(1, lvl + ri(-1, 1)))
    );
    setBattleConfig({
      enemies, kind: "tower",
      trainerName: `Trainer ${pick(TOWER_NAMES)} (Floor ${floor})`,
      towerFloor: floor,
      battleId: nextBattleId(),
    });
    setTowerPrompt(null);
    setScreen("battle");
  }


  /* ================= Playing together (two laptops) ================= */
  const roomRef = useRef(null);
  const [netOpen, setNetOpen] = useState(false);
  const [netStatus, setNetStatus] = useState(null); // { s, detail }
  const [roomInfo, setRoomInfo] = useState(null); // { role, code }
  const [joinDraft, setJoinDraft] = useState("");
  const [partner, setPartner] = useState(null); // what the other laptop last told us
  const [emotes, setEmotes] = useState({}); // { me: {e, at}, partner: {e, at} }
  const [emoteBar, setEmoteBar] = useState(false);
  const [trade, setTrade] = useState(null); // { mine: id|null, theirs: mon|null, myOk, theirOk }
  const [giftOpen, setGiftOpen] = useState(false);
  const [coopInvite, setCoopInvite] = useState(null); // an invite from the partner, waiting for an answer
  const [duelSetup, setDuelSetup] = useState(null); // picking a duel team: { mode: "send" | "answer", id, hc, theirs, picks }
  const [duelWait, setDuelWait] = useState(null); // the challenge I sent: { id, hc, picks }
  const [duelCfg, setDuelCfg] = useState(null); // the duel being played
  const duelIdRef = useRef(null);
  const duelMsgRef = useRef(null);
  const duelHandlerRef = useRef(null);
  const netHandlerRef = useRef(() => {});
  const connected = !!(netStatus && netStatus.s === "connected");
  const dropOutRef = useRef(null); // test hook: simulate a message lost on the way out
  const netSend = (m) => {
    if (dropOutRef.current && dropOutRef.current(m)) return;
    if (roomRef.current && roomRef.current.open) roomRef.current.send(m);
  };
  const partnerTag = partner && partner.name ? titleCase(partner.name) : "Your partner";
  // Trades, gifts and battles only once both laptops have confirmed they speak the same version
  const partnerOk = connected && !!partner && !partner.gone && partner.compat === true;
  // the same check for message handlers, read live (two messages can arrive before React re-renders)
  const compatRef = useRef(false);
  const partnerOkNow = () => !!(roomRef.current && roomRef.current.open && compatRef.current);

  function startRoom(role, code) {
    if (roomRef.current) roomRef.current.close();
    compatRef.current = false;
    setPartner(null); setTrade(null);
    const info = { role, code };
    setRoomInfo(info);
    roomRef.current = openRoom({
      role, code,
      onMsg: (m) => netHandlerRef.current(m),
      onStatus: (st, detail) => {
        setNetStatus({ s: st, detail });
        if (st === "connected") { helloSentRef.current = true; helloRepliedRef.current = false; helloAskedRef.current = 0; netHelloRef.current(); play("victory"); } // hello is always the first message
        if (st === "lost" || st === "waiting") {
          compatRef.current = false; setPartner((p) => (p ? { ...p, gone: true } : p)); setTrade(null); }
      },
    });
  }
  function leaveRoom() {
    if (roomRef.current) roomRef.current.close();
    roomRef.current = null;
    setRoomInfo(null); setNetStatus(null); setPartner(null); setTrade(null); setEmoteBar(false); setGiftOpen(false);
  }
  useEffect(() => () => { if (roomRef.current) roomRef.current.close(); }, []);
  leaveRoomRef.current = leaveRoom;

  // What we tell the other laptop about ourselves
  const mountMon = riding ? team.find((m) => m.id === riding) : null;
  const presence = () => ({
    t: "pos", name: playerName, outfit, qmode, region, x: pos.x, y: pos.y, facing,
    mount: mountMon ? monVisual(mountMon) : null, scr: screen === "battle" || screen === "duel" ? "battle" : "world",
    lead: team[0] ? { species: team[0].species, level: team[0].level } : null,
  });
  const netHelloRef = useRef(() => {});
  const helloSentRef = useRef(false);
  const helloRepliedRef = useRef(false); // answered the partner's first hello with ours (covers a hello lost while linking)
  const helloAskedRef = useRef(0); // when we last asked for a hello we never got
  // presence first, so "hello" is the type that survives (it carries the version check)
  netHelloRef.current = () => netSend({ ...presence(), t: "hello", proto: NET_PROTOCOL, ver: GAME_VERSION });
  useEffect(() => {
    if (connected && helloSentRef.current) netSend(presence());
  }, [connected, region, pos.x, pos.y, facing, riding, outfit, screen, playerName, qmode]); // eslint-disable-line

  function sendEmote(e) {
    const at = Date.now();
    setEmotes((x) => ({ ...x, me: { e, at } }));
    netSend({ t: "emote", e });
    setEmoteBar(false);
  }
  useEffect(() => {
    if (!emotes.me && !emotes.partner) return;
    const id = setTimeout(() => setEmotes((x) => {
      const now = Date.now(), out = {};
      Object.entries(x).forEach(([k, v]) => { if (v && now - v.at < 3200) out[k] = v; });
      return out;
    }), 3300);
    return () => clearTimeout(id);
  }, [emotes]);

  const regionOpen = (r) => r === 0 || (r === 1 && badge1) || (r === 2 && badge1 && badge2 && caughtCount >= SPECIES_TO_CATCH);
  function goToPartner() {
    if (!partner || partner.gone) return;
    if (partner.scr === "battle") { showToast(`${partnerTag} is in a battle — wait a moment!`); return; }
    if (!regionOpen(partner.region)) { showToast(`🔒 ${partnerTag} is in the ${REGION_NAMES[partner.region]}, which you haven't unlocked yet.`, 3200); return; }
    const map = MAPS[partner.region];
    const plain = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !SOLID.has(map[y][x]) && !"HDEQVMKYOU><}{$@%#".includes(map[y][x]);
    const spots = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
    const hit = spots.map(([dx, dy]) => [partner.x + dx, partner.y + dy]).find(([x, y]) => plain(x, y));
    const [tx, ty] = hit || [partner.x, partner.y];
    setRiding(null);
    setRegion(partner.region); setPos({ x: tx, y: ty });
    play("sparkle");
    showToast(`🧭 Whoosh! You found ${partnerTag}!`);
  }

  /* ---- Transactions between the laptops (trades and gifts) ----
     Every transaction has an ID. Anything still in flight is kept IN THE SAVE
     (pendingTx), and IDs already applied are remembered (txLog), so:
       · a message lost to a dropped link is simply sent again on the next link-up,
       · a repeated message is recognised and never applied twice,
       · nobody confirms a transaction until it is safely saved on their laptop. */
  const txLogRef = useRef(txLog);
  const pendingRef = useRef(pendingTx);
  useEffect(() => { txLogRef.current = txLog; }, [txLog]);
  useEffect(() => { pendingRef.current = pendingTx; }, [pendingTx]);
  const ackQueueRef = useRef([]);
  const newTxId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const logTx = (id) => { const nl = [id, ...txLogRef.current.filter((x) => x !== id)].slice(0, TX_LOG_MAX); txLogRef.current = nl; setTxLog(nl); };
  const addPending = (rec) => { const np = [...pendingRef.current, rec].slice(-TX_PENDING_MAX); pendingRef.current = np; setPendingTx(np); };
  const dropPending = (id) => { const np = pendingRef.current.filter((r) => r.id !== id); pendingRef.current = np; setPendingTx(np); };
  // Confirm only once the change has reached storage (sent from the auto-save effect)
  function ackAfterSave(msg) {
    flushNowRef.current = true;
    if (!HAS_STORAGE) { netSend(msg); return; }
    ackQueueRef.current.push(msg);
  }
  function sendQueuedAcks() {
    const q = ackQueueRef.current;
    ackQueueRef.current = [];
    q.forEach((m) => netSend(m));
  }
  // On every link-up: send again anything the other laptop never confirmed
  function resendPending(partnerName) {
    pendingRef.current.forEach((r) => {
      if (r.to && partnerName && r.to !== partnerName) return; // only to the same partner
      if (r.k === "trade") {
        const own = findOwn(r.giveId);
        if (own && own.mon.species === r.giveSpecies) netSend({ t: "tradeCommit", id: r.id, give: monWire(own.mon), takeId: r.takeId, takeSpecies: r.takeSpecies });
      } else if (r.k === "gift") {
        netSend({ t: "gift", id: r.id, coins: r.coins, items: r.items });
      }
    });
  }

  // While linked, keep re-sending anything unconfirmed every few seconds (a lost confirmation is harmless: repeats are ignored)
  useEffect(() => {
    if (!partnerOk || !pendingTx.length) return undefined;
    const id = setInterval(() => resendPending(partner ? partner.name : ""), 4000);
    return () => clearInterval(id);
  }, [partnerOk, pendingTx.length]); // eslint-disable-line

  /* ---- Trading: one Mathimal each. The HOST laptop makes the final call. ---- */
  const tradeFp = (mineSig, theirSig) => mineSig + "|" + theirSig;
  const findOwn = (id) => {
    const ti = appTeamRef.current.findIndex((m) => m.id === id);
    if (ti >= 0) return { where: "team", idx: ti, mon: appTeamRef.current[ti] };
    const bi = boxRef.current.findIndex((m) => m.id === id);
    if (bi >= 0) return { where: "box", idx: bi, mon: boxRef.current[bi] };
    return null;
  };
  const lockedIds = new Set(pendingTx.filter((r) => r.k === "trade").map((r) => r.giveId));
  function openTrade() {
    if (!connected || !partnerOk) return;
    setTrade({ mine: null, theirs: null, myOk: false, theirOk: false });
    netSend({ t: "tradeOpen" });
  }
  function offerTrade(id) {
    if (id && lockedIds.has(id)) return;
    const own = id ? findOwn(id) : null;
    setTrade((tr) => tr && !tr.myOk ? { ...tr, mine: own ? id : null, myOk: false, theirOk: false } : tr);
    netSend({ t: "tradeOffer", mon: own ? monWire(own.mon) : null });
  }
  function acceptTrade() {
    if (!trade || !trade.mine || !trade.theirs || trade.finishing) return;
    const own = findOwn(trade.mine);
    if (!own) return;
    const fp = tradeFp(monSig(own.mon), monSig(trade.theirs));
    const next = { ...trade, myOk: fp };
    setTrade(next);
    netSend({ t: "tradeOk", fp });
    if (roomInfo && roomInfo.role === "host") maybeCommitTrade(next);
  }
  function cancelTrade(silent) {
    if (trade && trade.finishing) return; // already committed: it will finish (or be resent) by itself
    setTrade(null);
    if (!silent) netSend({ t: "tradeCancel" });
  }
  function maybeCommitTrade(tr) {
    if (!tr || tr.finishing || !tr.myOk || !tr.theirOk || !tr.mine || !tr.theirs) return;
    const own = findOwn(tr.mine);
    if (!own) return;
    const mineSig = monSig(own.mon), theirSig = monSig(tr.theirs);
    // the guest's fingerprint is written from ITS side: theirs|mine
    if (tr.myOk !== tradeFp(mineSig, theirSig) || tr.theirOk !== tradeFp(theirSig, mineSig)) return;
    const id = newTxId();
    // 1) remember the trade in our save, 2) ask the guest to apply it; we swap only when they confirm
    addPending({ k: "trade", id, to: partner ? partner.name : "", giveId: own.mon.id, giveSpecies: own.mon.species, takeId: tr.theirs.id, takeSpecies: tr.theirs.species, take: tr.theirs });
    flushNowRef.current = true;
    setTrade({ ...tr, finishing: true });
    netSend({ t: "tradeCommit", id, give: monWire(own.mon), takeId: tr.theirs.id, takeSpecies: tr.theirs.species });
  }
  // Swap one of our Mathimals for an incoming one. Returns true if it happened.
  function completeSwap(own, incoming, txId) {
    const used = new Set([...appTeamRef.current, ...boxRef.current].map((m) => m.id).filter((id) => id !== own.mon.id));
    const raw = { ...incoming }; delete raw.id;
    const mon = cleanMon(raw, used);
    if (!mon) { setTrade(null); showToast("That trade didn't work — nothing changed."); return false; }
    let evolvedMsg = "";
    if (!mon.evolved) {
      const before = mon.name;
      applyEvolution(mon);
      evolvedMsg = ` ✨ TRADE EVOLUTION! ${before} evolved into ${mon.name}!`;
    }
    mon.hp = mon.maxHp;
    if (riding === own.mon.id) setRiding(null);
    if (own.where === "team") {
      const nt = appTeamRef.current.map((m, i) => (i === own.idx ? mon : m));
      appTeamRef.current = nt; setTeam(nt);
    } else {
      const nb = boxRef.current.map((m, i) => (i === own.idx ? mon : m));
      boxRef.current = nb; setBox(nb);
    }
    if (txId) logTx(txId);
    flushNowRef.current = true;
    markCaught(mon.species);
    setTrade(null);
    play(evolvedMsg ? "levelup" : "caught");
    showToast(`🔁 Trade done! ${displayName(own.mon)} went to ${partnerTag}, and ${displayName(mon)} arrived!${evolvedMsg}`, 5200);
    return true;
  }

  /* ---- Gifts: paid for up front, delivered (and re-delivered) until confirmed ---- */
  function sendGift(g) {
    if (!connected || !partnerOk) return;
    // read the live balances (refs), not this render's copy, so two quick clicks can't overspend
    if (g.coins && coinsRef.current < g.coins) return;
    if (g.items && Object.entries(g.items).some(([k, n]) => (invRef.current[k] || 0) < n)) return;
    if (g.coins) { coinsRef.current -= g.coins; setCoins((c) => Math.max(0, c - g.coins)); }
    if (g.items) {
      const ni = { ...invRef.current };
      Object.entries(g.items).forEach(([k, n]) => { ni[k] -= n; });
      invRef.current = ni;
      setInv((v) => { const nv = { ...v }; Object.entries(g.items).forEach(([k, n]) => { nv[k] = Math.max(0, (nv[k] || 0) - n); }); return nv; });
    }
    const id = newTxId();
    const rec = { k: "gift", id, to: partner ? partner.name : "", coins: g.coins || 0, items: g.items || {} };
    addPending(rec);
    flushNowRef.current = true;
    netSend({ t: "gift", id, coins: rec.coins, items: rec.items });
    play("select");
    showToast(`🎁 You sent ${partnerTag} ${g.label.replace(/^\S+ /, "")}!`);
  }

  // Every message from the other laptop lands here (re-bound each render, so state is fresh)
  netHandlerRef.current = (m) => {
    if (typeof window !== "undefined" && window.__mqTrace) window.__mqTrace.push(m.t + (m.id ? ":" + m.id : ""));
    switch (m.t) {
      case "hello":
        if (m.proto !== NET_PROTOCOL) showToast("⚠ The two laptops are on different versions of the game. Walking about works, but trades, gifts and battles are switched off until both use the same file.", 6500);
        // falls through
      case "pos": {
        const r = clampInt(m.region, 0, 2, 0);
        const compat = m.t === "hello" ? m.proto === NET_PROTOCOL : null; // a position update keeps what "hello" decided
        const wasOk = compatRef.current;
        if (compat !== null) compatRef.current = compat;
        if (m.t === "hello" && !helloRepliedRef.current) { helloRepliedRef.current = true; netHelloRef.current(); }
        if (m.t === "pos" && !compatRef.current && Date.now() - helloAskedRef.current > 2000) { helloAskedRef.current = Date.now(); netSend({ t: "helloReq" }); }
        setPartner((prev) => ({
          compat: compat !== null ? compat : !!(prev && !prev.gone && prev.compat),
          name: cleanName(m.name), outfit: OUTFITS.some((o) => o.id === m.outfit) ? m.outfit : "classic",
          qmode: m.qmode === "gk" ? "gk" : "maths", region: r,
          x: clampInt(m.x, 0, COLS - 1, 0), y: clampInt(m.y, 0, ROWS - 1, 0), facing: m.facing === -1 ? -1 : 1,
          mount: m.mount && SPRITES[m.mount.sprite] ? m.mount : null, scr: m.scr === "battle" ? "battle" : "world",
          lead: m.lead && DEX[m.lead.species] ? m.lead : null, gone: false,
        }));
        if (m.t === "hello") {
          if (compat && !wasOk) showToast(`👥 ${titleCase(cleanName(m.name))} joined your world!`, 3000);
          if (compat) setTimeout(() => resendPending(cleanName(m.name)), 300);
        }
        break;
      }
      case "emote":
        if (EMOTES.includes(m.e)) { setEmotes((x) => ({ ...x, partner: { e: m.e, at: Date.now() } })); play("select"); }
        break;
      case "full":
        showToast("That game already has two players.", 3500);
        leaveRoom();
        break;
      case "tradeOpen":
        setTrade((tr) => tr || { mine: null, theirs: null, myOk: false, theirOk: false });
        play("select");
        break;
      case "tradeOffer": {
        const incoming = m.mon && DEX[m.mon.species] ? m.mon : null;
        setTrade((tr) => ({ ...(tr || { mine: null }), theirs: incoming, myOk: false, theirOk: false }));
        break;
      }
      case "tradeOk": {
        if (typeof m.fp !== "string") break;
        const next = trade ? { ...trade, theirOk: m.fp } : null;
        setTrade(next);
        if (next && roomInfo && roomInfo.role === "host") maybeCommitTrade(next);
        break;
      }
      case "tradeCommit": {
        if (!partnerOkNow() || typeof m.id !== "string" || m.id.length > 24) break;
        if (txLogRef.current.includes(m.id)) { // already done: confirm again (unless that confirmation is still waiting on the save)
          if (!ackQueueRef.current.some((q) => q.id === m.id)) netSend({ t: "tradeAck", id: m.id, ok: true });
          break;
        }
        const own = isInt(m.takeId) ? findOwn(m.takeId) : null;
        if (!own || own.mon.species !== m.takeSpecies || !m.give || !DEX[m.give.species]) { netSend({ t: "tradeAck", id: m.id, ok: false }); setTrade(null); break; }
        const given = monWire(own.mon);
        if (completeSwap(own, m.give, m.id)) ackAfterSave({ t: "tradeAck", id: m.id, ok: true, mon: given });
        else netSend({ t: "tradeAck", id: m.id, ok: false });
        break;
      }
      case "tradeAck": {
        const rec = pendingRef.current.find((r) => r.id === m.id && r.k === "trade");
        if (!rec) break; // unknown or already finished
        if (!m.ok) { dropPending(rec.id); setTrade(null); showToast("That trade couldn't finish — nothing changed on either side."); break; }
        const own = findOwn(rec.giveId);
        const incoming = m.mon && DEX[m.mon.species] && m.mon.species === rec.takeSpecies ? m.mon : rec.take;
        dropPending(rec.id);
        if (own && own.mon.species === rec.giveSpecies) completeSwap(own, incoming, rec.id);
        break;
      }
      case "helloReq":
        netHelloRef.current();
        break;
      case "giftAck":
        if (pendingRef.current.some((r) => r.id === m.id && r.k === "gift")) { dropPending(m.id); flushNowRef.current = true; }
        break;
      case "tradeCancel":
        if (trade && trade.finishing) break;
        if (trade) showToast(`${partnerTag} closed the trade.`);
        setTrade(null);
        break;
      case "gift": {
        if (!partnerOkNow() || typeof m.id !== "string" || m.id.length > 24) break;
        if (txLogRef.current.includes(m.id)) { // a repeat: confirm, don't add again
          if (!ackQueueRef.current.some((q) => q.id === m.id)) netSend({ t: "giftAck", id: m.id });
          break;
        }
        logTx(m.id);
        ackAfterSave({ t: "giftAck", id: m.id });
        const c = clampInt(m.coins, 0, 1000, 0);
        const items = {};
        if (m.items && typeof m.items === "object") ITEM_KEYS.forEach((k) => { const n = clampInt(m.items[k], 0, 10, 0); if (n) items[k] = n; });
        if (c) setCoins((x) => addCap(x, c, COIN_MAX));
        if (Object.keys(items).length) setInv((v) => { const nv = { ...v }; Object.entries(items).forEach(([k, n]) => { nv[k] = addCap(nv[k], n, ITEM_MAX); }); return nv; });
        const what = [c ? `🪙 ${c} coins` : "", ...Object.entries(items).map(([k, n]) => `${n} × ${ITEM_NAMES[k] || k}`)].filter(Boolean).join(" + ");
        if (what) { play("sparkle"); showToast(`🎁 ${partnerTag} sent you a gift: ${what}!`, 4200); }
        break;
      }
      default:
        if (coopHandlerRef.current) coopHandlerRef.current(m);
    }
  };
  const coopHandlerRef = useRef(null);
  // Test hook for the two-player tests: inject a message, drop outgoing ones, peek at the shared battle
  if (typeof window !== "undefined") window.__mqNet = { sim: (m) => netHandlerRef.current(m), dropOut: (fn) => { dropOutRef.current = fn; }, coop: () => coopAuthRef.current, pending: () => pendingRef.current, txLog: () => txLogRef.current };

  /* ---- Co-op battles & raids ----
     The player who sends the invite is the battle's "keeper": their laptop holds
     the shared enemy HP, applies both players' hits, and spots TEAM-UPs
     (both players landing a correct answer within 3 seconds of each other). */
  const coopAuthRef = useRef(null); // { id, hp, maxHp, last, seq, done, owner }
  const coopTeamupsRef = useRef(0);
  const coopAidRef = useRef(0); // numbers each of our attacks in a shared battle, so a repeat is never counted twice
  const [coopHp, setCoopHp] = useState(null);
  const [coopWait, setCoopWait] = useState(null); // the invite I sent: { id, kind }
  const [coopNote, setCoopNote] = useState(null);
  const COOP_LINK_MS = 3000;
  const RAID_MS = 180000;

  function inviteCoop(kind) {
    if (!partnerOk || screen !== "world") return;
    if (partner.scr === "battle") { showToast(`${partnerTag} is busy in a battle — try again in a moment!`); return; }
    const id = Math.random().toString(36).slice(2, 9);
    setCoopWait({ id, kind });
    netSend({ t: "coopInvite", id, kind });
    play("select");
    showToast(kind === "raid" ? `👹 Asking ${partnerTag} to join a RAID…` : `⚔ Asking ${partnerTag} for a team battle…`, 3000);
  }
  function answerInvite(yes) {
    const inv0 = coopInvite;
    setCoopInvite(null);
    if (!inv0) return;
    netSend(yes ? { t: "coopYes", id: inv0.id, avg: avgLevel } : { t: "coopNo", id: inv0.id });
    if (yes) showToast("Getting ready…", 2000);
  }
  function buildCoopEnemy(kind, partnerAvg) {
    const base = Math.max(avgLevel, clampInt(partnerAvg, 1, MAX_LEVEL, 1));
    let e;
    if (kind === "raid") {
      const sp = pick(REGULAR_SPECIES);
      e = makeMon(sp, Math.min(MAX_LEVEL, base + 3), Math.random() < 0.15);
      if (!e.evolved) applyEvolution(e);
      e.maxHp = Math.min(9999, Math.round(e.maxHp * 8));
    } else {
      const roll = rollWild(region, night);
      e = makeMon(roll.species, Math.min(MAX_LEVEL, base + 1 + region), Math.random() < 0.05);
      e.maxHp = Math.min(9999, Math.round(e.maxHp * 3.5));
    }
    e.hp = e.maxHp;
    return e;
  }
  function startCoopBattle({ id, kind, enemy, endsAt, owner }) {
    coopAuthRef.current = { id, hp: enemy.hp, maxHp: enemy.maxHp, last: {}, seq: 0, done: false, owner, lastAid: 0 };
    coopAidRef.current = 0;
    coopTeamupsRef.current = 0;
    setCoopHp({ id, hp: enemy.hp, seq: 0 });
    setCoopNote(null);
    markSeen(enemy.species);
    setTrade(null); setGiftOpen(false); setNetOpen(false); setEmoteBar(false); setCoopInvite(null); setCoopWait(null);
    setBattleConfig({
      enemies: [enemy], kind: kind === "raid" ? "raid" : "coop",
      trainerName: kind === "raid" ? "👹 RAID BOSS" : `⚔ TEAM BATTLE with ${partnerTag}`,
      coop: { id, kind, owner, endsAt: endsAt || null }, battleId: nextBattleId(),
    });
    setScreen("battle");
  }
  function applyCoopHit(who, dmg) {
    const a = coopAuthRef.current;
    if (!a || a.done) return;
    const now = Date.now();
    const other = a.last[who === "me" ? "partner" : "me"];
    let bonus = 0;
    if (other && !other.used && now - other.at <= COOP_LINK_MS) { bonus = Math.round((dmg + other.dmg) * 0.5); other.used = true; }
    a.last[who] = { at: now, dmg, used: bonus > 0 };
    a.hp = Math.max(0, a.hp - dmg - bonus);
    a.seq += 1;
    if (a.hp <= 0) a.done = true;
    if (bonus) coopTeamupsRef.current += 1;
    setCoopHp({ id: a.id, hp: a.hp, seq: a.seq, by: who, dmg, bonus });
    if (a.owner) netSend({ t: "ehp", id: a.id, hp: a.hp, seq: a.seq, by: who, dmg, bonus });
  }
  function onCoopHit(dmg) {
    const a = coopAuthRef.current;
    if (!a) return;
    const linked = roomRef.current && roomRef.current.open;
    if (a.owner || !linked) applyCoopHit("me", dmg); // lost the link? carry on solo
    else { coopAidRef.current += 1; netSend({ t: "coopHit", id: a.id, dmg, aid: coopAidRef.current }); }
  }
  useEffect(() => {
    if (screen === "battle" && battleConfig && battleConfig.coop && !connected) setCoopNote("📡 Link lost — you're battling solo now.");
  }, [connected]); // eslint-disable-line

  coopHandlerRef.current = (m) => {
    switch (m.t) {
      case "coopInvite":
        if (!partnerOkNow() || screen !== "world" || trade || coopWait || duelSetup || duelWait) { netSend({ t: "coopNo", id: m.id, busy: true }); break; }
        setCoopInvite({ id: m.id, kind: m.kind === "raid" ? "raid" : "team" });
        play("encounter");
        break;
      case "coopNo":
        if (coopWait && coopWait.id === m.id) { setCoopWait(null); showToast(m.busy ? `${partnerTag} is busy right now.` : `${partnerTag} said "not now".`); }
        break;
      case "coopCancel":
        if (coopInvite && coopInvite.id === m.id) setCoopInvite(null);
        showToast("The battle invite ran out — send a new one!");
        break;
      case "coopYes": {
        if (!coopWait || coopWait.id !== m.id || screen !== "world") { netSend({ t: "coopCancel", id: m.id }); break; }
        const enemy = buildCoopEnemy(coopWait.kind, m.avg);
        const endsIn = coopWait.kind === "raid" ? RAID_MS : 0;
        netSend({ t: "coopStart", id: m.id, kind: coopWait.kind, enemy: monWire(enemy), endsIn });
        startCoopBattle({ id: m.id, kind: coopWait.kind, enemy, endsAt: endsIn ? Date.now() + endsIn : null, owner: true });
        break;
      }
      case "coopStart": {
        if (screen !== "world" || !m.enemy || !DEX[m.enemy.species]) break;
        const raw = { ...m.enemy }; delete raw.id;
        const enemy = cleanMon(raw, new Set([...team, ...box].map((x) => x.id)));
        if (!enemy) break;
        enemy.hp = enemy.maxHp;
        const endsIn = clampInt(m.endsIn, 0, RAID_MS, 0);
        startCoopBattle({ id: String(m.id), kind: m.kind === "raid" ? "raid" : "team", enemy, endsAt: endsIn ? Date.now() + endsIn : null, owner: false });
        break;
      }
      case "coopHit": {
        const a = coopAuthRef.current;
        if (!a || !a.owner || a.id !== m.id || !isInt(m.aid) || m.aid <= a.lastAid) break; // old battle or a repeat
        a.lastAid = m.aid;
        applyCoopHit("partner", clampInt(m.dmg, 0, Math.max(1, a.maxHp), 0));
        break;
      }
      case "ehp": {
        const a = coopAuthRef.current;
        if (!a || a.owner || a.id !== m.id || !isInt(m.seq) || m.seq <= a.seq) break;
        a.hp = clampInt(m.hp, 0, 9999, 0); a.seq = m.seq;
        if (a.hp <= 0) a.done = true;
        const bonus = clampInt(m.bonus, 0, 99999, 0);
        if (bonus) coopTeamupsRef.current += 1;
        setCoopHp({ id: a.id, hp: a.hp, seq: a.seq, by: m.by === "me" ? "partner" : "me", dmg: clampInt(m.dmg, 0, 9999, 0), bonus });
        break;
      }
      case "coopLeft":
        if (screen === "battle" && battleConfig && battleConfig.coop && battleConfig.coop.id === m.id) setCoopNote(`${partnerTag} left the battle — keep going, you've got this!`);
        break;
      default:
        if (duelHandlerRef.current) duelHandlerRef.current(m);
    }
  };

  // Partner-panel buttons for battling together
  const coopUi = () => (
    <>
      <button data-testid="team-btn" disabled={!!coopWait || !!duelWait || !partnerOk} onClick={() => inviteCoop("team")} style={hudBtn}>⚔ TEAM</button>
      <button data-testid="raid-btn" disabled={!!coopWait || !!duelWait || !partnerOk} onClick={() => inviteCoop("raid")} style={hudBtn}>👹 RAID</button>
      <button data-testid="duel-btn" disabled={!!coopWait || !!duelWait || !partnerOk} onClick={openDuelSetup} style={hudBtn}>{duelWait ? "🤺 WAITING…" : "🤺 DUEL"}</button>
    </>
  );
  // An unanswered invite times out after 20 s
  useEffect(() => {
    if (!coopWait) return;
    const t = setTimeout(() => { setCoopWait(null); netSend({ t: "coopCancel", id: coopWait.id }); showToast(`No answer from ${partnerTag} — try again!`); }, 20000);
    return () => clearTimeout(t);
  }, [coopWait]); // eslint-disable-line

  /* ---- Duels (v5.2): player against player ----
     The challenger is the referee ("host"). Both pick up to three Mathimals; the duel
     uses level-matched copies, so nothing on either real team is hurt or used up. */
  const duelWirePicks = (ids) => duelWire(ids.map((pid) => team.find((m) => m.id === pid)).filter(Boolean));
  function openDuelSetup() {
    if (!partnerOk || screen !== "world" || duelWait || coopWait) return;
    if (partner.scr === "battle") { showToast(`${partnerTag} is busy in a battle — try again in a moment!`); return; }
    play("select");
    setDuelSetup({ mode: "send", id: null, hc: 0, theirs: null, picks: team.slice(0, DUEL_SIZE).map((m) => m.id) });
  }
  function closeDuelSetup() {
    const s = duelSetup;
    setDuelSetup(null);
    if (s && s.mode === "answer") netSend({ t: "duelNo", id: s.id });
  }
  function sendDuelInvite() {
    const s = duelSetup;
    if (!s || s.mode !== "send" || !s.picks.length || !partnerOk) return;
    const id = Math.random().toString(36).slice(2, 9);
    netSend({ t: "duelInvite", id, hc: s.hc, team: duelWirePicks(s.picks) });
    setDuelWait({ id, hc: s.hc, picks: s.picks });
    setDuelSetup(null);
    showToast(`🤺 Challenging ${partnerTag} to a duel…`, 3000);
  }
  function acceptDuel() {
    const s = duelSetup;
    if (!s || s.mode !== "answer" || !s.picks.length) return;
    netSend({ t: "duelYes", id: s.id, team: duelWirePicks(s.picks) });
    beginDuel({ id: s.id, role: "guest", hc: s.hc, myPicks: s.picks, theirWire: s.theirs });
  }
  function beginDuel({ id, role, hc, myPicks, theirWire }) {
    const mineReal = myPicks.map((pid) => team.find((m) => m.id === pid)).filter(Boolean);
    let mine = duelTeam(mineReal, 1), theirs = duelTeam(theirWire, 2);
    const n = Math.min(mine.length, theirs.length); // same number each
    if (!n) { netSend({ t: "duelQuit", id, void: true }); setDuelSetup(null); setDuelWait(null); return; }
    mine = mine.slice(0, n); theirs = theirs.slice(0, n);
    duelIdRef.current = id;
    theirs.forEach((m) => markSeen(m.species));
    setDuelSetup(null); setDuelWait(null); setTrade(null); setGiftOpen(false); setNetOpen(false); setEmoteBar(false); setCoopInvite(null);
    setDuelCfg({ id, role, hc, mine, theirs, myIds: mineReal.slice(0, n).map((m) => m.id), key: nextBattleId() });
    setScreen("duel");
  }
  function onDuelEnd(result) {
    const cfg = duelCfg;
    duelIdRef.current = null;
    setDuelCfg(null);
    graceRef.current = 4;
    setScreen("world");
    if (!cfg || (result !== "win" && result !== "loss")) { showToast("🤝 The duel ended in a draw — nothing won or lost.", 3800); return; }
    const win = result === "win";
    const prize = win ? 60 : 20;
    const xp = (win ? 40 : 20) + avgLevel * (win ? 6 : 3);
    setCoins((c) => addCap(c, prize, COIN_MAX));
    setTeam((t) => t.map((m) => (cfg.myIds.includes(m.id) ? addXp(m, xp) : m)));
    setDuelRec((d) => ({ w: Math.min(99999, d.w + (win ? 1 : 0)), l: Math.min(99999, d.l + (win ? 0 : 1)), s: win ? Math.min(99999, d.s + 1) : 0 }));
    flushNowRef.current = true;
    play("coin");
    showToast(win
      ? `🏆 You won the duel! +${prize} coins and +${xp} XP for each duellist.`
      : `Good duel! +${prize} coins and +${xp} XP for each duellist. Rematch?`, 5000);
  }
  duelHandlerRef.current = (m) => {
    if (typeof m.id !== "string" || m.id.length > 24) return;
    switch (m.t) {
      case "duelInvite": {
        const wire = (Array.isArray(m.team) ? m.team : []).slice(0, DUEL_SIZE).filter((x) => x && DEX[x.species]).map((x) => ({ species: x.species, evolved: x.evolved === true, shiny: x.shiny === true }));
        if (!partnerOkNow() || screen !== "world" || trade || coopWait || coopInvite || duelSetup || duelWait || !wire.length || !team.length) { netSend({ t: "duelNo", id: m.id, busy: true }); break; }
        const need = Math.min(wire.length, team.length);
        setDuelSetup({ mode: "answer", id: m.id, hc: clampInt(m.hc, -30, 30, 0), theirs: wire, picks: team.slice(0, need).map((x) => x.id) });
        play("encounter");
        break;
      }
      case "duelNo":
        if (duelWait && duelWait.id === m.id) { setDuelWait(null); showToast(m.busy ? `${partnerTag} is busy right now.` : `${partnerTag} said "not now" to the duel.`); }
        break;
      case "duelCancel":
        if (duelSetup && duelSetup.mode === "answer" && duelSetup.id === m.id) { setDuelSetup(null); showToast("The duel challenge ran out — send a new one!"); }
        break;
      case "duelYes":
        if (!duelWait || duelWait.id !== m.id || screen !== "world") { netSend({ t: "duelQuit", id: m.id, void: true }); break; }
        beginDuel({ id: m.id, role: "host", hc: duelWait.hc, myPicks: duelWait.picks, theirWire: m.team });
        break;
      case "duelAns": case "duelRes": case "duelRdy": case "duelQuit":
        if (duelIdRef.current === m.id) { if (duelMsgRef.current) duelMsgRef.current(m); }
        else if (m.t === "duelAns") netSend({ t: "duelQuit", id: m.id, void: true }); // we aren't in that duel: let the other laptop out
        break;
      default:
    }
  };
  // An unanswered challenge times out after 60 s (the other player needs time to pick a team)
  useEffect(() => {
    if (!duelWait) return undefined;
    const t = setTimeout(() => { setDuelWait(null); netSend({ t: "duelCancel", id: duelWait.id }); showToast(`No answer from ${partnerTag} — try again!`); }, 60000);
    return () => clearTimeout(t);
  }, [duelWait]); // eslint-disable-line
  // If the link drops while a challenge is open, close it
  useEffect(() => {
    if (!connected) { setDuelWait(null); setDuelSetup((s) => (s && s.mode === "answer" ? null : s)); }
  }, [connected]);

  /* movement + hotkeys */
  useEffect(() => {
    if (screen !== "world") return;
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (e.metaKey || e.ctrlKey || e.altKey) return; // leave copy/paste etc. alone
      const tg = e.target;
      const typing = tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.isContentEditable);
      if (typing && k !== "escape") return; // letters typed into a box are just letters
      const modalOpen = gymPrompt || elitePrompt || rivalPrompt || shopOpen || saveOpen || dashOpen || dexOpen || boxOpen || towerPrompt || tablesOpen || cardOpen || minePrompt || craftOpen || topicPrompt || medalsOpen || netOpen || trade || giftOpen || coopInvite || duelSetup;
      if (emoteBar && /^[1-6]$/.test(k)) { e.preventDefault(); sendEmote(EMOTES[Number(k) - 1]); return; }
      if (k === "g") { if (!modalOpen || netOpen) { e.preventDefault(); setNetOpen((o) => !o); } return; }
      if (k === "e") { if (!modalOpen && connected) { e.preventDefault(); setEmoteBar((o) => !o); } return; }
      const panels = { p: [dashOpen, setDashOpen], c: [dexOpen, setDexOpen], b: [boxOpen, setBoxOpen], t: [tablesOpen, setTablesOpen], i: [cardOpen, setCardOpen], m: [medalsOpen, setMedalsOpen] };
      if (panels[k]) {
        const [isOpen, setOpen] = panels[k];
        if (modalOpen && !isOpen) return; // don't open a panel on top of another one
        e.preventDefault(); setOpen((d) => !d); return;
      }
      if (k === "h") { if (!modalOpen) { e.preventDefault(); setHudMin((d) => !d); } return; }
      if (k === "escape") { setShopOpen(false); setSaveOpen(false); setDashOpen(false); setDexOpen(false); setBoxOpen(false); setTablesOpen(false); setTowerPrompt(null); setCardOpen(false); setMinePrompt(null); setCraftOpen(false); setMedalsOpen(false); setNetOpen(false); setEmoteBar(false); setGiftOpen(false); if (trade) cancelTrade(); if (duelSetup) closeDuelSetup(); if (topicPrompt) { setPos(topicPrompt.back); setTopicPrompt(null); } return; }
      if (modalOpen) return;
      let dx = 0, dy = 0;
      if (k === "arrowup" || k === "w") dy = -1;
      else if (k === "arrowdown" || k === "s") dy = 1;
      else if (k === "arrowleft" || k === "a") dx = -1;
      else if (k === "arrowright" || k === "d") dx = 1;
      else return;
      e.preventDefault();
      if (dx === 1) setFacing(1);
      if (dx === -1) setFacing(-1);
      const p = posRef.current;
      let nx = p.x + dx, ny = p.y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
      if (SOLID.has(MAPS[region][ny][nx])) return;
      // Mounted: glide a second tile when the path is clear and nothing special is there
      if (riding) {
        const fx2 = nx + dx, fy2 = ny + dy;
        const midTile = MAPS[region][ny][nx];
        const plain = !"HDEQVMKYOU><}{$@%#".includes(midTile);
        if (plain && fx2 >= 0 && fy2 >= 0 && fx2 < COLS && fy2 < ROWS && !SOLID.has(MAPS[region][fy2][fx2])) {
          nx = fx2; ny = fy2;
        }
      }
      const t = MAPS[region][ny][nx];
      if (SOLID.has(t)) return;

      if (t === ">") {
        if (!badge1) { showToast("🔒 The bridge is locked until you earn the Number Badge!"); return; }
        play("step");
        setRegion(1); setPos({ x: 1, y: 7 }); setSteps((s) => s + 1);
        showToast("🌋 Welcome to the Ember Caves!");
        return;
      }
      if (t === "<") {
        play("step");
        setRegion(0); setPos({ x: 18, y: 7 }); setSteps((s) => s + 1);
        showToast("🌳 Back in the Meadow!");
        return;
      }
      if (t === "}") {
        if (!(badge1 && badge2 && caughtCount >= SPECIES_TO_CATCH)) {
          showToast(`🔒 Locked! Need BOTH badges + ${SPECIES_TO_CATCH} species caught (you have ${caughtCount}).`, 3400);
          return;
        }
        play("step");
        setRegion(2); setPos({ x: 1, y: 4 }); setSteps((s) => s + 1);
        showToast("❄️ You reached the Frozen Peaks!");
        return;
      }
      if (t === "{") {
        play("step");
        setRegion(1); setPos({ x: 18, y: 4 }); setSteps((s) => s + 1);
        showToast("🌋 Back in the Ember Caves!");
        return;
      }

      play("step");
      setPos({ x: nx, y: ny });
      setSteps((s) => s + 1);

      if (activeRivalSpot && activeRivalSpot.region === region && activeRivalSpot.x === nx && activeRivalSpot.y === ny) {
        setRivalPrompt(true);
        return;
      }
      if (t === "H") {
        setTeam((tm) => tm.map((m) => ({ ...m, hp: m.maxHp })));
        play("heal");
        showToast("💗 The Heal House restored your team!");
      } else if (TOPIC_BY_TILE[t]) {
        const tp = TOPIC_BY_TILE[t];
        if (!badge1) { setPos(p); showToast(`🔒 The ${tp.gym} opens after you earn the Number Badge!`, 3200); return; }
        setTopicPrompt({ topic: tp.id, back: p });
      } else if (t === "D") {
        setGymPrompt("gym1");
      } else if (t === "E") {
        setGymPrompt("gym2");
      } else if (t === "Q") {
        setElitePrompt(true);
      } else if (t === "V") {
        setTowerPrompt({ mode: "enter" });
      } else if (t === "Y" || t === "O" || t === "U") {
        const key = `${region}:${nx},${ny}`;
        const minedAt = minedRef.current[key];
        if (minedAt !== undefined && steps - minedAt < 60) {
          showToast("⛏ Already mined — it'll regrow soon!");
        } else {
          const kind = t === "Y" ? "wood" : t === "O" ? "ore" : "crystal";
          setMinePrompt({ x: nx, y: ny, kind, key, q: genQuestion(skill), input: "", msg: null });
        }
      } else if (t === "K") {
        setCraftOpen(true);
      } else if (t === "M") {
        setShopOpen(true);
      } else if (ENCOUNTER_TILES.has(t)) {
        if (riding) return; // mounted Mathimals scare wild ones away
        graceRef.current = Math.max(0, graceRef.current - 1);
        if (graceRef.current === 0 && Math.random() < 0.24) {
          setTimeout(() => startWild(), 120);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, region, badge1, badge2, champion, caughtCount, rivalStage, night, avgLevel, skill, steps, gymPrompt, elitePrompt, rivalPrompt, shopOpen, saveOpen, dashOpen, dexOpen, boxOpen, towerPrompt, tablesOpen, cardOpen, minePrompt, craftOpen, legendAwake, riding, activeRivalSpot, showToast, topicPrompt, medalsOpen, topicBadges, netOpen, trade, giftOpen, emoteBar, connected, coopInvite, duelSetup]); // eslint-disable-line

  function onBattleEnd(result) {
    graceRef.current = 4;
    const kind = battleConfig?.kind || "wild";
    if (battleConfig && battleConfig.coop) {
      const cid = battleConfig.coop.id;
      const teamups = coopTeamupsRef.current;
      if (result !== "win") netSend({ t: "coopLeft", id: cid });
      if (result === "win") {
        const lvl = battleConfig.enemies[0].level;
        const raid = kind === "raid";
        const reward = raid ? 150 + lvl * 6 : 30 + lvl * 3;
        setSessionWins((w) => w + 1);
        bumpFeat("wins");
        if (luckyWins > 0) setLuckyWins((n) => Math.max(0, n - 1)); // co-op wins use up a Lucky Egg charge too
        setCoins((c) => addCap(c, reward, COIN_MAX));
        play("coin");
        let gift = "";
        if (raid) {
          const boss = battleConfig.enemies[0];
          const mon = makeMon(boss.species, Math.max(3, Math.min(avgLevel, boss.level - 2)), boss.shiny);
          const dest = handleCatch(mon);
          gift = dest === "full" ? " (No room for the boss in your Box!)" : ` ${displayName(mon)} was so impressed it joined you${dest === "box" ? " (sent to your Box)" : ""}!`;
        }
        setScreen("world");
        showToast(`${raid ? "👹 RAID CLEARED!" : "⚔ Team victory!"} +${reward} coins${teamups ? ` · 🤝 ${teamups} team-up attack${teamups > 1 ? "s" : ""}` : ""}.${gift}`, 5200);
        return;
      }
      if (result === "raidfail") {
        setScreen("world");
        showToast("👹 The raid boss got away! Heal up and try another raid together.", 4200);
        return;
      }
      // blackout / ran fall through to the normal handling below
    }
    const enemyLevels = (battleConfig?.enemies || []).reduce((s, m) => s + m.level, 0);
    const eliteStage = battleConfig?.eliteStage;
    const towerFloor = battleConfig?.towerFloor;

    if (result === "blackout") {
      setTeam((tm) => tm.map((m) => ({ ...m, hp: m.maxHp })));
      if (kind === "tower") {
        // Tower defeat: run ends, team healed, best floor recorded (floors CLEARED = floor-1)
        const cleared = towerFloor - 1;
        if (cleared > towerBest) setTowerBest(cleared);
        setScreen("world");
        showToast(
          cleared > towerBest
            ? `🏢 NEW RECORD! You cleared ${cleared} floor${cleared === 1 ? "" : "s"}!`
            : `🏢 Tower run over — cleared ${cleared} floor${cleared === 1 ? "" : "s"}. Best: ${Math.max(towerBest, cleared)}`,
          3400
        );
        return;
      }
      // send back to the region they blacked out in, near its heal/start
      setPos(region === 2 ? { x: 14, y: 10 } : region === 1 ? { x: 16, y: 11 } : { x: 10, y: 12 });
      setScreen("world");
      showToast(
        kind.startsWith("elite") || kind === "grandmaster"
          ? "The Elite challenge ended — team healed. Train up and try the gauntlet again!"
          : kind === "topic" ? "The gym leader won this time — team healed. Practise and try again!"
          : "Your team rushed home for a rest — all healed! Try again!",
        3200
      );
      return;
    }
    if (result === "win") {
      setSessionWins((w) => w + 1);
      bumpFeat("wins");
      if (luckyWins > 0) setLuckyWins((n) => Math.max(0, n - 1));
      // Rewards grow with level, but gently — so coins stay meaningful late game
      let reward = kind === "wild" ? 8 + Math.round(enemyLevels * 1.5) : enemyLevels * 2;
      if (kind === "gym1") reward += 60;
      if (kind === "topic") reward += 80;
      if (kind === "gym2") reward += 100;
      if (kind === "rival") reward += 40;
      if (kind.startsWith("elite")) reward += 70;
      if (kind === "grandmaster") reward += 200;
      if (kind === "tower") reward = towerFloor * 10 + Math.round(enemyLevels * 1.5);
      setCoins((c) => addCap(c, reward, COIN_MAX));
      play("coin");

      if (kind === "tower") {
        if (towerFloor > towerBest) setTowerBest(towerFloor);
        setScreen("world");
        setTowerPrompt({ mode: "next", nextFloor: towerFloor + 1, reward, cleared: towerFloor });
        return;
      }
      if (kind === "topic") {
        const tp = TOPICS.find((t) => t.id === battleConfig.topic);
        const isNew = !topicBadges[tp.id];
        setTopicBadges((b) => ({ ...b, [tp.id]: true }));
        setScreen("world");
        play("levelup");
        showToast(isNew
          ? `${tp.emoji} ${tp.badge} earned! +${reward} coins · ${tp.name} questions now appear in wild battles!`
          : `${tp.emoji} ${tp.leader} beaten again! +${reward} coins`, 4600);
        return;
      }
      if (kind === "gym1") { setBadge1(true); setScreen("badge"); return; }
      if (kind === "gym2") { setBadge2(true); setScreen("champion"); return; }
      if (kind === "rival") {
        setRivalStage((s) => Math.min(2, s + 1));
        rivalCooldownRef.current = steps + 60;
        setScreen("world");
        showToast(`Max: "Argh! You win... this time!" +${reward} coins`, 3200);
        return;
      }
      if (kind.startsWith("elite")) {
        // chain straight to next elite member, keeping current HP
        const next = eliteStage + 1;
        showToast(`${ELITE[eliteStage].name} defeated! +${reward} coins. Next challenger approaches...`, 2600);
        setTimeout(() => startElite(next), 1600);
        return;
      }
      if (kind === "grandmaster") {
        setChampion(true);
        setScreen("grandchampion");
        return;
      }
      setScreen("world");
      showToast(`Victory! +${reward} coins`);
      return;
    }
    if (result === "caught") {
      bumpFeat("catches");
      setCoins((c) => addCap(c, enemyLevels, COIN_MAX));
      setScreen("world");
      return;
    }
    setScreen("world");
  }

  function loadFromCode() {
    const res = readSaveCode(loadCode);
    if (!res) { setLoadError(true); play("wrong"); return; }
    backupAutoSave(); // keep the current adventure recoverable
    applyState(res.state);
    if (res.legacy) setTimeout(() => showToast("Loaded an older save code — it couldn't hold your Box, special balls or resources. Make a new code from 💾 SAVE!", 6000), 400);
  }

  function currentSaveCode() {
    return encodeFullCode(durableState());
  }

  function downloadSave() {
    try {
      const blob = new Blob([`Mathimal Quest save code (${new Date().toLocaleString()})\n\n${currentSaveCode()}\n`], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mathimal-quest-save-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch (e) { setCopyFail(true); setTimeout(() => setCopyFail(false), 4000); }
  }

  function copyCode() {
    const code = currentSaveCode();
    let ok = false;
    // Fallback method first: works in sandboxed iframes where navigator.clipboard is blocked.
    try {
      const ta = document.createElement("textarea");
      ta.value = code;
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch (e) { ok = false; }
    // Modern API as an enhancement if available
    if (!ok && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(
        () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
        () => { setCopyFail(true); setTimeout(() => setCopyFail(false), 4000); }
      );
      return;
    }
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
    else { setCopyFail(true); setTimeout(() => setCopyFail(false), 4000); }
  }

  /* ----- screens ----- */

  // Keep the newest full state handy so a closing tab (or another tab taking over) can save it instantly
  latestSaveRef.current = screen !== "title" && screen !== "starter" && team.length ? { v: 2, ...durableState() } : null;

  if (frozen) {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <div data-testid="frozen" style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0f172a", fontFamily: FONT, textAlign: "center", gap: 18 }}>
          <div style={{ fontSize: 16, color: "#fde047" }}>⏸ PAUSED</div>
          <div style={{ fontSize: 9, color: "#cbd5e1", lineHeight: 2.1, maxWidth: 560 }}>
            This adventure has been opened in another tab or window, so this one has stopped saving.
            Your progress was saved first. Close this tab, or bring the adventure back here.
          </div>
          <PixelButton color="#86efac" onClick={() => { try { tabChanRef.current && tabChanRef.current.postMessage({ t: "claim", id: tabIdRef.current }); } catch (e) { /* ignore */ } setTimeout(() => window.location.reload(), 300); }}>▶ PLAY HERE INSTEAD</PixelButton>
        </div>
      </Frame>
    );
  }

  if (screen === "title") {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <div style={{
          position: "relative",
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "radial-gradient(circle at 50% 30%, #1e3a8a, #0f172a 75%)",
        }}>
          <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
            <div style={{ animation: "bounce 2s infinite" }}><Sprite name="embercub" size={76} /></div>
            <div style={{ animation: "bounce 2s 0.3s infinite" }}><Sprite name="bublip" size={76} /></div>
            <div style={{ animation: "bounce 2s 0.6s infinite" }}><Sprite name="pokejosh" size={76} /></div>
            <div style={{ animation: "bounce 2s 0.9s infinite" }}><Sprite name="thornling" size={76} /></div>
            <div style={{ animation: "bounce 2s 1.2s infinite" }}><Sprite name="magmite" size={76} /></div>
          </div>
          <div style={{ fontFamily: FONT, fontSize: 24, color: "#fde047", textShadow: "4px 4px 0 #b45309", textAlign: "center", lineHeight: 1.6 }}>
            {autoSnap && autoSnap.playerName !== DEFAULT_NAME ? <>{possessive(autoSnap.playerName)}<br /></> : null}MATHIMAL QUEST
          </div>
          <div style={{ fontFamily: FONT, fontSize: 9, color: "#fb923c", marginTop: 10 }}>
            ★ Episode 3: The Frozen Peaks ★
          </div>
          {autoSnap ? (
            <>
              <button
                onClick={restoreAutoSave}
                style={{
                  marginTop: 24, fontFamily: FONT, fontSize: 13, padding: "13px 20px", cursor: "pointer",
                  background: "#4ade80", color: "#14532d", border: "4px solid #166534", borderRadius: 12,
                  animation: "ripple 1.6s infinite",
                }}>
                ⚡ CONTINUE ADVENTURE
              </button>
              <div style={{ fontFamily: FONT, fontSize: 7, color: "#94a3b8", marginTop: 8 }}>
                {autoSnap.team.length + autoSnap.box.length} Mathimals · 🪙 {autoSnap.coins}
                {autoSnap.badge1 ? " · 🔢" : ""}{autoSnap.badge2 ? "🏆" : ""}{autoSnap.champion ? "👑" : ""}
              </div>
              <button
                onClick={() => { play("select"); setConfirmNew(true); }}
                style={{
                  marginTop: 16, fontFamily: FONT, fontSize: 8, padding: "7px 12px", cursor: "pointer",
                  background: "none", color: "#cbd5e1", border: "2px solid #475569", borderRadius: 8,
                }}>
                NEW ADVENTURE
              </button>
            </>
          ) : (
            <button
              onClick={() => { play("victory"); setScreen("starter"); }}
              style={{
                marginTop: 26, fontFamily: FONT, fontSize: 15, color: "#f9fafb",
                background: "none", border: "none", cursor: "pointer", animation: "blink 1.2s infinite",
              }}>
              ▶ PRESS START
            </button>
          )}

          {backupSnap && (
            <button
              onClick={() => { play("select"); restorePrevious(); }}
              style={{
                marginTop: 12, fontFamily: FONT, fontSize: 7, padding: "6px 10px", cursor: "pointer",
                background: "none", color: "#fbbf24", border: "2px dashed #92400e", borderRadius: 8,
              }}>
              ↩ RESTORE PREVIOUS ADVENTURE ({backupSnap.team.length + backupSnap.box.length} Mathimals · 🪙 {backupSnap.coins})
            </button>
          )}
          {ring.length > 0 && (
            <button data-testid="ring-btn"
              onClick={() => { play("select"); setRingOpen(true); }}
              style={{
                marginTop: 8, fontFamily: FONT, fontSize: 7, padding: "6px 10px", cursor: "pointer",
                background: "none", color: "#94a3b8", border: "2px dashed #475569", borderRadius: 8,
              }}>
              🕘 EARLIER SAVES ({ring.length})
            </button>
          )}
          {ringOpen && (
            <div style={{ position: "absolute", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: "#fffbe6", border: "4px solid #1f2937", borderRadius: 14, padding: 22, fontFamily: FONT, textAlign: "center", maxWidth: 460, width: "88%" }}>
                <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 6 }}>🕘 EARLIER SAVES</div>
                <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 12, lineHeight: 1.8 }}>Snapshots taken about every 10 minutes of play. Loading one keeps your current adventure under "Restore previous".</div>
                {ring.map((e) => {
                  const st = validateState(e.state);
                  if (!st) return null;
                  const mins = Math.max(1, Math.round((Date.now() - e.at) / 60000));
                  const ago = mins < 60 ? `${mins} min ago` : mins < 2880 ? `${Math.round(mins / 60)} h ago` : `${Math.round(mins / 1440)} days ago`;
                  return (
                    <button key={e.at} onClick={() => { play("select"); backupAutoSave(); setRingOpen(false); applyState(st); }} style={{
                      display: "block", width: "100%", marginBottom: 6, fontFamily: FONT, fontSize: 7.5, padding: "8px 10px", cursor: "pointer",
                      background: "#fff", border: "2px solid #9ca3af", borderRadius: 8, textAlign: "left",
                    }}>{ago} · {st.playerName} · {st.team.length + st.box.length} Mathimals · 🪙 {st.coins}</button>
                  );
                })}
                <div style={{ marginTop: 10 }}><PixelButton small color="#e5e7eb" onClick={() => setRingOpen(false)}>CLOSE</PixelButton></div>
              </div>
            </div>
          )}

          {confirmNew && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 30, background: "rgba(15,23,42,0.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                background: "#fffbe6", border: "4px solid #1f2937", borderRadius: 14, padding: 24,
                fontFamily: FONT, textAlign: "center", maxWidth: 440, width: "88%",
              }}>
                <div style={{ fontSize: 12, color: "#b91c1c", marginBottom: 12 }}>START OVER?</div>
                <div style={{ fontSize: 8.5, color: "#1f2937", lineHeight: 2, marginBottom: 18 }}>
                  A new adventure starts from the very beginning with one Mathimal.
                  Your current adventure ({autoSnap ? autoSnap.team.length + autoSnap.box.length : 0} Mathimals, 🪙 {autoSnap ? autoSnap.coins : 0})
                  will be put away — you can bring it back with "Restore previous adventure".
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                  <PixelButton small color="#4ade80" hotkey="escape" onClick={() => setConfirmNew(false)}>KEEP MY ADVENTURE</PixelButton>
                  <PixelButton small color="#fecaca" onClick={() => {
                    backupAutoSave();
                    setConfirmNew(false);
                    setScreen("starter");
                  }}>YES, START OVER</PixelButton>
                </div>
              </div>
            </div>
          )}

          <div style={{
            position: "absolute", bottom: 8, right: 12, fontFamily: FONT, fontSize: 7, color: "#475569",
          }}>{GAME_VERSION}</div>
          <div style={{ marginTop: 26, display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={loadCode}
              onChange={(e) => { setLoadCode(e.target.value); setLoadError(false); }}
              placeholder="Enter save code..."
              style={{
                fontFamily: FONT, fontSize: 8, padding: 9, width: 230, borderRadius: 8,
                border: loadError ? "3px solid #ef4444" : "3px solid #475569",
                background: "#0f172a", color: "#e2e8f0", outline: "none",
              }}
            />
            <button onClick={loadFromCode} style={{
              fontFamily: FONT, fontSize: 9, padding: "9px 12px", background: "#4ade80",
              border: "3px solid #166534", borderRadius: 8, cursor: "pointer",
            }}>LOAD CODE</button>
          </div>
          {loadError && <div style={{ fontFamily: FONT, fontSize: 8, color: "#f87171", marginTop: 8 }}>Hmm, that code doesn't look right — check it and try again! (Your current adventure is unchanged.)</div>}
        </div>
      </Frame>
    );
  }

  if (screen === "starter") {
    const starters = ["embercub", "bublip", "thornling"];
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <div style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#fef9c3",
        }}>
          <div style={{ marginBottom: 8 }}><Sprite name="prime" size={70} /></div>
          <div style={{ fontFamily: FONT, fontSize: 10, color: "#1f2937", textAlign: "center", lineHeight: 2, maxWidth: 580 }}>
            "Welcome! I'm Professor Prime.<br />Tell me your name, choose your partner — and watch out for my nephew Max.<br />He thinks he's the best trainer around!"
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            <label style={{ fontFamily: FONT, fontSize: 8, color: "#1f2937" }}>NAME
              <input
                data-testid="name-input"
                value={nameDraft}
                maxLength={NAME_MAX}
                onChange={(e) => setNameDraft(Array.from(nameFilter(e.target.value)).slice(0, NAME_MAX).join(""))}
                placeholder="TRAINER"
                style={{
                  marginLeft: 8, fontFamily: FONT, fontSize: 10, padding: "8px 10px", width: 170, borderRadius: 8,
                  border: "3px solid #1f2937", background: "#fffbe6", color: "#1f2937", outline: "none",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: 6 }}>
              {[["maths", "🔢 MATHS", "adaptive maths, for kids"], ["gk", "🧠 GENERAL KNOWLEDGE", "quiz questions, for grown-ups"]].map(([id, label, sub]) => (
                <button key={id} data-testid={"mode-" + id}
                  onClick={() => { play("select"); setModeDraft(id); }}
                  style={{
                    fontFamily: FONT, fontSize: 7.5, padding: "7px 10px", cursor: "pointer", borderRadius: 8, lineHeight: 1.7,
                    background: modeDraft === id ? "#4ade80" : "#fffbe6",
                    border: modeDraft === id ? "3px solid #166534" : "3px solid #94a3b8", color: "#1f2937",
                  }}>
                  {label}<br /><span style={{ fontSize: 6, color: "#475569" }}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 22, marginTop: 22 }}>
            {starters.map((sp) => (
              <button key={sp}
                onClick={() => {
                  play("caught");
                  claimSlot();
                  setPlayerName(cleanName(nameDraft)); setQmode(modeDraft); setGkCorrect(0);
                  setTeam([makeMon(sp, 3)]);
                  markCaught(sp);
                  setScreen("world");
                }}
                style={{
                  fontFamily: FONT, background: "#fffbe6", border: "4px solid #1f2937", borderRadius: 14,
                  padding: "16px 15px", cursor: "pointer", boxShadow: "4px 4px 0 rgba(0,0,0,0.3)",
                  transition: "transform 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.07)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                <Sprite name={sp} size={88} />
                <div style={{ fontSize: 10, marginTop: 10 }}>{DEX[sp].name}</div>
                <div style={{
                  fontSize: 7, marginTop: 6, padding: "3px 6px", borderRadius: 4, display: "inline-block",
                  background: TYPE_COLORS[DEX[sp].type],
                }}>{DEX[sp].type.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>
      </Frame>
    );
  }

  if (screen === "duel" && duelCfg) {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <Duel
          key={duelCfg.key}
          cfg={duelCfg}
          send={netSend}
          msgRef={duelMsgRef}
          connected={connected}
          partnerName={partnerTag}
          qmode={qmode}
          skill={skill}
          gkCorrect={gkCorrect}
          topics={TOPIC_IDS.filter((t) => topicBadges[t])}
          topicProgress={topicProgress}
          recordStat={recordStat}
          onTableProgress={handleTableProgress}
          onTopicProgress={handleTopicProgress}
          onGkCorrect={() => setGkCorrect((n) => n + 1)}
          use3D={use3D}
          region={region}
          isNight={night}
          onEnd={onDuelEnd}
        />
      </Frame>
    );
  }

  if (screen === "battle" && battleConfig) {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <Battle
          key={battleConfig.battleId}
          team={team} setTeam={setTeam}
          enemyQueue={battleConfig.enemies}
          kind={battleConfig.kind}
          trainerName={battleConfig.trainerName}
          skill={skill} setSkill={setSkill}
          skillFloor={skillFloor}
          streakRef={streakRef}
          inv={inv} setInv={setInv}
          recordStat={recordStat}
          isNight={night}
          rarity={battleConfig.rarity}
          use3D={use3D}
          region={region}
          xpShare={xpShare}
          lucky={luckyWins > 0}
          onCatch={handleCatch}
          onTableProgress={handleTableProgress}
          topics={TOPIC_IDS.filter((t) => topicBadges[t])}
          topicGym={battleConfig.kind === "topic" ? battleConfig.topic : null}
          topicProgress={topicProgress}
          onTopicProgress={handleTopicProgress}
          boxFull={team.length >= TEAM_MAX && box.length >= BOX_MAX}
          playerName={playerName}
          qmode={qmode}
          gkCorrect={gkCorrect}
          onGkCorrect={() => setGkCorrect((n) => n + 1)}
          coop={battleConfig.coop || null}
          coopHp={coopHp}
          onCoopHit={onCoopHit}
          coopNote={coopNote}
          partnerName={partnerTag}
          onEnd={onBattleEnd}
        />
      </Frame>
    );
  }

  if (screen === "badge") {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <CelebrationScreen
          title={`${playerName} EARNED THE\nNUMBER BADGE!`}
          icon="×"
          subtitle={caught.pokejosh
            ? 'Professor Prime: "Incredible maths power!\nThe bridge to the Ember Caves is open — head EAST! →"'
            : 'Professor Prime: "Incredible maths power!\nAnd look — a mysterious Mathimal has been watching you.\nIt wants to join your quest!"'}
          onContinue={() => {
            play("select");
            if (!caught.pokejosh) {
              const gift = makeMon("pokejosh", Math.max(4, avgLevel));
              const dest = handleCatch(gift);
              play("caught");
              showToast(dest === "team"
                ? "✨ PokeJosh joined your team!"
                : "✨ PokeJosh was sent to your Box!", 3600);
            }
            setScreen("world");
          }}
        />
      </Frame>
    );
  }

  if (screen === "champion") {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <CelebrationScreen
          title={`${playerName} IS THE\nMATHIMAL CHAMPION!`}
          icon="🏆"
          gold
          subtitle={'Captain Magna: "Blistering brilliance!"\nA frozen bridge lies deep in the Ember Caves...\nEarn BOTH badges and catch 8 species to cross! ❄️'}
          onContinue={() => { play("select"); setScreen("world"); }}
        />
      </Frame>
    );
  }

  if (screen === "grandchampion") {
    return (
      <Frame muted={muted} setMuted={setMuted}>
        <CelebrationScreen
          title={`GRAND CHAMPION\n${playerName}!`}
          icon="👑"
          gold
          subtitle={'Grandmaster Aria: "You have conquered the Frozen\nPeaks and the Elite Four. You are the greatest\nMathimal trainer in all the land!" ✨\nKeep collecting shinies and filling your Dex!'}
          onContinue={() => { play("select"); setScreen("world"); }}
        />
      </Frame>
    );
  }

  /* ----- world ----- */
  const map = MAPS[region];
  return (
    <Frame muted={muted} setMuted={setMuted}>
      <div style={{ width: "100%", height: "100%", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={use3D
          ? { position: "relative", width: "100%", height: "100%" }
          : { position: "relative", width: COLS * TILE, height: ROWS * TILE, border: "5px solid #0f172a", boxShadow: "0 0 0 5px #334155" }}>
          {use3D ? (
            <World3D region={region} pos={pos} night={night} outfit={outfit}
              mount={riding ? team.find((m) => m.id === riding) : null}
              rivalSpot={activeRivalSpot} partner={partner} emotes={emotes} />
          ) : <WorldGrid region={region} />}

          {!use3D && activeRivalSpot && activeRivalSpot.region === region && (
            <div style={{ position: "absolute", left: activeRivalSpot.x * TILE + 3, top: activeRivalSpot.y * TILE - 6, zIndex: 4 }}>
              <Sprite name="rival" size={32} />
              <div style={{ position: "absolute", top: -14, left: 8, fontFamily: FONT, fontSize: 10, color: "#fde047", animation: "blink 1s infinite" }}>!</div>
            </div>
          )}

          {!use3D && <div style={{
            position: "absolute", left: pos.x * TILE + 3, top: pos.y * TILE - 6,
            transition: "left 0.12s linear, top 0.12s linear", zIndex: 5,
          }}>
            {riding && (() => {
              const mount = team.find((m) => m.id === riding);
              if (!mount) return null;
              const v = monVisual(mount);
              return (
                <div style={{ position: "absolute", left: -7, top: 9, zIndex: -1 }}>
                  <Sprite name={v.sprite} size={40} flip={facing === -1} hue={v.hue} colorsOverride={v.colorsOverride} />
                </div>
              );
            })()}
            <div style={{ position: "relative", top: riding ? -8 : 0 }}>
              <Sprite name="trainer" size={32} flip={facing === -1} colorsOverride={outfitColors(outfit)} />
            </div>
            {emotes.me && <div style={{ position: "absolute", top: riding ? -36 : -28, left: 4, fontSize: 20, animation: "bounce 0.8s infinite" }}>{emotes.me.e}</div>}
          </div>}

          {!use3D && partner && !partner.gone && partner.region === region && partner.scr !== "battle" && (
            <div data-testid="partner-2d" style={{
              position: "absolute", left: partner.x * TILE + 3, top: partner.y * TILE - 6,
              transition: "left 0.2s linear, top 0.2s linear", zIndex: 5,
            }}>
              {partner.mount && (
                <div style={{ position: "absolute", left: -7, top: 9, zIndex: -1 }}>
                  <Sprite name={partner.mount.sprite} size={40} flip={partner.facing === -1} hue={partner.mount.hue} colorsOverride={partner.mount.colorsOverride} />
                </div>
              )}
              <div style={{ position: "relative", top: partner.mount ? -8 : 0 }}>
                <Sprite name="trainer" size={32} flip={partner.facing === -1} colorsOverride={outfitColors(partner.outfit)} />
              </div>
              <div style={{
                position: "absolute", top: partner.mount ? -22 : -14, left: 16, transform: "translateX(-50%)", whiteSpace: "nowrap",
                fontFamily: FONT, fontSize: 6.5, color: "#fde047", background: "rgba(15,23,42,0.8)", padding: "2px 4px", borderRadius: 4,
              }}>{partner.name}</div>
              {emotes.partner && <div style={{ position: "absolute", top: partner.mount ? -48 : -40, left: 4, fontSize: 20, animation: "bounce 0.8s infinite" }}>{emotes.partner.e}</div>}
            </div>
          )}

          {night && !use3D && <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 6, pointerEvents: "none" }} />}

          {/* HUD — translucent, sharpens on hover, collapsible */}
          <div
            onMouseEnter={() => setHudHover(true)}
            onMouseLeave={() => setHudHover(false)}
            style={{
              position: "absolute", top: 8, left: 8, zIndex: 10,
              background: hudHover ? "rgba(15,23,42,0.92)" : "rgba(15,23,42,0.45)",
              opacity: hudHover ? 1 : 0.85,
              backdropFilter: "blur(2px)",
              border: "2px solid " + (hudHover ? "#64748b" : "rgba(71,85,105,0.5)"),
              borderRadius: 8, padding: hudMin ? "5px 8px" : "8px 10px", fontFamily: FONT,
              transition: "background 0.2s, opacity 0.2s, border 0.2s",
            }}>
            <div style={{ fontSize: 8, color: "#fde047", marginBottom: hudMin ? 0 : 6, display: "flex", alignItems: "center", gap: 7 }}>
              <span>{playerName} {badge1 && "🔢"}{badge2 && "🏆"}{champion && "👑"}{TOPICS.filter((t) => topicBadges[t.id]).map((t) => t.emoji).join("")} {night ? "🌙" : "☀️"}</span>
              {hudMin && <span style={{ color: "#fbbf24", fontSize: 7 }}>🪙{coins}</span>}
              <button
                onClick={() => { play("select"); setHudMin((m) => !m); }}
                style={{
                  fontFamily: FONT, fontSize: 8, padding: "2px 6px", cursor: "pointer",
                  background: "rgba(51,65,85,0.7)", color: "#e2e8f0",
                  border: "1px solid #64748b", borderRadius: 5, lineHeight: 1,
                }}
                title={hudMin ? "Expand" : "Minimise"}
              >{hudMin ? "▾" : "▴"}</button>
            </div>
            {!hudMin && (
              <>
                <div style={{ fontSize: 7, color: "#fbbf24", marginBottom: 5 }}>🪙 {coins} · 📕 {caughtCount}/{SPECIES_LIST.length}</div>
                {(eggs.length > 0 || luckyWins > 0 || xpShare) && (
                  <div style={{ fontSize: 7, color: "#fcd34d", marginBottom: 5 }}>
                    {eggs.length > 0 && `🥚 ${eggs.map((n) => n).join("/")} steps `}
                    {luckyWins > 0 && `🍀×${luckyWins} `}
                    {xpShare && "🎒"}
                  </div>
                )}
                {(resources.wood > 0 || resources.ore > 0 || resources.crystal > 0) && (
                  <div style={{ fontSize: 7, color: "#d6d3d1", marginBottom: 5 }}>
                    🪵{resources.wood} 🪨{resources.ore} 💎{resources.crystal}{(inv.megaball || 0) > 0 ? ` ◎${inv.megaball}` : ""}
                  </div>
                )}
                {team.map((m) => (
                  <div key={m.id} style={{ fontSize: 7, color: m.hp > 0 ? "#e2e8f0" : "#f87171", marginBottom: 3 }}>
                    {displayName(m)} Lv{m.level} · {Math.max(0, m.hp)}/{m.maxHp}
                  </div>
                ))}
                <div style={{ fontSize: 7, color: "#93c5fd", marginTop: 5 }}>
                  {qmode === "gk" ? "Brain" : "Maths"} Power: {"▰".repeat(power)}{"▱".repeat(10 - power)}
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap", maxWidth: 168 }}>
                  <button onClick={() => {
                    play("select");
                    if (riding) { setRiding(null); showToast("You hopped off."); return; }
                    const mount = team.find((m) => m.level >= 20 && m.hp > 0);
                    if (!mount) { showToast("🐾 Need a Lv20+ healthy Mathimal to ride!", 3000); return; }
                    setRiding(mount.id);
                    showToast(`🐾 You climbed onto ${displayName(mount)}! Double speed, no wild battles.`, 3200);
                  }} style={{ ...hudBtn, background: riding ? "#166534" : hudBtn.background }}>
                    {riding ? "🐾 HOP OFF" : "🐾 RIDE"}
                  </button>
                  <button onClick={() => { play("select"); toggle3D(); }} style={hudBtn}>{use3D ? "🧊 3D" : "🟦 2D"}</button>
                  <button onClick={() => { play("select"); setCardOpen(true); }} style={hudBtn}>🎴 CARD</button>
                  <button onClick={() => { play("select"); setDexOpen(true); }} style={hudBtn}>📕 DEX</button>
                  <button onClick={() => { play("select"); setBoxOpen(true); }} style={hudBtn}>🗃 BOX</button>
                  <button onClick={() => { play("select"); setTablesOpen(true); }} style={hudBtn}>⭐ TBL</button>
                  <button onClick={() => { play("select"); setMedalsOpen(true); }} style={hudBtn}>🏅 {medals.length}</button>
                  <button onClick={() => { play("select"); setSaveOpen(true); }} style={hudBtn}>💾 SAVE</button>
                  <button data-testid="together-btn" onClick={() => { play("select"); setNetOpen(true); }} style={{ ...hudBtn, ...(connected ? { borderColor: "#4ade80", color: "#bbf7d0" } : {}) }}>👥 G</button>
                  <button onClick={() => { play("select"); setDashOpen(true); }} style={hudBtn}>📊 P</button>
                </div>
              </>
            )}
          </div>

          {saveFailed && (
            <div style={{
              position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 25,
              background: "#7f1d1d", color: "#fecaca", border: "3px solid #fca5a5", borderRadius: 10,
              padding: "8px 14px", fontFamily: FONT, fontSize: 8, lineHeight: 1.7, textAlign: "center", maxWidth: "70%",
            }}>
              ⚠ Your progress isn't saving on this computer!<br />Press 💾 SAVE and keep your code (or download it).
            </div>
          )}

          {medalPop && (
            <div data-testid="medal-pop" style={{
              position: "absolute", top: saveFailed ? 70 : 14, left: "50%", transform: "translateX(-50%)", zIndex: 26,
              background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "4px solid #b45309", borderRadius: 12,
              padding: "10px 16px", fontFamily: FONT, textAlign: "center", animation: "popIn 0.35s",
              boxShadow: "0 0 24px rgba(251,191,36,0.7)", maxWidth: "80%",
            }}>
              <div style={{ fontSize: 8, color: "#92400e", marginBottom: 6 }}>
                {medalPop.catchUp ? `🏅 ${medalPop.list.length} MEDALS FOR YOUR ADVENTURES SO FAR!` : medalPop.list.length > 1 ? `🏅 ${medalPop.list.length} NEW MEDALS!` : "🏅 NEW MEDAL!"}
              </div>
              {medalPop.list.length <= 3 ? medalPop.list.map((m) => (
                <div key={m.id} style={{ fontSize: 10, color: "#1f2937", margin: "4px 0" }}>{m.emoji} {m.name}</div>
              )) : (
                <div style={{ fontSize: 16, letterSpacing: 2, margin: "4px 0" }}>{medalPop.list.map((m) => m.emoji).join("")}</div>
              )}
              <div style={{ fontSize: 8, color: "#b45309", marginTop: 6 }}>+{medalPop.coins} coins 🪙 · press M to see your medals</div>
            </div>
          )}

          {/* ---- Partner panel (top right) ---- */}
          {roomInfo && (
            <div data-testid="partner-panel" style={{
              position: "absolute", top: 52, right: 8, zIndex: 10, width: 188, fontFamily: FONT,
              background: "rgba(15,23,42,0.88)", border: "2px solid " + (connected ? "#4ade80" : "#64748b"), borderRadius: 8, padding: "8px 9px",
            }}>
              <div style={{ fontSize: 7, color: "#94a3b8", marginBottom: 5 }}>👥 ROOM {roomInfo.code} · {roomInfo.role === "host" ? "HOST" : "GUEST"}</div>
              {connected && partner && !partner.gone ? (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Sprite name="trainer" size={24} colorsOverride={outfitColors(partner.outfit)} />
                    <div>
                      <div style={{ fontSize: 8, color: "#fde047" }}>{partner.name}</div>
                      <div style={{ fontSize: 6, color: "#cbd5e1", marginTop: 3 }}>
                        {partner.scr === "battle" ? "⚔ in a battle" : partner.region === region ? `📍 here (${partner.x},${partner.y})` : `📍 ${REGION_NAMES[partner.region]}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                    <button data-testid="goto-btn" onClick={goToPartner} style={hudBtn}>🧭 GO TO</button>
                    <button data-testid="emote-btn" onClick={() => setEmoteBar((o) => !o)} style={hudBtn}>😄 E</button>
                    <button data-testid="trade-btn" disabled={!partnerOk} onClick={() => { play("select"); openTrade(); }} style={hudBtn}>🔁 TRADE</button>
                    <button data-testid="gift-btn" disabled={!partnerOk} onClick={() => { play("select"); setGiftOpen(true); }} style={hudBtn}>🎁 GIFT</button>
                    {typeof coopUi === "function" && coopUi()}
                  </div>
                  {!partner.compat && <div style={{ fontSize: 6, color: "#fca5a5", marginTop: 6, lineHeight: 1.7 }}>Different game versions — update both laptops to trade, gift or battle together.</div>}
                </>
              ) : (
                <div style={{ fontSize: 7, color: "#fbbf24", lineHeight: 1.8 }}>
                  {netStatus && netStatus.s === "waiting" ? `Waiting for a player… tell them the code ${roomInfo.code}` :
                   netStatus && netStatus.s === "starting" ? "Linking up…" :
                   netStatus && netStatus.s === "lost" ? "Lost the link. Press 👥 G to rejoin." :
                   netStatus && netStatus.s === "error" ? (netStatus.detail || "Couldn't link.") : "…"}
                </div>
              )}
              {pendingTx.length > 0 && (
                <div data-testid="pending-note" style={{ fontSize: 6, color: "#fde68a", marginTop: 6, lineHeight: 1.7 }}>
                  ⏳ {pendingTx.length} {pendingTx.length === 1 ? "trade/gift is" : "trades/gifts are"} waiting for {pendingTx[0].to ? titleCase(pendingTx[0].to) : "your partner"} to confirm. They'll finish next time you link up.
                </div>
              )}
              {emoteBar && (
                <div data-testid="emote-bar" style={{ display: "flex", gap: 3, marginTop: 7, flexWrap: "wrap" }}>
                  {EMOTES.map((e, i) => (
                    <button key={e} onClick={() => sendEmote(e)} style={{ ...hudBtn, fontSize: 13, padding: "3px 5px" }}>
                      <span style={{ fontSize: 6, verticalAlign: "top" }}>{i + 1}</span>{e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ---- Together window: host or join ---- */}
          {netOpen && (
            <Modal>
              <div style={{ fontSize: 12, color: "#1f2937", marginBottom: 8 }}>👥 PLAY TOGETHER</div>
              {!roomInfo || (netStatus && (netStatus.s === "error" || netStatus.s === "lost" || netStatus.s === "closed")) ? (
                <>
                  <div style={{ fontSize: 7.5, color: "#4b5563", lineHeight: 2, marginBottom: 12 }}>
                    One laptop HOSTS and gets a 4-letter code. The other laptop types the code to JOIN.<br />
                    Both laptops need the internet to link up{netMode() === "local" ? " (test mode: two tabs in this browser)" : ""}.
                  </div>
                  {netStatus && netStatus.s === "error" && <div style={{ fontSize: 7.5, color: "#b91c1c", marginBottom: 10 }}>{netStatus.detail}</div>}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                    <PixelButton small color="#86efac" onClick={() => { play("select"); startRoom("host", makeRoomCode()); }}>🏠 HOST A GAME</PixelButton>
                    <span style={{ fontSize: 8, color: "#6b7280" }}>or</span>
                    <input
                      data-testid="join-code"
                      value={joinDraft}
                      onChange={(e) => setJoinDraft(cleanRoomCode(e.target.value))}
                      onKeyDown={(e) => { if (e.key === "Enter" && joinDraft.length === 4) startRoom("guest", joinDraft); }}
                      placeholder="CODE"
                      style={{ fontFamily: FONT, fontSize: 12, width: 82, padding: "8px 6px", textAlign: "center", letterSpacing: 3, border: "3px solid #1f2937", borderRadius: 8, textTransform: "uppercase" }}
                    />
                    <PixelButton small color="#93c5fd" disabled={joinDraft.length !== 4} onClick={() => { play("select"); startRoom("guest", joinDraft); }}>JOIN</PixelButton>
                  </div>
                </>
              ) : (
                <>
                  {roomInfo.role === "host" && (
                    <div style={{ margin: "6px 0 12px" }}>
                      <div style={{ fontSize: 7.5, color: "#4b5563" }}>Your room code</div>
                      <div data-testid="room-code" style={{ fontSize: 30, letterSpacing: 8, color: "#1d4ed8", margin: "8px 0" }}>{roomInfo.code}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 8, color: connected ? "#15803d" : "#b45309", marginBottom: 12, lineHeight: 1.8 }}>
                    {connected ? `✓ Linked with ${partner ? partner.name : "your partner"}!` : netStatus && netStatus.s === "waiting" ? "Waiting for the other laptop to join…" : "Linking up…"}
                  </div>
                  <div style={{ fontSize: 7, color: "#6b7280", lineHeight: 2, marginBottom: 12, textAlign: "left" }}>
                    🧭 GO TO jumps next to your partner · 😄 E sends an emote · 🔁 TRADE swaps Mathimals (a traded Mathimal evolves on arrival!) · 🎁 GIFT shares coins and items · ⚔ TEAM battles and 👹 RAIDS: battle side by side, and answer together within 3 seconds for a TEAM-UP attack
                  </div>
                  <PixelButton small color="#fecaca" onClick={() => { play("select"); leaveRoom(); }}>LEAVE ROOM</PixelButton>
                </>
              )}
              <div style={{ marginTop: 12 }}>
                <PixelButton small color="#e5e7eb" hotkey="escape" onClick={() => setNetOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}

          {/* ---- Trade window ---- */}
          {trade && (() => {
            const own = trade.mine ? [...team, ...box].find((m) => m.id === trade.mine) : null;
            const all = [...team.map((m) => ({ m, where: "team" })), ...box.map((m) => ({ m, where: "box" }))];
            const MonCard = ({ m, label }) => (
              <div style={{ width: 150, minHeight: 118, border: "3px solid #1f2937", borderRadius: 10, padding: 8, background: m ? "#fffbe6" : "#f3f4f6" }}>
                <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 6 }}>{label}</div>
                {m ? (
                  <>
                    <Sprite name={monVisual(m).sprite} size={54} hue={monVisual(m).hue} colorsOverride={monVisual(m).colorsOverride} />
                    <div style={{ fontSize: 8, marginTop: 4 }}>{displayName(m)}</div>
                    <div style={{ fontSize: 7, color: "#4b5563", marginTop: 3 }}>Lv{m.level}{m.shiny ? " ✨" : ""}{!m.evolved ? " · will evolve!" : ""}</div>
                  </>
                ) : <div style={{ fontSize: 7, color: "#9ca3af", marginTop: 30 }}>nothing yet…</div>}
              </div>
            );
            const theirs = trade.theirs ? { ...trade.theirs, name: DEX[trade.theirs.species] ? (trade.theirs.evolved ? DEX[trade.theirs.species].evoName : DEX[trade.theirs.species].name) : "?" } : null;
            return (
              <Modal wide>
                <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 10 }}>🔁 TRADE WITH {partner ? partner.name : "PARTNER"}</div>
                <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center" }}>
                  <MonCard m={own} label={`YOU GIVE ${trade.myOk ? "✓" : ""}`} />
                  <div style={{ fontSize: 18 }}>⇄</div>
                  <MonCard m={theirs} label={`YOU GET ${trade.theirOk ? "✓" : ""}`} />
                </div>
                {!trade.myOk && (
                  <div data-testid="trade-pick" style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginTop: 10, maxHeight: 118, overflowY: "auto" }}>
                    {all.filter(({ m }) => !lockedIds.has(m.id)).map(({ m, where }) => (
                      <button key={m.id} onClick={() => { play("select"); offerTrade(m.id); }} style={{
                        fontFamily: FONT, fontSize: 6.5, padding: "4px 6px", cursor: "pointer", borderRadius: 6,
                        background: trade.mine === m.id ? "#4ade80" : where === "team" ? "#e0f2fe" : "#f3f4f6", border: "2px solid #9ca3af",
                      }}>{displayName(m)} L{m.level}{m.shiny ? "✨" : ""}</button>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 7, color: "#6b7280", margin: "10px 0", lineHeight: 1.8 }}>
                  {trade.finishing ? `Finishing the trade with ${partnerTag}…` :
                   trade.myOk && !trade.theirOk ? `Waiting for ${partnerTag} to press ACCEPT…` :
                   !trade.myOk && trade.theirOk ? `${partnerTag} is ready! Press ACCEPT to swap.` :
                   "Both players pick one Mathimal, then both press ACCEPT."}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <PixelButton small color="#86efac" disabled={!own || !theirs || !!trade.myOk} onClick={() => { play("select"); acceptTrade(); }}>✓ ACCEPT</PixelButton>
                  <PixelButton small color="#fecaca" hotkey="escape" disabled={!!trade.finishing} onClick={() => cancelTrade()}>CANCEL</PixelButton>
                </div>
              </Modal>
            );
          })()}

          {/* ---- Gift window ---- */}
          {giftOpen && (
            <Modal>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 6 }}>🎁 SEND A GIFT</div>
              <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 12 }}>It comes out of your own coins and bag. You have 🪙 {coins}.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {GIFTS.map((g) => {
                  const can = connected && (!g.coins || coins >= g.coins) && (!g.items || Object.entries(g.items).every(([k, n]) => (inv[k] || 0) >= n));
                  return <PixelButton key={g.id} small color={can ? "#fde68a" : "#e5e7eb"} disabled={!can} onClick={() => sendGift(g)}>{g.label}</PixelButton>;
                })}
              </div>
              <div style={{ marginTop: 14 }}>
                <PixelButton small color="#e5e7eb" hotkey="escape" onClick={() => setGiftOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}

          {/* ---- Duel: send or answer a challenge ---- */}
          {duelSetup && (() => {
            const answer = duelSetup.mode === "answer";
            const need = Math.min(answer ? duelSetup.theirs.length : DUEL_SIZE, team.length);
            const picks = duelSetup.picks.filter((id) => team.some((m) => m.id === id)).slice(0, need);
            const toggle = (id) => setDuelSetup((s) => (s ? { ...s, picks: s.picks.includes(id) ? s.picks.filter((x) => x !== id) : s.picks.length < need ? [...s.picks, id] : s.picks } : s));
            const hc = duelSetup.hc;
            const hcText = hc === 0 ? "EVEN MATCH" : `${(hc > 0) !== answer ? partnerTag.toUpperCase() : "YOU"} +${Math.abs(hc)}% DAMAGE`;
            return (
              <Modal wide>
                <div style={{ fontSize: 28, marginBottom: 6 }}>🤺</div>
                <div style={{ fontSize: 11, color: "#1f2937", lineHeight: 1.9, marginBottom: 6 }}>
                  {answer ? `${partner ? partner.name : "YOUR PARTNER"} challenges you to a DUEL!` : `Challenge ${partnerTag} to a DUEL!`}
                </div>
                <div style={{ fontSize: 7.5, color: "#4b5563", lineHeight: 2, marginBottom: 10 }}>
                  You each answer your own questions at the same time. The faster correct answer strikes first.
                  <br />Every Mathimal battles at Lv{DUEL_LEVEL}, and your real team is never hurt.
                </div>
                {answer && (
                  <div style={{ fontSize: 7.5, color: "#1f2937", marginBottom: 10 }}>
                    {partnerTag} is bringing: {duelSetup.theirs.map((x) => (x.shiny ? "✨" : "") + (x.evolved ? DEX[x.species].evoName : DEX[x.species].name)).join(", ")}
                  </div>
                )}
                <div style={{ fontSize: 8, color: "#1f2937", marginBottom: 8 }}>
                  Pick {need} Mathimal{need === 1 ? "" : "s"} in battle order ({picks.length}/{need}):
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
                  {team.map((m) => {
                    const at = picks.indexOf(m.id);
                    return (
                      <button key={m.id} data-testid="duel-pick" onClick={() => { play("select"); toggle(m.id); }} style={{
                        fontFamily: FONT, fontSize: 8, padding: "8px 10px", borderRadius: 8, cursor: "pointer", color: "#1f2937",
                        border: "3px solid #1f2937", background: at >= 0 ? "#86efac" : "#e5e7eb", lineHeight: 1.6,
                      }}>
                        {at >= 0 ? `${at + 1}. ` : ""}{displayName(m)}
                        <span style={{ marginLeft: 6, fontSize: 6, padding: "2px 4px", borderRadius: 4, background: TYPE_COLORS[m.type] }}>{m.type.toUpperCase()}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 8, color: "#1f2937", marginBottom: 14 }}>
                  {answer ? <span>Head start: {hcText}</span> : (
                    <button data-testid="duel-hc" onClick={() => { play("select"); setDuelSetup((s) => (s ? { ...s, hc: DUEL_HANDICAPS[(DUEL_HANDICAPS.indexOf(s.hc) + 1) % DUEL_HANDICAPS.length] } : s)); }} style={hudBtn}>
                      HEAD START: {hcText} (CLICK TO CHANGE)
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <PixelButton small color="#86efac" disabled={picks.length < need || !partnerOk} onClick={answer ? acceptDuel : sendDuelInvite}>{answer ? "ACCEPT DUEL!" : "SEND CHALLENGE"}</PixelButton>
                  <PixelButton small color="#fecaca" onClick={closeDuelSetup}>{answer ? "NOT NOW" : "CANCEL"}</PixelButton>
                </div>
              </Modal>
            );
          })()}

          {/* ---- Battle invite from the partner ---- */}
          {coopInvite && (
            <Modal>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{coopInvite.kind === "raid" ? "👹" : "⚔"}</div>
              <div style={{ fontSize: 11, color: "#1f2937", lineHeight: 1.9, marginBottom: 8 }}>
                {partner ? partner.name : "YOUR PARTNER"} wants {coopInvite.kind === "raid" ? "to take on a RAID BOSS" : "a TEAM BATTLE"}!
              </div>
              <div style={{ fontSize: 7.5, color: "#4b5563", lineHeight: 2, marginBottom: 14 }}>
                {coopInvite.kind === "raid"
                  ? "A huge boss with one shared HP bar and a 3-minute clock. Beat it together and it joins you both!"
                  : "One tough wild Mathimal, one shared HP bar."}
                <br />Both get it right within 3 seconds for a 🤝 TEAM-UP attack!
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#86efac" onClick={() => answerInvite(true)}>LET'S GO!</PixelButton>
                <PixelButton small color="#fecaca" onClick={() => answerInvite(false)}>NOT NOW</PixelButton>
              </div>
            </Modal>
          )}

          {toast && (
            <div style={{
              position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 20,
              background: "#fffbe6", border: "3px solid #1f2937", borderRadius: 10, padding: "10px 16px",
              fontFamily: FONT, fontSize: 9, color: "#1f2937", animation: "popIn 0.3s",
              width: "max-content", maxWidth: "86%", textAlign: "center", lineHeight: 1.7,
            }}>{toast}</div>
          )}

          {gymPrompt && (
            <Modal>
              <Sprite name={gymPrompt === "gym1" ? "prime" : "magna"} size={64} />
              <div style={{ fontSize: 10, lineHeight: 2, margin: "12px 0 18px", color: "#1f2937" }}>
                {gymPrompt === "gym1"
                  ? (badge1 ? '"Back for a rematch, champ? My team trained hard!"' : `"So you want the Number Badge? Show me your ${qmode === "gk" ? "brain" : "maths"} power, ${titleCase(playerName)}!"`)
                  : (badge2 ? '"The Champion returns! Let\'s turn up the heat!"' : '"I\'m Captain Magna! Beat my THREE Mathimals and you\'ll be the CHAMPION!"')}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#fde047" onClick={() => startGym(gymPrompt)}>BATTLE!</PixelButton>
                <PixelButton small color="#e5e7eb" onClick={() => {
                  setGymPrompt(null);
                  setPos((p) => ({ x: p.x, y: p.y + 1 }));
                }}>NOT YET</PixelButton>
              </div>
            </Modal>
          )}

          {topicPrompt && (() => {
            const tp = TOPICS.find((t) => t.id === topicPrompt.topic);
            const won = topicBadges[tp.id];
            const n = topicProgress[tp.id] || 0;
            return (
              <Modal>
                <div style={{ fontSize: 9, color: "#6b7280", marginBottom: 6 }}>{tp.emoji} {tp.gym.toUpperCase()} {tp.emoji}</div>
                <Sprite name={tp.sprite} size={64} hue={tp.hue} />
                <div style={{ fontSize: 9, color: "#1f2937", marginTop: 6 }}>{tp.leader}</div>
                <div style={{ fontSize: 9.5, lineHeight: 2, margin: "10px 0 10px", color: "#1f2937" }}>{won ? tp.again : tp.hello}</div>
                <div style={{ fontSize: 7.5, color: "#6b7280", lineHeight: 1.8, marginBottom: 14 }}>
                  Every question in this gym is about {tp.name.toUpperCase()}.<br />
                  {won ? `✓ ${tp.badge} won` : `Win the ${tp.badge} to add ${tp.name.toLowerCase()} questions to wild battles!`}
                  {" · "}{tp.name} level {progressTier(n)}/3
                </div>
                <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                  <PixelButton small color="#fde047" onClick={() => startTopicGym(tp.id)}>BATTLE!</PixelButton>
                  <PixelButton small color="#e5e7eb" onClick={() => { setPos(topicPrompt.back); setTopicPrompt(null); }}>NOT YET</PixelButton>
                </div>
              </Modal>
            );
          })()}

          {elitePrompt && (
            <Modal>
              <Sprite name="grandmaster" size={64} />
              <div style={{ fontSize: 10, lineHeight: 2, margin: "12px 0 16px", color: "#1f2937" }}>
                {champion
                  ? '"Welcome back, Grand Champion! Care to face the gauntlet again?"'
                  : '"This is the ELITE HALL. Three Elites, then ME — Grandmaster Aria — back to back, NO healing between battles. Are you ready?"'}
              </div>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 14 }}>
                Tip: bring Potions and a full team of 4! Use the 🧪 BAG mid-battle.
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#fde047" onClick={() => {
                  // heal fully before the gauntlet starts, then no healing between
                  setTeam((tm) => tm.map((m) => ({ ...m, hp: m.maxHp })));
                  startElite(0);
                }}>ENTER!</PixelButton>
                <PixelButton small color="#e5e7eb" onClick={() => {
                  setElitePrompt(false);
                  setPos((p) => ({ x: p.x, y: p.y + 1 }));
                }}>NOT YET</PixelButton>
              </div>
            </Modal>
          )}

          {towerPrompt && towerPrompt.mode === "enter" && (
            <Modal>
              <div style={{ fontSize: 22 }}>🏢</div>
              <div style={{ fontSize: 11, color: "#1f2937", margin: "8px 0 6px" }}>TRAINER TOWER</div>
              <div style={{ fontSize: 9, lineHeight: 2, marginBottom: 8, color: "#1f2937" }}>
                Battle trainer after trainer — each floor is tougher!<br />
                How high can you climb?
              </div>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 14 }}>
                🏆 Best: {towerBest} floor{towerBest === 1 ? "" : "s"} · Coins banked after every floor
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#fde047" onClick={() => {
                  setTeam((tm) => tm.map((m) => ({ ...m, hp: m.maxHp })));
                  startTower(1);
                }}>CLIMB! (heals team)</PixelButton>
                <PixelButton small color="#e5e7eb" onClick={() => {
                  setTowerPrompt(null);
                  setPos((p) => ({ x: p.x, y: p.y + 1 }));
                }}>NOT YET</PixelButton>
              </div>
            </Modal>
          )}

          {towerPrompt && towerPrompt.mode === "next" && (
            <Modal>
              <div style={{ fontSize: 22 }}>🏢</div>
              <div style={{ fontSize: 11, color: "#1f2937", margin: "8px 0 6px" }}>
                FLOOR {towerPrompt.cleared} CLEARED!
              </div>
              <div style={{ fontSize: 9, lineHeight: 2, marginBottom: 6, color: "#1f2937" }}>
                +{towerPrompt.reward} coins banked! 🪙<br />
                {towerPrompt.cleared >= towerBest ? "⭐ That's your best climb yet!" : `Best: ${towerBest} floors`}
              </div>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 14 }}>
                No healing between floors — climb on or bank your run?
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#fde047" onClick={() => startTower(towerPrompt.nextFloor)}>
                  FLOOR {towerPrompt.nextFloor} ▲
                </PixelButton>
                <PixelButton small color="#bbf7d0" onClick={() => {
                  setTowerPrompt(null);
                  setTeam((tm) => tm.map((m) => ({ ...m, hp: m.maxHp })));
                  showToast("🏢 Great climb! Team healed.", 2600);
                }}>LEAVE & HEAL</PixelButton>
              </div>
            </Modal>
          )}

          {minePrompt && (
            <Modal>
              <div style={{ fontSize: 26 }}>{RES_META[minePrompt.kind].emoji}</div>
              <div style={{ fontSize: 10, color: "#1f2937", margin: "8px 0 4px" }}>
                {RES_META[minePrompt.kind].name.toUpperCase()} FOUND!
              </div>
              <div style={{ fontSize: 8, color: minePrompt.msg ? "#dc2626" : "#6b7280", lineHeight: 1.8, marginBottom: 10 }}>
                {minePrompt.msg || "Solve it to swing your pickaxe! ⛏"}
              </div>
              <div style={{ fontSize: 20, color: "#1f2937", marginBottom: 10 }}>{minePrompt.q.text} = ?</div>
              <input
                autoFocus
                value={minePrompt.input}
                inputMode="numeric"
                onChange={(e) => setMinePrompt((mp) => ({ ...mp, input: e.target.value.replace(/[^0-9-]/g, "") }))}
                onKeyDown={(e) => { if (e.key === "Enter") answerMine(); }}
                style={{
                  fontFamily: FONT, fontSize: 16, width: 100, textAlign: "center", padding: 7,
                  border: "3px solid #1f2937", borderRadius: 8, outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                <PixelButton small color="#fde68a" onClick={answerMine}>⛏ MINE!</PixelButton>
                <PixelButton small color="#e5e7eb" onClick={() => setMinePrompt(null)}>LEAVE IT</PixelButton>
              </div>
            </Modal>
          )}

          {craftOpen && (
            <Modal wide>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>🔨 CRAFTING BENCH</div>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 10 }}>
                You have: 🪵 {resources.wood} wood · 🪨 {resources.ore} ore · 💎 {resources.crystal} crystal
              </div>
              {RECIPES.map((rec) => (
                <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 8 }}>
                  <div style={{ fontSize: 8.5, color: "#1f2937", textAlign: "left" }}>
                    {rec.name}
                    <div style={{ fontSize: 7, color: "#6b7280", marginTop: 3 }}>
                      needs {Object.entries(rec.cost).map(([k, n]) => `${n} ${RES_META[k].emoji}`).join(" + ")}
                      {rec.note ? ` · ${rec.note}` : ""} · owned ×{inv[rec.id] || 0}
                    </div>
                  </div>
                  <PixelButton small color="#bbf7d0" disabled={!canCraft(rec)} onClick={() => craft(rec)}>CRAFT</PixelButton>
                </div>
              ))}
              <div style={{ fontSize: 7, color: "#9ca3af", marginTop: 8 }}>
                Mine 🪵 in the Meadow, 🪨 in the Ember Caves, 💎 in the Frozen Peaks!
              </div>
              <div style={{ marginTop: 12 }}>
                <PixelButton small color="#e5e7eb" onClick={() => { setCraftOpen(false); setPos({ x: 10, y: 12 }); }}>LEAVE BENCH</PixelButton>
              </div>
            </Modal>
          )}

          {rivalPrompt && (
            <Modal>
              <Sprite name="rival" size={64} />
              <div style={{ fontSize: 10, lineHeight: 2, margin: "12px 0 18px", color: "#1f2937" }}>
                {rivalStage === 0 && '"Hey! I\'m Max, Professor Prime\'s nephew. My Sparkit will zap you silly. Battle me!"'}
                {rivalStage === 1 && '"You again?! I\'ve been training in these caves. No more Mr Nice Max!"'}
                {rivalStage >= 2 && '"Champion, schmampion. Rematch time — my team is SUPERCHARGED!"'}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <PixelButton small color="#fde047" onClick={startRival}>BRING IT ON!</PixelButton>
              </div>
            </Modal>
          )}

          {shopOpen && (
            <Modal>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 6 }}>🛒 MATHI-MART</div>
              <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 14 }}>You have 🪙 {coins} coins</div>
              {[
                { key: "potion", label: "🧪 Potion (+25 HP)", price: 15 },
                { key: "superpotion", label: "⚗ Super Potion (full HP)", price: 40 },
                { key: "greatball", label: "◍ Great Ball (+25% catch)", price: 25 },
              ].map((it) => (
                <div key={it.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 8 }}>
                  <div style={{ fontSize: 8.5, color: "#1f2937", textAlign: "left" }}>
                    {it.label} <span style={{ color: "#6b7280" }}>×{inv[it.key]}</span>
                  </div>
                  <PixelButton small color="#bbf7d0" disabled={coins < it.price || (inv[it.key] || 0) >= ITEM_MAX}
                    onClick={() => {
                      if ((invRef.current[it.key] || 0) >= ITEM_MAX || coinsRef.current < it.price) return;
                      coinsRef.current -= it.price;
                      invRef.current = { ...invRef.current, [it.key]: (invRef.current[it.key] || 0) + 1 };
                      setCoins((c) => c - it.price);
                      setInv((v) => ({ ...v, [it.key]: addCap(v[it.key], 1, ITEM_MAX) }));
                      play("coin");
                    }}>
                    BUY 🪙{it.price}
                  </PixelButton>
                </div>
              ))}
              <div style={{ borderTop: "3px dashed #d1d5db", marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 9, color: "#1f2937", marginBottom: 10 }}>⭐ TRAINER UPGRADES</div>
                {[
                  { id: "egg", label: "🥚 Mystery Egg", note: `hatches after 40 steps · often a Mathimal you're missing · 10% shiny${eggs.length ? ` · carrying ${eggs.length}/3` : ""}`, price: 250,
                    disabled: eggs.length >= 3, buy: () => setEggs((e) => [...e, 40]) },
                  { id: "lucky", label: "🍀 Lucky Egg", note: `double XP for your next 10 wins${luckyWins ? ` · ${luckyWins} left` : ""}`, price: 300,
                    buy: () => setLuckyWins((n) => n + 10) },
                  { id: "share", label: "🎒 XP Share", note: xpShare ? "OWNED — healthy team-mates get half XP" : "one-time · healthy team-mates get half XP from every win", price: 1500,
                    disabled: xpShare, buy: () => setXpShare(true) },
                ].map((u) => (
                  <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9, gap: 8 }}>
                    <div style={{ fontSize: 8.5, color: "#1f2937", textAlign: "left" }}>
                      {u.label}
                      <div style={{ fontSize: 6.5, color: "#6b7280", marginTop: 3, lineHeight: 1.5 }}>{u.note}</div>
                    </div>
                    <PixelButton small color="#fde68a" disabled={u.disabled || coins < u.price}
                      onClick={() => { setCoins((c) => c - u.price); u.buy(); play("caught"); }}>
                      {u.id === "share" && xpShare ? "OWNED" : `BUY 🪙${u.price}`}
                    </PixelButton>
                  </div>
                ))}
                <div style={{ fontSize: 8, color: "#1f2937", margin: "10px 0 8px", textAlign: "left" }}>👕 Outfits</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {OUTFITS.map((o) => {
                    const owned = ownedOutfits.includes(o.id);
                    const worn = outfit === o.id;
                    return (
                      <button key={o.id}
                        disabled={worn || (!owned && coins < o.price)}
                        onClick={() => {
                          if (!owned) { setCoins((c) => c - o.price); setOwnedOutfits((list) => [...list, o.id]); }
                          setOutfit(o.id); play("caught");
                        }}
                        style={{
                          fontFamily: FONT, fontSize: 6, padding: "6px 2px", borderRadius: 8, cursor: worn ? "default" : "pointer",
                          background: worn ? "#bbf7d0" : "#fff", border: "3px solid " + (worn ? "#166534" : "#1f2937"),
                          opacity: !owned && coins < o.price ? 0.5 : 1, lineHeight: 1.6,
                        }}>
                        <Sprite name="trainer" size={30} colorsOverride={o.colors} />
                        <div>{o.name}</div>
                        <div style={{ color: "#6b7280" }}>{worn ? "WEARING" : owned ? "WEAR" : `🪙${o.price}`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ borderTop: "3px dashed #d1d5db", marginTop: 12, paddingTop: 12 }}>
                <div style={{ fontSize: 8, color: "#6b7280", marginBottom: 8 }}>🤫 Got a SECRET CODE from a grown-up?</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                  <input
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setCodeMsg(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") redeemCode(); }}
                    placeholder="SECRET CODE"
                    style={{
                      fontFamily: FONT, fontSize: 9, padding: 8, width: 150, borderRadius: 8,
                      border: "3px solid #1f2937", outline: "none", textTransform: "uppercase",
                    }}
                  />
                  <PixelButton small color="#fde68a" onClick={redeemCode}>REDEEM</PixelButton>
                </div>
                {codeMsg && (
                  <div style={{ fontSize: 8, marginTop: 8, color: codeMsg.ok ? "#166534" : "#dc2626" }}>{codeMsg.text}</div>
                )}
              </div>
              <div style={{ marginTop: 14 }}>
                <PixelButton small color="#e5e7eb" onClick={() => { setShopOpen(false); setPos({ x: 10, y: 12 }); setCodeMsg(null); }}>LEAVE SHOP</PixelButton>
              </div>
            </Modal>
          )}

          {saveOpen && (
            <Modal wide>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 6 }}>💾 SAVE CODE</div>
              {HAS_STORAGE && <div style={{ fontSize: 6.5, color: saveFailed ? "#b91c1c" : "#15803d", marginBottom: 8 }}>{saveFailed ? "⚠ Auto-save isn't working here — keep this code!" : lastSavedAt ? `✓ Auto-saved at ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Auto-save is on"}</div>}
              <div style={{ fontSize: 8, color: "#6b7280", lineHeight: 1.9, marginBottom: 12 }}>
                This code holds your WHOLE adventure — team, Box, items, resources and eggs.
                Copy it (or download it) and keep it safe. Load it on the title screen to carry on, even on another computer.
              </div>
              {!readSaveCode(currentSaveCode()) && (
                <div data-testid="code-selfcheck" style={{ fontSize: 8, color: "#b91c1c", lineHeight: 1.8, marginBottom: 10 }}>
                  ⚠ This code didn't pass its own check, so it may not load. Your game is still auto-saving on this computer — please tell a grown-up.
                </div>
              )}
              <textarea
                readOnly
                value={currentSaveCode()}
                onFocus={(e) => e.target.select()}
                onClick={(e) => e.target.select()}
                style={{
                  fontFamily: FONT, fontSize: 9, background: "#1f2937", color: "#4ade80",
                  padding: 12, borderRadius: 8, lineHeight: 1.8, width: "100%", height: 96, wordBreak: "break-all",
                  border: "2px solid #4ade80", resize: "none", boxSizing: "border-box", outline: "none",
                }}
              />
              <div style={{ fontSize: 7, color: copyFail ? "#dc2626" : "#9ca3af", marginTop: 8, lineHeight: 1.7 }}>
                {copyFail
                  ? "Couldn't auto-copy here — tap the box above to select it, then copy (Ctrl+C / long-press → Copy)."
                  : "Tip: you can also tap the box to select the whole code."}
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
                <PixelButton small color="#bbf7d0" onClick={copyCode}>{copied ? "✓ COPIED!" : "📋 COPY"}</PixelButton>
                <PixelButton small color="#bfdbfe" onClick={downloadSave}>⬇ DOWNLOAD</PixelButton>
                <PixelButton small color="#e5e7eb" onClick={() => setSaveOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}

          {dashOpen && (
            <Modal wide>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>📊 TRAINING REPORT</div>
              <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 12 }}>(for grown-ups · this session only · press P to toggle)</div>
              <div style={{ fontSize: 8, color: "#1f2937", marginBottom: 12 }}>
                Current Maths Power: {skill}/10
              </div>
              {Object.keys(statsRef.current.ops).length === 0 ? (
                <div style={{ fontSize: 9, color: "#6b7280", lineHeight: 2 }}>No questions answered yet this session — go battle!</div>
              ) : (
                <div>
                  {Object.entries(statsRef.current.ops).map(([op, d]) => (
                    <div key={op} style={{
                      display: "flex", justifyContent: "space-between", fontSize: 8.5,
                      color: "#1f2937", padding: "7px 4px", borderBottom: "2px solid #e5e7eb",
                    }}>
                      <span>{OP_LABELS[op] || op}</span>
                      <span>{d.c}/{d.n} correct ({Math.round((d.c / d.n) * 100)}%) · avg {(d.t / d.n).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <PixelButton small color="#e5e7eb" onClick={() => setDashOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}
          {dexOpen && (
            <Modal wide>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>📕 MATHIMAL-DEX</div>
              <div style={{ fontSize: 7.5, color: "#6b7280", marginBottom: 12 }}>
                Caught {caughtCount}/{SPECIES_LIST.length} · Seen {Object.keys(seen).length}/{SPECIES_LIST.length} · press C to toggle
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {SPECIES_LIST.map((sp) => {
                  const isCaught = caught[sp];
                  const isSeen = seen[sp];
                  const d = DEX[sp];
                  return (
                    <div key={sp} style={{
                      background: isCaught ? "#fff" : "#e5e7eb",
                      border: "3px solid " + (isCaught ? "#1f2937" : "#9ca3af"),
                      borderRadius: 8, padding: "8px 4px", textAlign: "center",
                    }}>
                      <div style={{ filter: isCaught ? "none" : "brightness(0)", opacity: isCaught ? 1 : (isSeen ? 0.45 : 0.18) }}>
                        <Sprite name={d.sprite} size={42} />
                      </div>
                      <div style={{ fontSize: 6.5, marginTop: 5, color: "#1f2937" }}>
                        {isCaught ? d.name : d.legendary ? "LEGEND?" : isSeen ? "???" : "—"}
                      </div>
                      {isCaught && (
                        <div style={{
                          fontSize: 5.5, marginTop: 3, padding: "1px 3px", borderRadius: 3,
                          display: "inline-block", background: TYPE_COLORS[d.type], color: "#1f2937",
                        }}>{d.type.toUpperCase()}</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 16 }}>
                <PixelButton small color="#e5e7eb" onClick={() => setDexOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}

          {boxOpen && (
            <BoxScreen
              team={team} box={box}
              boxToTeam={boxToTeam} swapTeamBox={swapTeamBox} teamToBox={teamToBox}
              onClose={() => setBoxOpen(false)}
            />
          )}

          {tablesOpen && (
            <Modal wide>
              <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>⭐ TIMES-TABLE STARS</div>
              <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 14, lineHeight: 1.7 }}>
                Answer 10 questions from a table correctly to master it! (× and ÷ both count) · press T to toggle
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => {
                  const n = Math.min(10, tables[t] || 0);
                  const done = n >= 10;
                  return (
                    <div key={t} style={{
                      background: done ? "#fef3c7" : "#fff",
                      border: "3px solid " + (done ? "#d97706" : "#1f2937"),
                      borderRadius: 8, padding: "9px 4px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: 13, color: "#1f2937" }}>{done ? "⭐" : "×" + t}</div>
                      <div style={{ fontSize: 7, marginTop: 4, color: "#374151" }}>{done ? `${t}× table` : `${n}/10`}</div>
                      <div style={{ width: "82%", height: 5, background: "#e5e7eb", borderRadius: 3, margin: "5px auto 0", overflow: "hidden" }}>
                        <div style={{ width: `${n * 10}%`, height: "100%", background: done ? "#f59e0b" : "#4ade80" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 7.5, color: "#6b7280", marginTop: 12 }}>
                Mastered: {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((t) => (tables[t] || 0) >= 10).length}/11 · each star earns 25 coins!
              </div>
              <div style={{ marginTop: 14 }}>
                <PixelButton small color="#e5e7eb" onClick={() => setTablesOpen(false)}>CLOSE</PixelButton>
              </div>
            </Modal>
          )}

          {cardOpen && (() => {
            const qOps = Object.values(statsRef.current.ops);
            const qN = qOps.reduce((s, d) => s + d.n, 0);
            const qC = qOps.reduce((s, d) => s + d.c, 0);
            const shinies = [...team, ...box].filter((mn) => mn.shiny).length;
            const stars = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((t) => (tables[t] || 0) >= 10).length;
            const row = (label, value) => (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8.5, color: "#1f2937", padding: "6px 2px", borderBottom: "2px dashed #e5e7eb" }}>
                <span>{label}</span><span>{value}</span>
              </div>
            );
            return (
              <Modal>
                <div style={{
                  background: "linear-gradient(135deg, #1e3a8a, #4c1d95)", margin: -22, marginBottom: 12,
                  padding: "16px 22px 12px", borderRadius: "10px 10px 0 0",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <Sprite name="trainer" size={54} colorsOverride={outfitColors(outfit)} />
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: "#fde047" }}>{playerName}</div>
                    <div style={{ fontSize: 8, color: "#c4b5fd", marginTop: 5 }}>
                      {champion ? "👑 GRAND CHAMPION" : badge2 ? "🏆 Champion" : badge1 ? "🔢 Badge Holder" : "Rookie Trainer"}
                    </div>
                    <div style={{ fontSize: 9, marginTop: 5 }}>{badge1 && "🔢"}{badge2 && "🏆"}{champion && "👑"}{TOPICS.filter((t) => topicBadges[t.id]).map((t) => t.emoji).join("")}</div>
                  </div>
                </div>
                {row("Mathimal-Dex", `${caughtCount}/${SPECIES_LIST.length} caught`)}
                {row("Table stars", `${stars}/11 ⭐`)}
                {row("Medals", `${medals.length}/${MEDALS.length} 🏅`)}
                {row("Topic badges", TOPICS.some((t) => topicBadges[t.id]) ? TOPICS.filter((t) => topicBadges[t.id]).map((t) => t.emoji).join(" ") : "—")}
                {row("Best tower floor", towerBest ? `Floor ${towerBest} 🏢` : "—")}
                {row("Shinies owned", shinies ? `${shinies} ✨` : "—")}
                {row("Coins", `🪙 ${coins}`)}
                {row("Strongest Mathimal", team.length ? `${displayName(team.reduce((a, b) => (b.level > a.level ? b : a)))} Lv${topLevel}` : "—")}
                {qmode === "gk"
                  ? row("Brain Power", `${power}/10 · ${gkCorrect} right`)
                  : row("Maths Power", `${skill}/10`)}
                {row("Duels", duelRec.w + duelRec.l ? `${duelRec.w} won · ${duelRec.l} lost${duelRec.s > 1 ? ` · 🔥 ${duelRec.s} in a row` : ""}` : "—")}
                {row("Battles won today", sessionWins)}
                <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between", marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 7.5, color: "#1f2937" }}>BATTLE QUESTIONS</span>
                  <span style={{ display: "flex", gap: 5 }}>
                    {[["maths", "🔢 Maths"], ["gk", "🧠 General knowledge"]].map(([id, label]) => (
                      <button key={id} data-testid={"card-mode-" + id}
                        onClick={() => { play("select"); setQmode(id); }}
                        style={{
                          fontFamily: FONT, fontSize: 7, padding: "5px 8px", cursor: "pointer", borderRadius: 6,
                          background: qmode === id ? "#4ade80" : "#f3f4f6", border: qmode === id ? "2px solid #166534" : "2px solid #9ca3af",
                        }}>{label}</button>
                    ))}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 7.5, color: "#1f2937" }}>NAME</span>
                  <input
                    data-testid="card-name"
                    defaultValue={playerName}
                    maxLength={NAME_MAX}
                    onBlur={(e) => setPlayerName(cleanName(e.target.value))}
                    onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                    style={{ fontFamily: FONT, fontSize: 8, padding: "5px 7px", width: 150, borderRadius: 6, border: "2px solid #9ca3af", textTransform: "uppercase" }}
                  />
                </div>
                {row("Questions today", qN ? `${qC}/${qN} (${Math.round((qC / qN) * 100)}%)` : "—")}
                <div style={{ fontSize: 6.5, color: "#9ca3af", marginTop: 8, textAlign: "right" }}>
                  Mathimal Quest {GAME_VERSION}{HAS_STORAGE ? " · auto-save on" : " · use 💾 save codes"}
                </div>
                <div style={{ marginTop: 14 }}>
                  <PixelButton small color="#e5e7eb" onClick={() => setCardOpen(false)}>CLOSE</PixelButton>
                </div>
              </Modal>
            );
          })()}

          {medalsOpen && (() => {
            const ctx = medalCtx();
            return (
              <Modal wide>
                <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>🏅 MEDALS</div>
                <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 10 }}>
                  {medals.length}/{MEDALS.length} earned · every medal pays coins · press M to toggle
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                  {TOPICS.map((tp) => {
                    const won = topicBadges[tp.id], n = topicProgress[tp.id] || 0;
                    return (
                      <div key={tp.id} style={{
                        background: won ? "#dcfce7" : "#f3f4f6", border: "3px solid " + (won ? "#15803d" : "#9ca3af"),
                        borderRadius: 8, padding: "6px 3px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 14, filter: won ? "none" : "grayscale(1)", opacity: won ? 1 : 0.5 }}>{tp.emoji}</div>
                        <div style={{ fontSize: 6.5, color: "#1f2937", marginTop: 3 }}>{tp.badge}</div>
                        <div style={{ fontSize: 6, color: "#6b7280", marginTop: 3 }}>{won ? `level ${progressTier(n)}/3` : `${["Meadow", "Ember Caves", "Frozen Peaks"][tp.region]}`}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, maxHeight: 300, overflowY: "auto", paddingRight: 4 }}>
                  {MEDALS.map((m) => {
                    const got = medals.includes(m.id);
                    const [cur, max] = medalProgress(m, ctx);
                    return (
                      <div key={m.id} title={m.desc} style={{
                        background: got ? "#fef3c7" : "#fff", border: "3px solid " + (got ? "#d97706" : "#d1d5db"),
                        borderRadius: 8, padding: "6px 3px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 15, filter: got ? "none" : "grayscale(1)", opacity: got ? 1 : 0.35 }}>{m.emoji}</div>
                        <div style={{ fontSize: 6.5, color: "#1f2937", marginTop: 3, lineHeight: 1.4 }}>{m.name}</div>
                        <div style={{ fontSize: 5.5, color: "#6b7280", marginTop: 3, lineHeight: 1.5 }}>{m.desc}</div>
                        {got ? (
                          <div style={{ fontSize: 5.5, color: "#b45309", marginTop: 3 }}>✓ +{m.coins}🪙</div>
                        ) : max > 1 ? (
                          <div style={{ width: "80%", height: 4, background: "#e5e7eb", borderRadius: 2, margin: "4px auto 0", overflow: "hidden" }}>
                            <div style={{ width: `${(cur / max) * 100}%`, height: "100%", background: "#4ade80" }} />
                          </div>
                        ) : (
                          <div style={{ fontSize: 5.5, color: "#9ca3af", marginTop: 3 }}>🪙{m.coins}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}>
                  <PixelButton small color="#e5e7eb" onClick={() => setMedalsOpen(false)}>CLOSE</PixelButton>
                </div>
              </Modal>
            );
          })()}
        </div>
      </div>
      <div style={{
        position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center",
        fontFamily: FONT, fontSize: 7.5, color: "#64748b",
      }}>
        WASD move · grass=wild · ⛏ mine · 🔨 craft · C=Dex · B=Box · T=Tables · M=Medals · I=Card · G=together{connected ? " · E=emote" : ""} · H=HUD · P=report
      </div>
    </Frame>
  );
}

const hudBtn = {
  fontFamily: FONT, fontSize: 7, padding: "5px 7px", background: "#334155",
  color: "#e2e8f0", border: "2px solid #64748b", borderRadius: 6, cursor: "pointer",
};

/* ---------------- Celebration screen ---------------- */

function BoxScreen({ team, box, boxToTeam, swapTeamBox, teamToBox, onClose }) {
  const [pickBox, setPickBox] = useState(null); // box index awaiting a team slot to swap

  function chooseBox(i) {
    if (team.length < 4) {
      boxToTeam(i);
      play("select");
    } else {
      setPickBox(i);
      play("select");
    }
  }
  function chooseTeamForSwap(ti) {
    if (pickBox === null) return;
    swapTeamBox(ti, pickBox);
    setPickBox(null);
    play("caught");
  }

  const cell = (mon, onClick, highlight, sub) => {
    const v = monVisual(mon);
    return (
      <button onClick={onClick} disabled={!onClick} style={{
        background: highlight ? "#fde68a" : "#fff",
        border: "3px solid " + (highlight ? "#d97706" : "#1f2937"),
        borderRadius: 8, padding: "6px 4px", cursor: onClick ? "pointer" : "default",
        textAlign: "center", fontFamily: FONT, minWidth: 76,
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Sprite name={v.sprite} size={40} hue={v.hue} colorsOverride={v.colorsOverride} />
          {mon.shiny && <div style={{ position: "absolute", top: -3, right: -3, fontSize: 9 }}>✨</div>}
        </div>
        <div style={{ fontSize: 6.5, marginTop: 3, color: "#1f2937" }}>{displayName(mon)}</div>
        <div style={{ fontSize: 6, marginTop: 2, color: "#6b7280" }}>{sub}</div>
      </button>
    );
  };

  return (
    <Modal wide>
      <div style={{ fontSize: 11, color: "#1f2937", marginBottom: 4 }}>🗃 MATHIMAL BOX</div>
      <div style={{ fontSize: 7, color: "#6b7280", marginBottom: 12, lineHeight: 1.7 }}>
        {pickBox === null
          ? (team.length < 4
              ? "Tap a boxed Mathimal to add it to your team. Tap a team member to send it to the box."
              : "Team is full! Tap a boxed Mathimal, then tap the team member to swap it with.")
          : "Now tap the TEAM member you want to swap out →"}
      </div>

      <div style={{ fontSize: 8, color: "#1f2937", marginBottom: 6, textAlign: "left" }}>YOUR TEAM ({team.length}/4)</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
        {team.map((m, i) =>
          <span key={m.id}>
            {cell(
              m,
              pickBox !== null ? () => chooseTeamForSwap(i) : (team.length > 1 ? () => teamToBox(i) : null),
              pickBox !== null,
              `Lv${m.level}`
            )}
          </span>
        )}
      </div>

      <div style={{ fontSize: 8, color: "#1f2937", marginBottom: 6, textAlign: "left" }}>BOX ({box.length})</div>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", maxHeight: 150, overflowY: "auto" }}>
        {box.length === 0
          ? <div style={{ fontSize: 8, color: "#9ca3af", padding: 12 }}>Box is empty — catch more Mathimals!</div>
          : box.map((m, i) =>
              <span key={m.id}>
                {cell(m, () => chooseBox(i), pickBox === i, `Lv${m.level}`)}
              </span>
            )}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, justifyContent: "center" }}>
        {pickBox !== null && (
          <PixelButton small color="#fecaca" onClick={() => setPickBox(null)}>CANCEL SWAP</PixelButton>
        )}
        <PixelButton small color="#e5e7eb" onClick={onClose}>CLOSE</PixelButton>
      </div>
    </Modal>
  );
}

function CelebrationScreen({ title, subtitle, icon, gold, onContinue }) {
  return (
    <div style={{
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden",
      background: gold
        ? "radial-gradient(circle at 50% 35%, #92400e, #1c1917 75%)"
        : "radial-gradient(circle at 50% 35%, #4c1d95, #1e1b4b 75%)",
    }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: -20, left: `${(i * 137) % 100}%`,
          width: 9, height: 9, background: ["#fde047", "#4ade80", "#38bdf8", "#f472b6"][i % 4],
          animation: `confetti ${2 + (i % 5) * 0.45}s ${(i % 7) * 0.3}s linear infinite`,
        }} />
      ))}
      <div style={{
        width: 112, height: 112, borderRadius: "50%",
        background: "conic-gradient(#fde047, #f59e0b, #fde047, #f59e0b, #fde047)",
        border: "5px solid #92400e", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 36px #fde047", animation: "popIn 0.7s",
      }}>
        <div style={{ fontFamily: FONT, fontSize: 32, color: "#78350f" }}>{icon}</div>
      </div>
      <div style={{ fontFamily: FONT, fontSize: 16, color: "#fde047", marginTop: 26, textAlign: "center", lineHeight: 1.9, whiteSpace: "pre-line" }}>
        {title}
      </div>
      <div style={{ fontFamily: FONT, fontSize: 8.5, color: "#e9d5ff", marginTop: 16, textAlign: "center", lineHeight: 2.1, whiteSpace: "pre-line" }}>
        {subtitle}
      </div>
      <button onClick={onContinue}
        style={{
          marginTop: 26, fontFamily: FONT, fontSize: 11, padding: "13px 20px",
          background: "#fde047", border: "3px solid #92400e", borderRadius: 10, cursor: "pointer",
        }}>
        KEEP EXPLORING ▶
      </button>
    </div>
  );
}

/* ---------------- Outer frame ---------------- */

function Frame({ children, muted, setMuted }) {
  return (
    <div style={{
      width: "100%", height: "100vh", minHeight: 560, background: "#0f172a",
      display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
    }}>
      <style>{GLOBAL_CSS}</style>
      <div style={{
        width: "min(96vw, 1060px)", height: "min(92vh, 700px)", position: "relative",
        border: "6px solid #334155", borderRadius: 18, overflow: "hidden",
        boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
      }}>
        {children}
        <button
          onClick={() => { MUTED = !MUTED; setMuted(MUTED); }}
          style={{
            position: "absolute", top: 8, right: 8, zIndex: 50, fontFamily: FONT, fontSize: 9,
            background: "rgba(15,23,42,0.85)", color: "#e2e8f0", border: "2px solid #475569",
            borderRadius: 8, padding: "6px 9px", cursor: "pointer",
          }}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </div>
  );
}

/* =====================================================================
   3D VOXEL RENDERER (v4) — the game logic above is unchanged; these
   classes only DRAW the world and battles in 3D, using Three.js.
   ===================================================================== */

let _webglOk = null;
function hasWebGL() {
  if (_webglOk !== null) return _webglOk;
  try {
    const c = document.createElement("canvas");
    // The bundled Three.js renderer needs WebGL 2; WebGL 1-only computers use the 2D view
    _webglOk = !!(window.WebGL2RenderingContext && c.getContext && c.getContext("webgl2"));
  } catch (e) { _webglOk = false; }
  return _webglOk;
}

const BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);

function srand(a, b, c = 0) {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
}
const pickC = (arr, r) => arr[Math.floor(r * arr.length) % arr.length];

/* A list of coloured boxes that becomes ONE InstancedMesh (one draw call). */
class VoxBatch {
  constructor() { this.items = []; }
  add(x, y, z, sx, sy, sz, color, rotY = 0) { this.items.push([x, y, z, sx, sy, sz, color, rotY]); return this; }
  build(material, cast = true, receive = true) {
    const n = this.items.length;
    const mesh = new THREE.InstancedMesh(BOX_GEO, material, Math.max(1, n));
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const it = this.items[i];
      p.set(it[0], it[1], it[2]); s.set(it[3], it[4], it[5]); q.setFromAxisAngle(UP, it[7]);
      m.compose(p, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.set(it[6]));
    }
    mesh.count = n;
    mesh.castShadow = cast; mesh.receiveShadow = receive;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    return mesh;
  }
}

/* Turn a 12x12 pixel sprite into a chunky voxel figure: pixels are extruded,
   thicker towards the middle of the silhouette so the model looks rounded.
   Eyes/mouth ("k") are painted on the FRONT face only. */
function spriteToModel(sprite, { colorsOverride = null, hue = 0, height = 1 } = {}) {
  const colors = { ...sprite.colors, ...(colorsOverride || {}) };
  const rows = sprite.rows, H = rows.length, W = rows[0].length;
  const isF = (x, y) => y >= 0 && y < H && x >= 0 && x < W && colors[rows[y][x]] !== undefined;
  const dist = Array.from({ length: H }, () => Array(W).fill(0));
  const queue = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isF(x, y)) continue;
    if (!isF(x - 1, y) || !isF(x + 1, y) || !isF(x, y - 1) || !isF(x, y + 1)) { dist[y][x] = 1; queue.push([x, y]); }
    else dist[y][x] = 99;
  }
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (isF(nx, ny) && dist[ny][nx] > dist[y][x] + 1) { dist[ny][nx] = dist[y][x] + 1; queue.push([nx, ny]); }
    }
  }
  const tint = (hex) => {
    const c = new THREE.Color(hex);
    if (hue) c.offsetHSL(hue / 360, 0.1, 0.03);
    return c.getHex();
  };
  const u = height / H;
  const b = new VoxBatch();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = rows[y][x];
    if (colors[ch] === undefined) continue;
    const d = Math.min(dist[y][x], 3) * 2 - 1;
    const px = (x - (W - 1) / 2) * u, py = (H - 1 - y) * u + u / 2;
    if (ch === "k" && y < H * 0.75) {
      let body = null;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [0, 2], [0, -2]]) {
        const c2 = rows[y + dy] && rows[y + dy][x + dx];
        if (c2 && c2 !== "k" && colors[c2] !== undefined) { body = colors[c2]; break; }
      }
      b.add(px, py, 0, u, u, d * u, tint(body || colors[ch]));
      b.add(px, py, (d * u) / 2 + u * 0.04, u * 0.98, u * 0.98, u * 0.1, tint(colors[ch]));
    } else {
      b.add(px, py, 0, u, u, d * u, tint(colors[ch]));
    }
  }
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const mesh = b.build(mat, true, false);
  const group = new THREE.Group();
  group.add(mesh);
  return { group, mat, mesh, height };
}

function disposeObject(obj) {
  if (!obj) return;
  obj.traverse((o) => {
    if (o.isMesh || o.isPoints || o.isInstancedMesh) {
      if (o.geometry && o.geometry !== BOX_GEO) o.geometry.dispose();
      if (o.isInstancedMesh && o.dispose) o.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      mats.forEach((m) => m && !m.userData.shared && m.dispose());
    }
    if (o.isSprite && o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
  });
  if (obj.parent) obj.parent.remove(obj);
}

/* Ambient particles: snow, embers, fireflies, stars */
class Ambient {
  constructor(kind, count) {
    this.kind = kind;
    const geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(count * 3);
    this.seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      this.pos[i * 3] = (Math.random() - 0.5) * 30;
      this.pos[i * 3 + 1] = Math.random() * 9;
      this.pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
      this.seed[i] = Math.random() * 100;
    }
    if (kind === "stars") {
      for (let i = 0; i < count; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.random() * 0.45 + 0.05;
        this.pos[i * 3] = Math.cos(th) * Math.cos(ph) * 90;
        this.pos[i * 3 + 1] = Math.sin(ph) * 90 + 6;
        this.pos[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * 90 - 20;
      }
    }
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    const style = {
      snow: { color: 0xffffff, size: 0.09, blend: THREE.NormalBlending, opacity: 0.9 },
      embers: { color: 0xff9a3c, size: 0.08, blend: THREE.AdditiveBlending, opacity: 0.9 },
      fireflies: { color: 0xfff27a, size: 0.09, blend: THREE.AdditiveBlending, opacity: 1 },
      stars: { color: 0xffffff, size: 0.55, blend: THREE.AdditiveBlending, opacity: 0.9 },
    }[kind];
    this.mat = new THREE.PointsMaterial({
      color: style.color, size: style.size, sizeAttenuation: true, transparent: true,
      opacity: style.opacity, depthWrite: false, blending: style.blend, fog: kind !== "stars",
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false;
    this.count = count;
  }
  update(dt, t, cx, cz) {
    if (this.kind === "stars") { this.mat.opacity = 0.65 + Math.sin(t * 1.3) * 0.1; return; }
    const p = this.pos;
    for (let i = 0; i < this.count; i++) {
      const s = this.seed[i];
      if (this.kind === "snow") { p[i * 3 + 1] -= dt * (0.5 + (s % 1) * 0.4); p[i * 3] += Math.sin(t + s) * dt * 0.25; }
      else if (this.kind === "embers") { p[i * 3 + 1] += dt * (0.35 + (s % 1) * 0.4); p[i * 3] += Math.sin(t * 2 + s) * dt * 0.3; }
      else { p[i * 3] += Math.sin(t * 0.7 + s) * dt * 0.4; p[i * 3 + 1] = 0.4 + (Math.sin(t * 0.9 + s * 3) + 1) * 0.6; p[i * 3 + 2] += Math.cos(t * 0.6 + s) * dt * 0.4; }
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] += 9;
      if (p[i * 3 + 1] > 9) p[i * 3 + 1] -= 9;
      // keep particles around the camera focus
      if (p[i * 3] < cx - 15) p[i * 3] += 30; else if (p[i * 3] > cx + 15) p[i * 3] -= 30;
      if (p[i * 3 + 2] < cz - 12) p[i * 3 + 2] += 24; else if (p[i * 3 + 2] > cz + 12) p[i * 3 + 2] -= 24;
    }
    if (this.kind === "fireflies") this.mat.opacity = 0.6 + Math.sin(t * 3) * 0.4;
    this.points.geometry.attributes.position.needsUpdate = true;
  }
}

/* Quality steps: the game starts high and steps down by itself if frames drop. */
const QUALITY = { level: 2, steps: [
  { pr: 0.6, shadow: 512 },
  { pr: 1, shadow: 1024 },
  { pr: () => Math.min(window.devicePixelRatio || 1, 2), shadow: 2048 },
] };

/* Shared renderer/loop plumbing. Each scene is a long-lived singleton whose
   canvas is attached to whichever React container is currently showing. */
class VoxScene {
  constructor(fov) {
    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.domElement.style.cssText = "display:block;width:100%;height:100%";
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(fov, 1.6, 0.1, 300);
    this.clock = new THREE.Clock();
    this.time = 0;
    this.tweens = [];
    this.container = null;
    this.resize = () => {
      if (!this.container) return;
      const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
      r.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };
    this.ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(this.resize) : null;
  }
  attach(container) {
    this.container = container;
    container.appendChild(this.renderer.domElement);
    if (this.ro) this.ro.observe(container);
    this.resize();
    this.clock.getDelta();
    this.applyQuality();
    this.perf = { frames: 0, time: 0, warm: 0 };
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const raw = this.clock.getDelta();
      const dt = Math.min(0.05, raw);
      this.time += dt;
      this.watchFps(raw);
      this.update(dt);
      this.tweens = this.tweens.filter((tw) => tw(dt) !== false);
      this.renderer.render(this.scene, this.camera);
    };
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(loop);
  }
  applyQuality() {
    const q = QUALITY.steps[QUALITY.level];
    this.renderer.setPixelRatio(typeof q.pr === "function" ? q.pr() : q.pr);
    this.scene.traverse((o) => {
      if (o.isLight && o.castShadow && o.shadow.mapSize.x !== q.shadow) {
        o.shadow.mapSize.set(q.shadow, q.shadow);
        if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
      }
    });
    this.qualityApplied = QUALITY.level;
    this.resize();
  }
  watchFps(raw) {
    if (this.qualityApplied !== QUALITY.level) this.applyQuality();
    const pf = this.perf;
    pf.warm += raw;
    if (pf.warm < 1.2) return; // ignore start-up (shaders compiling)
    pf.frames++; pf.time += raw;
    if (pf.time >= 1.5) {
      const fps = pf.frames / pf.time;
      pf.frames = 0; pf.time = 0;
      if (fps < 26 && QUALITY.level > 0) { QUALITY.level--; this.applyQuality(); pf.warm = 0; }
    }
  }
  detach() {
    cancelAnimationFrame(this.raf);
    if (this.ro && this.container) this.ro.unobserve(this.container);
    if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    this.container = null;
  }
  tween(duration, fn, done) {
    let t = 0;
    this.tweens.push((dt) => {
      t += dt;
      const k = Math.min(1, t / duration);
      fn(k);
      if (k >= 1) { if (done) done(); return false; }
      return true;
    });
  }
  update() {}
}

const REGION_LOOK = [
  { sky: 0x9fd8f5, night: 0x0b1633, base: 0x5aa548, sunC: 0xfff0d2, sunI: 2.6, hemiSky: 0xffffff, hemiGround: 0x5f8a45, hemiI: 1.5, fog: [18, 42] },
  { sky: 0x2c1b17, night: 0x150c0b, base: 0x2e2622, sunC: 0xffb07a, sunI: 1.5, hemiSky: 0xffcfa8, hemiGround: 0x3b2a22, hemiI: 1.1, fog: [12, 32] },
  { sky: 0xcfe7f6, night: 0x0c1a35, base: 0xdbe9f3, sunC: 0xffffff, sunI: 2.3, hemiSky: 0xffffff, hemiGround: 0xbcd3e6, hemiI: 1.5, fog: [18, 42] },
];

/* ---------------------------- WORLD ---------------------------- */

/* A camera-facing text label (name tags, emote bubbles) drawn onto a canvas */
function textSprite(text, color, px = 44) {
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  const font = `${px}px "Press Start 2P", monospace`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + px;
  c.width = w; c.height = Math.ceil(px * 1.7);
  ctx.font = font;
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  if (color) {
    ctx.fillStyle = "rgba(15,23,42,0.78)";
    const r = c.height / 2;
    ctx.beginPath(); ctx.moveTo(r, 0); ctx.arcTo(w, 0, w, c.height, r); ctx.arcTo(w, c.height, 0, c.height, r); ctx.arcTo(0, c.height, 0, 0, r); ctx.arcTo(0, 0, w, 0, r); ctx.fill();
    ctx.fillStyle = color;
  }
  ctx.fillText(text, w / 2, c.height / 2 + 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.renderOrder = 10;
  const h = 0.32;
  sp.scale.set((h * c.width) / c.height, h, 1);
  return sp;
}

class WorldScene extends VoxScene {
  constructor() {
    super(42);
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x5f8a45, 1.5);
    s.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d2, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 });
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    s.add(this.sun, this.sun.target);
    this.lantern = new THREE.PointLight(0xffc477, 0, 9, 1.6);
    s.add(this.lantern);
    this.mapGroup = new THREE.Group();
    s.add(this.mapGroup);
    this.player = { group: new THREE.Group(), from: new THREE.Vector3(), to: new THREE.Vector3(), t: 1, angle: 0, targetAngle: 0, lastX: null, lastZ: null };
    s.add(this.player.group);
    this.trainerModel = null;
    this.mountModel = null;
    this.rivalGroup = null;
    this.region = -1;
    this.nightAmt = 0;
    this.nightTarget = 0;
    this.snapNext = true;
    this.camTarget = new THREE.Vector3();
    this.ambient = [];
    this.setTrainer(null);
  }

  setTrainer(colorsOverride) {
    const key = JSON.stringify(colorsOverride || {});
    if (this.trainerKey === key) return;
    this.trainerKey = key;
    if (this.trainerModel) disposeObject(this.trainerModel.group);
    this.trainerModel = spriteToModel(SPRITES.trainer, { colorsOverride, height: 1.05 });
    this.player.group.add(this.trainerModel.group);
    this.layoutRider();
  }

  setMount(visual) {
    const key = visual ? JSON.stringify(visual) : "";
    if (this.mountKey === key) return;
    this.mountKey = key;
    if (this.mountModel) { disposeObject(this.mountModel.group); this.mountModel = null; }
    if (visual) {
      this.mountModel = spriteToModel(SPRITES[visual.sprite], { colorsOverride: visual.colorsOverride, hue: visual.hue, height: 1.0 });
      this.player.group.add(this.mountModel.group);
    }
    this.layoutRider();
  }

  layoutRider() {
    if (this.trainerModel) this.trainerModel.group.position.y = this.mountModel ? 0.62 : 0;
  }

  setRival(spot) {
    if (this.rivalGroup) { disposeObject(this.rivalGroup); this.rivalGroup = null; }
    this.rivalMark = null;
    if (!spot) return;
    const g = new THREE.Group();
    const m = spriteToModel(SPRITES.rival, { height: 1.05 });
    g.add(m.group);
    const mark = new VoxBatch().add(0, 0.16, 0, 0.1, 0.24, 0.1, 0xfde047).add(0, -0.04, 0, 0.1, 0.08, 0.1, 0xfde047)
      .build(new THREE.MeshBasicMaterial({ color: 0xffffff }), false, false);
    mark.position.y = 1.45;
    mark.userData.bob = true;
    g.add(mark);
    g.position.set(spot.x, 0, spot.y);
    this.rivalGroup = g;
    this.rivalMark = mark;
    this.scene.add(g);
  }

  setNight(night) { this.nightTarget = night ? 1 : 0; }

  /* The other player: a second trainer that glides between the tiles it is told about */
  setPartner(info) {
    const key = info ? JSON.stringify([info.colors, info.mount, info.name]) : "";
    if (!info) {
      if (this.partner) { disposeObject(this.partner.group); this.partner = null; this.partnerKey = ""; }
      return;
    }
    if (this.partnerKey !== key) {
      const old = this.partner;
      if (old && old.emote) old.group.remove(old.emote); // keep a live emote bubble across the rebuild
      if (old) disposeObject(old.group);
      const g = new THREE.Group();
      const body = new THREE.Group();
      g.add(body);
      const tm = spriteToModel(SPRITES.trainer, { colorsOverride: info.colors, height: 1.05 });
      body.add(tm.group);
      if (info.mount && SPRITES[info.mount.sprite]) {
        const mm = spriteToModel(SPRITES[info.mount.sprite], { colorsOverride: info.mount.colorsOverride, hue: info.mount.hue, height: 1.0 });
        body.add(mm.group);
        tm.group.position.y = 0.62;
      }
      const tag = textSprite(info.name, "#fde047");
      tag.position.y = info.mount ? 2.05 : 1.55;
      g.add(tag);
      this.partner = { group: g, body, tag, x: old ? old.x : info.x, z: old ? old.z : info.y, angle: old ? old.angle : 0, emote: null };
      if (old && old.emote) { this.partner.emote = old.emote; g.add(old.emote); }
      g.position.set(this.partner.x, 0, this.partner.z);
      this.scene.add(g);
      this.partnerKey = key;
    }
    this.partner.tx = info.x; this.partner.tz = info.y;
    this.partner.tagY = info.mount ? 2.05 : 1.55;
  }

  /* Emote bubble above "me" or "partner" (null clears it) */
  setEmote(who, e) {
    const owner = who === "me" ? this.player : this.partner;
    if (!owner) return;
    if (owner.emote) { owner.group.remove(owner.emote); disposeObject(owner.emote); owner.emote = null; }
    if (!e) return;
    const sp = textSprite(e, null, 96);
    sp.scale.multiplyScalar(1.6);
    sp.position.y = (who === "me" ? (this.mountModel ? 2.2 : 1.75) : (owner.tagY || 1.55) + 0.55);
    owner.group.add(sp);
    owner.emote = sp;
  }

  setRegion(map, region) {
    if (this.region === region) return;
    this.region = region;
    this.snapNext = true;
    while (this.mapGroup.children.length) disposeObject(this.mapGroup.children[0]);
    this.ambient.forEach((a) => disposeObject(a.points));
    this.ambient = [];
    const look = REGION_LOOK[region];
    this.look = look;
    this.scene.fog = new THREE.Fog(look.sky, look.fog[0], look.fog[1]);
    this.scene.background = new THREE.Color(look.sky);
    this.hemi.color.set(look.hemiSky);
    this.hemi.groundColor.set(look.hemiGround);
    this.sun.color.set(look.sunC);
    this.buildMap(map, region);
    const rows = map.length, cols = map[0].length;
    this.rows = rows; this.cols = cols;
    this.sun.target.position.set(cols / 2, 0, rows / 2);
    this.sun.position.set(cols / 2 + 7, 16, rows / 2 + 9);
    // ambience
    if (region === 2) this.addAmbient("snow", 260);
    if (region === 1) this.addAmbient("embers", 160);
    if (region === 0) this.addAmbient("fireflies", 70);
    if (region !== 1) this.addAmbient("stars", 400);
  }

  addAmbient(kind, n) {
    const a = new Ambient(kind, n);
    this.ambient.push(a);
    this.scene.add(a.points);
  }

  buildMap(map, region) {
    const S = new VoxBatch(), G = new VoxBatch(), Wt = new VoxBatch(), L = new VoxBatch();
    const blades = [];
    const rows = map.length, cols = map[0].length;
    const PAL = {
      grass: ["#6dbb58", "#73c25e", "#68b552", "#78c964"], dirt: "#7b5233",
      tall: ["#4f9d43", "#55a449"], bladeC: ["#2f8a3a", "#3a9a44", "#2a7d34", "#46a84d"],
      path: ["#e2c48d", "#dcbc82", "#e8cc98"],
      rock: ["#5c5650", "#57514b", "#635c55"], rockDirt: "#3a3430",
      ash: ["#3f3a34", "#45403a"], ashBlade: ["#5d7a1f", "#6b8a22", "#4f6a1a"],
      snow: ["#f3f8fc", "#eaf2f8", "#f7fbfe", "#e4eef6"], snowDirt: "#9fb6c8",
      snowBlade: ["#9cc8f0", "#b5d8f5", "#86b9e6"],
      leaf: ["#2e7d32", "#357f37", "#3c8f3e", "#2a6f2e", "#43973f"],
    };
    const ground = (x, z, cap, dirt, top = 0) => {
      S.add(x, top - 0.7, z, 1, 1.0, 1, dirt);
      S.add(x, top - 0.1, z, 1, 0.2, 1, cap);
    };
    const regionGround = (x, z, r) => {
      if (region === 0) ground(x, z, pickC(PAL.path, r), PAL.dirt, -0.04);
      else if (region === 1) ground(x, z, pickC(PAL.rock, r), PAL.rockDirt);
      else ground(x, z, pickC(PAL.snow, r), PAL.snowDirt);
    };
    const addBlades = (x, z, n, colors, hMin, hMax, seed) => {
      for (let i = 0; i < n; i++) {
        const a = srand(x, z, seed + i), b2 = srand(z, x, seed + i * 3);
        const h = hMin + srand(x + i, z, seed + 5) * (hMax - hMin);
        blades.push({ x: x - 0.38 + a * 0.76, z: z - 0.38 + b2 * 0.76, h, w: 0.075, color: pickC(colors, srand(i, x + z, seed)), phase: a * 6.28 });
      }
    };
    const building = (x, z, w, h, wall, trim, roof) => {
      S.add(x, h / 2, z, w, h, w, wall);
      S.add(x, h + 0.05, z, w + 0.1, 0.1, w + 0.1, trim);
      S.add(x, h + 0.18, z, w * 0.82, 0.16, w * 0.82, roof);
    };

    for (let z = 0; z < rows; z++) for (let x = 0; x < cols; x++) {
      const ch = map[z][x];
      const r = srand(x, z, region), r2 = srand(x + 3, z + 7, region + 2);
      const south = z === rows - 1;
      switch (ch) {
        case "G": ground(x, z, pickC(PAL.grass, r), PAL.dirt); break;
        case "T": ground(x, z, pickC(PAL.tall, r), PAL.dirt); addBlades(x, z, 7, PAL.bladeC, 0.32, 0.6, 1); break;
        case "F": {
          ground(x, z, pickC(PAL.grass, r), PAL.dirt);
          const fc = ["#f472b6", "#fde047", "#ffffff", "#fb7185", "#a78bfa"];
          for (let i = 0; i < 4; i++) {
            const fx = x - 0.3 + srand(x, z, i) * 0.6, fz = z - 0.3 + srand(z, x, i) * 0.6;
            S.add(fx, 0.1, fz, 0.04, 0.2, 0.04, "#2f7d32");
            S.add(fx, 0.22, fz, 0.13, 0.08, 0.13, pickC(fc, srand(i, x, z)));
          }
          break;
        }
        case "P": ground(x, z, pickC(PAL.path, r), PAL.dirt, -0.04); break;
        case "W":
          S.add(x, -0.8, z, 1, 0.8, 1, "#6b5135");
          Wt.add(x, -0.27, z, 1, 0.26, 1, r > 0.5 ? "#3d9ee0" : "#3797d8");
          break;
        case "X":
          ground(x, z, pickC(PAL.grass, r), PAL.dirt);
          if (south) {
            S.add(x, 0.26, z, 0.92, 0.52, 0.92, pickC(PAL.leaf, r));
            S.add(x + 0.15, 0.58, z - 0.1, 0.5, 0.2, 0.5, pickC(PAL.leaf, r2));
          } else {
            const h0 = 0.95 + r * 0.45;
            S.add(x, h0 / 2, z, 0.26, h0, 0.26, "#7a5230");
            S.add(x, h0 + 0.2, z, 0.98, 0.72, 0.98, pickC(PAL.leaf, r));
            S.add(x + (r2 - 0.5) * 0.3, h0 + 0.68, z + (r - 0.5) * 0.3, 0.66, 0.5, 0.66, pickC(PAL.leaf, r2));
            S.add(x - 0.22, h0 + 0.05, z + 0.26, 0.5, 0.42, 0.5, pickC(PAL.leaf, srand(z, x, 4)));
          }
          break;
        case "H":
          regionGround(x, z, r);
          S.add(x, 0.4, z, 0.86, 0.8, 0.86, "#fdf3d8");
          S.add(x, 0.88, z, 1.08, 0.16, 1.08, "#ec4899");
          S.add(x, 1.04, z, 0.82, 0.16, 0.82, "#f472b6");
          S.add(x, 1.2, z, 0.54, 0.16, 0.54, "#ec4899");
          S.add(x, 1.34, z, 0.26, 0.14, 0.26, "#db2777");
          S.add(x, 0.21, z + 0.44, 0.28, 0.42, 0.06, "#7c2d12");
          G.add(x, 0.62, z + 0.44, 0.22, 0.18, 0.05, "#ff5fa8");
          G.add(x - 0.27, 0.5, z + 0.44, 0.15, 0.15, 0.05, "#fff3b0");
          G.add(x + 0.27, 0.5, z + 0.44, 0.15, 0.15, 0.05, "#fff3b0");
          break;
        case "D": case "E": case "Q": case "$": case "@": case "%": case "#": {
          regionGround(x, z, r);
          const st = {
            D: ["#7c3aed", "#fde047", "#5b21b6", 1.25],
            E: ["#b91c1c", "#fbbf24", "#7f1d1d", 1.3],
            Q: ["#1e3a8a", "#facc15", "#312e81", 1.75],
            "$": ["#15803d", "#fde047", "#14532d", 1.1],
            "@": ["#0e7490", "#f0f9ff", "#164e63", 1.9],
            "%": ["#c2410c", "#fde68a", "#7c2d12", 1.1],
            "#": ["#6d28d9", "#c4b5fd", "#3b0764", 1.2],
          }[ch];
          building(x, z, 0.92, st[3], st[0], st[1], st[2]);
          S.add(x - 0.38, st[3] / 2, z + 0.42, 0.1, st[3], 0.1, "#ede9fe");
          S.add(x + 0.38, st[3] / 2, z + 0.42, 0.1, st[3], 0.1, "#ede9fe");
          G.add(x, 0.27, z + 0.47, 0.3, 0.52, 0.06, st[1]);
          G.add(x, st[3] + 0.45, z, 0.22, 0.22, 0.22, st[1], Math.PI / 4);
          if (ch === "Q") { G.add(x - 0.2, st[3] + 0.4, z, 0.1, 0.18, 0.1, "#facc15"); G.add(x + 0.2, st[3] + 0.4, z, 0.1, 0.18, 0.1, "#facc15"); }
          if (ch === "@") { G.add(x, st[3] - 0.35, z + 0.47, 0.42, 0.42, 0.04, "#f8fafc"); S.add(x, st[3] - 0.3, z + 0.5, 0.04, 0.16, 0.02, "#1f2937"); S.add(x + 0.06, st[3] - 0.35, z + 0.5, 0.12, 0.04, 0.02, "#dc2626"); }
          if (ch === "$") { G.add(x, st[3] + 0.1, z + 0.47, 0.34, 0.2, 0.04, "#fde047"); }
          if (ch === "%") { S.add(x + 0.3, st[3] + 0.3, z - 0.2, 0.16, 0.5, 0.16, "#44403c"); G.add(x + 0.3, st[3] + 0.6, z - 0.2, 0.1, 0.1, 0.1, "#fb923c"); }
          if (ch === "#") { G.add(x, st[3] + 0.1, z + 0.47, 0.5, 0.14, 0.04, "#a78bfa"); }
          break;
        }
        case "M":
          regionGround(x, z, r);
          S.add(x, 0.4, z, 0.88, 0.8, 0.88, "#2563eb");
          S.add(x, 0.87, z, 0.98, 0.14, 0.98, "#1e40af");
          for (let i = 0; i < 5; i++) S.add(x - 0.4 + i * 0.2, 0.74, z + 0.46, 0.2, 0.08, 0.26, i % 2 ? "#f9fafb" : "#ef4444");
          G.add(x, 0.42, z + 0.445, 0.5, 0.24, 0.05, "#bfdbfe");
          S.add(x + 0.28, 0.22, z + 0.445, 0.2, 0.44, 0.05, "#1e293b");
          break;
        case "K":
          ground(x, z, pickC(PAL.grass, r), PAL.dirt);
          S.add(x, 0.5, z, 0.8, 0.14, 0.8, "#a16207");
          for (const [lx, lz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) S.add(x + lx, 0.22, z + lz, 0.1, 0.44, 0.1, "#713f12");
          S.add(x, 0.58, z, 0.8, 0.02, 0.05, "#854d0e");
          S.add(x, 0.58, z, 0.05, 0.02, 0.8, "#854d0e");
          S.add(x + 0.18, 0.63, z + 0.12, 0.2, 0.08, 0.08, "#9ca3af");
          S.add(x + 0.18, 0.6, z - 0.04, 0.04, 0.04, 0.3, "#78350f");
          break;
        case "V":
          ground(x, z, pickC(PAL.grass, r), PAL.dirt);
          S.add(x, 1.5, z, 0.82, 3.0, 0.82, "#64748b");
          S.add(x, 1.0, z, 0.9, 0.12, 0.9, "#475569");
          S.add(x, 2.0, z, 0.9, 0.12, 0.9, "#475569");
          for (const [cx, cz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) S.add(x + cx, 3.1, z + cz, 0.22, 0.22, 0.22, "#475569");
          for (const wy of [0.75, 1.5, 2.3]) G.add(x, wy, z + 0.415, 0.14, 0.22, 0.05, "#fde68a");
          S.add(x, 0.22, z + 0.415, 0.26, 0.44, 0.05, "#1e293b");
          break;
        case "Y":
          ground(x, z, pickC(PAL.grass, r), PAL.dirt);
          S.add(x, 0.18, z, 0.6, 0.36, 0.6, "#8b5a2b");
          S.add(x, 0.37, z, 0.5, 0.04, 0.5, "#c08a4f");
          S.add(x, 0.39, z, 0.26, 0.02, 0.26, "#a16f3c");
          S.add(x + 0.34, 0.05, z, 0.16, 0.1, 0.12, "#7a4b22");
          S.add(x - 0.1, 0.05, z + 0.34, 0.12, 0.1, 0.16, "#7a4b22");
          break;
        case "O":
          ground(x, z, pickC(PAL.rock, r), PAL.rockDirt);
          S.add(x, 0.25, z, 0.72, 0.5, 0.72, "#6b6560");
          S.add(x + 0.1, 0.58, z - 0.05, 0.46, 0.34, 0.46, "#78716c");
          G.add(x - 0.2, 0.32, z + 0.37, 0.13, 0.13, 0.04, "#fb923c");
          G.add(x + 0.22, 0.18, z + 0.37, 0.11, 0.11, 0.04, "#fdba74");
          G.add(x + 0.1, 0.78, z, 0.12, 0.05, 0.12, "#fb923c");
          break;
        case "U":
          ground(x, z, pickC(PAL.snow, r), PAL.snowDirt);
          G.add(x - 0.08, 0.38, z, 0.16, 0.76, 0.16, "#67e8f9", 0.3);
          G.add(x + 0.2, 0.26, z + 0.12, 0.13, 0.52, 0.13, "#a5f3fc", 0.8);
          G.add(x + 0.02, 0.22, z - 0.2, 0.12, 0.44, 0.12, "#22d3ee", 1.2);
          G.add(x - 0.25, 0.15, z + 0.2, 0.1, 0.3, 0.1, "#cffafe", 0.5);
          break;
        case ">": case "<": case "}": case "{": {
          if (region === 0) ground(x, z, pickC(PAL.path, r), PAL.dirt, -0.04);
          else if (region === 1) ground(x, z, pickC(PAL.rock, r), PAL.rockDirt);
          else ground(x, z, pickC(PAL.snow, r), PAL.snowDirt);
          for (let i = -1; i <= 1; i++) S.add(x + i * 0.33, 0.04, z, 0.3, 0.1, 1.0, i === 0 ? "#92400e" : "#a16207");
          S.add(x, 0.2, z - 0.48, 1, 0.25, 0.08, "#78350f");
          S.add(x, 0.2, z + 0.48, 1, 0.25, 0.08, "#78350f");
          const dir = ch === ">" || ch === "}" ? 1 : -1;
          const ac = ch === "}" ? "#67e8f9" : ch === "{" ? "#fb923c" : "#fde047";
          G.add(x - dir * 0.05, 0.75, z, 0.4, 0.1, 0.1, ac);
          G.add(x + dir * 0.2, 0.75, z, 0.12, 0.26, 0.1, ac);
          break;
        }
        case "C": case "I": {
          const cave = ch === "C";
          ground(x, z, cave ? pickC(PAL.rock, r) : pickC(PAL.snow, r), cave ? PAL.rockDirt : PAL.snowDirt);
          const h = south ? 0.45 : 1.3 + r * 1.3;
          const wall = cave ? pickC(["#3b3531", "#433c37", "#35302c"], r2) : pickC(["#bfe3f5", "#a8d6ef", "#b4dcf2"], r2);
          S.add(x, h / 2, z, 1, h, 1, wall);
          if (!south && r2 > 0.5) S.add(x + (r - 0.5) * 0.4, h + 0.2, z + (r2 - 0.5) * 0.4, 0.55, 0.4, 0.55, wall);
          S.add(x, h + 0.02, z, 1.02, 0.08, 1.02, cave ? "#4d4540" : "#ffffff");
          break;
        }
        case "R": ground(x, z, pickC(PAL.rock, r), PAL.rockDirt); if (r > 0.82) S.add(x + (r2 - 0.5) * 0.5, 0.06, z, 0.18, 0.12, 0.14, "#4a443f"); break;
        case "A": ground(x, z, pickC(PAL.ash, r), PAL.rockDirt); addBlades(x, z, 6, PAL.ashBlade, 0.28, 0.5, 2); break;
        case "L":
          S.add(x, -0.8, z, 1, 0.8, 1, "#2b1f1a");
          L.add(x, -0.25, z, 1, 0.2, 1, r > 0.5 ? "#ff7a1a" : "#ff6a10");
          if (r2 > 0.6) L.add(x + (r - 0.5) * 0.5, -0.12, z + (r2 - 0.6), 0.16, 0.08, 0.16, "#ffd23f");
          break;
        case "S": ground(x, z, pickC(PAL.snow, r), PAL.snowDirt); if (r > 0.86) S.add(x, 0.07, z + (r2 - 0.5) * 0.4, 0.3, 0.14, 0.24, "#ffffff"); break;
        case "N": ground(x, z, pickC(["#dde9f5", "#d4e4f2"], r), PAL.snowDirt); addBlades(x, z, 6, PAL.snowBlade, 0.28, 0.5, 3); break;
        case "Z":
          S.add(x, -0.75, z, 1, 0.9, 1, "#6f9bb9");
          S.add(x, -0.2, z, 1, 0.2, 1, r > 0.5 ? "#a9dcf5" : "#b6e2f7");
          S.add(x + (r - 0.5) * 0.3, -0.095, z + (r2 - 0.5) * 0.3, 0.6, 0.01, 0.05, "#eefaff", r * 3);
          break;
        default: ground(x, z, pickC(PAL.grass, r), PAL.dirt);
      }
    }

    const look = REGION_LOOK[region];
    // a wide base so the world doesn't float in space
    const base = new THREE.Mesh(new THREE.BoxGeometry(160, 1, 160), new THREE.MeshLambertMaterial({ color: look.base }));
    base.position.set(cols / 2, -1.25, rows / 2);
    base.receiveShadow = true;
    this.mapGroup.add(base);

    this.mapGroup.add(S.build(new THREE.MeshLambertMaterial({ color: 0xffffff })));
    this.mapGroup.add(G.build(new THREE.MeshBasicMaterial({ color: 0xffffff }), false, false));
    this.waterMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.82 });
    this.waterMesh = Wt.build(this.waterMat, false, true);
    this.mapGroup.add(this.waterMesh);
    this.lavaMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.mapGroup.add(L.build(this.lavaMat, false, false));

    // swaying grass blades (matrices updated each frame)
    this.blades = blades;
    this.bladeMesh = null;
    if (blades.length) {
      const bm = new THREE.InstancedMesh(BOX_GEO, new THREE.MeshLambertMaterial({ color: 0xffffff }), blades.length);
      const c = new THREE.Color();
      blades.forEach((bl, i) => bm.setColorAt(i, c.set(bl.color)));
      bm.instanceColor.needsUpdate = true;
      bm.castShadow = true;
      bm.frustumCulled = false;
      this.bladeMesh = bm;
      this.updateBlades(0);
      this.mapGroup.add(bm);
    }
  }

  updateBlades(t) {
    if (!this.bladeMesh) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), axis = new THREE.Vector3(), v = new THREE.Vector3();
    const px = this.player.group.position.x, pz = this.player.group.position.z;
    this.blades.forEach((bl, i) => {
      let ang = Math.sin(t * 2.2 + bl.phase) * 0.14;
      axis.set(Math.cos(bl.phase), 0, Math.sin(bl.phase));
      // blades bend away when the trainer walks through them
      const dx = bl.x - px, dz = bl.z - pz, d2 = dx * dx + dz * dz;
      if (d2 < 0.5) { axis.set(dz, 0, -dx).normalize(); ang = 0.7 * (1 - d2 / 0.5); }
      q.setFromAxisAngle(axis, ang);
      v.set(0, bl.h / 2, 0).applyQuaternion(q);
      p.set(bl.x, 0, bl.z).add(v);
      s.set(bl.w, bl.h, bl.w);
      m.compose(p, q, s);
      this.bladeMesh.setMatrixAt(i, m);
    });
    this.bladeMesh.instanceMatrix.needsUpdate = true;
  }

  setPlayerTile(x, z) {
    const P = this.player;
    const far = P.lastX === null || Math.abs(x - P.lastX) > 2 || Math.abs(z - P.lastZ) > 2;
    if (this.snapNext || far) {
      P.group.position.set(x, 0, z);
      P.from.set(x, 0, z); P.to.set(x, 0, z); P.t = 1;
      this.camTarget.set(x, 0, z);
      this.snapCam = true;
      this.snapNext = false;
    } else if (x !== P.lastX || z !== P.lastZ) {
      P.from.copy(P.group.position); P.from.y = 0;
      P.to.set(x, 0, z);
      P.t = 0;
      P.targetAngle = Math.atan2(x - P.lastX, z - P.lastZ);
    }
    P.lastX = x; P.lastZ = z;
  }

  update(dt) {
    const t = this.time, P = this.player;
    // movement: short hop between tiles
    if (P.t < 1) {
      P.t = Math.min(1, P.t + dt / 0.14);
      P.group.position.lerpVectors(P.from, P.to, P.t);
      P.group.position.y = Math.sin(P.t * Math.PI) * (this.mountModel ? 0.18 : 0.12);
    } else {
      P.group.position.y = 0;
    }
    let da = P.targetAngle - P.angle;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    P.angle += da * Math.min(1, dt * 14);
    P.group.rotation.y = P.angle;
    if (this.trainerModel) this.trainerModel.group.scale.y = 1 + Math.sin(t * 3) * 0.015;

    // camera follows from above-behind
    const k = this.snapCam ? 1 : 1 - Math.exp(-dt * 5);
    this.snapCam = false;
    const cols = this.cols || 20, rows = this.rows || 14;
    const want = P.group.position.clone();
    want.x = Math.min(Math.max(want.x, 6.5), cols - 7.5);
    want.z = Math.min(Math.max(want.z, 4), rows - 4.5);
    this.camTarget.lerp(want, k);
    this.camTarget.y = 0;
    this.camera.position.set(this.camTarget.x, 9.8, this.camTarget.z + 8.3);
    this.camera.lookAt(this.camTarget.x, 0.2, this.camTarget.z - 0.2);

    // day / night blend
    this.nightAmt += (this.nightTarget - this.nightAmt) * Math.min(1, dt * 1.5);
    const n = this.nightAmt, look = this.look || REGION_LOOK[0];
    if (this.scene.background) {
      this.scene.background.set(look.sky).lerp(new THREE.Color(look.night), n);
      this.scene.fog.color.copy(this.scene.background);
    }
    this.hemi.intensity = look.hemiI * (1 - n * 0.72);
    this.sun.intensity = look.sunI * (1 - n * 0.8);
    this.sun.color.set(look.sunC).lerp(new THREE.Color(0x8fa8ff), n);
    this.lantern.intensity = n * 9;
    this.lantern.position.set(P.group.position.x, 1.6, P.group.position.z + 0.3);

    // living world
    this.updateBlades(t);
    if (this.waterMesh) { this.waterMesh.position.y = Math.sin(t * 1.6) * 0.025; this.waterMat.opacity = 0.78 + Math.sin(t * 2.1) * 0.05; }
    if (this.lavaMat) this.lavaMat.color.setScalar(0.82 + Math.sin(t * 2.4) * 0.18);
    if (this.rivalMark) this.rivalMark.position.y = 1.45 + Math.sin(t * 4) * 0.08;
    if (this.partner) {
      const Q = this.partner;
      const dx = Q.tx - Q.x, dz = Q.tz - Q.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 4) { Q.x = Q.tx; Q.z = Q.tz; } // a jump (teleport or new area): snap
      else if (dist > 0.001) {
        const step = Math.min(dist, dt * 7);
        Q.x += (dx / dist) * step; Q.z += (dz / dist) * step;
        Q.angle = Math.atan2(dx, dz);
      }
      Q.group.position.set(Q.x, dist > 0.05 ? Math.abs(Math.sin(t * 14)) * 0.1 : 0, Q.z);
      Q.body.rotation.y = Q.angle;
      if (Q.emote) Q.emote.position.y = (Q.tagY || 1.55) + 0.55 + Math.sin(t * 5) * 0.05;
    }
    if (this.player.emote) this.player.emote.position.y = (this.mountModel ? 2.2 : 1.75) + Math.sin(t * 5) * 0.05;
    this.ambient.forEach((a) => {
      a.points.visible = a.kind === "stars" || a.kind === "fireflies" ? n > 0.25 : true;
      a.update(dt, t, this.camTarget.x, this.camTarget.z);
    });
  }
}

/* ---------------------------- BATTLE ---------------------------- */

const BATTLE_SLOTS = {
  enemy: { base: new THREE.Vector3(2.15, 0, -2.6), height: 1.45, pad: 1.25 },
  player: { base: new THREE.Vector3(-1.85, 0, 0.6), height: 1.38, pad: 1.4 },
};

class BattleScene extends VoxScene {
  constructor() {
    super(38);
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x5f8a45, 1.5);
    this.sun = new THREE.DirectionalLight(0xfff0d2, 2.6);
    this.sun.position.set(4, 9, 6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    Object.assign(this.sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.03;
    s.add(this.hemi, this.sun);
    this.envGroup = new THREE.Group();
    s.add(this.envGroup);
    this.slots = { enemy: this.makeSlot("enemy"), player: this.makeSlot("player") };
    this.trainer = null;
    // particles
    this.pMax = 600;
    this.pMesh = new THREE.InstancedMesh(BOX_GEO, new THREE.MeshBasicMaterial({ color: 0xffffff }), this.pMax);
    this.pMesh.frustumCulled = false;
    this.parts = [];
    const zero = new THREE.Matrix4().makeScale(0, 0, 0), c = new THREE.Color(1, 1, 1);
    for (let i = 0; i < this.pMax; i++) { this.pMesh.setMatrixAt(i, zero); this.pMesh.setColorAt(i, c); }
    this.pNext = 0;
    s.add(this.pMesh);
    // projectile
    this.proj = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.projLight = new THREE.PointLight(0xffffff, 0, 6, 1.5);
    this.proj.visible = false;
    s.add(this.proj, this.projLight);
    this.ball = this.makeBall();
    this.ball.visible = false;
    s.add(this.ball);
    this.shake = 0;
    this.camBase = new THREE.Vector3(-0.7, 2.25, 6.1);
    this.camLook = new THREE.Vector3(0.55, 0.75, -1.05);
    this.ambient = [];
    this.envKey = "";
  }

  makeSlot(side) {
    const cfg = BATTLE_SLOTS[side];
    const g = new THREE.Group();
    g.position.copy(cfg.base);
    this.scene.add(g);
    return { side, cfg, group: g, model: null, key: "", appear: 1, faint: 0, fainting: false, hurt: 0, lunge: 0, capture: 0, flash: 0, phase: Math.random() * 6 };
  }

  makeBall() {
    const g = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xef4444 }));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xf9fafb }));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.163, 0.163, 0.035, 14), new THREE.MeshLambertMaterial({ color: 0x1f2937 }));
    this.ballButton = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.ballButton.rotation.x = Math.PI / 2;
    this.ballButton.position.z = 0.16;
    [top, bot, band].forEach((m) => { m.castShadow = true; g.add(m); });
    g.add(this.ballButton);
    return g;
  }

  reset() {
    ["enemy", "player"].forEach((k) => {
      const sl = this.slots[k];
      if (sl.model) disposeObject(sl.model.group);
      Object.assign(sl, { model: null, key: "", appear: 1, faint: 0, fainting: false, hurt: 0, lunge: 0, capture: 0, flash: 0 });
    });
    if (this.trainer) { disposeObject(this.trainer.group); this.trainer = null; }
    this.trainerKey = "";
    this.parts.length = 0;
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.pMax; i++) this.pMesh.setMatrixAt(i, zero);
    this.pMesh.instanceMatrix.needsUpdate = true;
    this.proj.visible = false;
    this.projLight.intensity = 0;
    this.ball.visible = false;
    this.ballState = null;
    this.tweens = [];
  }

  setEnv(region, night) {
    const key = region + ":" + (night ? 1 : 0);
    if (this.envKey === key) return;
    this.envKey = key;
    while (this.envGroup.children.length) disposeObject(this.envGroup.children[0]);
    this.ambient.forEach((a) => disposeObject(a.points));
    this.ambient = [];
    const look = REGION_LOOK[region];
    const sky = new THREE.Color(look.sky).lerp(new THREE.Color(look.night), night ? 0.85 : 0);
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, 11, 30);
    this.hemi.color.set(look.hemiSky);
    this.hemi.groundColor.set(look.hemiGround);
    this.hemi.intensity = look.hemiI * (night ? 0.42 : 1);
    this.sun.color.set(night ? 0x9fb4ff : look.sunC);
    this.sun.intensity = look.sunI * (night ? 0.35 : 1);

    const S = new VoxBatch(), G = new VoxBatch();
    const capPal = [["#79c766", "#71bf5e", "#82ce6e"], ["#5d5650", "#665e57", "#57504a"], ["#f4f9fd", "#e9f2f9", "#f9fcfe"]][region];
    const rimC = ["#4e9a3f", "#3e3732", "#b9d3e6"][region];
    const groundC = ["#68b252", "#4a423c", "#e3eef6"][region];
    const ground = new THREE.Mesh(new THREE.BoxGeometry(80, 1, 80), new THREE.MeshLambertMaterial({ color: groundC }));
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    this.envGroup.add(ground);
    // battle pads
    for (const k of ["enemy", "player"]) {
      const cfg = BATTLE_SLOTS[k], R = cfg.pad, step = 0.25;
      for (let i = -R; i <= R + 1e-6; i += step) for (let j = -R; j <= R + 1e-6; j += step) {
        const d = Math.hypot(i, j);
        if (d > R) continue;
        const rim = d > R - step * 1.2;
        const r = srand(i * 9 + cfg.base.x, j * 7 + cfg.base.z, region);
        S.add(cfg.base.x + i, rim ? 0.06 : 0.03, cfg.base.z + j, step, rim ? 0.12 : 0.06, step, rim ? rimC : pickC(capPal, r));
      }
    }
    // scenery ring
    for (let i = 0; i < 46; i++) {
      const a = srand(i, 3, region) * Math.PI * 1.25 - Math.PI * 0.62 - Math.PI / 2;
      const dist = 8 + srand(i, 9, region) * 9;
      const x = Math.cos(a) * dist + 0.5, z = Math.sin(a) * dist - 2;
      if (z > 2.5) continue;
      const r = srand(i, 11, region);
      if (region === 0) {
        const h = 1.2 + r * 1.2;
        S.add(x, h / 2, z, 0.35, h, 0.35, "#7a5230");
        S.add(x, h + 0.3, z, 1.4, 1.0, 1.4, pickC(["#2e7d32", "#3c8f3e", "#357f37"], r));
        S.add(x + 0.2, h + 0.95, z - 0.1, 0.9, 0.6, 0.9, pickC(["#43973f", "#2a6f2e"], r));
      } else if (region === 1) {
        const h = 0.6 + r * 2.4;
        S.add(x, h / 2, z, 1.2 + r, h, 1.1, pickC(["#3b3531", "#433c37", "#35302c"], r));
        if (r > 0.6) G.add(x + 0.9, 0.03, z + 0.6, 1.1, 0.06, 0.9, "#ff7a1a");
      } else {
        const h = 0.8 + r * 2.2;
        S.add(x, h / 2, z, 1.1, h, 1.1, pickC(["#bfe3f5", "#a8d6ef"], r));
        S.add(x, h + 0.06, z, 1.14, 0.12, 1.14, "#ffffff");
        if (r > 0.65) G.add(x + 0.8, 0.4, z + 0.5, 0.2, 0.8, 0.2, "#67e8f9", r * 2);
      }
    }
    // a few tufts / pebbles near the pads
    for (let i = 0; i < 40; i++) {
      const x = (srand(i, 1, region) - 0.5) * 12 + 0.3, z = (srand(i, 2, region) - 0.5) * 9 - 1;
      if (Math.hypot(x - BATTLE_SLOTS.enemy.base.x, z - BATTLE_SLOTS.enemy.base.z) < 1.6) continue;
      if (Math.hypot(x - BATTLE_SLOTS.player.base.x, z - BATTLE_SLOTS.player.base.z) < 1.8) continue;
      const c = [["#3a9a44", "#2f8a3a", "#46a84d"], ["#5d7a1f", "#4a443f", "#6b8a22"], ["#9cc8f0", "#ffffff", "#b5d8f5"]][region];
      for (let b = 0; b < 3; b++) {
        const h = 0.1 + srand(i, 5 + b) * 0.14;
        S.add(x + (b - 1) * 0.07, h / 2, z + srand(i, b) * 0.08, 0.045, h, 0.045, pickC(c, srand(i, 4 + b)));
      }
    }
    this.envGroup.add(S.build(new THREE.MeshLambertMaterial({ color: 0xffffff })));
    this.envGroup.add(G.build(new THREE.MeshBasicMaterial({ color: 0xffffff }), false, false));
    if (region === 2) this.addAmbient("snow", 180);
    if (region === 1) this.addAmbient("embers", 120);
    if (night && region !== 1) { this.addAmbient("stars", 350); if (region === 0) this.addAmbient("fireflies", 40); }
  }

  addAmbient(kind, n) {
    const a = new Ambient(kind, n);
    this.ambient.push(a);
    this.scene.add(a.points);
  }

  setMon(side, mon, visual, extraScale = 1) {
    const sl = this.slots[side];
    const key = mon ? `${mon.id}:${JSON.stringify(visual)}` : "";
    if (sl.key === key) return;
    sl.key = key;
    if (sl.model) disposeObject(sl.model.group);
    sl.model = null;
    if (!mon) return;
    const h = sl.cfg.height * (mon.evolved ? 1.15 : 1) * extraScale;
    sl.model = spriteToModel(SPRITES[visual.sprite], { colorsOverride: visual.colorsOverride, hue: visual.hue, height: h });
    sl.group.add(sl.model.group);
    sl.appear = 0; sl.faint = 0; sl.fainting = false; sl.capture = 0; sl.hurt = 0; sl.flash = 0;
    if (mon.shiny) setTimeout(() => this.burst(this.chest(side), 0xfde047, 26, 2.2), 250);
  }

  setTrainer(spriteName) {
    const key = spriteName || "";
    if (this.trainerKey === key) return;
    this.trainerKey = key;
    if (this.trainer) { disposeObject(this.trainer.group); this.trainer = null; }
    if (!spriteName || !SPRITES[spriteName]) return;
    this.trainer = spriteToModel(SPRITES[spriteName], { height: 1.8 });
    this.trainer.group.position.set(4.25, 0, -3.5);
    this.trainer.group.rotation.y = Math.atan2(-1.85 - 4.25, 0.6 + 3.5);
    this.scene.add(this.trainer.group);
  }

  chest(side) {
    const sl = this.slots[side];
    return sl.group.position.clone().add(new THREE.Vector3(0, sl.cfg.height * 0.55, 0));
  }

  hurt(side) { const sl = this.slots[side]; sl.hurt = 0.55; sl.flash = 1; }
  faint(side) { this.slots[side].fainting = true; }

  spawn(p, v, color, life, size, grav = 0) {
    const i = this.pNext;
    this.pNext = (this.pNext + 1) % this.pMax;
    const existing = this.parts.findIndex((q) => q.i === i);
    if (existing >= 0) this.parts.splice(existing, 1);
    this.pMesh.setColorAt(i, new THREE.Color(color));
    this.pMesh.instanceColor.needsUpdate = true;
    this.parts.push({ i, p: p.clone(), v, life, max: life, size, grav, rot: Math.random() * 6 });
  }

  burst(at, color, n = 18, speed = 2.6) {
    for (let k = 0; k < n; k++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9 + 0.1, Math.random() - 0.5).normalize().multiplyScalar(speed * (0.5 + Math.random()));
      const col = new THREE.Color(color).offsetHSL(0, 0, (Math.random() - 0.3) * 0.25);
      this.spawn(at, v, col, 0.45 + Math.random() * 0.35, 0.08 + Math.random() * 0.08, 5);
    }
  }

  projectile(to, color) {
    const from = to === "enemy" ? "player" : "enemy";
    const a = this.chest(from), b = this.chest(to);
    const slFrom = this.slots[from];
    slFrom.lunge = 1;
    const col = new THREE.Color(color);
    this.proj.material.color.copy(col);
    this.projLight.color.copy(col);
    this.proj.visible = true;
    let trailT = 0;
    this.tween(0.44, (k) => {
      const p = a.clone().lerp(b, k);
      p.y += Math.sin(k * Math.PI) * 0.7;
      this.proj.position.copy(p);
      this.proj.rotation.set(k * 9, k * 7, 0);
      this.proj.scale.setScalar(0.8 + k * 0.6);
      this.projLight.position.copy(p);
      this.projLight.intensity = 6;
      trailT += 1;
      if (trailT % 1 === 0) this.spawn(p, new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4), col, 0.3, 0.09, 0);
    }, () => {
      this.proj.visible = false;
      this.projLight.intensity = 0;
      this.burst(b, color, 22, 3);
      this.burst(b, 0xffffff, 8, 2);
      this.shake = 0.28;
    });
  }

  throwBall() {
    const target = this.slots.enemy.group.position.clone().add(new THREE.Vector3(-0.35, 0.18, 0.75));
    const start = new THREE.Vector3(-1.3, 1.3, 3.2);
    this.ball.visible = true;
    this.ball.scale.setScalar(1);
    this.ballState = "flying";
    this.ballButton.material.color.set(0xffffff);
    this.tween(0.5, (k) => {
      const p = start.clone().lerp(target, k);
      p.y += Math.sin(k * Math.PI) * 1.4;
      this.ball.position.copy(p);
      this.ball.rotation.set(k * 14, 0, k * 4);
    }, () => {
      this.ball.rotation.set(0, 0, 0);
      this.slots.enemy.capture = 0.0001;
      this.burst(this.chest("enemy"), 0xffffff, 16, 1.6);
      this.ballState = "wobble";
    });
  }

  resolveCatch(result) {
    if (!this.ball.visible) return;
    if (result === "free") {
      this.burst(this.ball.position, 0xef4444, 18, 2.4);
      this.burst(this.ball.position, 0xffffff, 10, 2);
      this.ball.visible = false;
      this.ballState = null;
      this.slots.enemy.capture = 0;
      this.slots.enemy.appear = 0;
      this.shake = 0.15;
    } else {
      this.ballState = "caught";
      this.ballButton.material.color.set(0xfde047);
      for (let k = 0; k < 3; k++) setTimeout(() => this.burst(this.ball.position.clone().add(new THREE.Vector3(0, 0.25, 0)), 0xfde047, 10, 1.8), k * 180);
    }
  }

  update(dt) {
    const t = this.time;
    const eFace = Math.atan2(BATTLE_SLOTS.player.base.x - BATTLE_SLOTS.enemy.base.x, BATTLE_SLOTS.player.base.z - BATTLE_SLOTS.enemy.base.z);
    const pFace = Math.atan2(BATTLE_SLOTS.enemy.base.x - BATTLE_SLOTS.player.base.x, BATTLE_SLOTS.enemy.base.z - BATTLE_SLOTS.player.base.z);
    for (const side of ["enemy", "player"]) {
      const sl = this.slots[side];
      if (!sl.model) continue;
      const g = sl.model.group;
      sl.appear = Math.min(1, sl.appear + dt / 0.35);
      if (sl.fainting) sl.faint = Math.min(1, sl.faint + dt / 0.6);
      if (sl.capture > 0) sl.capture = Math.min(1, sl.capture + dt / 0.28);
      sl.hurt = Math.max(0, sl.hurt - dt);
      sl.flash = Math.max(0, sl.flash - dt * 2.2);
      sl.lunge = Math.max(0, sl.lunge - dt / 0.32);
      const pop = sl.appear < 1 ? Math.sin(sl.appear * Math.PI * 0.5) * (1 + Math.sin(sl.appear * Math.PI) * 0.15) : 1;
      const sc = pop * (1 - sl.faint) * (1 - sl.capture);
      g.scale.set(sc, sc * (1 + Math.sin(t * 2.6 + sl.phase) * 0.025), sc);
      const face = side === "enemy" ? eFace : pFace;
      const lungeDir = new THREE.Vector3(Math.sin(face), 0, Math.cos(face));
      const lungeAmt = Math.sin(sl.lunge * Math.PI) * 0.45;
      const shakeX = sl.hurt > 0 ? Math.sin(t * 60) * 0.07 * (sl.hurt / 0.55) : 0;
      g.position.set(lungeDir.x * lungeAmt + shakeX, -sl.faint * 0.6 + Math.abs(Math.sin(t * 2.6 + sl.phase)) * 0.04, lungeDir.z * lungeAmt);
      g.rotation.y = face + Math.sin(t * 0.9 + sl.phase) * 0.08;
      // hurt flash / capture glow
      const fl = Math.max(sl.flash * (Math.sin(t * 40) > 0 ? 1 : 0.3), sl.capture > 0 ? 1 : 0);
      sl.model.mat.emissive.setScalar(fl * 0.85);
      if (sl.fainting) sl.model.mat.color.setScalar(1 - sl.faint * 0.5);
      if (sl.model.mesh) sl.model.mesh.visible = sc > 0.01;
    }
    if (this.trainer) this.trainer.group.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
    // ball wobble
    if (this.ball.visible && this.ballState === "wobble") {
      const w = Math.sin(t * 9) * 0.45 * (Math.sin(t * 2.2) > 0 ? 1 : 0.15);
      this.ball.rotation.z = w;
      this.ball.position.y = Math.max(0.16, this.ball.position.y - dt * 3);
      this.ballButton.material.color.setScalar(Math.sin(t * 9) > 0 ? 1 : 0.6);
    }
    // particles
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
    for (let k = this.parts.length - 1; k >= 0; k--) {
      const pt = this.parts[k];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.pMesh.setMatrixAt(pt.i, m.makeScale(0, 0, 0));
        this.parts.splice(k, 1);
        continue;
      }
      pt.v.y -= pt.grav * dt;
      pt.p.addScaledVector(pt.v, dt);
      if (pt.p.y < 0.03) { pt.p.y = 0.03; pt.v.multiplyScalar(0.5); }
      pt.rot += dt * 6;
      const sz = pt.size * (pt.life / pt.max);
      q.setFromEuler(e.set(pt.rot, pt.rot * 0.7, 0));
      this.pMesh.setMatrixAt(pt.i, m.compose(pt.p, q, s.set(sz, sz, sz)));
    }
    this.pMesh.instanceMatrix.needsUpdate = true;
    // camera with gentle drift + hit shake
    this.shake = Math.max(0, this.shake - dt);
    const sh = this.shake > 0 ? this.shake * 0.35 : 0;
    this.camera.position.set(
      this.camBase.x + Math.sin(t * 0.25) * 0.15 + (Math.random() - 0.5) * sh,
      this.camBase.y + Math.sin(t * 0.33) * 0.05 + (Math.random() - 0.5) * sh,
      this.camBase.z,
    );
    this.camera.lookAt(this.camLook);
    this.ambient.forEach((a) => a.update(dt, t, 0.5, -1));
  }
}

let _worldScene = null, _battleScene = null;
/* If the 3D renderer can't start (or a scene throws), stand in a do-nothing scene,
   switch the game to 2D and say so — never a blank screen. */
const NULL_SCENE = new Proxy({}, { get: () => () => {} });
function sceneFailed(err) {
  _webglOk = false;
  try { console.warn("3D view failed, switching to 2D:", err && err.message); } catch (e) { /* ignore */ }
  try { window.dispatchEvent(new Event("mq-3d-failed")); } catch (e) { /* ignore */ }
  return NULL_SCENE;
}
const getWorldScene = () => (_worldScene = _worldScene || new WorldScene());
const getBattleScene = () => (_battleScene = _battleScene || new BattleScene());

/* ---------------------------- React wrappers ---------------------------- */

function World3D({ region, pos, night, mount, outfit, rivalSpot, partner, emotes }) {
  const ref = useRef(null);
  const sceneRef = useRef(null);
  useEffect(() => {
    let s;
    try { s = getWorldScene(); s.attach(ref.current); } catch (err) { s = sceneFailed(err); }
    sceneRef.current = s;
    return () => { try { s.detach(); } catch (e) { /* ignore */ } };
  }, []);
  useEffect(() => { sceneRef.current.setRegion(MAPS[region], region); }, [region]);
  useEffect(() => { sceneRef.current.setPlayerTile(pos.x, pos.y); }, [region, pos.x, pos.y]);
  useEffect(() => { sceneRef.current.setNight(night); }, [night]);
  useEffect(() => { sceneRef.current.setTrainer(outfitColors(outfit)); }, [outfit]);
  const mountVis = mount ? monVisual(mount) : null;
  const mountKey = mountVis ? JSON.stringify(mountVis) : "";
  useEffect(() => { sceneRef.current.setMount(mountVis); }, [mountKey]); // eslint-disable-line
  const rivalKey = rivalSpot && rivalSpot.region === region ? `${rivalSpot.x},${rivalSpot.y}` : "";
  useEffect(() => { sceneRef.current.setRival(rivalKey ? rivalSpot : null); }, [rivalKey]); // eslint-disable-line
  const pVis = partner && !partner.gone && partner.region === region && partner.scr !== "battle"
    ? { x: partner.x, y: partner.y, colors: outfitColors(partner.outfit), mount: partner.mount, name: partner.name } : null;
  const pKey = pVis ? JSON.stringify(pVis) : "";
  useEffect(() => { sceneRef.current.setPartner(pVis); }, [pKey]); // eslint-disable-line
  useEffect(() => () => { const s = sceneRef.current; if (s) { s.setPartner(null); s.setEmote("me", null); } }, []);
  const meE = emotes && emotes.me ? emotes.me.e + emotes.me.at : "";
  const paE = emotes && emotes.partner && pVis ? emotes.partner.e + emotes.partner.at : "";
  useEffect(() => { sceneRef.current.setEmote("me", meE ? emotes.me.e : null); }, [meE]); // eslint-disable-line
  useEffect(() => { sceneRef.current.setEmote("partner", paE ? emotes.partner.e : null); }, [paE, pKey]); // eslint-disable-line
  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}

const TRAINER_SPRITE = { topic_money: "prime", topic_time: "elite2", topic_fraction: "elite3", topic_place: "elite1", gym1: "prime", gym2: "magna", rival: "rival", elite1: "elite1", elite2: "elite2", elite3: "elite3", grandmaster: "grandmaster", tower: "trainer" };

function Battle3D({ enemy, active, region, isNight, kind, enemyHurt, playerHurt, fx, ballAnim, catchFx }) {
  const ref = useRef(null);
  const sRef = useRef(null);
  useEffect(() => {
    let s;
    try { s = getBattleScene(); s.reset(); s.attach(ref.current); } catch (err) { s = sceneFailed(err); }
    sRef.current = s;
    return () => { try { s.detach(); } catch (e) { /* ignore */ } };
  }, []);
  useEffect(() => { sRef.current.setEnv(region || 0, isNight); }, [region, isNight]);
  useEffect(() => { sRef.current.setTrainer(TRAINER_SPRITE[kind] || null); }, [kind]);
  const eVis = monVisual(enemy);
  const eKey = `${enemy.id}:${JSON.stringify(eVis)}`;
  useEffect(() => { sRef.current.setMon("enemy", enemy, eVis, kind === "raid" ? 1.7 : DEX[enemy.species].legendary ? 1.3 : 1); }, [eKey]); // eslint-disable-line
  const aVis = active ? monVisual(active) : null;
  const aKey = active ? `${active.id}:${JSON.stringify(aVis)}` : "";
  useEffect(() => { sRef.current.setMon("player", active, aVis); }, [aKey]); // eslint-disable-line
  useEffect(() => { if (enemy.hp <= 0) sRef.current.faint("enemy"); }, [enemy.id, enemy.hp <= 0]); // eslint-disable-line
  useEffect(() => { if (active && active.hp <= 0) sRef.current.faint("player"); }, [aKey, active && active.hp <= 0]); // eslint-disable-line
  useEffect(() => { if (enemyHurt) sRef.current.hurt("enemy"); }, [enemyHurt]);
  useEffect(() => { if (playerHurt) sRef.current.hurt("player"); }, [playerHurt]);
  useEffect(() => { if (fx) sRef.current.projectile(fx.to, fx.color); }, [fx && fx.id]); // eslint-disable-line
  useEffect(() => { if (ballAnim) sRef.current.throwBall(); }, [ballAnim]);
  useEffect(() => { if (catchFx) sRef.current.resolveCatch(catchFx.result); }, [catchFx && catchFx.id]); // eslint-disable-line
  return <div ref={ref} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 163, zIndex: 0 }} />;
}

if (typeof window !== "undefined") window.__mqDebug = { world: () => _worldScene, battle: () => _battleScene, MAPS, quality: QUALITY, readSaveCode, encodeFullCode, validateState, fnv32, genTopicQuestion, genQuestion, TOPICS, MEDALS, medalEarned, progressTier, sameFraction, BOX_MAX, BOX_STORE_MAX, rewardHash, REWARD_CODES, genGkQuestion, gkTierFor, GK_BANK, cleanName };
