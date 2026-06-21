import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  ChevronLeft, ChevronRight, ChevronUp, Compass, X, Mountain, CalendarDays,
  Eye, Plus, Minus, Navigation, Layers, List, Clock, MapPin, Play, Crosshair,
} from "lucide-react";

/* ================ Tap on Travel — Sikkim + North Bengal ================ */
const C = {
  bg0: "#070A10", ink: "#0A0E16",
  red: "#E8313E", gold: "#F6C254", text: "#EDF2F8",
  muted: "#8B98A8", faint: "#5C6B7C",
  line: "rgba(255,255,255,0.09)", glass: "rgba(13,18,28,0.86)",
  view: "#37C2B5", stay: "#9B7BFF", food: "#FF8A3D",
};
const W = 1200, H = 840;

const STOPS = [
  { name: "Bagdogra / NJP", short: "Bagdogra", tag: "Arrival", day: "Day 1", elevation: "130 m", drive: "—", coord: "26.68°N 88.32°E", p: [320, 980], theme: "gateway", grad: ["#7FA8C9", "#E9D8B0"],
    blurb: "The gateway to the hills. Land at Bagdogra and ride beside the Teesta as the plains fold into the first Himalayan ridges, climbing toward Gangtok.",
    highlights: ["Teesta River drive", "Namgyal Institute of Tibetology", "Do Drul Chorten", "MG Marg by night"] },
  { name: "Gangtok", short: "Gangtok", tag: "Sikkim · 2N", day: "Day 2", elevation: "1,650 m", drive: "4.5 h", coord: "27.33°N 88.61°E", p: [560, 600], theme: "town", grad: ["#27406B", "#D59A6E"],
    blurb: "Sikkim's capital, draped over a ridge. Today climbs to glacial Tsomgo Lake and Baba Mandir near the border, with an optional run up to Nathula Pass.",
    highlights: ["Tsomgo Lake", "Baba Harbhajan Singh Mandir", "Nathula Pass (permit)", "MG Marg cafés"] },
  { name: "Namchi / Ravangla", short: "Namchi", tag: "South Sikkim", day: "Day 3", elevation: "2,100 m", drive: "3.5 h", coord: "27.17°N 88.35°E", p: [830, 760], theme: "monastery", grad: ["#3A5E8C", "#F0C98E"],
    blurb: "Quiet South Sikkim. Wander the Temi tea slopes and the serene Buddha Park at Ravangla, then Char Dham crowned by the statue on Samdruptse Hill.",
    highlights: ["Temi Tea Garden", "Buddha Park, Ravangla", "Char Dham", "Samdruptse statue"] },
  { name: "Kalimpong", short: "Kalimpong", tag: "North Bengal · 1N", day: "Day 4–5", elevation: "1,250 m", drive: "3.5 h", coord: "27.06°N 88.47°E", p: [1130, 620], theme: "hills", grad: ["#7FA8C0", "#CFE0CE"],
    blurb: "A calmer hill town of monasteries and nurseries. Durpin Monastery's valley views, the climb up Deolo Hill, and one of the region's great cactus collections.",
    highlights: ["Durpin Monastery", "Deolo Hill", "Cactus Nursery", "Easy evening"] },
  { name: "Darjeeling", short: "Darjeeling", tag: "North Bengal · 2N", day: "Day 6", elevation: "2,042 m", drive: "2.5 h", coord: "27.04°N 88.26°E", p: [1240, 320], theme: "peaks", grad: ["#16335E", "#FF9E6B"],
    blurb: "The Queen of the Hills. Sunrise over Kanchenjunga from Tiger Hill, the heritage Toy Train through Batasia Loop, and tea on Chowrasta.",
    highlights: ["Tiger Hill sunrise", "Darjeeling Toy Train", "Batasia Loop", "Japanese Peace Pagoda"] },
  { name: "Mirik", short: "Mirik", tag: "Lakeside", day: "Day 7", elevation: "1,767 m", drive: "1.5 h", coord: "26.88°N 88.18°E", p: [800, 300], theme: "lake", grad: ["#5E94B8", "#CFE3DC"],
    blurb: "A pine-rimmed lake on the way down. A slow walk along the water and an optional boat ride at Mirik Lake before the descent to the plains.",
    highlights: ["Mirik Lake", "Lakeside walk", "Boating (optional)", "Tea gardens"] },
  { name: "Bagdogra / NJP", short: "Bagdogra", tag: "Departure", day: "Day 7", elevation: "130 m", drive: "1.5 h", coord: "26.68°N 88.32°E", p: [430, 560], theme: "gateway", grad: ["#7FA8C9", "#E9D8B0"],
    blurb: "The road folds back to the plains. Continue to Bagdogra or NJP for the onward journey — the mountains behind you, the memories packed.",
    highlights: ["Descent to plains", "Onward transfer", "Beautiful memories", "Until next time"] },
];

const POI_DEFS = [
  { f: 0.10, type: "view", label: "Teesta viewpoint" }, { f: 0.26, type: "stay", label: "Gangtok stay" },
  { f: 0.42, type: "view", label: "Buddha Park" }, { f: 0.58, type: "food", label: "Hillside kitchen" },
  { f: 0.74, type: "view", label: "Tiger Hill" }, { f: 0.88, type: "stay", label: "Mirik lodge" },
];
const CAT = { view: C.view, stay: C.stay, food: C.food };

