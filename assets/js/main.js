/* Göttsche Tobian GbR – Website-Skript
   Kein Tracking, keine externen Bibliotheken. */
(function () {
  "use strict";

  var CONSENT_KEY = "gt-consent";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) { /* Speicher gesperrt */ }
  }
  function read(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function forget(key) {
    try { window.localStorage.removeItem(key); } catch (e) { /* Speicher gesperrt */ }
  }

  /* ---------- Kopfzeile: deckend ab dem Scrollen ---------- */
  var header = document.querySelector(".site-header");
  if (header && document.body.classList.contains("has-transparent-header")) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobiles Menü ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
      document.body.classList.toggle("is-locked", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
    };
    toggle.addEventListener("click", function () {
      setMenu(!menu.classList.contains("is-open"));
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && menu.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------- Lightbox ---------- */
  var tiles = document.querySelectorAll(".tile[data-full]");
  if (tiles.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Bildansicht");
    box.innerHTML =
      '<button type="button" class="lightbox-close">Schließen</button>' +
      '<img src="" alt="">' +
      '<p class="lightbox-caption"></p>';
    document.body.appendChild(box);

    var lbImg = box.querySelector("img");
    var lbCaption = box.querySelector(".lightbox-caption");
    var lbClose = box.querySelector(".lightbox-close");
    var lastFocus = null;

    var openBox = function (tile) {
      var img = tile.querySelector("img");
      lastFocus = tile;
      lbImg.src = tile.getAttribute("data-full") || img.src;
      lbImg.alt = img ? img.alt : "";
      lbCaption.textContent = tile.getAttribute("data-caption") || (img ? img.alt : "");
      box.classList.add("is-open");
      document.body.classList.add("is-locked");
      lbClose.focus();
    };
    var closeBox = function () {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    };

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () { openBox(tile); });
    });
    lbClose.addEventListener("click", closeBox);
    box.addEventListener("click", function (e) { if (e.target === box) closeBox(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") closeBox();
      if (e.key === "Tab") {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }

  /* ---------- Zahlen hochzählen ---------- */
  var values = document.querySelectorAll(".stat .value[data-count]");
  if (values.length && !reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count"));
        var suffix = el.getAttribute("data-suffix") || "";
        var separator = el.getAttribute("data-separator") === "true";
        var duration = 1100;
        var start = null;
        var format = function (n) {
          var rounded = Math.round(n);
          return separator ? rounded.toLocaleString("de-DE") : String(rounded);
        };
        var step = function (ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = format(target * eased) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = format(target) + suffix;
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    values.forEach(function (el) { observer.observe(el); });
  }

  /* ---------- Karte erst nach Freigabe laden ---------- */
  function loadMap(frame) {
    var url = frame.getAttribute("data-map-src");
    if (!url || frame.querySelector("iframe")) return;
    var iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.loading = "lazy";
    iframe.title = "Karte mit dem Standort des Hofes in Schwedeneck";
    iframe.setAttribute("referrerpolicy", "no-referrer");
    frame.appendChild(iframe);
    var consent = frame.querySelector(".map-consent");
    if (consent) consent.remove();
  }

  var mapFrames = document.querySelectorAll(".map-frame[data-map-src]");
  mapFrames.forEach(function (frame) {
    if (document.documentElement.getAttribute("data-analytics-src") && read(CONSENT_KEY) === "all") {
      loadMap(frame);
      return;
    }
    var button = frame.querySelector("[data-load-map]");
    if (button) {
      button.addEventListener("click", function () { loadMap(frame); });
    }
  });

  /* ---------- Einwilligungs-Hinweis ---------- */
  var banner = null;

  function showConsentBanner() {
    if (banner) return;
    banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("aria-label", "Hinweis zu Cookies und externen Inhalten");
    banner.innerHTML =
      "<h2>Cookies und externe Inhalte</h2>" +
      "<p>Diese Website setzt keine Tracking-Cookies. Wir speichern nur deine Auswahl hier im Browser. " +
      'Wenn du zustimmst, dürfen wir außerdem die Karte von OpenStreetMap direkt laden. Mehr dazu in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="btn btn--on-dark" data-consent="essential">Nur notwendige</button>' +
      '<button type="button" class="btn btn--sand" data-consent="all">Alle akzeptieren</button>' +
      "</div>";
    document.body.appendChild(banner);
    var current = banner;
    window.setTimeout(function () { current.classList.add("is-open"); }, 400);

    banner.querySelectorAll("[data-consent]").forEach(function (button) {
      button.addEventListener("click", function () {
        var choice = button.getAttribute("data-consent");
        store(CONSENT_KEY, choice);
        current.classList.remove("is-open");
        window.setTimeout(function () { current.remove(); }, 400);
        banner = null;
        if (choice === "all") {
          mapFrames.forEach(loadMap);
          startAnalytics();
        }
      });
    });
  }

  /* Statistik: erst nach Einwilligung. Trägt der Betrieb später eine
     datensparsame Lösung ein (z. B. Plausible oder Matomo), reicht die URL im html-Tag. */
  var analyticsStarted = false;
  function startAnalytics() {
    var endpoint = document.documentElement.getAttribute("data-analytics-src");
    if (!endpoint || analyticsStarted) return;
    analyticsStarted = true;
    var script = document.createElement("script");
    script.defer = true;
    script.src = endpoint;
    var site = document.documentElement.getAttribute("data-analytics-domain");
    if (site) script.setAttribute("data-domain", site);
    document.head.appendChild(script);
  }

  /* Der Hinweis erscheint nur, wenn eine Statistik eingetragen ist (data-analytics-src im html-Tag).
     Ohne Statistik setzt die Seite nichts im Browser, und die Karte hat ihren eigenen Klick. */
  var analyticsConfigured = !!document.documentElement.getAttribute("data-analytics-src");
  var consent = analyticsConfigured ? read(CONSENT_KEY) : null;
  if (consent === "all") startAnalytics();
  else if (analyticsConfigured && !consent) showConsentBanner();

  /* Einwilligung auf der Datenschutzseite zurücknehmen */
  var resetConsent = document.querySelector("[data-consent-reset]");
  if (resetConsent) {
    resetConsent.addEventListener("click", function () {
      forget(CONSENT_KEY);
      resetConsent.textContent = "Auswahl zurückgesetzt";
      resetConsent.disabled = true;
      showConsentBanner();
    });
  }

  /* ---------- Kontaktformular ---------- */
  var form = document.querySelector("form[data-contact-form]");
  if (form) {
    var status = form.querySelector(".form-status");
    var fields = form.querySelectorAll("[required]");
    var tokenField = form.querySelector('input[name="formular_token"]');
    var captchaField = form.querySelector("#antwort");
    var captchaLabel = form.querySelector("[data-frage]");
    var submitButton = form.querySelector('button[type="submit"]');
    var tokenUrl = form.getAttribute("data-token-url");
    var sending = false;

    var CONTACT_HINT = "Bitte versuch es noch einmal oder schreib uns direkt an maltegoettsche@t-online.de.";

    var showStatus = function (kind, text) {
      if (!status) return;
      status.hidden = false;
      status.className = "form-status" + (kind ? " form-status--" + kind : "");
      status.textContent = text;
    };

    /* Die Meldung steht oben im Formular. Wer unten auf Senden gedrückt hat, soll sie sehen. */
    var scrollToStatus = function () {
      if (!status || !status.scrollIntoView) return;
      status.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    };

    var setFieldError = function (field, message) {
      var row = field.closest(".form-row");
      var slot = row ? row.querySelector(".field-error") : null;
      if (slot) slot.textContent = message;
      field.setAttribute("aria-invalid", message ? "true" : "false");
    };

    /* Sicherheitsfrage und Token vom Server holen. Die Antwort steht nicht im HTML. */
    var loadToken = function () {
      if (!tokenUrl || !tokenField || !window.fetch) return Promise.resolve(false);
      return window.fetch(tokenUrl, { cache: "no-store", headers: { Accept: "application/json" } })
        .then(function (res) {
          if (!res.ok) throw new Error("token");
          return res.json();
        })
        .then(function (data) {
          if (!data || !data.token || !data.frage) throw new Error("token");
          tokenField.value = data.token;
          if (captchaLabel) captchaLabel.textContent = "Sicherheitsfrage: " + data.frage;
          if (captchaField) {
            captchaField.value = "";
            setFieldError(captchaField, "");
          }
          return true;
        })
        .catch(function () {
          tokenField.value = "";
          if (captchaLabel) captchaLabel.textContent = "Sicherheitsfrage (konnte nicht geladen werden)";
          return false;
        });
    };

    loadToken().then(function (ok) {
      if (!ok && tokenUrl) {
        showStatus("error", "Die Sicherheitsfrage konnte nicht geladen werden. Bitte lade die Seite neu oder ruf uns an unter 0175 4977347.");
      }
    });

    /* Rückmeldung nach einem Absenden ohne JavaScript (send-contact.php leitet mit ?status= zurück) */
    var result = new URLSearchParams(window.location.search).get("status");
    if (result === "ok") {
      showStatus("ok", "Danke für deine Nachricht. Wir melden uns so bald wie möglich bei dir.");
    } else if (result === "zuviel") {
      showStatus("error", "Von deinem Anschluss kamen gerade mehrere Nachrichten. Bitte versuch es später noch einmal oder ruf uns an unter 0175 4977347.");
    } else if (result === "fehler") {
      showStatus("error", "Das hat leider nicht geklappt. " + CONTACT_HINT);
    }

    var messageFor = function (field) {
      var value = field.value.trim();
      if (!value) return "Bitte ausfüllen.";
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) {
        return "Bitte eine gültige E-Mail-Adresse angeben.";
      }
      if (field.name === "nachricht" && value.length < 10) {
        return "Bitte schreib uns ein paar Worte mehr.";
      }
      if (field.name === "antwort" && !/^\d{1,2}$/.test(value)) {
        return "Bitte eine Zahl eingeben.";
      }
      return "";
    };

    var checkField = function (field) {
      var message = messageFor(field);
      setFieldError(field, message);
      return !message;
    };

    form.setAttribute("novalidate", "novalidate");

    var handleAnswer = function (answer) {
      if (answer === "ok") {
        form.reset();
        fields.forEach(function (field) { setFieldError(field, ""); });
        loadToken();
        showStatus("ok", "Danke für deine Nachricht. Wir melden uns so bald wie möglich bei dir.");
        scrollToStatus();
      } else if (answer === "zuviel") {
        showStatus("error", "Von deinem Anschluss kamen gerade mehrere Nachrichten. Bitte versuch es später noch einmal oder ruf uns an unter 0175 4977347.");
        scrollToStatus();
      } else if (answer === "frage") {
        loadToken().then(function () {
          if (captchaField) {
            setFieldError(captchaField, "Das Ergebnis stimmt nicht. Hier ist eine neue Frage.");
            captchaField.focus();
          }
          showStatus("error", "Bitte beantworte die Sicherheitsfrage noch einmal.");
        });
      } else if (answer === "token") {
        loadToken().then(function () {
          showStatus("error", "Die Sicherheitsfrage war abgelaufen. Bitte beantworte die neue Frage und sende noch einmal.");
          scrollToStatus();
        });
      } else {
        showStatus("error", "Das hat leider nicht geklappt. " + CONTACT_HINT);
        scrollToStatus();
      }
    };

    var send = function () {
      if (sending) return;
      /* Vorschau auf GitHub: Das Formular sendet nichts, es zeigt nur eine Rückmeldung */
      if (!captchaField || String(captchaField.value).trim() !== "7") {
        handleAnswer("frage");
        return;
      }
      form.reset();
      fields.forEach(function (field) { setFieldError(field, ""); });
      loadToken();
      showStatus("ok", "Vorschau: Das Formular ist hier nur eine Demo, es wird nichts gesendet.");
      scrollToStatus();
      return;
      sending = true;
      if (submitButton) submitButton.disabled = true;
      showStatus("", "Nachricht wird gesendet ...");

      window.fetch(form.getAttribute("action"), {
        method: "POST",
        body: new URLSearchParams(new FormData(form)),
        headers: { Accept: "application/json" }
      })
        .then(function (res) { return res.json(); })
        .then(function (data) { handleAnswer(data && data.status); })
        .catch(function () {
          showStatus("error", "Das hat leider nicht geklappt. " + CONTACT_HINT);
          scrollToStatus();
        })
        .then(function () {
          sending = false;
          if (submitButton) submitButton.disabled = false;
        });
    };

    form.addEventListener("submit", function (event) {
      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!checkField(field) && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        event.preventDefault();
        showStatus("error", "Bitte schau dir die markierten Felder noch einmal an.");
        firstInvalid.focus();
        return;
      }

      /* Honigtopf: von Bots ausgefüllt, von Menschen nicht */
      var honey = form.querySelector(".hp input");
      if (honey && honey.value) {
        event.preventDefault();
        return;
      }

      /* Sehr alte Browser ohne fetch: normales Absenden mit Weiterleitung */
      if (!window.fetch || !window.FormData || !window.URLSearchParams) {
        showStatus("", "Nachricht wird gesendet ...");
        return;
      }

      event.preventDefault();
      send();
    });

    /* Beim Verlassen nur das eine Feld prüfen, und nur wenn schon etwas drinsteht */
    fields.forEach(function (field) {
      field.addEventListener("blur", function () {
        if (field.value.trim() !== "" || field.getAttribute("aria-invalid") === "true") checkField(field);
      });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") checkField(field);
      });
    });
  }

  /* ---------- Jahreszahl im Fußbereich ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
