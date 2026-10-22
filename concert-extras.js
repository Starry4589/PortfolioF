
/* =========================================================
   concert-extras.js
   Load AFTER script.js
   Backstage room, light board, drawing wall, stickers,
   VIP crowd effects, and concert transitions.
========================================================= */

(() => {
  "use strict";

  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const random = (min, max) =>
    min + Math.random() * (max - min);

  const themes = {
    pink: {
      primary: "#ff70a6",
      soft: "#ff97b8",
      glow: "rgba(255,112,166,.55)"
    },
    blue: {
      primary: "#00d2ff",
      soft: "#80e5ff",
      glow: "rgba(0,210,255,.55)"
    },
    gold: {
      primary: "#ffb703",
      soft: "#ffe066",
      glow: "rgba(255,183,3,.55)"
    },
    purple: {
      primary: "#a855f7",
      soft: "#c084fc",
      glow: "rgba(168,85,247,.55)"
    }
  };

  const penColors = [
    "#ff70a6",
    "#7df9ff",
    "#ffe066",
    "#7dffb5",
    "#ffffff"
  ];

  const posterArt = ["🎸", "🎤", "🥁", "🎹", "🦋", "🎧"];

  const stickerArt = [
    "🦋", "⭐", "💜", "🎤",
    "🔥", "🎧", "✨", "🥁"
  ];

  /* ---------------------------------------------------------
     GENERATORS
  --------------------------------------------------------- */

  function makeBars(count) {
    return Array.from({ length: count }, () => `
      <i style="
        --d:${random(0.3, 0.9).toFixed(2)}s;
        --l:-${random(0, 0.8).toFixed(2)}s;
      "></i>
    `).join("");
  }

  function makeSpotlights() {
    const spots = [
      ["8%", "#ff70a6", "4s"],
      ["32%", "#7df9ff", "5.2s"],
      ["58%", "#ffe066", "4.6s"],
      ["82%", "#d946ef", "5.8s"]
    ];

    return spots.map(([x, color, duration]) => `
      <i style="
        --x:${x};
        --c:${color};
        --t:${duration};
      "></i>
    `).join("");
  }

  function makeFloatingParts() {
    return Array.from({ length: 18 }, () => `
      <i style="
        --x:${random(2, 96).toFixed(0)}%;
        --s:${random(0.9, 1.6).toFixed(1)}rem;
        --t:${random(7, 14).toFixed(1)}s;
        --dl:-${random(0, 12).toFixed(1)}s;
      ">${Math.random() < 0.5 ? "🦋" : "✦"}</i>
    `).join("");
  }

  /* ---------------------------------------------------------
     VIP CROWD EFFECTS
  --------------------------------------------------------- */

  function buildCrowd(vip) {
    if (!vip || $(".crowd-fx", vip)) return;

    const colors = [
      "#ff70a6",
      "#7df9ff",
      "#ffe066",
      "#d946ef",
      "#7dffb5"
    ];

    const crowd = Array.from({ length: 30 }, (_, index) => `
      <i style="
        left:${(index * 3.4 + random(0, 1.5)).toFixed(1)}%;
        --s:${Math.floor(random(22, 34))}px;
        --d:${random(0.5, 1.1).toFixed(2)}s;
        --c:${colors[index % colors.length]};
        --r:${Math.floor(random(-18, 18))}deg;
      "></i>
    `).join("");

    vip.insertAdjacentHTML("beforeend", `
      <div class="beam" style="left:38%;animation-delay:-2s"></div>
      <div class="beam r" style="left:82%;animation-delay:-1s"></div>
      <div class="eq-edge">${makeBars(28)}</div>
      <div class="crowd-fx">${crowd}</div>
    `);
  }

  /* ---------------------------------------------------------
     BACKSTAGE ROOM
  --------------------------------------------------------- */

  function buildBack(back) {
    if (!back || $("#bk", back)) return;

    // Remove selected old props if they exist.
    $$(".dc", back).forEach(element => {
      if (["🛋", "🪴", "🎸"].some(item =>
        element.textContent.includes(item)
      )) {
        element.remove();
      }
    });

    const lightDots = Object.entries(themes).map(
      ([name, theme], index) => `
        <i
          class="bk-dot${index === 0 ? " on" : ""}"
          data-th="${name}"
          role="button"
          tabindex="0"
          aria-label="${name} lighting"
          aria-pressed="${index === 0}"
          style="--c:${theme.primary}"
        ></i>
      `
    ).join("");

    const penDots = penColors.map((color, index) => `
      <i
        class="bk-dot${index === 0 ? " on" : ""}"
        data-c="${color}"
        role="button"
        tabindex="0"
        aria-label="Choose drawing color ${index + 1}"
        aria-pressed="${index === 0}"
        style="--c:${color}"
      ></i>
    `).join("");

    back.insertAdjacentHTML("beforeend", `
      <div class="bk" id="bk">

        <div class="bk-spots">
          ${makeSpotlights()}
        </div>

        <div class="bk-strobe"></div>

        <div class="bk-col l">

          <div class="bk-row" id="bkRow1"></div>

          <div class="bk-board">
            <div class="bk-h">
              <span>TOUR WALL</span>
             
            </div>

            <div class="bk-wall" id="bkWall">
              <canvas id="bkCv" aria-label="Interactive drawing wall"></canvas>
            </div>

            <div class="bk-tools bk-pens">
              ${penDots}
              <button class="bk-btn" id="bkClr" type="button">
                Clear
              </button>
            </div>
          </div>

        </div>

        <div class="bk-col r">

          <div class="bk-row" id="bkRow2"></div>

          <div class="bk-panel">

            <div class="bk-h">LIGHT BOARD</div>

            <div class="bk-tools bk-themes">
              ${lightDots}
            </div>

            <div class="bk-tools bk-light-controls">
              <button
                class="bk-btn on"
                type="button"
                data-t="spots"
                aria-pressed="true"
              >Spot light</button>

              <button
                class="bk-btn"
                type="button"
                data-t="strobe"
                aria-pressed="false"
              >Light</button>

              <button
                class="bk-btn"
                type="button"
                data-t="pyro"
                aria-pressed="false"
              >Confetti</button>
            </div>

          </div>

          <div class="bk-panel">

            <div class="bk-h">STICKERS</div>

            <div class="bk-tray">
              ${stickerArt.map(item => `
                <button type="button" aria-label="Add ${item} sticker">
                  ${item}
                </button>
              `).join("")}
            </div>

            <div class="bk-hint">
              Choose a sticker, drag it around the room, and double-click
              a placed sticker to remove it.
            </div>

          </div>

        </div>

        <button class="bk-door" id="bkDoor" type="button">
          ← STAGE
        </button>

        <div class="bk-floor"></div>
        <div class="bk-amp"><i></i><i></i></div>
        <div class="bk-case">WORLD TOUR</div>

        <div class="bk-parts">
          ${makeFloatingParts()}
        </div>

      </div>
    `);

    const bk = $("#bk", back);
    const row1 = $("#bkRow1", bk);
    const row2 = $("#bkRow2", bk);

    // Move existing room decorations into their correct positions.
    const leftPoster = $(".left-poster", back);
    const mirror = $(".mir", back);
    const rightPoster = $(".right-poster", back);
    const positionElement = $(".pos", back);

    if (leftPoster) row1.append(leftPoster);
    if (mirror) row1.append(mirror);

    row1.insertAdjacentHTML("beforeend", `
      <div class="bk-setlist">
        <b>SETLIST</b>
        <div tabindex="0">1. Hello World</div>
        <div tabindex="0">2. Responsive Remix</div>
        <div tabindex="0">3. 3D Stage Anthem</div>
        <div tabindex="0">4. Serial Bridge (encore)</div>
      </div>
    `);

    const stack = document.createElement("div");
    stack.className = "bk-stack";

    if (positionElement) stack.append(positionElement);

    stack.insertAdjacentHTML("beforeend", `
      <div class="bk-monitor">

        <div class="bk-cam-screen">
          <div class="mini-stage">
            <div class="mini-beam"></div>
            <div class="mini-idol"></div>
            <div class="mini-crowd"></div>
          </div>
        </div>

        <div class="bk-cam">
          <span>STAGE CAM 1</span>
        </div>

        <div class="bk-small">SHOW STARTS IN</div>
        <div class="bk-count" id="bkCount">00:12</div>
        <div class="bk-wave">${makeBars(14)}</div>

      </div>
    `);

    if (rightPoster) row2.append(rightPoster);
    row2.append(stack);
        // ID pass in the middle, Stickers on the left, Tour Wall full-width at the bottom
    const pass = $("#postcard", back);
    if (pass) bk.insertBefore(pass, $(".bk-col.r", bk));

    const stickerPanel = $(".bk-tray", bk)?.closest(".bk-panel");
    if (stickerPanel) $(".bk-col.l", bk).append(stickerPanel);

    const board = $(".bk-board", bk);
    if (board) bk.insertBefore(board, $("#bkDoor", bk));
    setupDrawing(bk);
    setupStickers(bk);
    setupBackstageControls(bk);
    setupCountdown(bk);
  }

  /* ---------------------------------------------------------
     DRAWING WALL
  --------------------------------------------------------- */

  function setupDrawing(bk) {
    const canvas = $("#bkCv", bk);
    const wall = $("#bkWall", bk);

    if (!canvas || !wall) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let pen = penColors[0];
    let drawing = false;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const ratio = Math.max(1, window.devicePixelRatio || 1);
      const width = Math.round(rect.width * ratio);
      const height = Math.round(rect.height * ratio);

      if (canvas.width === width && canvas.height === height) return;

      // Preserve existing drawing when the canvas size changes.
      let saved = null;

      if (canvas.width && canvas.height) {
        try {
          saved = document.createElement("canvas");
          saved.width = canvas.width;
          saved.height = canvas.height;
          saved.getContext("2d").drawImage(canvas, 0, 0);
        } catch (_) {
          saved = null;
        }
      }

      canvas.width = width;
      canvas.height = height;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.lineWidth = 4;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (saved) {
        context.drawImage(
          saved,
          0, 0, saved.width, saved.height,
          0, 0, rect.width, rect.height
        );
      }
    }

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();

      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }

    resizeCanvas();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeCanvas);
      observer.observe(canvas);
    } else {
      window.addEventListener("resize", resizeCanvas);
    }

    canvas.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;

      resizeCanvas();
      drawing = true;

      canvas.setPointerCapture(event.pointerId);

      const point = getPoint(event);

      context.strokeStyle = pen;
      context.shadowColor = pen;
      context.shadowBlur = 12;
      context.beginPath();
      context.moveTo(point.x, point.y);
      context.lineTo(point.x + 0.1, point.y + 0.1);
      context.stroke();

      wall.classList.add("used");
      event.preventDefault();
    });

    canvas.addEventListener("pointermove", event => {
      if (!drawing) return;

      const point = getPoint(event);

      context.strokeStyle = pen;
      context.shadowColor = pen;
      context.lineTo(point.x, point.y);
      context.stroke();
      context.beginPath();
      context.moveTo(point.x, point.y);
    });

    function stopDrawing() {
      drawing = false;
      context.beginPath();
    }

    ["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
      canvas.addEventListener(type, stopDrawing);
    });

    // Select drawing colors.
    $$(".bk-pens [data-c]", bk).forEach(dot => {
      dot.addEventListener("click", () => {
        pen = dot.dataset.c;

        $$(".bk-pens [data-c]", bk).forEach(item => {
          const selected = item === dot;
          item.classList.toggle("on", selected);
          item.setAttribute("aria-pressed", String(selected));
        });
      });
    });

    // Clear the wall.
    $("#bkClr", bk).addEventListener("click", () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      wall.classList.remove("used");
    });
  }

  /* ---------------------------------------------------------
     STICKERS
  --------------------------------------------------------- */

  function setupStickers(bk) {
    let dragged = null;

    function addSticker(button) {
      const stickers = $$(".bk-stk", bk);

      if (stickers.length >= 30) {
        stickers[0].remove();
      }

      const sticker = document.createElement("span");
      const roomRect = bk.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      sticker.className = "bk-stk";
      sticker.textContent = button.textContent.trim();
      sticker.setAttribute("role", "img");
      sticker.setAttribute("aria-label", "Movable sticker");

      sticker.style.left =
        `${Math.max(0, buttonRect.left - roomRect.left)}px`;

      sticker.style.top =
        `${Math.max(0, buttonRect.top - roomRect.top - 45)}px`;

      bk.append(sticker);
    }

    $$(".bk-tray button", bk).forEach(button => {
      button.addEventListener("click", () => addSticker(button));
    });

    bk.addEventListener("pointerdown", event => {
      const sticker = event.target.closest(".bk-stk");

      if (!sticker) return;

      const rect = sticker.getBoundingClientRect();

      dragged = {
        element: sticker,
        dx: event.clientX - rect.left,
        dy: event.clientY - rect.top
      };

      sticker.classList.add("dragging");
      event.preventDefault();
    });

    bk.addEventListener("pointermove", event => {
      if (!dragged) return;

      const roomRect = bk.getBoundingClientRect();

      const x = event.clientX - roomRect.left - dragged.dx;
      const y = event.clientY - roomRect.top - dragged.dy;

      dragged.element.style.left =
        `${Math.max(0, Math.min(roomRect.width - 40, x))}px`;

      dragged.element.style.top =
        `${Math.max(0, Math.min(roomRect.height - 50, y))}px`;
    });

    function stopDragging() {
      if (dragged) {
        dragged.element.classList.remove("dragging");
      }

      dragged = null;
    }

    bk.addEventListener("pointerup", stopDragging);
    bk.addEventListener("pointercancel", stopDragging);

    bk.addEventListener("dblclick", event => {
      const sticker = event.target.closest(".bk-stk");
      if (sticker) sticker.remove();
    });
  }

  /* ---------------------------------------------------------
     LIGHT BOARD AND BACKSTAGE INTERACTIONS
  --------------------------------------------------------- */

  function setupBackstageControls(bk) {
    // Theme color buttons.
    $$("[data-th]", bk).forEach(dot => {
      dot.addEventListener("click", () => {
        const theme = themes[dot.dataset.th];
        if (!theme) return;

        const root = document.documentElement.style;

        root.setProperty("--theme-primary", theme.primary);
        root.setProperty("--theme-soft", theme.soft);
        root.setProperty("--theme-glow", theme.glow);

        $$("[data-th]", bk).forEach(item => {
          const selected = item === dot;
          item.classList.toggle("on", selected);
          item.setAttribute("aria-pressed", String(selected));
        });

        // Update the spotlight colors to match the chosen theme.
        $$(".bk-spots i", bk).forEach((light, index) => {
          light.style.setProperty(
            "--c",
            index % 2 === 0 ? theme.primary : theme.soft
          );
        });
      });

      dot.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          dot.click();
        }
      });
    });

    // Spots, strobe, and pyro buttons.
    $$("[data-t]", bk).forEach(button => {
      button.addEventListener("click", () => {
        const action = button.dataset.t;

        if (action === "spots") {
          const hidden = bk.classList.toggle("nospots");
          button.classList.toggle("on", !hidden);
          button.setAttribute("aria-pressed", String(!hidden));
        }

        if (action === "strobe") {
          const enabled = bk.classList.toggle("strobe");
          button.classList.toggle("on", enabled);
          button.setAttribute("aria-pressed", String(enabled));
        }

        if (action === "pyro") {
          createConfetti(60);

          button.classList.add("on");

          window.setTimeout(() => {
            button.classList.remove("on");
          }, 500);
        }
      });
    });

    // Poster art changes when clicked.
    $$(".wall-poster", bk).forEach(poster => {
      poster.addEventListener("click", () => {
        const art = $(".p-art", poster);
        if (!art) return;

        const currentIndex = posterArt.indexOf(art.textContent.trim());
        art.textContent =
          posterArt[(currentIndex + 1) % posterArt.length];
      });
    });

    // Mirror dark mode.
    const mirror = $(".mir", bk);

    if (mirror) {
      mirror.addEventListener("click", () => {
        mirror.classList.toggle("dark");
      });
    }

    // Cross out completed setlist items.
    $$(".bk-setlist div", bk).forEach(item => {
      item.addEventListener("click", () => {
        item.classList.toggle("done");
      });

      item.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        }
      });
    });

    // Stage exit button.
    const door = $("#bkDoor", bk);

    if (door) {
      door.addEventListener("click", () => {
        if (typeof window.setSeat === "function") {
          window.setSeat("vip");
        }
      });
    }

    // ON AIR sign.
    const onAir = $(".onair", bk);

    if (onAir) {
      onAir.addEventListener("click", () => {
        onAir.classList.toggle("off");
      });
    }
  }

  /* ---------------------------------------------------------
     COUNTDOWN
  --------------------------------------------------------- */

  function setupCountdown(bk) {
    let seconds = 12;
    const counter = $("#bkCount", bk);

    if (!counter) return;

    window.setInterval(() => {
      seconds = seconds <= 0 ? 12 : seconds - 1;

      counter.textContent = seconds > 0
        ? `00:${String(seconds).padStart(2, "0")}`
        : "GO!";
    }, 1000);
  }

  /* ---------------------------------------------------------
     CONFETTI / PYRO
  --------------------------------------------------------- */

  function createConfetti(count = 40) {
    const colors = [
      "#ff70a6",
      "#7df9ff",
      "#ffe066",
      "#d946ef",
      "#7dffb5",
      "#ffffff"
    ];

    for (let index = 0; index < count; index++) {
      const piece = document.createElement("span");

      piece.className = "x-conf";
      piece.textContent = "⭐";

      piece.style.left = `${random(0, 100)}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--t", `${random(2.2, 4).toFixed(1)}s`);
      piece.style.setProperty("--dx", `${Math.floor(random(-120, 120))}px`);

      document.body.append(piece);

      window.setTimeout(() => piece.remove(), 4200);
    }
  }

  /* ---------------------------------------------------------
     EXISTING PORTFOLIO FUNCTION WRAPPERS
  --------------------------------------------------------- */

  const originalOpenPanel = window.openPanel;
  const originalClosePanel = window.closePanel;
  const originalSetSeat = window.setSeat;
  const originalOpenStage = window.openStage;

  window.openPanel = function (key, button) {
    if (typeof originalOpenPanel === "function") {
      originalOpenPanel(key, button);
    }

    document.body.classList.add("expanded");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.closePanel = function () {
    if (typeof originalClosePanel === "function") {
      originalClosePanel();
    }

    document.body.classList.remove("expanded");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  window.setSeat = function (key) {
    if (
      key === "back" &&
      document.body.classList.contains("expanded")
    ) {
      window.closePanel();
    }

    if (typeof originalSetSeat === "function") {
      originalSetSeat(key);
    }
  };

  window.openStage = function () {
    if (typeof originalOpenStage === "function") {
      originalOpenStage();
    }

    window.setTimeout(() => createConfetti(48), 1000);
  };

  /* ---------------------------------------------------------
     INITIALIZE
  --------------------------------------------------------- */

  function build() {
    buildCrowd($(".s-vip"));
    buildBack($(".s-back"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();