function catmullRom(points, closed = false) {
  const pts = points.map((p) => ({ x: p[0], y: p[1] }));
  if (pts.length < 2) return "";
  const get = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M ${pts[0].x} ${pts[0].y}`; const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2); d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`; }
  return d + (closed ? " Z" : "");
}
// function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// function buildRelief() {
//   const masses = [
//     [300, 200, 320, 5, 1, 0.85], [640, 150, 380, 6, 1, 0.8], [1010, 190, 340, 5, 1, 0.78], [1360, 240, 300, 5, 1, 0.72],
//     [170, 520, 250, 4, 0, 0.35], [840, 460, 320, 5, 0, 0.4], [1160, 430, 280, 4, 0, 0.36], [1460, 580, 280, 4, 0, 0.3],
//     [430, 780, 240, 4, 0, 0.18], [720, 950, 230, 3, 0, 0.1], [1080, 900, 260, 4, 0, 0.16], [1360, 920, 240, 3, 0, 0.12],
//     [120, 940, 230, 3, 0, 0.08], [1520, 340, 220, 4, 1, 0.65],
//   ];
//   const blobs = [], contours = [];
//   masses.forEach((m, mi) => {
//     const [cx, cy, R, rings, snow, haze] = m;
//     const r = rng(mi * 911 + 17); const ph1 = r() * 6.283, ph2 = r() * 6.283; const k1 = 3 + Math.floor(r() * 2), k2 = 5 + Math.floor(r() * 2);
//     const ringPath = (rr) => { const pts = []; for (let a = 0; a < 6.283; a += 0.32) { const wob = 1 + 0.15 * Math.sin(a * k1 + ph1) + 0.09 * Math.sin(a * k2 + ph2); pts.push([cx + Math.cos(a) * rr * wob, cy + Math.sin(a) * rr * wob * 0.82]); } return catmullRom(pts, true); };
//     const core = snow ? "rgba(206,222,238," : haze > 0.5 ? "rgba(120,150,192," : "rgba(86,140,104,";
//     blobs.push({ d: ringPath(R), id: `b${mi}`, core });
//     for (let ring = 1; ring < rings; ring++) { const t = ring / (rings - 1); const op = (0.05 + t * 0.1) * (1 - haze * 0.3); let stroke = `rgba(190,210,225,${op.toFixed(3)})`; if (snow && t > 0.55) stroke = `rgba(235,243,250,${(0.16 + t * 0.26).toFixed(3)})`; contours.push({ d: ringPath(R * (1 - ring / (rings + 0.5))), stroke, w: 1 + t * 0.5 }); }
//   });
//   const rivers = [
//     catmullRom([[330, 1100], [380, 980], [430, 870], [520, 810], [560, 720], [640, 640]]),
//     catmullRom([[1260, 1110], [1180, 980], [1110, 850], [1030, 750], [970, 640], [900, 520]]),
//     catmullRom([[40, 700], [180, 720], [340, 760], [480, 800], [640, 840]]),
//   ];
//   const lakes = [
//     { d: catmullRom([[760, 318], [800, 300], [846, 312], [858, 348], [820, 372], [772, 358]], true) },
//     { d: catmullRom([[612, 556], [648, 548], [672, 566], [664, 596], [628, 602], [606, 582]], true) },
//   ];
//   return { blobs, contours, rivers, lakes };
// }
// const RELIEF = buildRelief();
const ROUTE_D = catmullRom(STOPS.map((s) => s.p), false);

