// Presentation only: wraps existing label words in styled badges. It never changes the text.
(function () {
  var LABELS = [
    ["Pending documentary verification", "b-pending"],
    ["Pending verification", "b-pending"],
    ["Awaiting documentary verification", "b-awaiting"],
    ["awaiting documentary verification", "b-awaiting"],
    ["My recollection", "b-recollection"],
    ["Company's written response", "b-company"],
    ["disputed (circumstances)", "b-disputed"],
    ["Disputed", "b-disputed"],
    ["disputed", "b-disputed"],
    ["In progress", "b-progress"],
    ["Proposed", "b-proposed"]
  ];
  function cls(t) { t = t.trim(); for (var i = 0; i < LABELS.length; i++) if (t === LABELS[i][0]) return LABELS[i][1]; return null; }
  function badge(text, c) { var s = document.createElement("span"); s.className = "badge " + c; s.textContent = text; return s; }

  // 1. Headings ending in "— *label; label*": keep the words, show them as badges.
  document.querySelectorAll(".content h2, .content h3").forEach(function (h) {
    var em = h.querySelector("em"); if (!em || em !== h.lastElementChild) return;
    var parts = em.textContent.split(";"), out = document.createElement("span"), kinds = [];
    out.className = "labels";
    for (var i = 0; i < parts.length; i++) { var c = cls(parts[i]); if (!c) return; out.appendChild(badge(parts[i].trim(), c)); if (i < parts.length - 1) out.appendChild(document.createTextNode(" ")); kinds.push(c); }
    var prev = em.previousSibling;
    if (prev && prev.nodeType === 3) { prev.textContent = prev.textContent.replace(/\s*—\s*$/, ""); out.insertBefore(document.createTextNode(" — "), out.firstChild); out.firstChild.className = ""; }
    em.replaceWith(out);
    // visually hide the joining dash but keep it for screen readers / copy
    var dash = out.firstChild; var sr = document.createElement("span"); sr.style.cssText = "position:absolute;left:-9999px"; sr.textContent = dash.textContent; out.replaceChild(sr, dash);
    // Mark the following block of content as a statement of that kind
    if (h.tagName === "H3") {
      var k = kinds.indexOf("b-company") > -1 ? "k-company" : (kinds.indexOf("b-recollection") > -1 ? "k-recollection" : null);
      if (k) { var wrap = document.createElement("div"); wrap.className = "statement " + k; var n = h.nextElementSibling; while (n && !/^H[1-3]$/.test(n.tagName)) { var nx = n.nextElementSibling; wrap.appendChild(n); n = nx; } h.after(wrap); }
    }
  });

  // 2. Table cells: label phrases become badges; every cell gets its column name for mobile stacking.
  document.querySelectorAll(".content table").forEach(function (t) {
    var heads = [].map.call(t.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    t.querySelectorAll("tbody tr").forEach(function (tr) {
      [].forEach.call(tr.children, function (td, i) {
        td.setAttribute("data-label", heads[i] || "");
        if (td.children.length === 1 && td.firstElementChild.tagName === "STRONG" && cls(td.textContent) && td.textContent.trim() === td.firstElementChild.textContent.trim()) { var lab = td.textContent.trim(); td.textContent = ""; td.appendChild(badge(lab, cls(lab))); return; }
        if (td.children.length) return;
        var parts = td.textContent.split(";"), ok = parts.every(function (p) { return cls(p); });
        if (!ok && parts.length > 1 && cls(parts[0])) { var first = parts.shift().trim(); td.textContent = ""; td.appendChild(badge(first, cls(first))); td.appendChild(document.createTextNode("; " + parts.join(";").trim())); return; }
        if (ok) { td.textContent = ""; parts.forEach(function (p, j) { td.appendChild(badge(p.trim(), cls(p))); if (j < parts.length - 1) td.appendChild(document.createTextNode(" ")); }); }
      });
    });
  });

  // 3. Mobile menu
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  if (btn && nav) btn.addEventListener("click", function () { var o = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", o ? "true" : "false"); });
})();

// 4. Timeline: a table directly under a "Timeline" heading is shown as a vertical timeline (same text).
(function () {
  document.querySelectorAll(".content h2").forEach(function (h) {
    if (h.textContent.trim() !== "Timeline") return;
    var t = h.nextElementSibling; if (!t || t.tagName !== "TABLE") return;
    var ol = document.createElement("ol"); ol.className = "timeline";
    t.querySelectorAll("tbody tr").forEach(function (tr) {
      var c = tr.children, li = document.createElement("li");
      var tm = document.createElement("time"); tm.textContent = c[0].textContent; li.appendChild(tm);
      var ev = document.createElement("div"); ev.className = "ev"; ev.textContent = c[1].textContent; li.appendChild(ev);
      var lb = document.createElement("div"); while (c[2].firstChild) lb.appendChild(c[2].firstChild); li.appendChild(lb);
      if (/after/i.test(c[1].textContent)) li.className = "after";
      ol.appendChild(li);
    });
    t.replaceWith(ol);
  });
  // 5. "On this page" list in the margin, built from the page's own section headings.
  var note = document.querySelector(".margin-note"), hs = document.querySelectorAll(".content h2");
  if (note && hs.length > 1) {
    var ul = document.createElement("ul"); ul.style.cssText = "list-style:none;padding:0;margin:.4rem 0 0";
    function link(h, id) { if (!h.id) h.id = id; var a = document.createElement("a"); a.href = "#" + h.id;
      var tx = h.cloneNode(true); tx.querySelectorAll(".labels").forEach(function (x) { x.remove(); }); a.textContent = tx.textContent.trim();
      a.style.cssText = "color:inherit;text-decoration:none;display:block;padding:.3rem 0"; return a; }
    var withSubs = document.body.contains(document.querySelector('.content h2 + h3')) && location.pathname.indexOf("contributions") > -1;
    hs.forEach(function (h, i) { var li = document.createElement("li"); li.appendChild(link(h, "s" + i));
      if (withSubs) { var sub = document.createElement("ul"); sub.style.cssText = "list-style:none;padding:0;margin:0"; var n = h.nextElementSibling, j = 0;
        while (n && n.tagName !== "H2") { if (n.tagName === "H3") { var sl = document.createElement("li"); sl.appendChild(link(n, "s" + i + "-" + (j++))); sub.appendChild(sl); } n = n.nextElementSibling; }
        if (sub.children.length) li.appendChild(sub); }
      ul.appendChild(li); });
    note.appendChild(ul);
  } else if (note) note.remove();
})();

// 6. Experience: let readers show one kind of statement at a time (presentation only).
(function () {
  var acc = [].filter.call(document.querySelectorAll(".content h2"), function (h) { return h.textContent.trim() === "Account"; })[0];
  if (!acc) return;
  var opts = [["All", null], ["My recollection", "b-recollection"], ["Company's written response", "b-company"], ["Disputed", "b-disputed"], ["Awaiting documentary verification", "b-awaiting"]];
  var bar = document.createElement("div"); bar.className = "filter"; bar.setAttribute("role", "group"); bar.setAttribute("aria-label", "Show statements by label");
  var lab = document.createElement("span"); lab.textContent = "Show:"; bar.appendChild(lab);
  var items = []; var n = acc.nextElementSibling;
  while (n && n.tagName !== "H2") { if (n.tagName === "H3") items.push([n, n.nextElementSibling && n.nextElementSibling.classList.contains("statement") ? n.nextElementSibling : null]); n = n.nextElementSibling; }
  opts.forEach(function (o, i) { var b = document.createElement("button"); b.type = "button"; b.textContent = o[0]; b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
    b.addEventListener("click", function () { bar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true");
      var shown = 0;
      items.forEach(function (it) { var on = !o[1] || it[0].querySelector("." + o[1]); if (on) shown++; it[0].classList.toggle("dim", !on); if (it[1]) it[1].classList.toggle("dim", !on); });
      status.textContent = o[1] ? "Highlighting " + shown + " of " + items.length + " sections labelled " + o[0] + ". All sections stay on the page." : "";
    });
    bar.appendChild(b); });
  // Filtering only changes emphasis (opacity); no content is hidden, removed or altered.
  var status = document.createElement("p"); status.className = "filter-status"; status.setAttribute("aria-live", "polite"); bar.appendChild(status);
  acc.after(bar);
})();
// 7. Highlight the current section in the margin index while reading.
(function () {
  var links = document.querySelectorAll(".margin-note a"); if (!links.length || !("IntersectionObserver" in window)) return;
  var map = {}; links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove("active"); }); var a = map[e.target.id]; if (a) a.classList.add("active"); } }); }, { rootMargin: "0px 0px -75% 0px" });
  Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();

