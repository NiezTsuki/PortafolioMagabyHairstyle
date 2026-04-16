/* PROTECCIÓN VISUAL CONTRA ROBOS DE IMÁGENES */
document.addEventListener('contextmenu', function(e) {
  if (e.target.tagName === 'IMG' || e.target.closest('.gallery-item') || e.target.closest('.hero-img-main') || e.target.closest('.about-img-frame')) {
    e.preventDefault();
  }
});
document.addEventListener('dragstart', function(e) {
  if (e.target.tagName === 'IMG' || e.target.closest('.gallery-item') || e.target.closest('.about-img-frame')) {
    e.preventDefault();
  }
});

/* LÓGICA DEL CURSOR ANIMADO (SÓLO PARA ESCRITORIO) */
const cur = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

if (cur && window.matchMedia('(pointer:fine)').matches) {
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
    setTimeout(() => {
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
    }, 80);
  });
}

/* EFECTO DE NAVEGACIÓN AL HACER SCROLL */
const mainNav = document.getElementById('mainNav');
if (mainNav && !mainNav.classList.contains('nav-always-solid')) {
  window.addEventListener('scroll', () => {
    mainNav.classList.toggle('scrolled', window.scrollY > 70);
  }, { passive: true });
}

/* ANIMACIÓN DE APARICIÓN TIPO "REVEAL" MIENTRAS SE HACE SCROLL */
const observerOptions = {
  threshold: 0.08,
  rootMargin: '0px 0px -40px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* DESPLAZAMIENTO SUAVE PARA LOS ENLACES DE ANCLAJE (#) */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const targetId = a.getAttribute('href');
    if (targetId === '#') return; 
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      e.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* LÓGICA DEL VISOR DE IMÁGENES (LIGHTBOX GALERÍA) */
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

if (lightbox && lightboxImg && lightboxClose) {
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      lightboxImg.src = img.src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden'; 
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; 
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* BLINDAJE DE EVENTOS: SE EJECUTAN SÓLO CUANDO EL DOM CARGA */
document.addEventListener('DOMContentLoaded', () => {
  const docLang = document.documentElement.lang || 'es';

  /* LÓGICA DEL MENÚ HAMBURGUESA (MÓVILES) */
  const ham = document.getElementById('hamburger');
  const mob = document.getElementById('mobileMenu');
  const mobClose = document.getElementById('mobileClose');

  if (ham && mob) {
    ham.addEventListener('click', () => {
      ham.classList.toggle('open');
      mob.classList.toggle('open');
      document.body.style.overflow = mob.classList.contains('open') ? 'hidden' : '';
    });
    
    if (mobClose) {
      mobClose.addEventListener('click', () => {
        ham.classList.remove('open');
        mob.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
    
    mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      ham.classList.remove('open');
      mob.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* INICIALIZAR CALENDARIO FLATPICKR */
  if (typeof flatpickr !== 'undefined' && document.getElementById('contactDate')) {
    flatpickr("#contactDate", {
      locale: docLang === 'es' ? 'es' : 'default', 
      dateFormat: "d \\de F, Y",
      minDate: "today",
      disableMobile: true 
    });
  }
});

/* LÓGICA DE ENVÍO AL WHATSAPP DE MAGABY */
const whatsappForm = document.getElementById('whatsappForm');

if (whatsappForm) {
  whatsappForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const docLang = document.documentElement.lang || 'es';
    const isEn = docLang === 'en';
    
    const submitBtn = document.getElementById('formSubmit');
    const name = document.getElementById('contactName').value;
    const date = document.getElementById('contactDate').value;
    const location = document.getElementById('contactLocation').value;
    const service = document.getElementById('serviceSelect').value;
    const message = document.getElementById('contactMessage').value;

    const extrasElements = document.querySelectorAll('input[name="extras"]:checked');
    const extrasList = Array.from(extrasElements).map(cb => cb.nextElementSibling.textContent.trim());

    const phoneNumber = '50765660761';

    let waText = isEn 
      ? `Hello Magaby! I would like to check availability for my wedding:\n\n`
      : `¡Hola Magaby! Quisiera consultar disponibilidad para mi boda:\n\n`;
    
    waText += isEn ? `*Bride:* ${name}\n` : `*Novia:* ${name}\n`;
    waText += isEn ? `*Date:* ${date}\n` : `*Fecha:* ${date}\n`;
    waText += isEn ? `*Location:* ${location}\n` : `*Lugar/Hotel:* ${location}\n`;
    waText += isEn ? `*Service:* ${service}\n` : `*Servicio:* ${service}\n`;
    
    if (extrasList.length > 0) {
      waText += `*Extras:* ${extrasList.join(', ')}\n`;
    }
    
    waText += `\n`; 
    
    if(message.trim() !== '') {
      waText += isEn ? `*Details:* ${message}` : `*Detalles:* ${message}`;
    }

    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');

    submitBtn.textContent = isEn ? 'Redirecting...!' : '¡Redirigiendo...!';
    submitBtn.style.background = 'var(--gold)'; 
    
    setTimeout(() => {
      submitBtn.textContent = isEn ? 'Message on WhatsApp →' : 'Escribir al WhatsApp →';
      submitBtn.style.background = 'var(--deep)';
      whatsappForm.reset(); 
    }, 3000);
  });
}

/* FILTRO DE GALERÍA POR CATEGORÍA */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');

    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.gallery-item[data-category]').forEach(item => {
      if (filter === 'all' || item.getAttribute('data-category') === filter) {
        item.classList.remove('hidden');
        item.classList.remove('visible');
        setTimeout(() => item.classList.add('visible'), 50);
      } else {
        item.classList.add('hidden');
      }
    });
  });
});

/* TABS DE PAQUETES */
document.querySelectorAll('.pkg-tab').forEach(tab => {
  if (tab.classList.contains('coming-soon')) return; 

  tab.addEventListener('click', () => {
    const panelId = 'panel-' + tab.getAttribute('data-panel');

    document.querySelectorAll('.pkg-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    document.querySelectorAll('.packages-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('active');
  });
});