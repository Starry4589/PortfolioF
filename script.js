/* script.js — main portfolio interactions */


(() => {
  const seatMeta = {
    vip: {
      sec: "VIP",
      row: "01",
      pass: "VIP PASS",
      title: "VIP ARENA ACCESS"
    },
    back: {
      sec: "BEHIND THE SCENES",
      row: "N/A",
      pass: "BACKSTAGE",
      title: "BACKSTAGE PASS"
    }
  };

  const $ = id => document.getElementById(id);

  // Switch between VIP and Backstage
  function setSeat(key) {
    if (!seatMeta[key]) return;

    document.body.dataset.seat = key;

    document.querySelectorAll("[data-k]").forEach(button => {
      button.classList.toggle("active", button.dataset.k === key);
    });

    const meta = seatMeta[key];

    if ($("route")) {
      $("route").textContent = `⚡ ACCESS TIER: ${meta.title}`;
    }

    if ($("tSeat")) {
      $("tSeat").textContent = `SEC ${meta.sec} // ROW ${meta.row}`;
    }

    if ($("tPass")) {
      $("tPass").textContent = meta.pass;
    }

    if ($("tAccess")) {
      $("tAccess").textContent =
        key === "back" ? "BACKSTAGE" : "ALL AREAS";
    }
  }

  // Tear the ticket along the dotted line, then open the curtains.
  // Uses the Web Animations API, so it needs NO extra CSS to work.
  let tearBusy = false;
  let tearAnims = [];

  function tearTicket() {
    if (tearBusy) return;

    const ticket = document.querySelector("#entrance .ticket");
    const stub = ticket && ticket.querySelector(".stub");
    const main = ticket && ticket.querySelector(".t-main");

    // Fallback: if anything is missing, just open the stage
    if (!ticket || !stub || !ticket.animate) {
      window.openStage();
      return;
    }

    tearBusy = true;

    const btn = document.querySelector("#entrance .tap");
    if (btn) btn.disabled = true;

    // Make sure nothing clips the stub while it flies away
    [$("entrance"), document.querySelector("#entrance .wrap"), ticket]
      .forEach(el => { if (el) el.style.overflow = "visible"; });

    stub.style.position = "relative";
    stub.style.zIndex = "20";
    stub.style.transformOrigin = "0% 100%";
    ticket.classList.add("tearing");

    // 1) whole ticket gets tugged
    tearAnims.push(ticket.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-5px) rotate(-.7deg)", offset: .25 },
      { transform: "translateX(4px) rotate(.5deg)", offset: .6 },
      { transform: "translateX(0)" }
    ], { duration: 300 }));

    // 2) main part recoils as the stub comes off
    if (main) {
      tearAnims.push(main.animate([
        { transform: "translateX(0)" },
        { transform: "translateX(-8px)", offset: .4 },
        { transform: "translateX(0)" }
      ], { delay: 280, duration: 500, easing: "ease-out" }));
    }

    // 3) stub rips off and falls away
    tearAnims.push(stub.animate([
      { transform: "none", opacity: 1 },
      { transform: "rotate(8deg) translateX(6px)", opacity: 1, offset: .25 },
      { transform: "translate(130px, 320px) rotate(42deg)", opacity: 0 }
    ], {
      delay: 250,
      duration: 1000,
      easing: "cubic-bezier(.45,0,.75,.4)",
      fill: "forwards"
    }));

    // Open the curtains once the stub is gone
    window.setTimeout(() => {
      window.openStage();
      tearBusy = false;
      if (btn) btn.disabled = false;
    }, 1300);
  }

  // Put the stub back on the ticket
  function resetTicket() {
    tearAnims.forEach(anim => anim.cancel());
    tearAnims = [];

    const ticket = document.querySelector("#entrance .ticket");
    if (ticket) {
      ticket.classList.remove("tearing");
      const stub = ticket.querySelector(".stub");
      if (stub) stub.style.zIndex = "";
    }
  }

  // Open the concert stage
  function openStage() {
    const entrance = $("entrance");

    if (!entrance) return;

    entrance.style.opacity = "0";

    window.setTimeout(() => {
      entrance.style.display = "none";
      $("curtains")?.classList.add("open");
      document.body.classList.add("live");
    }, 500);
  }

  // Exit the show
  function exitShow() {
    $("curtains")?.classList.remove("open");
    $("bye")?.classList.add("show");
  }

  // Return to the entrance
  function buyAgain() {
    resetTicket();

    $("bye")?.classList.remove("show");

    const entrance = $("entrance");
    if (!entrance) return;

    entrance.style.display = "flex";

    window.setTimeout(() => {
      entrance.style.opacity = "1";
    }, 50);
  }

  // LED typing animation
  const phrases = [
    "Front-End Developer & UI Designer",
    "Building Interactive Concert Experiences",
    "Welcome to the Arena Stage!"
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let typingTimer = null;

  function typeLoop() {
    const element = $("type");
    if (!element) return;

    const phrase = phrases[phraseIndex];

    charIndex += deleting ? -1 : 1;

    element.textContent = phrase.substring(0, charIndex);

    let delay = deleting ? 45 : 85;

    if (!deleting && charIndex >= phrase.length) {
      deleting = true;
      delay = 1600;
    } else if (deleting && charIndex <= 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 350;
    }

    typingTimer = window.setTimeout(typeLoop, delay);
  }

  // LED panel titles
  const panelTitles = {
    about: "ARTIST BIO // ABOUT ME",
    skills: "SETLIST // TECHNICAL SKILLS",
    projects: "WORLD TOUR // SHOWCASE PROJECTS"
  };

  // Open an LED information panel
  function openPanel(key, button) {
    document.querySelectorAll(".led-btn").forEach(item => {
      item.classList.remove("on");
    });

    if (button) {
      button.classList.add("on");
    }

    if ($("pTitle")) {
      $("pTitle").textContent = panelTitles[key] || "INFO";
    }

    const template = $("tmpl-" + key);

    if ($("pBody")) {
      $("pBody").replaceChildren();

      if (template) {
        $("pBody").appendChild(
          template.content.cloneNode(true)
        );
      }
    }

    $("led")?.classList.add("open");
    document.body.classList.add("expanded");
  }

  // Minimize the LED panel
  function closePanel() {
    $("led")?.classList.remove("open");

    document.querySelectorAll(".led-btn").forEach(item => {
      item.classList.remove("on");
    });

    document.body.classList.remove("expanded");
  }

  // Backstage check-in demo
  function sendCard() {
    const name = $("pcName")?.value.trim();
    const button = $("pcBtn");

    if (!name) {
      alert("Please enter your name!");
      $("pcName")?.focus();
      return;
    }

    if (button) {
      button.textContent = "Checked In ✓";
      button.disabled = true;
    }

    window.setTimeout(() => {
      if (button) {
        button.textContent = "Check In ✉️";
        button.disabled = false;
      }

      if ($("pcName")) $("pcName").value = "";
      if ($("pcMail")) $("pcMail").value = "";
      if ($("pcMsg")) $("pcMsg").value = "";

      alert(
        "Backstage check-in complete! (Demo only — no email was sent.)"
      );
    }, 900);
  }

  // Connect HTML buttons to JavaScript functions
  Object.assign(window, {
    setSeat,
    openStage,
    exitShow,
    buyAgain,
    openPanel,
    closePanel,
    sendCard,
    tearTicket,
    resetTicket
  });

  // Initialize the page
  document.addEventListener("DOMContentLoaded", () => {
    setSeat("vip");

    if (!typingTimer) {
      typeLoop();
    }
  });
})();
