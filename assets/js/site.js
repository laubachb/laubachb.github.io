const NAV_ITEMS = [
  { key: "about", href: "index.html", label: "About" },
  { key: "experience", href: "experience.html", label: "Experience" },
  { key: "research", href: "research.html", label: "Research" },
  { key: "projects", href: "projects.html", label: "Projects" },
  { key: "publications", href: "publications.html", label: "Publications" },
  { key: "contact", href: "contact.html", label: "Contact" },
];

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function renderChrome() {
  const page = document.body.dataset.page || "";

  if (!document.getElementById("lattice-bg")) {
    const canvas = document.createElement("canvas");
    canvas.id = "lattice-bg";
    document.body.prepend(canvas);
  }

  const headerEl = document.getElementById("site-header");
  if (headerEl) {
    const navLinks = NAV_ITEMS.map(
      (item) =>
        `<a href="${item.href}"${item.key === page ? ' class="active"' : ""}>${item.label}</a>`
    ).join("");
    headerEl.innerHTML = `
      <div class="container header-inner">
        <a href="index.html" class="logo"><span class="logo-bracket">[</span>B. Laubach<span class="logo-bracket">]</span></a>
        <nav>${navLinks}</nav>
      </div>`;
  }

  const footerEl = document.getElementById("site-footer");
  if (footerEl) {
    footerEl.innerHTML = `
      <div class="container footer-inner">
        <p>&copy; <span id="year"></span> Benjamin Laubach</p>
        <ul class="links">
          <li><a href="mailto:blaubach@umich.edu">Email</a></li>
          <li><a href="https://github.com/laubachb" target="_blank" rel="noopener">GitHub</a></li>
          <li><a href="https://www.linkedin.com/in/benjamin-laubach-3372a4193/" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
      </div>`;
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
}

function typeEffect(el) {
  const strings = JSON.parse(el.dataset.strings || "[]");
  if (!strings.length) return;
  const full = strings[0];
  if (prefersReducedMotion) {
    el.textContent = full;
    return;
  }
  let i = 0;
  function step() {
    el.textContent = full.slice(0, i);
    i++;
    if (i <= full.length) setTimeout(step, 55);
  }
  step();
}

function initTyping() {
  document.querySelectorAll(".type-target").forEach(typeEffect);
}

function initReveal() {
  const revealEls = document.querySelectorAll(".reveal:not(.is-visible)");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => observer.observe(el));
}

function animateCount(el) {
  const target = parseInt(el.dataset.count, 10);
  if (prefersReducedMotion || isNaN(target)) {
    el.textContent = target;
    return;
  }
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * progress);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function initCounters() {
  const statEls = document.querySelectorAll(".stat-num");
  if (!statEls.length) return;
  if ("IntersectionObserver" in window) {
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    statEls.forEach((el) => statObserver.observe(el));
  } else {
    statEls.forEach(animateCount);
  }
}

function initLattice() {
  const canvas = document.getElementById("lattice-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width, height, nodes;
  const NODE_COUNT_DIVISOR = 14000; // controls density relative to viewport area
  const LINK_DIST = 140;
  const accent = "rgba(79, 209, 197,";
  const accent2 = "rgba(124, 156, 255,";

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(90, Math.max(30, Math.floor((width * height) / NODE_COUNT_DIVISOR)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          const alpha = (1 - dist / LINK_DIST) * 0.35;
          ctx.strokeStyle = accent + alpha + ")";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const n of nodes) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = accent2 + "0.8)";
      ctx.fill();
    }

    if (!prefersReducedMotion) requestAnimationFrame(step);
  }

  resize();
  window.addEventListener("resize", resize);

  if (prefersReducedMotion) {
    step(); // draw a single static frame
  } else {
    requestAnimationFrame(step);
  }
}

// Renders cards from data/projects.json into #project-list.
// Expected shape per entry: { name, description, url, tags: [string], image (optional) }.
function renderProjectCard(project) {
  const tagRow = (project.tags || [])
    .map((tag) => `<span class="card-tag">${tag}</span>`)
    .join(" ");
  const image = project.image
    ? `<img class="card-img" src="${project.image}" alt="${project.name}" loading="lazy" />`
    : "";
  return `
    <article class="card reveal">
      ${image}
      <div class="tag-row">${tagRow}</div>
      <h3>${project.name}</h3>
      <p>${project.description || ""}</p>
      ${project.url ? `<a class="card-link" href="${project.url}" target="_blank" rel="noopener">View on GitHub &rarr;</a>` : ""}
    </article>`;
}

async function initProjects() {
  const list = document.getElementById("project-list");
  if (!list) return;
  try {
    const res = await fetch("data/projects.json");
    const projects = await res.json();
    list.innerHTML = projects.length
      ? projects.map(renderProjectCard).join("")
      : `<p class="empty-state reveal">// more projects coming soon</p>`;
  } catch (err) {
    list.innerHTML = `<p class="empty-state reveal">// more projects coming soon</p>`;
  }
  initReveal();
}

renderChrome();
initTyping();
initReveal();
initCounters();
initLattice();
initProjects();