/* ================ 360° PANORAMA ================ */
const PTHEME = {
  gateway: { skyTop: "#9fc4e0", skyBot: "#f3e3c2", sun: [0.78, 0.32], snow: 0, water: 0, stars: 0, warm: 0.7 },
  town: { skyTop: "#13294a", skyBot: "#d59a6e", sun: [0.2, 0.42], snow: 1, water: 0, stars: 1, warm: 0.5, lights: 1 },
  monastery: { skyTop: "#274a78", skyBot: "#f0c98e", sun: [0.5, 0.3], snow: 1, water: 0, stars: 0, warm: 0.8, statue: 1 },
  hills: { skyTop: "#8fb9d6", skyBot: "#e7eee2", sun: [0.7, 0.28], snow: 0, water: 0, stars: 0, warm: 0.5 },
  peaks: { skyTop: "#0e2347", skyBot: "#ff9e6b", sun: [0.5, 0.34], snow: 1, water: 0, stars: 1, warm: 0.9 },
  lake: { skyTop: "#7fb0d2", skyBot: "#dde9e4", sun: [0.3, 0.3], snow: 1, water: 1, stars: 0, warm: 0.4 },
};
function hxc(c) { const m = c.replace("#", ""); return `${parseInt(m.slice(0, 2), 16)},${parseInt(m.slice(2, 4), 16)},${parseInt(m.slice(4, 6), 16)}`; }
function mixc(a, b, t) { const pa = hxc(a).split(",").map(Number), pb = hxc(b).split(",").map(Number); const v = pa.map((x, i) => Math.max(0, Math.min(255, Math.round(x + (pb[i] - x) * t)))); return `#${v.map((x) => x.toString(16).padStart(2, "0")).join("")}`; }
function paintPanorama(theme) {
  const Wp = 2400, Hp = 1200, hz = Hp * 0.58;
  const cv = document.createElement("canvas"); cv.width = Wp; cv.height = Hp;
  const x = cv.getContext("2d"); const P = PTHEME[theme];
  const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, P.skyTop); sky.addColorStop(0.7, mixc(P.skyTop, P.skyBot, 0.55)); sky.addColorStop(1, P.skyBot); x.fillStyle = sky; x.fillRect(0, 0, Wp, hz + 2);
  if (P.stars) for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(255,255,255,${(Math.random() * 0.5 + 0.1).toFixed(2)})`; x.fillRect(Math.random() * Wp, Math.random() * hz * 0.7, Math.random() < 0.1 ? 2 : 1, 1); }
  const sx = Wp * P.sun[0], sy = Hp * P.sun[1]; let g = x.createRadialGradient(sx, sy, 0, sx, sy, 520); g.addColorStop(0, `rgba(255,${230 - P.warm * 30},${190 - P.warm * 60},0.95)`); g.addColorStop(0.4, `rgba(255,220,170,${0.4 + P.warm * 0.2})`); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, Wp, Hp);
  for (let i = 0; i < 9; i++) { const cx = Math.random() * Wp, cy = hz * (0.15 + Math.random() * 0.5), rw = 180 + Math.random() * 320; const cg = x.createRadialGradient(cx, cy, 0, cx, cy, rw); cg.addColorStop(0, "rgba(255,255,255,0.16)"); cg.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = cg; x.save(); x.translate(cx, cy); x.scale(1, 0.32); x.beginPath(); x.arc(0, 0, rw, 0, 6.283); x.fill(); x.restore(); }
  const layers = [{ base: 0.4, amp: [0.18, 0.07, 0.035], freq: [1, 3, 7], col: "#7d92b0", far: 0.85 }, { base: 0.26, amp: [0.15, 0.06], freq: [2, 5], col: "#56708e", far: 0.5 }, { base: 0.12, amp: [0.11, 0.045], freq: [3, 8], col: "#33465f", far: 0.2 }];
  layers.forEach((L, li) => {
    const ridge = (px) => { const t = (px / Wp) * 6.283; let y = hz - Hp * L.base; L.freq.forEach((f, i) => (y -= Math.sin(t * f + i * 1.9 + li) * Hp * L.amp[i])); return y; };
    const top = mixc(L.col, "#ffffff", 0.22), bot = mixc(L.col, "#000000", 0.25); const lg = x.createLinearGradient(0, hz - Hp * L.base - Hp * 0.25, 0, Hp); lg.addColorStop(0, mixc(top, P.skyBot, L.far * 0.5)); lg.addColorStop(0.5, mixc(L.col, P.skyBot, L.far * 0.35)); lg.addColorStop(1, bot);
    x.beginPath(); x.moveTo(0, Hp); for (let px = 0; px <= Wp; px += 3) x.lineTo(px, ridge(px)); x.lineTo(Wp, Hp); x.closePath(); x.fillStyle = lg; x.fill();
    if (P.snow && li === 0) for (let px = 0; px <= Wp; px += 3) { const y = ridge(px); const peak = (hz - Hp * L.base - y) / (Hp * L.amp[0]); if (peak > 0.5) { const cap = (peak - 0.45) * 130; const sg = x.createLinearGradient(0, y, 0, y + cap); sg.addColorStop(0, "rgba(248,252,255,0.95)"); sg.addColorStop(1, "rgba(248,252,255,0)"); x.fillStyle = sg; x.fillRect(px, y, 3, cap); } }
  });
  const haze = x.createLinearGradient(0, hz - 120, 0, hz + 60); haze.addColorStop(0, "rgba(255,255,255,0)"); haze.addColorStop(0.6, `rgba(${hxc(P.skyBot)},0.45)`); haze.addColorStop(1, `rgba(${hxc(P.skyBot)},0)`); x.fillStyle = haze; x.fillRect(0, hz - 120, Wp, 180);
  if (P.statue) { const px = Wp * 0.5, by = hz + 16, hh = 240; x.fillStyle = "#cdae6c"; x.beginPath(); x.ellipse(px, by - hh, 26, 34, 0, 0, 6.283); x.fill(); x.fillRect(px - 20, by - hh + 16, 40, hh - 16); x.fillStyle = "rgba(120,90,30,0.4)"; x.fillRect(px + 2, by - hh + 16, 18, hh - 16); }
  if (P.water) { const wg = x.createLinearGradient(0, hz, 0, Hp); wg.addColorStop(0, "rgba(150,180,188,0.9)"); wg.addColorStop(1, "rgba(28,62,72,1)"); x.fillStyle = wg; x.fillRect(0, hz, Wp, Hp - hz); x.save(); x.globalAlpha = 0.18; x.translate(0, hz * 2); x.scale(1, -1); x.fillStyle = "#445a76"; x.beginPath(); x.moveTo(0, hz); for (let px = 0; px <= Wp; px += 6) x.lineTo(px, hz - Hp * 0.12 - Math.sin((px / Wp) * 6.283 * 3) * Hp * 0.06); x.lineTo(Wp, hz); x.closePath(); x.fill(); x.restore(); x.strokeStyle = "rgba(255,255,255,0.08)"; for (let i = 0; i < 70; i++) { const yy = hz + Math.random() * (Hp - hz); x.beginPath(); x.moveTo(0, yy); x.lineTo(Wp, yy); x.stroke(); } }
  else { const fg = x.createLinearGradient(0, hz, 0, Hp); fg.addColorStop(0, "rgba(20,30,22,0.9)"); fg.addColorStop(1, "rgba(6,10,8,1)"); x.fillStyle = fg; x.fillRect(0, hz, Wp, Hp - hz); }
  if (P.lights) { x.fillStyle = "rgba(255,205,140,0.9)"; for (let i = 0; i < 260; i++) x.fillRect(Math.random() * Wp, hz + Math.random() * (Hp - hz) * 0.55, 2, 2); }
  const gr = x.getImageData(0, 0, Wp, Hp), dd = gr.data; for (let i = 0; i < dd.length; i += 4) { const n = (Math.random() - 0.5) * 14; dd[i] += n; dd[i + 1] += n; dd[i + 2] += n; } x.putImageData(gr, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter; return tex;
}
function PanoViewer({ open, theme, name, onClose }) {
  const ref = useRef(null), fovRef = useRef(74);
  useEffect(() => {
    if (!open || !ref.current) return;
    const mount = ref.current, reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(mount.clientWidth, mount.clientHeight); renderer.domElement.style.cssText = "display:block;touch-action:none;cursor:grab;"; mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(74, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(60, 64, 44), new THREE.MeshBasicMaterial({ side: THREE.BackSide, map: paintPanorama(theme) })); scene.add(sphere);
    let lon = -18, lat = 4, dragging = false, lx = 0, ly = 0; const t = new THREE.Vector3(); const dom = renderer.domElement;
    const down = (e) => { dragging = true; lx = e.clientX; ly = e.clientY; dom.style.cursor = "grabbing"; };
    const move = (e) => { if (!dragging) return; lon -= (e.clientX - lx) * 0.12; lat = Math.max(-78, Math.min(78, lat + (e.clientY - ly) * 0.12)); lx = e.clientX; ly = e.clientY; };
    const up = () => { dragging = false; dom.style.cursor = "grab"; };
    const wheel = (e) => { e.preventDefault(); fovRef.current = Math.max(40, Math.min(92, fovRef.current + e.deltaY * 0.04)); };
    dom.addEventListener("pointerdown", down); window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); dom.addEventListener("wheel", wheel, { passive: false });
    let raf; const loop = () => { raf = requestAnimationFrame(loop); if (!dragging && !reduce) lon += 0.03; cam.fov = fovRef.current; cam.updateProjectionMatrix(); const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon); t.set(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)); cam.lookAt(t); renderer.render(scene, cam); }; loop();
    const onResize = () => { renderer.setSize(mount.clientWidth, mount.clientHeight); cam.aspect = mount.clientWidth / mount.clientHeight; cam.updateProjectionMatrix(); }; window.addEventListener("resize", onResize); mount._api = { zoom: (d) => { fovRef.current = Math.max(40, Math.min(92, fovRef.current + d)); } };
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); dom.removeEventListener("pointerdown", down); dom.removeEventListener("wheel", wheel); sphere.material.map.dispose(); renderer.dispose(); if (mount.contains(dom)) mount.removeChild(dom); };
  }, [open, theme]);
  if (!open) return null;
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "#000" }} className="tot-fade">
      <div ref={ref} style={{ position: "absolute", inset: 0 }} />
      <div style={panoTop}><Compass size={17} color={C.gold} /><span style={{ fontWeight: 800 }}>{name}</span><span style={{ color: C.muted, fontSize: 12 }}>· 360°</span></div>
      <button onClick={onClose} style={panoClose}><X size={16} /> Close</button>
      <div style={panoHint}><Navigation size={14} color={C.gold} /> Drag to look around</div>
      <div style={{ position: "absolute", right: 14, bottom: 86, display: "flex", flexDirection: "column", gap: 8, zIndex: 71 }}>
        <button style={zoomBtn} onClick={() => ref.current?._api?.zoom(-8)}><Plus size={18} /></button>
        <button style={zoomBtn} onClick={() => ref.current?._api?.zoom(8)}><Minus size={18} /></button>
      </div>
    </div>
  );
}

const CSS = `
@keyframes totFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes totFade{from{opacity:0}to{opacity:1}}
@keyframes totDrop{from{opacity:0;transform:translateY(-22px)}to{opacity:1;transform:translateY(0)}}
@keyframes totPulse{0%,100%{box-shadow:0 0 0 0 rgba(232,49,62,.5)}50%{box-shadow:0 0 0 12px rgba(232,49,62,0)}}
@keyframes totRing{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.4);opacity:0}}
.tot-fade-up{animation:totFadeUp .5s both cubic-bezier(.2,.7,.2,1)}
.tot-fade{animation:totFade .4s both}
.tot-drop{animation:totDrop .5s both cubic-bezier(.2,.8,.2,1)}
.tot-scroll::-webkit-scrollbar{display:none}.tot-scroll{scrollbar-width:none;-ms-overflow-style:none}
.tot-btn{transition:transform .12s ease,opacity .2s ease}.tot-btn:active{transform:scale(.96)}
.tot-pulse{animation:totPulse 2.2s infinite}
`;

export default function JourneyMap() {
  const wrapRef = useRef(null), worldRef = useRef(null), inputRef = useRef(null);
  const baseRef = useRef(null), progRef = useRef(null);
  const sheetRef = useRef(null), stripRef = useRef(null);
  const stopElRefs = useRef([]), poiElRefs = useRef([]), travElRef = useRef(null);
  const lenAtRef = useRef([]), totalRef = useRef(0), animRef = useRef(null), idxRef = useRef(0), travelingRef = useRef(false);
  const camRef = useRef({ tx: 0, ty: 0, s: 0 }), minSRef = useRef(1), poisRef = useRef([]), travPosRef = useRef(null);

  const [index, setIndex] = useState(0);
  const [traveling, setTraveling] = useState(false);
  const [pano, setPano] = useState(false);
  const [compact, setCompact] = useState(typeof window !== "undefined" ? window.innerWidth < 760 : false);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [overview, setOverview] = useState(false);
  const [legend, setLegend] = useState(false);
  const [pois, setPois] = useState([]);
  const [ready, setReady] = useState(false);
  const reduceRef = useRef(false);

  const getVW = () => wrapRef.current?.clientWidth || window.innerWidth;
  const getVH = () => wrapRef.current?.clientHeight || window.innerHeight;

  const projectMarkers = () => {
    const { tx, ty, s } = camRef.current;
    for (let i = 0; i < STOPS.length; i++) { const el = stopElRefs.current[i]; if (el) el.style.transform = `translate(${tx + s * STOPS[i].p[0]}px,${ty + s * STOPS[i].p[1]}px) translate(-50%,-50%)`; }
    const ps = poisRef.current; for (let i = 0; i < ps.length; i++) { const el = poiElRefs.current[i]; if (el) el.style.transform = `translate(${tx + s * ps[i].x}px,${ty + s * ps[i].y}px) translate(-50%,-50%)`; }
    const t = travPosRef.current; if (travElRef.current && t) travElRef.current.style.transform = `translate(${tx + s * t.x}px,${ty + s * t.y}px) translate(-50%,-50%)`;
  };
  const applyTransform = () => {
    const w = worldRef.current; if (!w) return;
    const vw = getVW(), vh = getVH(), s = camRef.current.s;
    camRef.current.tx = Math.min(0, Math.max(vw - s * W, camRef.current.tx));
    camRef.current.ty = Math.min(0, Math.max(vh - s * H, camRef.current.ty));
    const { tx, ty } = camRef.current;
    w.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    projectMarkers();
  };
  const centerOn = (px, py) => {
    const vw = getVW(), vh = getVH(), cmp = vw < 760, s = camRef.current.s;
    camRef.current.tx = vw / 2 - s * px;
    camRef.current.ty = vh * (cmp ? 0.30 : 0.46) - s * py;
    applyTransform();
  };
  const applyLayout = (recenter = true) => {
    const vw = getVW(), vh = getVH(); setCompact(vw < 760);
    const cover = Math.max(vw / W, vh / H); minSRef.current = cover;
    let s = camRef.current.s; if (!s || s < cover) s = Math.max(cover * 1.04, Math.min(2.2, vw / 740));
    camRef.current.s = clamp(s, cover, cover * 3.2);
    if (recenter) centerOn(STOPS[idxRef.current].p[0], STOPS[idxRef.current].p[1]); else applyTransform();
  };

  useLayoutEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      const path = baseRef.current; if (!path) return;
      const total = path.getTotalLength(); totalRef.current = total;
      lenAtRef.current = STOPS.map((s) => { let best = 0, bd = Infinity; for (let l = 0; l <= total; l += total / 800) { const pt = path.getPointAtLength(l); const dx = pt.x - s.p[0], dy = pt.y - s.p[1], d = dx * dx + dy * dy; if (d < bd) { bd = d; best = l; } } return best; });
      const ps = POI_DEFS.map((d) => { const pt = path.getPointAtLength(d.f * total); return { ...d, x: pt.x, y: pt.y }; });
      poisRef.current = ps; setPois(ps);
      if (progRef.current) { progRef.current.style.strokeDasharray = `${total}`; progRef.current.style.strokeDashoffset = `${total - lenAtRef.current[0]}`; }
      path.style.strokeDasharray = `${total}`; path.style.strokeDashoffset = `${total}`;
      requestAnimationFrame(() => { path.style.transition = reduceRef.current ? "none" : "stroke-dashoffset 1.8s ease"; path.style.strokeDashoffset = "0"; });
      const tp = path.getPointAtLength(lenAtRef.current[0]); travPosRef.current = { x: tp.x, y: tp.y };
      applyLayout(true);
      setReady(true);
    };
    const id = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => { poisRef.current = pois; applyTransform(); }, [pois]);
  useEffect(() => { const onR = () => applyLayout(true); window.addEventListener("resize", onR); return () => window.removeEventListener("resize", onR); }, []);
//   useEffect(() => { try { stripRef.current?.querySelector(`[data-day="${index}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (e) {} }, [index, sheetOpen]);
useEffect(() => {
  const strip = stripRef.current;
  const active = strip?.querySelector(
    `[data-day="${index}"]`
  );

  if (!strip || !active) return;

  const target =
    active.offsetLeft -
    strip.clientWidth / 2 +
    active.clientWidth / 2;

  strip.scrollTo({
    left: Math.max(
      0,
      Math.min(
        target,
        strip.scrollWidth - strip.clientWidth
      )
    ),
    behavior: "smooth",
  });
}, [index, sheetOpen]);

  const goTo = (target) => {
    if (travelingRef.current || pano) return;
    target = clamp(target, 0, STOPS.length - 1); if (target === idxRef.current) return;
    const path = baseRef.current, lens = lenAtRef.current; if (!path || !lens.length) return;
    travelingRef.current = true; setTraveling(true);
    const from = idxRef.current, start = performance.now(), dur = reduceRef.current ? 420 : 1500, total = totalRef.current;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur), e = ease(p);
      const curLen = lens[from] + (lens[target] - lens[from]) * e;
      const pt = path.getPointAtLength(curLen);
      travPosRef.current = { x: pt.x, y: pt.y };
      if (progRef.current) progRef.current.style.strokeDashoffset = `${total - curLen}`;
      centerOn(pt.x, pt.y);
      if (p < 1) animRef.current = requestAnimationFrame(step);
      else { idxRef.current = target; travelingRef.current = false; setTraveling(false); setIndex(target); centerOn(STOPS[target].p[0], STOPS[target].p[1]); }
    };
    animRef.current = requestAnimationFrame(step);
  };
  useEffect(() => () => animRef.current && cancelAnimationFrame(animRef.current), []);

  /* ---- map pan / zoom / pinch ---- */
  useEffect(() => {
    const el = inputRef.current; if (!el) return;
    const pts = new Map(); let pan = null, pinch = null;
    const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const down = (e) => {
      if (travelingRef.current) return;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) pan = { x: e.clientX, y: e.clientY, tx: camRef.current.tx, ty: camRef.current.ty };
      else if (pts.size === 2) { const a = [...pts.values()]; pinch = { dist: d2(a[0], a[1]), s: camRef.current.s, tx: camRef.current.tx, ty: camRef.current.ty, mx: (a[0].x + a[1].x) / 2, my: (a[0].y + a[1].y) / 2 }; pan = null; }
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const rect = wrapRef.current.getBoundingClientRect();
      if (pts.size >= 2 && pinch) { const a = [...pts.values()]; const nd = d2(a[0], a[1]); const ns = clamp(pinch.s * (nd / pinch.dist), minSRef.current, minSRef.current * 3.2); const mx = pinch.mx - rect.left, my = pinch.my - rect.top; camRef.current.tx = mx - ((mx - pinch.tx) / pinch.s) * ns; camRef.current.ty = my - ((my - pinch.ty) / pinch.s) * ns; camRef.current.s = ns; applyTransform(); }
      else if (pan) { camRef.current.tx = pan.tx + (e.clientX - pan.x); camRef.current.ty = pan.ty + (e.clientY - pan.y); applyTransform(); }
    };
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 1) { const a = [...pts.values()][0]; pan = { x: a.x, y: a.y, tx: camRef.current.tx, ty: camRef.current.ty }; } if (pts.size === 0) pan = null; };
    const wheel = (e) => { e.preventDefault(); if (travelingRef.current) return; const rect = wrapRef.current.getBoundingClientRect(); const cx = e.clientX - rect.left, cy = e.clientY - rect.top; const oldS = camRef.current.s; const ns = clamp(oldS * (1 - e.deltaY * 0.0014), minSRef.current, minSRef.current * 3.2); camRef.current.tx = cx - ((cx - camRef.current.tx) / oldS) * ns; camRef.current.ty = cy - ((cy - camRef.current.ty) / oldS) * ns; camRef.current.s = ns; applyTransform(); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("wheel", wheel, { passive: false });
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel); };
  }, []);

  const recenter = () => { camRef.current.s = Math.max(minSRef.current * 1.04, Math.min(2.2, getVW() / 740)); centerOn(STOPS[idxRef.current].p[0], STOPS[idxRef.current].p[1]); };

  /* ---- sheet drag (mobile) ---- */
  const dragRef = useRef(null);
  const onHandleDown = (e) => {
    if (!compact || !sheetRef.current) return;
    const h = sheetRef.current.clientHeight, peek = 96, maxT = Math.max(0, h - peek);
    dragRef.current = { startY: e.clientY, maxT, baseT: sheetOpen ? 0 : maxT, moved: false };
    sheetRef.current.style.transition = "none";
    const mv = (ev) => { if (!dragRef.current) return; const dy = ev.clientY - dragRef.current.startY; if (Math.abs(dy) > 4) dragRef.current.moved = true; const t = Math.max(0, Math.min(dragRef.current.maxT, dragRef.current.baseT + dy)); sheetRef.current.style.transform = `translateY(${t}px)`; };
    const upp = (ev) => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", upp); if (!dragRef.current) return; const dy = ev.clientY - dragRef.current.startY, moved = dragRef.current.moved, maxT2 = dragRef.current.maxT; sheetRef.current.style.transition = ""; sheetRef.current.style.transform = ""; if (!moved) setSheetOpen((v) => !v); else setSheetOpen(Math.max(0, Math.min(maxT2, dragRef.current.baseT + dy)) < maxT2 / 2); dragRef.current = null; };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", upp);
  };

  const stop = STOPS[index], isFirst = index === 0, isLast = index === STOPS.length - 1;
  const contentH = compact ? "38vh" : 300;

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%", height: "100dvh", minHeight: 560, overflow: "hidden", background: C.bg0, fontFamily: "'SF Pro Display',-apple-system,system-ui,'Segoe UI',sans-serif", color: C.text, userSelect: "none", WebkitTapHighlightColor: "transparent", touchAction: "none" }}>
      <style>{CSS}</style>

