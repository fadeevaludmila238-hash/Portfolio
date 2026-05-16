(function () {
  var TESTIMONIALS = [
    {
      quote:
        "Сайт получился не «как у всех», а с характером. С первого экрана понятно, кто я и зачем смотреть дальше — заявки пошли уже в первую неделю.",
      name: "Анна К.",
      designation: "эксперт, личный бренд",
      src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80&auto=format&fit=crop",
    },
    {
      quote:
        "Нужен был лендинг под AI-продукт — быстро, но без ощущения шаблона. Собрали структуру, тексты и визуал так, что страницу реально хочется переслать.",
      name: "Дмитрий В.",
      designation: "основатель digital-продукта",
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
    },
    {
      quote:
        "Работали на скорости: концепт, подача, сборка. Клиенты отмечают, что сайт выглядит дороже, чем стоил — это лучший комплимент.",
      name: "Мария Л.",
      designation: "креативная студия",
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80&auto=format&fit=crop",
    },
  ];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function calculateGap(width) {
    var minWidth = 1024;
    var maxWidth = 1456;
    var minGap = 60;
    var maxGap = 86;
    if (width <= minWidth) return minGap;
    if (width >= maxWidth) return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
    return minGap + ((maxGap - minGap) * (width - minWidth)) / (maxWidth - minWidth);
  }

  function init() {
    var widget = document.getElementById("testimonials-widget");
    var imagesEl = document.getElementById("testimonials-images");
    var textEl = document.getElementById("testimonials-text");
    var dotsEl = document.getElementById("testimonials-dots");
    var prevBtn = document.getElementById("testimonials-prev");
    var nextBtn = document.getElementById("testimonials-next");

    if (!widget || !imagesEl || !textEl) return;

    var activeIndex = 0;
    var containerWidth = 1200;
    var autoplay = widget.getAttribute("data-autoplay") === "true" && !reduced;
    var autoplayTimer = null;
    var gapPx = 60;

    TESTIMONIALS.forEach(function (t, i) {
      var img = document.createElement("img");
      img.className = "testimonial-image";
      img.src = t.src;
      img.alt = t.name;
      img.setAttribute("data-index", String(i));
      img.loading = i === 0 ? "eager" : "lazy";
      img.decoding = "async";
      imagesEl.appendChild(img);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "testimonials-dot cursor-target";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Отзыв " + (i + 1) + ": " + t.name);
      dot.setAttribute("data-index", String(i));
      if (dotsEl) dotsEl.appendChild(dot);
    });

    var images = imagesEl.querySelectorAll(".testimonial-image");
    var dots = dotsEl ? dotsEl.querySelectorAll(".testimonials-dot") : [];

    function updateGap() {
      containerWidth = imagesEl.offsetWidth || 1200;
      gapPx = calculateGap(containerWidth);
    }

    function getRole(index) {
      var len = TESTIMONIALS.length;
      var left = (activeIndex - 1 + len) % len;
      var right = (activeIndex + 1) % len;
      if (index === activeIndex) return "active";
      if (index === left) return "left";
      if (index === right) return "right";
      return "hidden";
    }

    function applyImageStyles() {
      images.forEach(function (img, index) {
        var role = getRole(index);
        img.className = "testimonial-image testimonial-image--" + role;
        var maxStickUp = gapPx * 0.8;
        if (role === "active") {
          img.style.transform = "translateX(0) translateY(0) scale(1) rotateY(0deg)";
          img.style.opacity = "1";
          img.style.zIndex = "3";
        } else if (role === "left") {
          img.style.transform =
            "translateX(-" + gapPx + "px) translateY(-" + maxStickUp + "px) scale(0.85) rotateY(15deg)";
          img.style.opacity = "1";
          img.style.zIndex = "2";
        } else if (role === "right") {
          img.style.transform =
            "translateX(" + gapPx + "px) translateY(-" + maxStickUp + "px) scale(0.85) rotateY(-15deg)";
          img.style.opacity = "1";
          img.style.zIndex = "2";
        } else {
          img.style.transform = "translateX(0) scale(0.8)";
          img.style.opacity = "0";
          img.style.zIndex = "1";
        }
      });
    }

    function renderQuote(animate) {
      var t = TESTIMONIALS[activeIndex];
      var words = t.quote.split(" ");
      var quoteHtml = words
        .map(function (word, i) {
          var delay = reduced ? 0 : i * 0.025;
          return (
            '<span class="testimonial-word' +
            (animate && !reduced ? " testimonial-word--in" : "") +
            '" style="--word-delay:' +
            delay +
            's">' +
            word +
            "&nbsp;</span>"
          );
        })
        .join("");

      textEl.innerHTML =
        '<h3 class="testimonial-name">' +
        t.name +
        "</h3>" +
        '<p class="testimonial-designation">' +
        t.designation +
        "</p>" +
        '<blockquote class="testimonial-quote"><p>' +
        quoteHtml +
        "</p></blockquote>";

      if (animate && !reduced) {
        requestAnimationFrame(function () {
          textEl.querySelectorAll(".testimonial-word").forEach(function (el) {
            el.classList.add("testimonial-word--in");
          });
        });
      }
    }

    function updateDots() {
      dots.forEach(function (dot, i) {
        var on = i === activeIndex;
        dot.classList.toggle("is-active", on);
        dot.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    function goTo(index, animateQuote) {
      activeIndex = (index + TESTIMONIALS.length) % TESTIMONIALS.length;
      updateGap();
      applyImageStyles();
      renderQuote(animateQuote !== false);
      updateDots();
    }

    function resetAutoplay() {
      if (!autoplay) return;
      if (autoplayTimer) clearInterval(autoplayTimer);
      autoplayTimer = setInterval(function () {
        goTo(activeIndex + 1, true);
      }, 5000);
    }

    function handleNext() {
      goTo(activeIndex + 1, true);
      resetAutoplay();
    }

    function handlePrev() {
      goTo(activeIndex - 1, true);
      resetAutoplay();
    }

    if (prevBtn) prevBtn.addEventListener("click", handlePrev);
    if (nextBtn) nextBtn.addEventListener("click", handleNext);

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        var i = parseInt(dot.getAttribute("data-index"), 10);
        if (!isNaN(i)) {
          goTo(i, true);
          resetAutoplay();
        }
      });
    });

    window.addEventListener("keydown", function (e) {
      if (!widget.closest("section") || !document.getElementById("testimonials")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    });

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        updateGap();
        applyImageStyles();
      }, 120);
    });

    updateGap();
    goTo(0, false);
    resetAutoplay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
