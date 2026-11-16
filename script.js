// Order: cover, image_1 ... image_12
const images = [
  "images/cover.png",
  "images/image_1.png",  "images/image_2.png",
  "images/image_3.png",  "images/image_4.png",
  "images/image_5.png",  "images/image_6.png",
  "images/image_7.png",  "images/image_8.png",
  "images/image_9.png",  "images/image_10.png",
  "images/image_11.png", "images/image_12.png",
];

const BACK_COVER = null; // back cover image irundha: "images/back.png"
if (images.length % 2 !== 0) images.push(BACK_COVER);

const app = document.getElementById("app");
const scene = document.getElementById("scene");
const stage = document.getElementById("stage");
const book = document.getElementById("book");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const status = document.getElementById("status");
const rotateBtn = document.getElementById("rotateBtn");
const fsBtn = document.getElementById("fsBtn");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const zoomResetBtn = document.getElementById("zoomReset");

const totalLeaves = images.length / 2;
let current = 0;
const leaves = [];

/* ================= Zoom state ================= */
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
let scale = 1, tx = 0, ty = 0;

function clampPan() {
  const maxX = (scene.clientWidth * (scale - 1)) / 2;
  const maxY = (scene.clientHeight * (scale - 1)) / 2;
  tx = Math.max(-maxX, Math.min(maxX, tx));
  ty = Math.max(-maxY, Math.min(maxY, ty));
}

function applyZoom() {
  scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale));
  if (scale === 1) { tx = 0; ty = 0; }
  clampPan();
  stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  zoomResetBtn.textContent = Math.round(scale * 100) + "%";
  zoomOutBtn.disabled = scale <= MIN_ZOOM;
  zoomInBtn.disabled = scale >= MAX_ZOOM;
}

function setZoom(s) { scale = s; applyZoom(); }

zoomInBtn.addEventListener("click", () => setZoom(scale + 0.5));
zoomOutBtn.addEventListener("click", () => setZoom(scale - 0.5));
zoomResetBtn.addEventListener("click", () => setZoom(1));

// Desktop: mouse wheel zoom
scene.addEventListener("wheel", (e) => {
  e.preventDefault();
  setZoom(scale + (e.deltaY < 0 ? 0.25 : -0.25));
}, { passive: false });

// Desktop: double click = zoom toggle
scene.addEventListener("dblclick", () => setZoom(scale > 1 ? 1 : 2));

/* ================= Rotate + Adaptive sizing ================= */
let ratio = 2 / 3;
let rotated = false;

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const portrait = vh > vw;

  if (!portrait) rotated = false;
  rotateBtn.style.display = portrait || rotated ? "" : "none";

  let W, H;
  if (rotated) {
    W = vh; H = vw;
    app.style.width = W + "px";
    app.style.height = H + "px";
    app.style.left = vw + "px";
    app.style.transform = "rotate(90deg)";
  } else {
    W = vw; H = vh;
    app.style.width = W + "px";
    app.style.height = H + "px";
    app.style.left = "0px";
    app.style.transform = "none";
  }

  const small = W < 700 || H < 500;
  const topH = small ? 36 : 40;
  const ctrlH = small ? 46 : 52;
  const availW = W - 6;
  const availH = H - topH - ctrlH - 10;

  const pageH = Math.min(availH, (availW / 2) / ratio);
  const pageW = pageH * ratio;

  const root = document.documentElement.style;
  root.setProperty("--h", pageH + "px");
  root.setProperty("--w", pageW + "px");

  rotateBtn.textContent = rotated ? "⟲ Normal" : "⟳ Rotate";
  applyZoom();
}

const probe = new Image();
probe.onload = () => {
  ratio = probe.naturalWidth / probe.naturalHeight;
  layout();
};
probe.src = images[0];

window.addEventListener("resize", layout);
window.addEventListener("orientationchange", () => setTimeout(layout, 250));

rotateBtn.addEventListener("click", () => {
  rotated = !rotated;
  setZoom(1);
  layout();
});

fsBtn.addEventListener("click", () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(document);
  }
});
if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
  fsBtn.style.display = "none";
}

layout();

/* ================= Build book ================= */
let suppressClick = false;
function blockClickBriefly() {
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 300);
}

function makeFace(className, src) {
  const face = document.createElement("div");
  face.className = "face " + className;
  if (src) face.style.backgroundImage = `url("${src}")`;
  else face.classList.add("blank");
  return face;
}

