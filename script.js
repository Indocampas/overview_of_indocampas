(function () {
  if (window.__flipbookInit) return;
  window.__flipbookInit = true;

  // Order: cover, image_1 ... image_12
  const images = [
    "images/cover.png",
    "images/image_1.png",  "images/image_2.png",
    "images/image_3.png",  "images/image_4.png",
    "images/image_5.png",  "images/image_6.png",
    "images/image_7.png",  "images/image_8.png",
    "images/image_9.png",  "images/image_10.png",
    "images/image_11.png", "images/image_13.png", 
    "images/image_14.png",  "images/image_15.png",
    "images/image_12.png",
     
  ];

  const BACK_COVER = null; // back cover image irundha: "images/back.png"
  const padded = images.length % 2 !== 0 ? [...images, BACK_COVER] : [...images];

  const app = document.getElementById("app");
  const scene = document.getElementById("scene");
  const stage = document.getElementById("stage");
  const book = document.getElementById("book");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  const sidePrev = document.getElementById("sidePrev");
  const sideNext = document.getElementById("sideNext");
  const status = document.getElementById("status");
  const fsBtn = document.getElementById("fsBtn");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomResetBtn = document.getElementById("zoomReset");

  const FLIP_MS = 900;

  let single = false;
  let built = false;
  let totalLeaves = 0;
  let maxCurrent = 0;
  let current = 0;
  const leaves = [];

  // Phone / tablet (touch) la mattum orientation paarthu single page. Desktop la eppavum spread.
  // const isTouchDevice = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  // const isTouchDevice =
  //   /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent) ||
  //   (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 820);
  // Mobile detection ovvoru layout la check aagum (device emulation maathinaalum work aagum)

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 0 && Math.min(screen.width, screen.height) < 820) ||
      Math.min(window.innerWidth, window.innerHeight) < 500;
  }

  // mobile la open pannumbodhu default portrait (single page). Phone thirupuna aprom orientation follow aagum
  let forcePortrait = true;
  let lastPortrait = null;

  /* ================= Zoom ================= */
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

  scene.addEventListener("wheel", (e) => {
    e.preventDefault();
    setZoom(scale + (e.deltaY < 0 ? 0.25 : -0.25));
  }, { passive: false });

  scene.addEventListener("dblclick", () => setZoom(scale > 1 ? 1 : 2));

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
    else if (!className.includes("none")) face.classList.add("blank");
    const shade = document.createElement("div");
    shade.className = "shade";
    face.appendChild(shade);
    return face;
  }

  function build() {
    book.innerHTML = "";
    leaves.length = 0;
    book.classList.remove("open", "end");
    book.classList.toggle("single", single);

    // totalLeaves = single ? images.length : padded.length / 2;  // 17-11-2026
         totalLeaves = single ? images.length : padded.length / 2;
    maxCurrent = single ? totalLeaves - 1 : totalLeaves;

    for (let i = 0; i < totalLeaves; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      if (single) {
        // leaf.append(makeFace("front", images[i]), makeFace("back none", null));
       leaf.append(makeFace("front", images[i]), makeFace("back none", null));
      } else {
        leaf.append(makeFace("front", padded[i * 2]), makeFace("back", padded[i * 2 + 1]));
      }
      book.appendChild(leaf);
      leaves.push(leaf);
    }

    current = 0;   // mode maarumbodhu first page
    built = true;
    updateZ();
    updateState();
  }

  function updateZ() {
    leaves.forEach((leaf, i) => {
      if (leaf.classList.contains("flipping")) return;
      leaf.style.zIndex = i < current ? i : totalLeaves - i;
    });
  }

  function updateState() {
    // if (single) {
    //   book.classList.remove("open", "end");
    //   // status.textContent = current === 0 ? "Cover" : `Page ${current} / ${images.length - 1}`;
    //   if (current === 0) status.textContent = "Cover";
    //   else if (current === maxCurrent && !padded[current]) status.textContent = "The End";
    //   else status.textContent = `Page ${current} / ${images.length - 1}`;
    // } else {
         if (single) {
      book.classList.remove("open");
      book.classList.toggle("end", current === maxCurrent);   // last page la atta close aagum
      status.textContent = current === 0 ? "Cover" : `Page ${current} / ${images.length - 1}`;
    } else {
      book.classList.toggle("open", current > 0 && current < totalLeaves);
      book.classList.toggle("end", current === totalLeaves);
      if (current === 0) status.textContent = "Cover";
      else if (current === totalLeaves) status.textContent = "The End";
      else status.textContent = `Page ${current * 2 - 1} - ${current * 2}`;
    }
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current >= maxCurrent;
    sidePrev.disabled = prevBtn.disabled;
    sideNext.disabled = nextBtn.disabled;
  }

  /* ================= Flip with paper bend ================= */
  function flip(leaf, flipTo) {
    if (leaf._anim) leaf._anim.cancel();

    leaf.classList.add("flipping");
    leaf.style.visibility = "visible";
    leaf.style.zIndex = totalLeaves + 1;
    leaf.classList.toggle("flipped", flipTo);

    const a = flipTo ? 0 : -180;
    const b = flipTo ? -180 : 0;
    const at = (t) => a + (b - a) * t;
    const s = flipTo ? -1 : 1;

    const frames = [
      { transform: `rotateY(${at(0)}deg) skewY(0deg)`, offset: 0 },
      { transform: `rotateY(${at(0.25)}deg) skewY(${s * 1.2}deg)`, offset: 0.25 },
      { transform: `rotateY(${at(0.5)}deg) skewY(${s * 2.5}deg)`, offset: 0.5 },
      { transform: `rotateY(${at(0.75)}deg) skewY(${s * 1.2}deg)`, offset: 0.75 },
      { transform: `rotateY(${at(1)}deg) skewY(0deg)`, offset: 1 },
    ];
    const opts = { duration: FLIP_MS, easing: "cubic-bezier(.45,.05,.35,1)" };

    leaf.querySelectorAll(".shade").forEach((sh) => {
      sh.animate([{ opacity: 0 }, { opacity: 0.45 }, { opacity: 0 }], opts);
    });

    const anim = leaf.animate(frames, opts);
    leaf._anim = anim;
    anim.onfinish = () => {
      if (leaf._anim !== anim) return;
      leaf.classList.remove("flipping");
      if (single && flipTo) leaf.style.visibility = "hidden";
      updateZ();
    };
  }

  function next() {
    if (!built || current >= maxCurrent) return;
    flip(leaves[current], true);
    current++;
    updateState();
  }

  function prev() {
    if (!built || current <= 0) return;
    current--;
    flip(leaves[current], false);
    updateState();
  }

  nextBtn.addEventListener("click", next);
  prevBtn.addEventListener("click", prev);
  sideNext.addEventListener("click", next);
  sidePrev.addEventListener("click", prev);

  // Tap / click navigation (book position vechu)
  scene.addEventListener("click", (e) => {
    if (suppressClick) return;
    if (e.target.closest && e.target.closest(".side-btn")) return;

    const r = book.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right ||
        e.clientY < r.top  || e.clientY > r.bottom) return;

    const frac = (e.clientX - r.left) / r.width;
    if (single) {
      if (frac < 0.3) prev(); else next();
    } else {
      if (frac < 0.5) prev(); else next();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "+" || e.key === "=") setZoom(scale + 0.5);
    if (e.key === "-") setZoom(scale - 0.5);
    if (e.key === "0") setZoom(1);
  });

  /* ================= Adaptive layout ================= */
  let ratio = 2 / 3;

  function viewportSize() {
    const vv = window.visualViewport;
    const w = Math.round((vv && vv.width) || window.innerWidth);
    const h = Math.round((vv && vv.height) || window.innerHeight);
    return { w, h };
  }


  function layout() {
    const { w: vw, h: vh } = viewportSize();
    const portrait = vh > vw;

    app.style.width = vw + "px";
    app.style.height = vh + "px";

    // phone thirupuna aprom orientation follow aagum
    if (lastPortrait !== null && portrait !== lastPortrait) forcePortrait = false;
    lastPortrait = portrait;

    // Mobile: open pannumbodhu single page, aprom orientation follow. Desktop: spread
    const mobile = isMobile();
    const wantSingle = mobile
      ? (forcePortrait || portrait)
      : (portrait && vw < 700);

    if (!built || wantSingle !== single) {
      single = wantSingle;
      scale = 1; tx = 0; ty = 0;
      build();
    }
    app.classList.toggle("spread", !single);

    const pad = 22; // hard cover board ku idam
    const availW = Math.max(50, scene.clientWidth - pad);
    const availH = Math.max(50, scene.clientHeight - pad);

    let pageW, pageH;
    if (single) {
      pageW = Math.min(availW, availH * ratio);
      pageH = pageW / ratio;
    } else {
      pageH = Math.min(availH, availW / 2 / ratio);
      pageW = pageH * ratio;
    }

    const root = document.documentElement.style;
    root.setProperty("--h", pageH + "px");
    root.setProperty("--w", pageW + "px");

    applyZoom();
  }

  let raf = 0;
  function scheduleLayout() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(layout);
  }

  const probe = new Image();
  probe.onload = () => {
    if (probe.naturalWidth && probe.naturalHeight) {
      ratio = probe.naturalWidth / probe.naturalHeight;
    }
    scheduleLayout();
  };
  probe.src = images[0];

  window.addEventListener("resize", scheduleLayout);
  window.addEventListener("orientationchange", () => {
    scheduleLayout();
    setTimeout(scheduleLayout, 150);
    setTimeout(scheduleLayout, 400);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", scheduleLayout);
  }
  if (window.ResizeObserver) {
    new ResizeObserver(scheduleLayout).observe(scene);
  }

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

  /* ================= Touch: pinch zoom + pan + swipe ================= */
  let sx = 0, sy = 0, startTx = 0, startTy = 0;
  let pinching = false, multiTouch = false;
  let startDist = 0, startScale = 1;

  function dist(t) {
    return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
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
    }
  }, { passive: true });

  scene.addEventListener("touchmove", (e) => {
    e.preventDefault();
    if (pinching && e.touches.length === 2) {
      scale = startScale * (dist(e.touches) / startDist);
      applyZoom();
      blockClickBriefly();
    } else if (e.touches.length === 1 && !multiTouch && scale > 1) {
      tx = startTx + (e.touches[0].clientX - sx);
      ty = startTy + (e.touches[0].clientY - sy);
      applyZoom();
      if (Math.abs(tx - startTx) > 5 || Math.abs(ty - startTy) > 5) blockClickBriefly();
    }
  }, { passive: false });

  scene.addEventListener("touchend", (e) => {
    if (e.touches.length < 2) pinching = false;

    if (e.touches.length === 0) {
      if (!multiTouch && scale === 1) {
        const dx = e.changedTouches[0].clientX - sx;
        const dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          blockClickBriefly();
          dx < 0 ? next() : prev();
        }
      }
      if (multiTouch) blockClickBriefly();
      multiTouch = false;
    }
  }, { passive: true });

  /* ================= Desktop mouse drag pan ================= */
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

  layout();
})();
