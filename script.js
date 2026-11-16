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

const book = document.getElementById("book");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const status = document.getElementById("status");

const totalLeaves = images.length / 2;
let current = 0;
const leaves = [];

/* ---------- Adaptive sizing ---------- */
let ratio = 2 / 3; // width / height (cover image load aana appuram real ratio varum)

function resizeBook() {
  const controlsH = 56;
  const availW = window.innerWidth - 16;
  const availH = window.innerHeight - controlsH - 16;

  // 2 pages side by side: total width = 2 * pageW
  let pageH = Math.min(availH, (availW / 2) / ratio);
  let pageW = pageH * ratio;

  const root = document.documentElement.style;
  root.setProperty("--h", pageH + "px");
  root.setProperty("--w", pageW + "px");
}

// Cover image ratio automatic ah edukkum
const probe = new Image();
probe.onload = () => {
  ratio = probe.naturalWidth / probe.naturalHeight;
  resizeBook();
};
probe.src = images[0];

window.addEventListener("resize", resizeBook);
window.addEventListener("orientationchange", () => setTimeout(resizeBook, 200));
resizeBook();

/* ---------- Build book ---------- */
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
});

/* ---------- Mobile swipe ---------- */
let startX = 0;
document.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
document.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
}, { passive: true });

updateZ();
updateState();