function timer() {
  return {
    days: ['0','0'], hours: ['0','0'], minutes: ['0','0'], seconds: ['0','0'],
    targetDate: new Date('2026-09-10T23:59:59').getTime(),
    start() {
      this.updateTimer();
      setInterval(() => this.updateTimer(), 999);
    },
    updateTimer() {
      const now = new Date().getTime();
      const distance = this.targetDate - now;
      if (distance > 0) {
        this.days    = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2,'0').split('');
        this.hours   = String(Math.floor((distance % (1000*60*60*24)) / (1000*60*60))).padStart(2,'0').split('');
        this.minutes = String(Math.floor((distance % (1000*60*60)) / (1000*60))).padStart(2,'0').split('');
        this.seconds = String(Math.floor((distance % (1000*60)) / 1000)).padStart(2,'0').split('');
      } else {
        this.days = ['0','0']; this.hours = ['0','0'];
        this.minutes = ['0','0']; this.seconds = ['0','0'];
      }
    }
  };
}

// ── Fade From Top ──
const fadeTopItems = document.querySelectorAll('.fade-from-top');
if (fadeTopItems.length) {
  const fadeTopObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  fadeTopItems.forEach(el => fadeTopObserver.observe(el));
}

// ── Fade From Left ──
const fadeLeftItems = document.querySelectorAll('.fade-from-left');
if (fadeLeftItems.length) {
  const fadeLeftObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = Array.from(fadeLeftItems).indexOf(entry.target);
        entry.target.style.animationDelay = `${index * 0.02}s`;
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.02 });
  fadeLeftItems.forEach(el => fadeLeftObserver.observe(el));
}

// ── Product Image Track ──
const track = document.querySelector('.product-img-track');
if (track) {
  let speed = 2, pos = 0, paused = false, isVisible = false, rafId = null;
  const outer = document.getElementById('ProductContainerOuter');
  if (outer) outer.style.visibility = 'hidden';

  function fillTrack() {
    const items = Array.from(track.children);
    const trackWidth = track.parentElement.offsetWidth;
    let totalWidth = items.reduce((sum, el) => sum + el.offsetWidth, 0);
    while (totalWidth < trackWidth * 3) {
      items.forEach(item => {
        const clone = item.cloneNode(true);
        clone.querySelectorAll('img').forEach(img => img.loading = 'eager');
        track.appendChild(clone);
        totalWidth += item.offsetWidth;
      });
    }
  }

  function preloadSrc(src) {
    return new Promise(resolve => { const img = new Image(); img.src = src; img.decode().then(resolve).catch(resolve); });
  }

  function appendClone(item) {
    const clone = item.cloneNode(true);
    clone.querySelectorAll('img').forEach(img => img.loading = 'eager');
    track.appendChild(clone);
  }

  track.parentElement.addEventListener('mouseenter', () => paused = true);
  track.parentElement.addEventListener('mouseleave', () => paused = false);

  function animateTrack() {
    if (isVisible && !paused) {
      pos -= speed;
      const firstItem = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).gap);
      if (firstItem.getBoundingClientRect().right < 0) {
        pos += firstItem.offsetWidth + gap;
        appendClone(firstItem);
        track.removeChild(firstItem);
      }
      track.style.transform = `translateX(${pos}px)`;
    }
    rafId = requestAnimationFrame(animateTrack);
  }

  function startTrackObserver() {
    const trackObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (isVisible && rafId === null) { rafId = requestAnimationFrame(animateTrack); }
      });
    }, { threshold: 0.1 });
    trackObserver.observe(track.parentElement);
  }

  const images = Array.from(track.querySelectorAll('img'));
  Promise.all(images.map(img => preloadSrc(img.src))).then(() => {
    fillTrack();
    if (outer) outer.style.visibility = '';
    track.classList.add('is-loaded');
    const fadeParent = track.closest('.fade-from-left');
    if (fadeParent) {
      fadeParent.addEventListener('animationend', startTrackObserver, { once: true });
    } else {
      startTrackObserver();
    }
  });
}

// ── Read More / Less ──
const boschContainer = document.querySelector('.bosch-2026-intro-container');
const readMoreBtn = document.getElementById('readMoreBtn');
if (boschContainer && readMoreBtn) {
  readMoreBtn.addEventListener('click', () => {
    boschContainer.classList.toggle('expanded');
    const isExpanded = boschContainer.classList.contains('expanded');
    readMoreBtn.textContent = isExpanded ? 'READ LESS' : 'READ MORE';
    if (isExpanded) { setTimeout(() => boschContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 300); }
  });
}

// ── Product Carousel ──
(function () {
  const wrapper = document.getElementById('carouselWrapper');
  const track   = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!wrapper || !track || !prevBtn || !nextBtn) return;

  let current = 0;
  const isSwipe = () => window.innerWidth <= 767;
  const getVisible = () => (window.innerWidth <= 1024 ? 2 : 3);
  const getTotal = () => track.children.length;
  function nearestIndex() {
    const mid = wrapper.getBoundingClientRect().left + wrapper.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    Array.from(track.children).forEach((card, i) => {
      const r = card.getBoundingClientRect();
      const d = Math.abs((r.left + r.width / 2) - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function snapTo(i) {
    const clamped = Math.max(0, Math.min(i, getTotal() - 1));
    track.children[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function update() {
    if (isSwipe()) { track.style.transform = ''; return; }
    const visible = getVisible();
    current = Math.max(0, Math.min(current, getTotal() - visible));
    track.style.transform = `translateX(-${(100 / visible) * current}%)`;
  }

  prevBtn.addEventListener('click', () => {
    if (isSwipe()) { snapTo(nearestIndex() - 1); return; }
    if (current > 0) { current--; update(); }
  });

  nextBtn.addEventListener('click', () => {
    if (isSwipe()) { snapTo(nearestIndex() + 1); return; }
    if (current < getTotal() - getVisible()) { current++; update(); }
  });

  window.addEventListener('resize', () => {
    if (isSwipe()) { track.style.transform = ''; } else { wrapper.scrollLeft = 0; }
    update();
  });

  update();
})();
