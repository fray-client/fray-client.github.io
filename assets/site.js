// Fray site: top bar, phone menu, the visitor's system, and the download flow. No dependencies.
(() => {
  const root = document.documentElement;
  const top = document.querySelector(".top");

  // Top bar: solid once the page scrolls.
  const onScroll = () => top && top.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Phone menu.
  const menuBtn = document.querySelector(".menu-btn");
  if (menuBtn) {
    const set = (open) => {
      document.body.classList.toggle("menu-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };
    menuBtn.addEventListener("click", () => set(!document.body.classList.contains("menu-open")));
    document.querySelectorAll(".nav a").forEach((a) => a.addEventListener("click", () => set(false)));
    addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  }

  // The visitor's system: windows | linux | other, and ARM on Linux. ?os= and ?arch=arm pick by hand.
  const q = new URLSearchParams(location.search);
  const ua = navigator.userAgent;
  let os = /Windows/.test(ua) ? "windows" : /Linux|X11|CrOS/.test(ua) && !/Android/.test(ua) ? "linux" : /Mac|iPhone|iPad|Android/.test(ua) ? "other" : "windows";
  let arm = /aarch64|arm64|armv\d/i.test(ua);
  const apply = () => {
    root.dataset.os = os;
    root.dataset.arch = arm ? "arm" : "x86_64";
    document.querySelectorAll(".plat").forEach((p) => p.classList.toggle("is-yours", p.dataset.plat === os));
    document.querySelectorAll("[data-os-label]").forEach((el) => { el.textContent = os === "linux" ? "for Linux" : os === "windows" ? "for Windows" : ""; });
    document.querySelectorAll("[data-tab]").forEach((t) => setTab(t, os === "linux" ? "linux" : "windows"));
  };
  if (q.get("os") === "linux" || q.get("os") === "windows") os = q.get("os");
  if (q.get("arch") === "arm") arm = true;
  apply();
  // Chromium knows more (real platform and CPU) behind a promise.
  if (!q.get("os") && navigator.userAgentData?.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(["architecture", "platform"]).then((v) => {
      if (v.platform === "Linux" || v.platform === "Chrome OS") os = "linux";
      else if (v.platform === "Windows") os = "windows";
      if (v.architecture && !q.get("arch")) arm = v.architecture === "arm";
      apply();
    }).catch(() => {});
  }

  // Install-step tabs (Windows / Linux).
  function setTab(wrap, which) {
    wrap.dataset.tab = which;
    wrap.querySelectorAll("[role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.for === which)));
  }
  document.querySelectorAll("[data-tab]").forEach((wrap) => {
    wrap.querySelectorAll("[role=tab]").forEach((b) => b.addEventListener("click", () => setTab(wrap, b.dataset.for)));
  });

  // After a download click the page becomes the install guide for that system. The download itself is a plain link.
  const flow = document.querySelector("[data-flow]");
  document.querySelectorAll("[data-get]").forEach((a) => a.addEventListener("click", () => {
    if (!flow) return;
    const which = a.dataset.get;
    flow.classList.add("started");
    document.querySelectorAll("[data-retry]").forEach((r) => { r.href = a.href; });
    document.querySelectorAll("[data-tab]").forEach((t) => setTab(t, which));
    const guide = document.getElementById("install");
    if (guide) setTimeout(() => {
      const y = guide.getBoundingClientRect().top + scrollY - (top ? top.offsetHeight : 0);
      scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }, 600);
  }));
})();
