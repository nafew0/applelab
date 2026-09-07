/* ============================================================
   APPLE LAB — Homepage Interactivity
   ============================================================ */

(() => {
  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el));

  /* ---------- Number counters in trust bar ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1500;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.floor(eased * target).toLocaleString() + (t === 1 ? suffix : '');
          if (t < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString() + suffix;
        };
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  counters.forEach((el) => countIO.observe(el));

  /* ---------- Tracker widget (demo) ---------- */
  const trackerForm = document.getElementById('tracker-form');
  const trackerResult = document.getElementById('tracker-result');
  if (trackerForm && trackerResult) {
    trackerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('tracker-id');
      const phone = document.getElementById('tracker-phone');
      if (!id.value.trim()) {
        id.focus();
        return;
      }
      trackerResult.classList.add('active');
      trackerResult.scrollIntoView ? null : null; // keep no-scroll behavior
    });
  }

  /* ---------- Chat widget ---------- */
  const chatBtn = document.getElementById('chat-trigger');
  const chatWin = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  const chatBody = document.getElementById('chat-body');
  const chatInput = document.getElementById('chat-input');
  const chatForm = document.getElementById('chat-form');

  const greetIfFirstTime = () => {
    if (chatBody.dataset.greeted) return;
    chatBody.dataset.greeted = '1';
    // Already has initial bot message in HTML; no-op
  };

  if (chatBtn && chatWin) {
    chatBtn.addEventListener('click', () => {
      chatWin.classList.toggle('open');
      if (chatWin.classList.contains('open')) {
        greetIfFirstTime();
        setTimeout(() => chatInput && chatInput.focus(), 100);
      }
    });
    chatClose.addEventListener('click', () => chatWin.classList.remove('open'));
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = chatInput.value.trim();
      if (!val) return;
      const user = document.createElement('div');
      user.className = 'msg user';
      user.textContent = val;
      chatBody.appendChild(user);
      chatInput.value = '';
      chatBody.scrollTop = chatBody.scrollHeight;

      // Canned bot reply (offline-friendly demo)
      setTimeout(() => {
        const bot = document.createElement('div');
        bot.className = 'msg bot';
        bot.textContent = pickBotReply(val);
        chatBody.appendChild(bot);
        chatBody.scrollTop = chatBody.scrollHeight;
      }, 600);
    });
  }

  function pickBotReply(q) {
    const lc = q.toLowerCase();
    if (/(price|cost|quote|kt|tk|৳|taka)/.test(lc))
      return 'Most repairs start with a free diagnosis — once we know what is needed we send a fixed quote. Type your device + issue (e.g. “iPhone 13 screen”) and I will share a starting price.';
    if (/(screen|display|crack|broken|glass)/.test(lc))
      return 'Screen replacements use genuine Apple-grade parts. Service usually completes within 24 hours. Want me to start a booking?';
    if (/(battery|charge|charging)/.test(lc))
      return 'Battery service for iPhone, MacBook, iPad and Apple Watch — original cells, 90-day warranty. Free health check on walk-in.';
    if (/(track|status|ticket)/.test(lc))
      return 'You can track any repair with your ticket ID right on the homepage — or paste it here and I will look it up.';
    if (/(warranty|guarantee)/.test(lc))
      return 'Every repair is covered by our 90-day warranty. No-fix, no-fee — if we cannot fix it, you owe nothing.';
    if (/(hi|hello|hey|asalam|salam)/.test(lc))
      return 'Hi! I am AppleBot — ask me about prices, repair times, or how to book. I can also help track a repair.';
    return 'Got it. A human engineer can take over any time — tap “Book a Repair” at the top, or share your device + issue here and I will guide you.';
  }
})();