for (let i = 0; i < totalLeaves; i++) {
  const leaf = document.createElement("div");
  leaf.className = "leaf";

  leaf.append(
    makeFace("front", images[i * 2]),
    makeFace("back", images[i * 2 + 1])
  );

  leaf.addEventListener("click", () => {
    if (suppressClick) return;
    if (leaf.classList.contains("flipped")) prev();
    else next();
  });

  book.appendChild(leaf);
  leaves.push(leaf);
}

function updateZ() {
  leaves.forEach((leaf, i) => {
    if (leaf.classList.contains("flipping")) return;
    leaf.style.zIndex = i < current ? i : totalLeaves - i;
  });
}

function updateState() {
  book.classList.toggle("open", current > 0 && current < totalLeaves);
  book.classList.toggle("end", current === totalLeaves);
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === totalLeaves;

  if (current === 0) status.textContent = "Cover";
  else if (current === totalLeaves) status.textContent = "The End";
  else status.textContent = `Page ${current * 2 - 1} - ${current * 2}`;
}

function flip(leaf, flipTo) {
  leaf.classList.add("flipping");
  leaf.style.zIndex = totalLeaves + 1;
  leaf.classList.toggle("flipped", flipTo);
  setTimeout(() => {
    leaf.classList.remove("flipping");
    updateZ();
  }, 1200);
}

function next() {
  if (current >= totalLeaves) return;
  flip(leaves[current], true);
  current++;
  updateState();
}

function prev() {
  if (current <= 0) return;
  current--;
  flip(leaves[current], false);
  updateState();
}

nextBtn.addEventListener("click", next);
prevBtn.addEventListener("click", prev);
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
  if (e.key === "+" || e.key === "=") setZoom(scale + 0.5);
  if (e.key === "-") setZoom(scale - 0.5);
  if (e.key === "0") setZoom(1);
});

/* ================= Touch: pinch zoom + pan + swipe ================= */
let sx = 0, sy = 0, startTx = 0, startTy = 0;
let pinching = false, multiTouch = false, panned = false;
let startDist = 0, startScale = 1;

function dist(t) {
  return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
}

// Screen movement ah app coordinates ku maathum (rotate mode la swap aagum)
function toApp(dx, dy) {
  return rotated ? { x: dy, y: -dx } : { x: dx, y: dy };
}

scene.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    pinching = true;
    multiTouch = true;
    startDist = dist(e.touches);
    startScale = scale;
  } else if (e.touches.length === 1 && !multiTouch) {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    startTx = tx;
    startTy = ty;
    panned = false;
  }
}, { passive: true });

scene.addEventListener("touchmove", (e) => {
  e.preventDefault();
  if (pinching && e.touches.length === 2) {
    scale = startScale * (dist(e.touches) / startDist);
    applyZoom();
    blockClickBriefly();
  } else if (e.touches.length === 1 && !multiTouch && scale > 1) {
    const d = toApp(e.touches[0].clientX - sx, e.touches[0].clientY - sy);
    tx = startTx + d.x;
    ty = startTy + d.y;
    applyZoom();
    if (Math.abs(d.x) > 5 || Math.abs(d.y) > 5) {
      panned = true;
      blockClickBriefly();
    }
  }
}, { passive: false });

scene.addEventListener("touchend", (e) => {
  if (e.touches.length < 2) pinching = false;

  if (e.touches.length === 0) {
    // Zoom aagala + multi-touch illa na mattum swipe = page flip
    if (!multiTouch && scale === 1) {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      const d = rotated ? dy : dx;
      const cross = rotated ? dx : dy;
      if (Math.abs(d) > 50 && Math.abs(d) > Math.abs(cross)) {
        blockClickBriefly();
        d < 0 ? next() : prev();
      }
    }
    if (multiTouch) blockClickBriefly();
    multiTouch = false;
  }
}, { passive: true });

/* ================= Desktop mouse drag pan (zoom la irukkumbodhu) ================= */
let mouseDown = false, mx = 0, my = 0;
scene.addEventListener("mousedown", (e) => {
  if (scale <= 1) return;
  mouseDown = true;
  mx = e.clientX; my = e.clientY;
  startTx = tx; startTy = ty;
});
window.addEventListener("mousemove", (e) => {
  if (!mouseDown) return;
  tx = startTx + (e.clientX - mx);
  ty = startTy + (e.clientY - my);
  applyZoom();
  if (Math.abs(e.clientX - mx) > 4 || Math.abs(e.clientY - my) > 4) blockClickBriefly();
});
window.addEventListener("mouseup", () => { mouseDown = false; });

updateZ();
updateState();