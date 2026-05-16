/**
 * Порт TargetCursor (React + GSAP) на ванильный JS для статического сайта.
 * GSAP подключается с CDN в index.html.
 */
(function () {
  if (typeof gsap === "undefined") return;

  var mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function isMobile() {
    var hasTouch = "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0;
    var small = window.innerWidth <= 768;
    var ua = (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
    var mobileRe = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return (hasTouch && small) || mobileRe.test(ua);
  }

  function markTargets(selector) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.add("cursor-target");
    });
  }

  function initTargetCursor(options) {
    var targetSelector = options.targetSelector || ".cursor-target";
    var spinDuration = options.spinDuration != null ? options.spinDuration : 2;
    var hideDefaultCursor = options.hideDefaultCursor !== false;
    var hoverDuration = options.hoverDuration != null ? options.hoverDuration : 0.2;
    var parallaxOn = options.parallaxOn !== false;

    if (isMobile() || !hoverFine || mqReduce.matches) return;

    var cursor = document.getElementById("target-cursor");
    if (!cursor) return;

    var dot = cursor.querySelector(".target-cursor-dot");
    var corners = cursor.querySelectorAll(".target-cursor-corner");
    if (corners.length < 4) return;

    var spinTl = null;
    var activeStrength = { current: 0 };
    var isActive = false;
    var targetCornerPositions = null;
    var tickerFn = null;
    var cursorRef = cursor;

    var constants = { borderWidth: 3, cornerSize: 12 };

    function moveCursor(x, y) {
      gsap.to(cursorRef, {
        x: x,
        y: y,
        duration: 0.1,
        ease: "power3.out",
      });
    }

    var originalCursor = document.body.style.cursor;
    if (hideDefaultCursor) {
      document.body.style.cursor = "none";
    }

    var cs = constants.cornerSize;
    gsap.set(corners[0], { x: -cs * 1.5, y: -cs * 1.5 });
    gsap.set(corners[1], { x: cs * 0.5, y: -cs * 1.5 });
    gsap.set(corners[2], { x: cs * 0.5, y: cs * 0.5 });
    gsap.set(corners[3], { x: -cs * 1.5, y: cs * 0.5 });

    var activeTarget = null;
    var currentLeaveHandler = null;
    var resumeTimeout = null;

    function cleanupTarget(target) {
      if (currentLeaveHandler) {
        target.removeEventListener("mouseleave", currentLeaveHandler);
      }
      currentLeaveHandler = null;
    }

    gsap.set(cursor, {
      xPercent: -50,
      yPercent: -50,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    function createSpinTimeline() {
      if (spinTl) spinTl.kill();
      spinTl = gsap
        .timeline({ repeat: -1 })
        .to(cursor, { rotation: "+=360", duration: spinDuration, ease: "none" });
    }

    createSpinTimeline();

    tickerFn = function () {
      if (!targetCornerPositions || !cursorRef || !corners || corners.length === 0) return;

      var strength = activeStrength.current;
      if (strength === 0) return;

      var cursorX = gsap.getProperty(cursorRef, "x");
      var cursorY = gsap.getProperty(cursorRef, "y");

      Array.prototype.forEach.call(corners, function (corner, i) {
        var currentX = gsap.getProperty(corner, "x");
        var currentY = gsap.getProperty(corner, "y");

        var targetX = targetCornerPositions[i].x - cursorX;
        var targetY = targetCornerPositions[i].y - cursorY;

        var finalX = currentX + (targetX - currentX) * strength;
        var finalY = currentY + (targetY - currentY) * strength;

        var duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05;

        gsap.to(corner, {
          x: finalX,
          y: finalY,
          duration: duration,
          ease: duration === 0 ? "none" : "power1.out",
          overwrite: "auto",
        });
      });
    };

    function moveHandler(e) {
      moveCursor(e.clientX, e.clientY);
    }
    window.addEventListener("mousemove", moveHandler);

    function scrollHandler() {
      if (!activeTarget || !cursorRef) return;
      var mouseX = gsap.getProperty(cursorRef, "x");
      var mouseY = gsap.getProperty(cursorRef, "y");
      var elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
      var isStillOverTarget =
        elementUnderMouse &&
        (elementUnderMouse === activeTarget ||
          (elementUnderMouse.closest && elementUnderMouse.closest(targetSelector) === activeTarget));
      if (!isStillOverTarget && currentLeaveHandler) {
        currentLeaveHandler();
      }
    }
    window.addEventListener("scroll", scrollHandler, { passive: true });

    function mouseDownHandler() {
      if (!dot) return;
      gsap.to(dot, { scale: 0.7, duration: 0.3 });
      gsap.to(cursorRef, { scale: 0.9, duration: 0.2 });
    }

    function mouseUpHandler() {
      if (!dot) return;
      gsap.to(dot, { scale: 1, duration: 0.3 });
      gsap.to(cursorRef, { scale: 1, duration: 0.2 });
    }

    window.addEventListener("mousedown", mouseDownHandler);
    window.addEventListener("mouseup", mouseUpHandler);

    function enterHandler(e) {
      var directTarget = e.target;
      var allTargets = [];
      var current = directTarget;
      while (current && current !== document.body) {
        if (current.matches && current.matches(targetSelector)) {
          allTargets.push(current);
        }
        current = current.parentElement;
      }
      var target = allTargets[0] || null;
      if (!target || !cursorRef || !corners || corners.length === 0) return;
      if (activeTarget === target) return;
      if (activeTarget) {
        cleanupTarget(activeTarget);
      }
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }

      activeTarget = target;
      Array.prototype.forEach.call(corners, function (corner) {
        gsap.killTweensOf(corner);
      });

      gsap.killTweensOf(cursorRef, "rotation");
      if (spinTl) spinTl.pause();
      gsap.set(cursorRef, { rotation: 0 });

      var rect = target.getBoundingClientRect();
      var borderWidth = constants.borderWidth;
      var cornerSize = constants.cornerSize;
      var cursorX = gsap.getProperty(cursorRef, "x");
      var cursorY = gsap.getProperty(cursorRef, "y");

      targetCornerPositions = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
      ];

      isActive = true;
      gsap.ticker.add(tickerFn);

      gsap.to(activeStrength, {
        current: 1,
        duration: hoverDuration,
        ease: "power2.out",
      });

      Array.prototype.forEach.call(corners, function (corner, i) {
        gsap.to(corner, {
          x: targetCornerPositions[i].x - cursorX,
          y: targetCornerPositions[i].y - cursorY,
          duration: 0.2,
          ease: "power2.out",
        });
      });

      function leaveHandler() {
        gsap.ticker.remove(tickerFn);

        isActive = false;
        targetCornerPositions = null;
        gsap.set(activeStrength, { current: 0, overwrite: true });
        activeTarget = null;

        if (corners) {
          var cornerSize2 = constants.cornerSize;
          var positions = [
            { x: -cornerSize2 * 1.5, y: -cornerSize2 * 1.5 },
            { x: cornerSize2 * 0.5, y: -cornerSize2 * 1.5 },
            { x: cornerSize2 * 0.5, y: cornerSize2 * 0.5 },
            { x: -cornerSize2 * 1.5, y: cornerSize2 * 0.5 },
          ];
          var tl = gsap.timeline();
          Array.prototype.forEach.call(corners, function (corner, index) {
            tl.to(
              corner,
              {
                x: positions[index].x,
                y: positions[index].y,
                duration: 0.3,
                ease: "power3.out",
              },
              0
            );
          });
        }

        resumeTimeout = setTimeout(function () {
          if (!activeTarget && cursorRef && spinTl) {
            var currentRotation = gsap.getProperty(cursorRef, "rotation");
            var normalizedRotation = currentRotation % 360;
            spinTl.kill();
            spinTl = gsap
              .timeline({ repeat: -1 })
              .to(cursorRef, { rotation: "+=360", duration: spinDuration, ease: "none" });
            gsap.to(cursorRef, {
              rotation: normalizedRotation + 360,
              duration: spinDuration * (1 - normalizedRotation / 360),
              ease: "none",
              onComplete: function () {
                if (spinTl) spinTl.restart();
              },
            });
          }
          resumeTimeout = null;
        }, 50);

        cleanupTarget(target);
      }

      currentLeaveHandler = leaveHandler;
      target.addEventListener("mouseleave", leaveHandler);
    }

    window.addEventListener("mouseover", enterHandler, { passive: true });

    function destroy() {
      gsap.ticker.remove(tickerFn);
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseover", enterHandler);
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("mousedown", mouseDownHandler);
      window.removeEventListener("mouseup", mouseUpHandler);
      if (activeTarget) cleanupTarget(activeTarget);
      if (spinTl) spinTl.kill();
      document.body.style.cursor = originalCursor;
      isActive = false;
      targetCornerPositions = null;
      activeStrength.current = 0;
    }

    window.__targetCursorDestroy = destroy;
  }

  function boot() {
    markTargets(
      ".btn, .card, .project-card, .nav a, .site-header .logo, .steps > li, .audience-list > li, .social a, .contact-block a, .testimonials-arrow, .testimonials-dot"
    );

    initTargetCursor({
      targetSelector: ".cursor-target",
      spinDuration: 2,
      hideDefaultCursor: true,
      hoverDuration: 0.2,
      parallaxOn: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
