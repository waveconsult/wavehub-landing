/* ==========================================================================
   WaveHub — free-guide popup (Resend).
   Replaces the old Mailchimp pop-up. Self-contained: injects its own styles
   and markup, posts to the app's /api/lead, which emails the PDF and adds the
   contact to the Resend audience.

   CONFIG below is the only thing to edit.
   ========================================================================== */
(function () {
  var CFG = {
    api:        "https://app.wavehubtennis.com/api/lead",
    tournament: "montreal",                               // tag / slug
    // `title` also drives the email subject: "Your free <title> preview"
    title:      "ATP Montreal",
    pdf:        "/assets/previews/canada.pdf",
    eyebrow:    "PDF · Free preview",
    heading:    "ATP Montreal is here.",
    sub:        "And we analysed all the potential plays — quarter by quarter, the prices worth taking and the ones to skip. Want to get it for free?",
    cta:        "Get the free preview",
    dismiss:    "No, thanks",
    delayMs:    9000,       // show after this long on the page
    key:        "wh_popup_v1"
  };

  try { if (localStorage.getItem(CFG.key)) return; } catch (e) {}

  var css = document.createElement("style");
  css.textContent = [
    ".whp-ov{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);",
    "display:flex;align-items:center;justify-content:center;padding:22px;opacity:0;transition:opacity .3s cubic-bezier(.16,1,.3,1)}",
    ".whp-ov.in{opacity:1}",
    ".whp{position:relative;width:100%;max-width:440px;background:#141414;border:1px solid rgba(255,255,255,.14);",
    "border-radius:20px;padding:34px 30px 28px;transform:translateY(14px) scale(.98);",
    "transition:transform .35s cubic-bezier(.16,1,.3,1);box-shadow:0 40px 100px -30px rgba(37,99,235,.5)}",
    ".whp-ov.in .whp{transform:none}",
    ".whp-x{position:absolute;top:12px;right:14px;background:none;border:0;color:#6a6a72;font-size:26px;line-height:1;cursor:pointer;padding:4px 8px}",
    ".whp-x:hover{color:#f5f5f6}",
    ".whp-eb{font-family:Sora,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#5b9bff}",
    ".whp h3{font-family:Sora,system-ui,sans-serif;font-size:25px;font-weight:700;letter-spacing:-.03em;line-height:1.12;margin:10px 0 0;color:#f5f5f6}",
    ".whp p{margin-top:11px;font-size:14.5px;line-height:1.6;color:#a2a2ab}",
    ".whp input{width:100%;margin-top:9px;padding:14px 16px;border-radius:12px;border:1px solid rgba(255,255,255,.14);",
    "background:#0d0d0d;color:#f5f5f6;font-family:Inter,system-ui,sans-serif;font-size:15px;outline:none}",
    ".whp input:focus{border-color:#5b9bff}",
    ".whp label{display:block;margin-top:14px;font-family:Sora,system-ui,sans-serif;font-size:12px;font-weight:600;color:#a2a2ab}",
    ".whp-go{width:100%;margin-top:18px;padding:15px 20px;border-radius:999px;border:1px solid #2563eb;background:#2563eb;",
    "color:#fff;font-family:Sora,system-ui,sans-serif;font-weight:600;font-size:15px;cursor:pointer;transition:background .2s}",
    ".whp-go:hover:not(:disabled){background:#5b9bff}.whp-go:disabled{opacity:.6;cursor:default}",
    ".whp-no{display:block;width:100%;margin-top:12px;background:none;border:0;color:#6a6a72;font-family:Inter,system-ui,sans-serif;",
    "font-size:13px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}",
    ".whp-no:hover{color:#a2a2ab}",
    ".whp-msg{margin-top:10px;font-size:13px;color:#5b9bff;min-height:18px;text-align:center}",
    ".whp-msg.err{color:#ff8b8b}",
    ".whp-fine{margin-top:14px;font-size:11.5px;line-height:1.6;color:#6a6a72;text-align:center}"
  ].join("");
  document.head.appendChild(css);

  var ov = document.createElement("div");
  ov.className = "whp-ov";
  ov.innerHTML =
    '<div class="whp" role="dialog" aria-modal="true" aria-label="' + CFG.heading + '">' +
      '<button class="whp-x" type="button" aria-label="Close">&times;</button>' +
      '<div class="whp-eb">' + CFG.eyebrow + '</div>' +
      '<h3>' + CFG.heading + '</h3>' +
      '<p>' + CFG.sub + '</p>' +
      '<form novalidate>' +
        '<label for="whp-n">Your name</label>' +
        '<input id="whp-n" type="text" autocomplete="given-name" placeholder="Alex">' +
        '<label for="whp-e">Your email</label>' +
        '<input id="whp-e" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>' +
        '<button class="whp-go" type="submit">' + CFG.cta + ' &rarr;</button>' +
        '<p class="whp-msg" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<button class="whp-no" type="button">' + CFG.dismiss + '</button>' +
      '<p class="whp-fine">18+. Analysis, not a bookmaker. Unsubscribe any time.</p>' +
    '</div>';

  function seen() { try { localStorage.setItem(CFG.key, "1"); } catch (e) {} }
  function close() { ov.classList.remove("in"); setTimeout(function () { ov.remove(); }, 320); seen(); }

  var shown = false;
  function open() {
    if (shown) return;
    shown = true;
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("in"); });

    ov.querySelector(".whp-x").addEventListener("click", close);
    ov.querySelector(".whp-no").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    var form = ov.querySelector("form"),
        go = ov.querySelector(".whp-go"),
        msg = ov.querySelector(".whp-msg");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = ov.querySelector("#whp-n").value.trim();
      var email = ov.querySelector("#whp-e").value.trim();
      msg.className = "whp-msg";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.className = "whp-msg err"; msg.textContent = "Please enter a valid email."; return;
      }
      go.disabled = true; go.textContent = "Sending…"; msg.textContent = "";

      fetch(CFG.api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name, email: email, tournament: CFG.tournament,
                               title: CFG.title, pdf: CFG.pdf })
      })
      .then(function (r) { return r.json().catch(function () { return {}; })
                            .then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.j.error || "failed");
        seen();
        var box = ov.querySelector(".whp");
        box.innerHTML =
          '<button class="whp-x" type="button" aria-label="Close">&times;</button>' +
          '<div class="whp-eb">You\'re in</div>' +
          '<h3>Check your inbox.</h3>' +
          '<p>' + (res.j.emailed === false
            ? 'Your guide is ready — <a href="' + CFG.pdf + '" style="color:#5b9bff">download it here</a>.'
            : 'The guide is on its way. If it is not there in a minute, look in spam.') + '</p>';
        box.querySelector(".whp-x").addEventListener("click", close);
        setTimeout(close, 5200);
      })
      .catch(function (err) {
        go.disabled = false; go.textContent = CFG.cta + " →";
        msg.className = "whp-msg err";
        msg.textContent = (err && err.message && err.message !== "failed")
          ? err.message : "Something went wrong — try again in a moment.";
      });
    });
  }

  setTimeout(open, CFG.delayMs);
  // exit intent (desktop): leaving towards the tab bar
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 0) open();
  });
})();
