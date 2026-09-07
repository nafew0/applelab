/* Scroll-scrubbed repair film */
(() => {
  const film = document.getElementById('repair-film');
  if (!film) return;
  const frames = [...film.querySelectorAll('.film-frame')];
  const caps = [...film.querySelectorAll('.film-cap')];
  const bar = film.querySelector('.film-bar i');
  const glint = film.querySelector('.film-glint');
  const glow = film.querySelector('.film-glow');
  const intro = film.querySelector('.film-intro');
  const outro = film.querySelector('.film-outro');
  const hint = film.querySelector('.film-hint');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    film.classList.add('static');
    frames.forEach((f, i) => { f.style.opacity = i === frames.length - 1 ? 1 : 0; f.style.transform = 'none'; });
    if (intro) intro.style.opacity = 0;
    if (outro) { outro.style.opacity = 1; outro.style.pointerEvents = 'auto'; }
    if (hint) hint.style.opacity = 0;
    return;
  }
  let target = 0, cur = 0;
  function measure() {
    const total = film.offsetHeight - innerHeight;
    target = clamp(-film.getBoundingClientRect().top / total, 0, 1);
  }
  function tick() {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0004) cur = target;
    const f = cur * (frames.length - 1);
    frames.forEach((img, i) => {
      const vis = clamp(1 - Math.abs(i - f), 0, 1);
      img.style.opacity = vis;
      img.style.transform = 'scale(' + (1.07 - 0.07 * vis).toFixed(4) + ')';
    });
    if (bar) bar.style.transform = 'scaleX(' + cur.toFixed(4) + ')';
    caps.forEach(c => {
      const vis = range(cur, +c.dataset.in - 0.03, +c.dataset.in) * (1 - range(cur, +c.dataset.out, +c.dataset.out + 0.03));
      c.style.opacity = vis;
      c.style.transform = 'translateY(' + ((1 - vis) * 14).toFixed(1) + 'px)';
    });
    if (intro) {
      const v = 1 - range(cur, 0.015, 0.09);
      intro.style.opacity = v;
      intro.style.transform = 'translateY(' + ((1 - v) * -22).toFixed(1) + 'px)';
      intro.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
    }
    if (hint) hint.style.opacity = 1 - range(cur, 0.01, 0.05);
    if (glint) {
      const g = range(cur, 0.42, 0.64);
      glint.style.opacity = g > 0.02 && g < 0.98 ? 0.9 : 0;
      glint.style.transform = 'translateX(' + (-120 + g * 520).toFixed(1) + '%) skewX(-18deg)';
    }
    if (glow) glow.style.opacity = range(cur, 0.9, 0.99);
    if (outro) {
      const v = range(cur, 0.9, 0.985);
      outro.style.opacity = v;
      outro.style.transform = 'translateY(' + ((1 - v) * 24).toFixed(1) + 'px)';
      outro.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
    }
    requestAnimationFrame(tick);
  }
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', measure);
  measure();
  tick();
})();