{/* MAP WORLD */}
<div
  ref={worldRef}
  style={{
    position: "absolute",
    left: 0,
    top: 0,
    width: W,
    height: H,
    transformOrigin: "0 0",
    willChange: "transform",
    pointerEvents: "none",
  }}
>

  <img
    src="/maps/hill-terrain-map.png"
    alt=""
    draggable={false}
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      userSelect: "none",
      pointerEvents: "none",
    }}
  />

  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{
      position: "absolute",
      inset: 0,
    }}
  >
    <defs>
      <filter
        id="routeGlow"
        x="-30%"
        y="-30%"
        width="160%"
        height="160%"
      >
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient
        id="routeProg"
        x1="0"
        y1="0"
        x2="1"
        y2="1"
      >
        <stop offset="0%" stopColor={C.gold} />
        <stop offset="100%" stopColor={C.red} />
      </linearGradient>
    </defs>

    <path
      ref={baseRef}
      d={ROUTE_D}
      fill="none"
      stroke="rgba(246,194,84,0.25)"
      strokeWidth="5"
      strokeLinecap="round"
    />

    <path
      ref={progRef}
      d={ROUTE_D}
      fill="none"
      stroke="url(#routeProg)"
      strokeWidth="6"
      strokeLinecap="round"
      filter="url(#routeGlow)"
    />
  </svg>
