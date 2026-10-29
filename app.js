(() => {
  'use strict';
  const c = window.BIRTHDAY_CONFIG;
  const $ = id => document.getElementById(id);
  const set = (id, text) => { $(id).textContent = text; };
  document.querySelectorAll('[data-name]').forEach(el => el.textContent = c.name);
  ['introLine','introAccent','from','photoCaption','memoryTitle','memorySubtitle'].forEach(key => set(key.replace(/[A-Z]/g, l => '-' + l.toLowerCase()), c[key]));
  set('birthday-date', c.birthdayDate);
  set('surprise-heading', c.surpriseTitle);
  set('surprise-message', c.surpriseMessage);
  set('surprise-button', c.surpriseButton + ' ♡');
  $('signature').textContent = c.signature;
  c.letter.forEach(text => { const p = document.createElement('p'); p.textContent = text; $('letter-paragraphs').appendChild(p); });
  $('memory-photo').src = c.memoryPhoto;
  $('modal-image').src = c.surprisePhoto;

  // La experiencia se desbloquea con seis toques durante la pantalla inicial.
  let taps = 0;
  const target = 6;
  const prompts = [
    'Toca el corazón',
    'Otra vez',
    'Algo se está encendiendo...',
    'Un poquito más',
    'No pares ahora',
    '¡La última vez!'
  ];
  const loading = $('loading');
  const loadButton = $('loading-heart-button');
  const loadFill = $('loading-heart-fill');
  const progress = $('loading-progress');
  let opening = false;
  // Audio: se activa desde el sexto toque para respetar las políticas móviles.
  const audio = $('birthday-audio');
  const musicButton = $('music-toggle');
  const musicLabel = $('music-label');
  const musicIcon = $('music-icon');
  const targetVolume = 0.42;
  let fadeInterval = null;
  let audioWanted = true;
  function updateMusicButton() {
    const playing = !audio.paused;
    musicLabel.textContent = playing ? 'Pausar música' : 'Reproducir música';
    musicIcon.textContent = playing ? '♫' : '♪';
    musicButton.setAttribute('aria-label', musicLabel.textContent);
    musicButton.setAttribute('aria-pressed', String(playing));
  }
  function startMusic() {
    audioWanted = true;
    audio.volume = 0;
    const attempt = audio.play();
    if (attempt && typeof attempt.then === 'function') {
      attempt.then(() => {
        if (!audioWanted) { audio.pause(); return; }
        window.clearInterval(fadeInterval);
        let step = 0;
        fadeInterval = window.setInterval(() => {
          step++;
          audio.volume = Math.min(targetVolume, targetVolume * step / 25);
          if (step >= 25 || audio.paused) window.clearInterval(fadeInterval);
        }, 90);
        updateMusicButton();
      }).catch(() => {
        // Si el navegador lo bloquea, el botón permite iniciarlo manualmente.
        audio.volume = targetVolume;
        updateMusicButton();
      });
    }
  }
  audio.addEventListener('play', updateMusicButton);
  audio.addEventListener('pause', updateMusicButton);
  musicButton.addEventListener('click', () => {
    if (audio.paused) {
      audioWanted = true;
      audio.volume = targetVolume;
      audio.play().catch(() => {});
    } else {
      audioWanted = false;
      window.clearInterval(fadeInterval);
      audio.pause();
    }
    updateMusicButton();
  });
  document.body.classList.add('is-loading');
  function openPage() {
    if (opening) return;
    opening = true;
    loadButton.disabled = true;
    $('loading-instruction').textContent = 'Esta sorpresa es para ti ♡';
    loading.classList.add('loading-finished');
    window.setTimeout(() => {
      loading.classList.add('loading-exit');
      document.body.classList.remove('is-loading');
      window.setTimeout(() => { loading.hidden = true; }, 750);
    }, reduced ? 80 : 520);
  }
  loadButton.addEventListener('click', () => {
    if (opening) return;
    taps = Math.min(target, taps + 1);
    const percentage = taps / target * 100;
    loadFill.style.clipPath = `inset(${100 - percentage}% 0 0 0)`;
    progress.style.width = `${percentage}%`;
    $('loading-note').textContent = `${taps} de ${target} latidos ♡`;
    if (taps < target) $('loading-instruction').textContent = prompts[taps];
    loadButton.setAttribute('aria-label', `${taps} de ${target} latidos`);
    loadButton.classList.remove('heart-pulse');
    void loadButton.offsetWidth;
    loadButton.classList.add('heart-pulse');
    if (taps === target) {
      musicButton.hidden = false;
      startMusic(); // Llamada directa desde el gesto del usuario.
      openPage();
    }
  });

  const photos = c.firstPhotos;
  let active = 0;
  const dots = $('photo-dots');
  dots.replaceChildren();
  const buttons = photos.map((_, i) => {
    const b = document.createElement('button'); b.type='button'; b.setAttribute('aria-label',`Ver fotografía ${i+1}`);
    b.addEventListener('click', () => show(i)); dots.appendChild(b); return b;
  });
  function show(n) {
    active = (n + photos.length) % photos.length;
    const img = $('carousel-image');
    img.style.opacity = '0';
    window.setTimeout(() => { img.src = photos[active]; img.alt = `Recuerdo ${active+1} de ${photos.length}`; img.style.opacity = '1'; }, 135);
    buttons.forEach((b,i) => { b.classList.toggle('active',i === active); b.setAttribute('aria-current',String(i===active)); });
  }
  $('carousel-image').style.transition='opacity .3s ease';
  $('photo-prev').addEventListener('click',() => show(active - 1));
  $('photo-next').addEventListener('click',() => show(active + 1));
  let touchX = null;
  $('carousel').addEventListener('touchstart', e => {touchX = e.changedTouches[0].screenX;},{passive:true});
  $('carousel').addEventListener('touchend', e => {if(touchX === null)return; const dx = e.changedTouches[0].screenX - touchX; if(Math.abs(dx)>35)show(active+(dx<0?1:-1)); touchX=null;},{passive:true});
  show(0);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const observer = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    if (e.target.id === 'letter-experience') e.target.classList.add('letter-opened');
    else { e.target.classList.add('visible'); if (e.target.classList.contains('memory-section')) e.target.classList.add('cheers-play'); }
    observer.unobserve(e.target);
  }),{ threshold:.18, rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.reveal,#letter-experience').forEach(el => observer.observe(el));
  if (reduced) document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

  const modal = $('modal');
  const modalDialog = modal.querySelector('.surprise-modal');
  let closeTimer;
  let lastFocused = null;
  function close() {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      modal.hidden = true;
      document.body.style.overflow = '';
      (lastFocused || $('surprise-button')).focus();
    }, reduced ? 10 : 400);
  }
  $('surprise-button').addEventListener('click', () => {
    window.clearTimeout(closeTimer);
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('is-open');
      modalDialog.focus({preventScroll:true});
    }));
  });
  $('close-modal').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
    if (e.key === 'Tab' && !modal.hidden) {
      e.preventDefault();
      $('close-modal').focus();
    }
  });
})();
