/* led-carousel.js — turns the LED screen into a carousel.
 *
 * Load AFTER script.js (and the other scripts). It reuses:
 *   - the #led frame (so size/position/glow from style.css stay the same)
 *   - the existing <h1> and typing line as the first "Home" slide
 *   - the <template id="tmpl-about|skills|projects"> content as slides
 * so you keep editing your content in index.html only.
 *
 * Skills are split into one slide per ACT, projects into one slide per card.
 *
 * Public API: window.LEDCarousel = { init, goTo, next, prev, goToSection }
 */
(() => {
  'use strict';

  // ---- Edit these to rename tabs / titles or add new sections -------------
  const SECTIONS = [
    { key: 'about',    tab: 'About',    title: 'ARTIST BIO // ABOUT ME',          template: 'tmpl-about',    splitAt: null },
    { key: 'skills',   tab: 'Skills',   title: 'SETLIST // TECHNICAL SKILLS',     template: 'tmpl-skills',   splitAt: '.act' },
    { key: 'projects', tab: 'Projects', title: 'WORLD TOUR // SHOWCASE PROJECTS', template: 'tmpl-projects', splitAt: '.card' }
  ];
  const HOME_TAB = 'Home';
  const SWIPE_MIN = 50; // px

  let root, track, status, slides = [], dots = [], tabs = [], index = 0;

  const make = (tag, cls, attrs) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  };

  // Split a template into pages. A new page starts at every element that
  // matches `splitAt`; with no splitAt the whole template is one page.
  function buildPages(tpl, splitAt) {
    const wrapper = tpl.content.firstElementChild;
    if (!wrapper) return [];

    if (!splitAt) {
      return [{ node: wrapper.cloneNode(true), sub: '' }];
    }

    const pages = [];
    let current = null;

    [...wrapper.children].forEach(child => {
      if (child.matches(splitAt)) {
        const h = child.querySelector('h3');
        const sub = (h ? h.textContent : child.textContent).replace(/\s+/g, ' ').trim();
        current = { node: make('div'), sub };
        pages.push(current);
      }
      if (current) current.node.appendChild(child.cloneNode(true));
    });

    return pages;
  }

  function buildSlides() {
    const list = [];

    // Slide 0: the original LED heading + typing line (moved, not copied,
    // so the typing animation in script.js keeps working).
    const home = make('section', 'lc-slide lc-home');
    const h1 = root.querySelector(':scope > h1');
    const typed = root.querySelector(':scope > .type');
    if (h1) home.appendChild(h1);
    if (typed) home.appendChild(typed);
    home.appendChild(make('p', 'lc-hint')).textContent =
      'Swipe or use the arrows to browse the show';
    list.push({ el: home, group: 'home', label: 'Welcome' });

    SECTIONS.forEach(sec => {
      const tpl = document.getElementById(sec.template);
      if (!tpl) return;

      buildPages(tpl, sec.splitAt).forEach(page => {
        const el = make('section', 'lc-slide');
        const title = make('div', 'p-title');
        title.textContent = sec.title;
        const body = make('div', 'p-body');
        body.appendChild(page.node);
        el.append(title, body);
        list.push({
          el,
          group: sec.key,
          label: page.sub ? `${sec.tab}: ${page.sub}` : sec.tab
        });
      });
    });

    return list;
  }

  function build() {
    const data = buildSlides();
    const frame = make('div', 'lc', {
      role: 'region',
      'aria-roledescription': 'carousel',
      'aria-label': 'Portfolio screen'
    });

    const viewport = make('div', 'lc-viewport');
    track = make('div', 'lc-track');

    data.forEach((s, i) => {
      s.el.setAttribute('role', 'group');
      s.el.setAttribute('aria-roledescription', 'slide');
      s.el.setAttribute('aria-label', `${s.label} (${i + 1} of ${data.length})`);
      track.appendChild(s.el);
    });
    viewport.appendChild(track);

    // Arrows + dots (dots are spaced out per section)
    const bar = make('div', 'lc-bar');
    const prev = make('button', 'led-btn lc-arrow', { type: 'button', 'aria-label': 'Previous slide' });
    const next = make('button', 'led-btn lc-arrow', { type: 'button', 'aria-label': 'Next slide' });
    prev.textContent = '‹';
    next.textContent = '›';
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));

    const dotWrap = make('div', 'lc-dots');
    data.forEach((s, i) => {
      const dot = make('button', 'lc-dot', { type: 'button', 'aria-label': `Go to ${s.label}` });
      if (i > 0 && data[i - 1].group !== s.group) dot.classList.add('gap');
      dot.addEventListener('click', () => go(i));
      dotWrap.appendChild(dot);
      dots.push(dot);
    });
    bar.append(prev, dotWrap, next);

    // Section tabs
    const tabRow = make('div', 'lc-tabs');
    const groups = ['home', ...SECTIONS.map(s => s.key)].filter(k => data.some(s => s.group === k));
    groups.forEach(key => {
      const btn = make('button', 'led-btn lc-tab', { type: 'button' });
      btn.dataset.group = key;
      btn.textContent = key === 'home' ? HOME_TAB : SECTIONS.find(s => s.key === key).tab;
      btn.addEventListener('click', () => goToSection(key));
      tabRow.appendChild(btn);
      tabs.push(btn);
    });

    status = make('span', 'lc-sr', { 'aria-live': 'polite' });
    frame.append(viewport, bar, tabRow, status);
    root.appendChild(frame);

    slides = data;
    enableSwipe(viewport);
    enableKeys();
  }

  function enableSwipe(el) {
    let x0 = 0, y0 = 0, tracking = false;

    el.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      tracking = true;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    el.addEventListener('pointercancel', () => { tracking = false; });
    el.addEventListener('pointerup', e => {
      if (!tracking) return;
      tracking = false;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
        go(index + (dx < 0 ? 1 : -1));
      }
    });
  }

  function enableKeys() {
    root.addEventListener('keydown', e => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') { go(index + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { go(index - 1); e.preventDefault(); }
      else if (e.key === 'Home') { go(0); e.preventDefault(); }
      else if (e.key === 'End') { go(slides.length - 1); e.preventDefault(); }
    });
  }

  function go(i) {
    if (!slides.length) return;
    index = (i + slides.length) % slides.length; // loops at both ends

    track.style.transform = `translateX(${-index * 100}%)`;

    slides.forEach((s, n) => {
      const active = n === index;
      s.el.toggleAttribute('inert', !active);
      s.el.setAttribute('aria-hidden', String(!active));
      if (active) {
        const body = s.el.querySelector('.p-body');
        if (body) body.scrollTop = 0;
      }
    });

    dots.forEach((d, n) => {
      d.classList.toggle('on', n === index);
      if (n === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });

    const group = slides[index].group;
    tabs.forEach(t => t.classList.toggle('on', t.dataset.group === group));

    status.textContent = `${slides[index].label}, slide ${index + 1} of ${slides.length}`;
  }

  function goToSection(key) {
    const i = slides.findIndex(s => s.group === key);
    if (i >= 0) go(i);
  }

  function init() {
    if (root) return; // already initialised
    root = document.getElementById('led');
    if (!root) return;

    // 'open' + 'expanded' switch on the original responsive layout from
    // style.css (taller hero, LED height caps, idol/stage spacing), so the
    // screen follows the viewport size exactly like the old opened panel did.
    root.classList.add('is-carousel', 'open');
    document.body.classList.add('expanded');
    build();
    go(0);

    // Keep any old inline onclick="openPanel(...)" / closePanel() working.
    window.openPanel = key => goToSection(key);
    window.closePanel = () => go(0);
  }

  window.LEDCarousel = {
    init,
    goTo: go,
    next: () => go(index + 1),
    prev: () => go(index - 1),
    goToSection
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