</div>

      {/* MAP INPUT (pan / zoom / pinch) */}
      <div ref={inputRef} style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "grab", touchAction: "none" }} />

      {/* MARKERS (screen-space overlay, constant size, tappable) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none", opacity: ready ? 1 : 0, transition: "opacity .4s" }}>
        {/* POIs */}
        {pois.map((poi, i) => (
          <div key={"poi" + i} ref={(el) => (poiElRefs.current[i] = el)} style={{ position: "absolute", left: 0, top: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 15, height: 15, borderRadius: 99, background: CAT[poi.type], border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }} />
            {!compact && <span style={{ fontSize: 11, color: "#cfd8e2", background: "rgba(8,12,20,0.7)", padding: "2px 7px", borderRadius: 7, whiteSpace: "nowrap" }}>{poi.label}</span>}
          </div>
        ))}
        {/* stop pins */}
        {STOPS.map((s, i) => {
          const active = i === index, visited = i < index;
          const size = active ? 40 : compact ? 30 : 26;
          return (
            <button key={i} ref={(el) => (stopElRefs.current[i] = el)} onClick={() => goTo(i)} className={active ? "tot-pulse" : ""}
              style={{ position: "absolute", left: 0, top: 0, width: size, height: size, borderRadius: 99, border: active ? "2.5px solid #fff" : visited ? "2px solid rgba(255,255,255,0.5)" : "2px solid rgba(180,200,220,0.5)", background: active ? C.red : visited ? C.gold : "rgba(18,26,38,0.95)", color: active || visited ? "#fff" : "#c2cdd9", fontWeight: 800, fontSize: active ? 15 : 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: traveling ? "default" : "pointer", pointerEvents: traveling ? "none" : "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.5)", zIndex: active ? 3 : 1 }}>
              {i + 1}
              {active && !traveling && (
                <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: C.red, color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
                  {s.short}
                  <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `5px solid ${C.red}` }} />
                </span>
              )}
            </button>
          );
        })}
        {/* traveller */}
        <div ref={travElRef} style={{ position: "absolute", left: 0, top: 0, opacity: traveling ? 1 : 0, transition: "opacity .25s" }}>
          <span style={{ position: "absolute", inset: -9, borderRadius: 99, border: `2px solid ${C.gold}`, animation: "totRing 1.4s infinite" }} />
          <div style={{ width: 20, height: 20, borderRadius: 99, background: C.gold, border: "2px solid #1a1205", boxShadow: `0 0 16px ${C.gold}` }} />
          <span style={{ position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)", background: C.gold, color: "#1a1205", fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 8, whiteSpace: "nowrap" }}>You are here</span>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="tot-drop" style={{ position: "absolute", top: compact ? 12 : 18, left: compact ? 12 : 20, right: compact ? 12 : 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", zIndex: 20, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={brandChip}><svg width="13" height="17" viewBox="0 0 14 18"><path d="M7 0C3.1 0 0 3.1 0 7c0 5 7 11 7 11s7-6 7-11c0-3.9-3.1-7-7-7z" fill={C.red} /><circle cx="7" cy="7" r="2.6" fill="#fff" /></svg><span style={{ fontWeight: 900, fontStyle: "italic", color: C.red, fontSize: 14 }}>TAP</span><span style={{ fontWeight: 800, fontSize: 10, color: C.ink, letterSpacing: 1.4 }}>ON TRAVEL</span></div>
            <button className="tot-btn" onClick={() => setOverview(true)} style={iconChip}><List size={16} /> {!compact && "Overview"}</button>
          </div>
          {!compact && <div style={{ marginTop: 12 }}><div style={{ fontSize: 10, letterSpacing: 3, color: C.gold, fontWeight: 700, fontFamily: "ui-monospace,monospace" }}>6 NIGHTS · 7 DAYS · CUSTOMISED</div><div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05, letterSpacing: -0.5, textShadow: "0 3px 18px rgba(0,0,0,0.7)" }}>Sikkim <span style={{ color: C.faint, fontWeight: 600 }}>+</span> North Bengal</div></div>}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", pointerEvents: "auto" }}>
          <div style={dayBadge}><span style={{ color: C.red, fontWeight: 800 }}>{String(index + 1).padStart(2, "0")}</span><span style={{ color: C.faint }}>/{String(STOPS.length).padStart(2, "0")}</span></div>
          <button className="tot-btn" onClick={() => setLegend((v) => !v)} style={{ ...iconChip, background: legend ? "rgba(246,194,84,0.16)" : C.glass, color: legend ? C.gold : C.text }}><Layers size={16} /></button>
        </div>
      </div>

      {compact && !pano && (
        <div style={{ position: "absolute", top: 52, left: 12, right: 12, zIndex: 18, pointerEvents: "none" }}>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}><div style={{ height: "100%", width: `${(index / (STOPS.length - 1)) * 100}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.red})`, borderRadius: 99, transition: "width .6s cubic-bezier(.5,0,.2,1)" }} /></div>
        </div>
      )}

      {/* zoom + recenter controls */}
      {!pano && (
        <div style={{ position: "absolute", zIndex: 19, right: compact ? 12 : 22, top: compact ? 92 : "auto", bottom: compact ? "auto" : 110, display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="tot-btn" style={mapBtn} onClick={() => { const c = camRef.current; const ns = clamp(c.s * 1.3, minSRef.current, minSRef.current * 3.2); const vw = getVW(), vh = getVH(); c.tx = vw / 2 - ((vw / 2 - c.tx) / c.s) * ns; c.ty = vh / 2 - ((vh / 2 - c.ty) / c.s) * ns; c.s = ns; applyTransform(); }}><Plus size={18} /></button>
          <button className="tot-btn" style={mapBtn} onClick={() => { const c = camRef.current; const ns = clamp(c.s / 1.3, minSRef.current, minSRef.current * 3.2); const vw = getVW(), vh = getVH(); c.tx = vw / 2 - ((vw / 2 - c.tx) / c.s) * ns; c.ty = vh / 2 - ((vh / 2 - c.ty) / c.s) * ns; c.s = ns; applyTransform(); }}><Minus size={18} /></button>
          <button className="tot-btn" style={mapBtn} onClick={recenter} title="Recenter"><Crosshair size={17} /></button>
        </div>
      )}

      {/* LEGEND */}
      {legend && !pano && (
        <div className="tot-fade-up" style={{ position: "absolute", zIndex: 21, ...(compact ? { top: 92, left: 12 } : { bottom: 28, right: 22 }), background: C.glass, border: `1px solid ${C.line}`, backdropFilter: "blur(14px)", borderRadius: 16, padding: 14, width: 184 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: C.muted, fontWeight: 700, marginBottom: 10, fontFamily: "ui-monospace,monospace" }}>MAP LEGEND</div>
          {[["Travelled", C.gold, "line"], ["Route ahead", "rgba(246,194,84,0.4)", "line"], ["Stop", C.red, "dot"], ["Viewpoint", C.view, "dot"], ["Stay", C.stay, "dot"], ["Food", C.food, "dot"]].map(([n, c, k]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 9, margin: "7px 0", fontSize: 12.5, color: "#D7DFE8" }}>{k === "line" ? <span style={{ width: 18, height: 3, borderRadius: 2, background: c }} /> : <span style={{ width: 11, height: 11, borderRadius: 99, background: c, border: "1.5px solid rgba(255,255,255,0.5)" }} />}{n}</div>
          ))}
        </div>
      )}

      {/* OVERVIEW DRAWER */}
      {overview && (
        <div style={{ position: "absolute", inset: 0, zIndex: 55 }}>
          <div onClick={() => setOverview(false)} className="tot-fade" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: compact ? "84%" : 380, maxWidth: 420, background: "rgba(10,14,22,0.97)", borderRight: `1px solid ${C.line}`, backdropFilter: "blur(20px)", padding: "20px 18px", overflowY: "auto", animation: "totFadeUp .4s both" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><div style={{ fontSize: 20, fontWeight: 800 }}>Trip Overview</div><button className="tot-btn" onClick={() => setOverview(false)} style={iconChip}><X size={16} /></button></div>
            <div style={{ color: C.muted, fontSize: 12.5, marginBottom: 18 }}>Gangtok → Namchi → Kalimpong → Darjeeling → Mirik</div>
            {STOPS.map((s, i) => (
              <button key={i} className="tot-btn" onClick={() => { goTo(i); setOverview(false); }} style={{ display: "flex", gap: 12, alignItems: "center", width: "100%", textAlign: "left", background: i === index ? "rgba(232,49,62,0.12)" : "transparent", border: `1px solid ${i === index ? "rgba(232,49,62,0.4)" : C.line}`, borderRadius: 14, padding: 12, marginBottom: 9, cursor: "pointer", color: C.text }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, color: "#fff", fontSize: 13 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div><div style={{ fontSize: 11.5, color: C.muted, fontFamily: "ui-monospace,monospace", marginTop: 2 }}>{s.day} · {s.elevation}{s.drive !== "—" ? ` · ${s.drive}` : ""}</div></div>
                {i === index && <MapPin size={16} color={C.red} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DETAIL SHEET (fixed height, pinned buttons, stays where you left it) */}
      {!pano && (
        <div ref={sheetRef} style={{ position: "absolute", zIndex: 30, ...(compact ? { left: 0, right: 0, bottom: 0, transform: sheetOpen ? "translateY(0)" : "translateY(calc(100% - 180px))", transition: "transform .5s cubic-bezier(.4,0,.1,1)", animation: "totFade .5s both" } : { left: 20, bottom: 22, width: 396, animation: "totFadeUp .6s both" }) }}>
          <div style={{ background: C.glass, backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", border: `1px solid ${C.line}`, borderRadius: compact ? "24px 24px 0 0" : 24, boxShadow: "0 -12px 50px rgba(0,0,0,0.55)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {compact && (
              <div onPointerDown={onHandleDown} style={{ padding: "10px 16px 8px", cursor: "grab", touchAction: "none", flexShrink: 0 }}>
                <div style={{ width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.25)", margin: "0 auto 10px" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${stop.grad[0]}, ${stop.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}>{index + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{traveling ? "On the road…" : stop.name}</div><div style={{ fontSize: 11, color: C.muted, fontFamily: "ui-monospace,monospace" }}>{stop.day} · {stop.tag}</div></div>
                  <ChevronUp size={20} color={C.muted} style={{ transform: sheetOpen ? "rotate(180deg)" : "none", transition: "transform .4s" }} />
                </div>
              </div>
            )}

            {/* scrolling content — FIXED height so nothing shifts */}
            <div className="tot-scroll" style={{ height: contentH, overflowY: "auto", overflowY: "hidden", maxWidth: "100%", padding: compact ? "0 18px" : "20px 20px 0" }}>
              <div ref={stripRef} className="tot-scroll" style={{ display: "flex", overflowX: "auto", padding: "6px 2px 14px", margin: compact ? "0 -4px" : 0, borderBottom: `1px solid ${C.line}` }}>
                {STOPS.map((s, i) => {
                  const active = i === index, visited = i < index;
                  return (
                    <div key={i} data-day={i} onClick={() => goTo(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", flexShrink: 0, position: "relative", width: 76 }}>
                      {i > 0 && <div style={{ position: "absolute", top: 22, right: "50%", width: "100%", height: 2, background: visited ? C.gold : "rgba(255,255,255,0.14)", zIndex: 0 }} />}
                      <div style={{ width: active ? 46 : 38, height: active ? 46 : 38, borderRadius: 99, background: `linear-gradient(135deg, ${s.grad[0]}, ${s.grad[1]})`, border: active ? `2.5px solid ${C.red}` : visited ? `2px solid ${C.gold}` : "2px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, transition: "all .35s cubic-bezier(.4,0,.1,1)", boxShadow: active ? "0 0 0 4px rgba(232,49,62,0.18)" : "none", fontWeight: 800, fontSize: active ? 15 : 13, color: "#fff" }}>{i + 1}</div>
                      <div style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, color: active ? C.text : C.muted, marginTop: 6, whiteSpace: "nowrap" }}>{s.short}</div>
                      <div style={{ fontSize: 9, color: C.faint, fontFamily: "ui-monospace,monospace" }}>{s.drive === "—" ? "Start" : s.drive}</div>
                    </div>
                  );
                })}
              </div>

              <div key={index} className="tot-fade-up">
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap", marginTop: 14 }}><h2 style={{ fontSize: compact ? 22 : 25, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>{stop.name}</h2><span style={tagPill}>{stop.tag}</span></div>
                <div style={{ fontSize: 10.5, color: C.faint, fontFamily: "ui-monospace,monospace", letterSpacing: 1, marginTop: 4 }}>{stop.coord}</div>
                <div style={{ display: "flex", gap: 8, margin: "14px 0" }}>
                  {[[CalendarDays, "DAY", stop.day], [Clock, "DRIVE", stop.drive], [Mountain, "ELEVATION", stop.elevation]].map(([Ic, l, v], k) => (
                    <div key={k} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 8px", textAlign: "center" }}><Ic size={14} color={C.gold} style={{ marginBottom: 4 }} /><div style={{ fontSize: 9, letterSpacing: 1, color: C.muted, fontFamily: "ui-monospace,monospace" }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>{v}</div></div>
                  ))}
                </div>
                <p style={{ color: "#C6D0DC", fontSize: 13.5, lineHeight: 1.55, margin: "0 0 13px" }}>{stop.blurb}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 14 }}>{stop.highlights.map((h) => <span key={h} style={chip}>{h}</span>)}</div>
              </div>
            </div>

            {/* buttons — pinned, never move */}
            <div style={{ display: "flex", gap: 9, padding: compact ? "12px 18px calc(14px + env(safe-area-inset-bottom))" : "14px 20px 18px", borderTop: `1px solid ${C.line}`, flexShrink: 0 }}>
              <button className="tot-btn" onClick={() => goTo(index - 1)} disabled={isFirst || traveling} style={btn(isFirst || traveling, "ghost", compact)}><ChevronLeft size={18} />{!compact && " Back"}</button>
              <button className="tot-btn" onClick={() => setPano(true)} disabled={traveling} style={btn(traveling, "gold", compact)}><Eye size={16} /> 360°</button>
              <button className="tot-btn" onClick={() => goTo(index + 1)} disabled={isLast || traveling} style={btn(isLast || traveling, "primary", compact)}>{traveling ? "Travelling…" : isLast ? "Journey complete" : <><Play size={15} fill="#fff" /> Next stop</>}{!isLast && !traveling && <ChevronRight size={18} />}</button>
            </div>
          </div>
        </div>
      )}

      <PanoViewer open={pano} theme={stop.theme} name={stop.name} onClose={() => setPano(false)} />
    </div>
  );
}

const brandChip = { display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 99, padding: "6px 12px 6px 10px", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" };
const iconChip = { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(13,18,28,0.86)", border: `1px solid ${C.line}`, backdropFilter: "blur(12px)", color: C.text, borderRadius: 99, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const dayBadge = { display: "inline-flex", alignItems: "center", gap: 1, background: "rgba(13,18,28,0.86)", border: `1px solid ${C.line}`, backdropFilter: "blur(12px)", borderRadius: 99, padding: "8px 14px", fontSize: 13, fontFamily: "ui-monospace,monospace", fontWeight: 700 };
const mapBtn = { width: 40, height: 40, borderRadius: 12, border: `1px solid ${C.line}`, background: C.glass, backdropFilter: "blur(10px)", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
const tagPill = { fontSize: 11, fontWeight: 700, color: C.gold, background: "rgba(246,194,84,0.12)", padding: "3px 10px", borderRadius: 99 };
const chip = { fontSize: 12, color: "#D7DFE8", border: `1px solid ${C.line}`, background: "rgba(255,255,255,0.04)", padding: "5px 11px", borderRadius: 99 };
const panoTop = { position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 9, background: C.glass, border: `1px solid ${C.line}`, backdropFilter: "blur(12px)", padding: "10px 16px", borderRadius: 99, zIndex: 71 };
const panoClose = { position: "absolute", top: 16, right: 16, display: "inline-flex", alignItems: "center", gap: 6, background: C.red, color: "#fff", border: "none", borderRadius: 99, padding: "10px 15px", fontWeight: 700, fontSize: 13, cursor: "pointer", zIndex: 71, boxShadow: "0 8px 22px rgba(232,49,62,0.5)" };
const panoHint = { position: "absolute", bottom: 22, left: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 7, color: "#E7EDF4", background: "rgba(7,10,16,0.6)", padding: "8px 14px", borderRadius: 99, fontSize: 13, zIndex: 71 };
const zoomBtn = { width: 42, height: 42, borderRadius: 12, border: `1px solid ${C.line}`, background: C.glass, backdropFilter: "blur(10px)", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

function btn(disabled, variant, compact) {
  const base = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "none", borderRadius: 13, padding: compact ? "13px 14px" : "12px 15px", fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, whiteSpace: "nowrap" };
  if (variant === "primary") return { ...base, flex: 1, background: C.red, color: "#fff", boxShadow: "0 8px 22px rgba(232,49,62,0.4)" };
  if (variant === "gold") return { ...base, background: "rgba(246,194,84,0.14)", color: C.gold, border: `1px solid rgba(246,194,84,0.4)` };
  return { ...base, background: "rgba(255,255,255,0.06)", color: C.text, border: `1px solid ${C.line}`, minWidth: compact ? 46 : "auto" };
}