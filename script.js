(function () {
  var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = mq.matches;
  var hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (e) {
        var id = this.getAttribute("href");
        if (!id || id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      });
    });
  }

  function revealAll() {
    document.querySelectorAll(".reveal-on-scroll").forEach(function (el) {
      el.classList.add("is-inview");
    });
  }

  function initReveals() {
    var nodes = document.querySelectorAll(".reveal-on-scroll");
    if (!nodes.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }
    document.documentElement.classList.add("reveal-js");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-inview");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 }
    );
    nodes.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initScenes() {
    var sections = Array.prototype.slice.call(document.querySelectorAll("main > section[id]"));
    if (!sections.length) return;
    var ticking = false;
    function tick() {
      var anchor = window.innerHeight * 0.24;
      var id = sections[0].id;
      for (var i = 0; i < sections.length; i++) {
        var r = sections[i].getBoundingClientRect();
        if (r.top <= anchor) {
          id = sections[i].id;
        }
      }
      document.documentElement.setAttribute("data-scene", id);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        tick();
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();
  }

  function initMagnetic() {
    if (reduced || !hoverFine) return;
    document.querySelectorAll(".btn-magnetic").forEach(function (btn) {
      var k = 0.13;
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width * 0.5;
        var y = e.clientY - r.top - r.height * 0.5;
        btn.style.setProperty("--mx", x * k + "px");
        btn.style.setProperty("--my", y * k + "px");
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.setProperty("--mx", "0px");
        btn.style.setProperty("--my", "0px");
      });
    });
  }

  function initPageExit() {
    if (reduced) return;
    var overlay = document.getElementById("page-exit");
    if (!overlay) return;
    document.addEventListener(
      "click",
      function (e) {
        var a = e.target.closest && e.target.closest("a");
        if (!a) return;
        if (a.getAttribute("target") !== "_blank") return;
        var href = a.getAttribute("href");
        if (!href || href === "#" || href.indexOf("javascript:") === 0) return;
        if (!/^https?:\/\//i.test(href)) return;
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (e.button !== 0) return;
        e.preventDefault();
        overlay.removeAttribute("hidden");
        overlay.classList.add("is-active");
        var url = a.href;
        window.setTimeout(function () {
          window.open(url, "_blank", "noopener,noreferrer");
          overlay.classList.remove("is-active");
          window.setTimeout(function () {
            overlay.setAttribute("hidden", "");
          }, 340);
        }, 260);
      },
      true
    );
  }

  function initScrollParallax() {
    if (reduced) return;
    if (typeof CSS === "undefined" || !CSS.supports || !CSS.supports("animation-timeline", "view()")) return;
    var inner = document.querySelector(".hero-photo-inner");
    if (inner) inner.classList.add("hero-photo-inner--parallax");
  }

  function onMotionChange() {
    reduced = mq.matches;
    if (reduced) revealAll();
  }

  bindAnchors();
  initReveals();
  initScenes();
  initMagnetic();
  initPageExit();
  initScrollParallax();

  if (mq.addEventListener) {
    mq.addEventListener("change", onMotionChange);
  } else if (mq.addListener) {
    mq.addListener(onMotionChange);
  }
})();