// 8. Home: place the LinkedIn line under the introduction, and show each section's own opening line (read from that page).
(function () {
  if (!document.body.classList.contains("home")) return;
  var main = document.querySelector(".content"), li = document.getElementById("li-home");
  var intro = [].filter.call(main.querySelectorAll(":scope > p"), function (p) { return /Prepared and owned by Tayyab Shoukat\./.test(p.textContent); })[0];
  if (li && intro) intro.after(li);
  var sf = document.getElementById("story-feature"), list = main.querySelector(":scope > ul");
  if (sf && list) list.before(sf);
  if (!window.fetch || !window.DOMParser) return;
  main.querySelectorAll(":scope > ul a").forEach(function (a) {
    var t = document.createElement("span"); t.className = "t"; t.textContent = a.textContent; a.textContent = ""; a.appendChild(t);
    fetch(a.href).then(function (r) { return r.ok ? r.text() : ""; }).then(function (html) {
      if (!html) return;
      var d = new DOMParser().parseFromString(html, "text/html"), m = d.querySelector(".content"); if (!m) return;
      var p = [].filter.call(m.children, function (e) { return e.tagName === "P" && e.textContent.trim(); })[0]; if (!p) return;
      var s = document.createElement("span"); s.className = "d"; s.textContent = p.textContent.trim(); a.appendChild(s);
    }).catch(function () {});
  });
})();

// 9. A paragraph that is only a sequence "A → B → C → D" is shown as a step flow. The words and order are unchanged.
(function () {
  document.querySelectorAll(".content p").forEach(function (p) {
    if (p.children.length) return;
    var parts = p.textContent.split("→");
    if (parts.length < 4) return;
    var ol = document.createElement("ol"); ol.className = "flow"; ol.setAttribute("aria-label", "Sequence");
    parts.forEach(function (t, i) {
      var li = document.createElement("li"); li.textContent = t.trim(); ol.appendChild(li);
      if (i < parts.length - 1) { var a = document.createElement("li"); a.className = "arr"; a.setAttribute("aria-hidden", "true"); a.textContent = "→"; ol.appendChild(a); }
    });
    p.replaceWith(ol);
  });
})();
