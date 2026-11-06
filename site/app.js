(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* ── Mobile menu ──────────────────────────────────── */
  const sheet = document.querySelector("[data-menu]");
  const openers = document.querySelectorAll("[data-menu-open]");
  const closer = document.querySelector("[data-menu-close]");
  if (sheet && openers.length && closer) {
    const setOpen = (open) => {
      if (open) sheet.setAttribute("data-open", "");
      else sheet.removeAttribute("data-open");
      sheet.setAttribute("aria-hidden", String(!open));
      openers.forEach((button) => button.setAttribute("aria-expanded", String(open)));
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (open) closer.focus();
      else openers[0].focus();
    };
    openers.forEach((button) => button.addEventListener("click", () => setOpen(true)));
    closer.addEventListener("click", () => setOpen(false));
    sheet.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
    sheet.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  }

  /* ── Hero: profile tabs drive the notch demo ──────── */
  const SCRIPTS = {
    interview: {
      speaker: "Interviewer",
      initials: "IV",
      question: "Tell me about a time you disagreed with your team.",
      answer: [
        ["Pick one real example. "],
        ["Situation:", true],
        [" what the team wanted. "],
        ["Your view:", true],
        [" why you disagreed, with one fact. "],
        ["Result:", true],
        [" what changed and what you learned."],
      ],
    },
    meeting: {
      speaker: "Team lead",
      initials: "TL",
      question: "Can someone recap what we decided about the launch?",
      answer: [
        ["Ship on "],
        ["Friday", true],
        [". Payments go in, the admin dashboard moves to "],
        ["week two", true],
        [". Design owns the release notes, and QA signs off Thursday."],
      ],
    },
    sales: {
      speaker: "Prospect",
      initials: "PR",
      question: "Honestly, it feels a bit expensive for a team our size.",
      answer: [
        ["Ask what they are comparing it to. Then tie the price to "],
        ["hours saved each week", true],
        [", and offer a "],
        ["one-month pilot", true],
        [" instead of a discount."],
      ],
    },
    presentation: {
      speaker: "Audience",
      initials: "AU",
      question: "What is the biggest risk with this plan?",
      answer: [
        ["Say it plainly: the "],
        ["timeline", true],
        [". Two suppliers deliver late in March, and you already have a "],
        ["backup supplier", true],
        [" lined up for that gap."],
      ],
    },
    negotiation: {
      speaker: "Buyer",
      initials: "BY",
      question: "We really cannot go above this number.",
      answer: [
        ["Don't counter yet. Ask "],
        ["what would make it work", true],
        [" for them, then trade: a higher number for a "],
        ["longer contract", true],
        ["."],
      ],
    },
  };

  const demo = document.querySelector("[data-demo]");
  if (demo) {
    const tabs = Array.from(document.querySelectorAll("[data-profile]"));
    const notch = demo.querySelector(".notch");
    const status = demo.querySelector("[data-status]");
    const who = demo.querySelector("[data-who]");
    const answerEl = demo.querySelector("[data-answer]");
    const caption = demo.querySelector("[data-caption]");
    const speakerName = demo.querySelector("[data-speaker]");
    const speakerFace = demo.querySelector("[data-face]");
    const order = tabs.map((tab) => tab.dataset.profile);
    let current = order[0];
    let run = 0;
    let visible = true;

    const renderAnswer = (segments, chars) => {
      answerEl.textContent = "";
      let left = chars;
      for (const [text, bold] of segments) {
        if (left <= 0) break;
        const piece = text.slice(0, left);
        left -= piece.length;
        const node = bold ? document.createElement("strong") : document.createTextNode(piece);
        if (bold) node.textContent = piece;
        answerEl.append(node);
      }
    };
    const totalChars = (segments) => segments.reduce((sum, [text]) => sum + text.length, 0);

    const select = (profile) => {
      current = profile;
      tabs.forEach((tab) => {
        const on = tab.dataset.profile === profile;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      const script = SCRIPTS[profile];
      speakerName.textContent = script.speaker;
      speakerFace.textContent = script.initials;
      caption.innerHTML = "";
      const b = document.createElement("b");
      b.textContent = `${script.speaker}: `;
      caption.append(b, document.createTextNode(script.question));
      who.textContent = `${tabs.find((tab) => tab.dataset.profile === profile).textContent} profile`;
    };

    const play = async (profile) => {
      const token = ++run;
      const alive = () => token === run;
      select(profile);
      const script = SCRIPTS[profile];
      const total = totalChars(script.answer);

      if (reduceMotion.matches) {
        notch.dataset.state = "open";
        status.textContent = "Answer ready";
        caption.style.opacity = "1";
        renderAnswer(script.answer, total);
        return;
      }

      notch.dataset.state = "closed";
      status.textContent = "Listening";
      answerEl.textContent = "";
      caption.style.opacity = "0";
      await wait(450);
      if (!alive()) return;
      caption.style.opacity = "1";
      await wait(1500);
      if (!alive()) return;
      status.textContent = "Answering";
      notch.dataset.state = "open";
      await wait(380);
      for (let chars = 0; chars <= total; chars += 2) {
        if (!alive()) return;
        while (!visible || document.hidden) {
          await wait(250);
          if (!alive()) return;
        }
        renderAnswer(script.answer, chars);
        const caret = document.createElement("span");
        caret.className = "caret";
        answerEl.append(caret);
        await wait(26);
      }
      renderAnswer(script.answer, total);
      status.textContent = "Answer ready";
      await wait(4200);
      if (!alive()) return;
      notch.dataset.state = "closed";
      await wait(700);
      if (!alive()) return;
      const next = order[(order.indexOf(profile) + 1) % order.length];
      play(next);
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => play(tab.dataset.profile));
      tab.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const step = event.key === "ArrowRight" ? 1 : -1;
        const target = tabs[(index + step + tabs.length) % tabs.length];
        target.focus();
        play(target.dataset.profile);
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      }).observe(demo);
    }
    play(current);
  }

  /* ── Keycaps ───────────────────────────────────────── */
  const KEY_NAMES = { Control: "ctrl", Shift: "shift", " ": "space", Enter: "enter", Escape: "esc", m: "m", M: "m" };
  const keyEls = (name) => document.querySelectorAll(`.key[data-k="${name}"]`);

  const pressCombo = async (root, hold = 520) => {
    const caps = Array.from(root.querySelectorAll(".key"));
    for (const cap of caps) {
      cap.setAttribute("data-down", "");
      await wait(reduceMotion.matches ? 0 : 95);
    }
    root.setAttribute("data-hit", "");
    await wait(hold);
    for (const cap of caps.reverse()) {
      cap.removeAttribute("data-down");
      await wait(reduceMotion.matches ? 0 : 45);
    }
    root.removeAttribute("data-hit");
  };

  const combos = Array.from(document.querySelectorAll("[data-combo]"));
  combos.forEach((combo) => {
    combo.addEventListener("click", () => pressCombo(combo));
  });

  if (combos.length) {
    const held = new Set();
    const comboFor = (event) => {
      const parts = [];
      if (event.ctrlKey) parts.push("ctrl");
      if (event.shiftKey) parts.push("shift");
      const main = KEY_NAMES[event.key];
      if (main && main !== "ctrl" && main !== "shift") parts.push(main);
      return parts.join("+");
    };
    window.addEventListener("keydown", (event) => {
      const name = KEY_NAMES[event.key];
      if (!name) return;
      held.add(name);
      keyEls(name).forEach((cap) => cap.setAttribute("data-down", ""));
      const match = combos.find((combo) => combo.dataset.combo === comboFor(event));
      if (match && (name !== "ctrl" && name !== "shift")) {
        event.preventDefault();
        match.setAttribute("data-hit", "");
        setTimeout(() => match.removeAttribute("data-hit"), 900);
      }
    });
    window.addEventListener("keyup", (event) => {
      const name = KEY_NAMES[event.key];
      if (!name) return;
      held.delete(name);
      keyEls(name).forEach((cap) => cap.removeAttribute("data-down"));
    });
    window.addEventListener("blur", () => {
      held.clear();
      document.querySelectorAll(".key[data-down]").forEach((cap) => cap.removeAttribute("data-down"));
    });

    if (!reduceMotion.matches) {
      (async () => {
        await wait(500);
        for (const combo of combos) {
          pressCombo(combo, 380);
          await wait(240);
        }
      })();
    }
  }

  /* Footer keycaps press once when the closing screen arrives. */
  const ctaKeys = document.querySelector("[data-cta-keys]");
  if (ctaKeys && "IntersectionObserver" in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setTimeout(() => pressCombo(ctaKeys, 700), 350);
    }, { threshold: 0.6 });
    observer.observe(ctaKeys);
  }
})();
