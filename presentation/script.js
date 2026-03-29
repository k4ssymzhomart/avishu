const slides = Array.from(document.querySelectorAll(".slide"));
const ROOT = document.documentElement;
const SLIDE_WIDTH = 1920;
const SLIDE_HEIGHT = 1080;
const VIEWPORT_PADDING = 48;
const params = new URLSearchParams(window.location.search);
const isolatedSlideId = params.get("single");

const updateScale = () => {
  const availableWidth = Math.max(window.innerWidth - VIEWPORT_PADDING, 320);
  const availableHeight = Math.max(window.innerHeight - VIEWPORT_PADDING, 320);
  const scale = Math.min(availableWidth / SLIDE_WIDTH, availableHeight / SLIDE_HEIGHT);

  ROOT.style.setProperty("--slide-scale", String(Math.max(scale, 0.16)));
};

const activateSlide = (slide) => {
  if (!slide) return;

  slides.forEach((item) => {
    item.classList.toggle("is-active", item === slide);
  });

  if (history.replaceState && slide.id) {
    history.replaceState(null, "", `#${slide.id}`);
  }
};

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visible) {
      activateSlide(visible.target);
    }
  },
  {
    threshold: [0.45, 0.6, 0.75],
  }
);

slides.forEach((slide) => observer.observe(slide));

document.addEventListener("keydown", (event) => {
  const activeIndex = slides.findIndex((slide) => slide.classList.contains("is-active"));
  if (activeIndex === -1) return;

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    slides[Math.min(activeIndex + 1, slides.length - 1)].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    slides[Math.max(activeIndex - 1, 0)].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.key === "Home") {
    event.preventDefault();
    slides[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (event.key === "End") {
    event.preventDefault();
    slides[slides.length - 1]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

window.addEventListener("resize", updateScale, { passive: true });
window.addEventListener("orientationchange", updateScale, { passive: true });

updateScale();

if (isolatedSlideId) {
  document.body.classList.add("single-slide");
  const isolatedSlide = slides.find((slide) => slide.id === isolatedSlideId);
  if (isolatedSlide) {
    isolatedSlide.classList.add("isolated");
    activateSlide(isolatedSlide);
    isolatedSlide.scrollIntoView({ behavior: "auto", block: "start" });
  }
}

if (!isolatedSlideId && window.location.hash) {
  const target = document.querySelector(window.location.hash);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "auto", block: "start" });
      activateSlide(target);
    });
  }
} else if (!isolatedSlideId) {
  activateSlide(slides[0]);
}
