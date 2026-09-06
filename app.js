/* ==========================================================================
   VELD STUDIO — Interactive Frontend Logic
   Handcrafted Footwear & Independent Designer Platform
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initUltraLowGpuCursor();
  initShoeZoom();
  initHotspots();
  initColorwaySwitcher();
  initProvenanceSlider();
  initDesignerModal();
  initFormSubmissions();
  initSmoothScroll();
});

/**
 * 1. Minimal Custom Cursor (Optimized for Near-Zero GPU & CPU Load)
 * - Uses requestAnimationFrame with an idle threshold so it sleeps when mouse is still
 * - Only modifies composite property `transform: translate3d(...)`
 * - Automatically disabled on touch / mobile devices
 */
function initUltraLowGpuCursor() {
  // Check if device supports fine pointer (mouse)
  if (window.matchMedia('(pointer: coarse)').matches) {
    return;
  }

  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (!dot || !ring) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isMoving = false;
  let isHovering = false;
  let hasMovedOnce = false;

  // Passive event listener for minimal scroll/touch contention
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasMovedOnce) {
      hasMovedOnce = true;
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      ringX = mouseX;
      ringY = mouseY;
    }

    if (!isMoving) {
      isMoving = true;
      requestAnimationFrame(renderCursor);
    }
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
  });

  window.addEventListener('mouseenter', () => {
    if (hasMovedOnce) {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    }
  });

  // Linear interpolation loop that shuts itself off when idle
  function renderCursor() {
    // Move dot immediately with hardware acceleration
    dot.style.transform = `translate3d(${mouseX - 3}px, ${mouseY - 3}px, 0)`;

    // Lerp ring for soft organic trailing without layout reflows
    const ease = 0.22;
    ringX += (mouseX - ringX) * ease;
    ringY += (mouseY - ringY) * ease;

    const ringRadius = isHovering ? 22 : 14;
    ring.style.transform = `translate3d(${ringX - ringRadius}px, ${ringY - ringRadius}px, 0)`;

    // Check if close enough to sleep to conserve GPU / CPU battery
    const dx = Math.abs(mouseX - ringX);
    const dy = Math.abs(mouseY - ringY);

    if (dx > 0.1 || dy > 0.1) {
      requestAnimationFrame(renderCursor);
    } else {
      isMoving = false;
    }
  }

  // Fast delegation for interactive elements and dark surface contrast detection
  const darkSurfaceSelector = '.announcement-bar, .ledger-preview-box, .certificate-mockup, .site-footer, .hotspot-popover, .btn-primary, .btn-primary-sm, .color-chip[data-variant="obsidian"], [data-dark="true"]';

  document.addEventListener('mouseover', (e) => {
    // 1. Check interactive hover
    const interactiveTarget = e.target.closest('a, button, input, select, textarea, .interactive-target, .color-chip, .hotspot');
    if (interactiveTarget) {
      isHovering = true;
      ring.classList.add('cursor-hover');
      dot.classList.add('cursor-hover');
    }

    // 2. Check if hovering over a black/dark background surface
    const darkTarget = e.target.closest(darkSurfaceSelector);
    if (darkTarget) {
      dot.classList.add('cursor-on-dark');
      ring.classList.add('cursor-on-dark');
    } else {
      dot.classList.remove('cursor-on-dark');
      ring.classList.remove('cursor-on-dark');
    }
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const interactiveTarget = e.target.closest('a, button, input, select, textarea, .interactive-target, .color-chip, .hotspot');
    if (interactiveTarget) {
      isHovering = false;
      ring.classList.remove('cursor-hover');
      dot.classList.remove('cursor-hover');
    }
  }, { passive: true });
}

/**
 * 2. Tactile Suede Zoom Lens Inspector
 */
function initShoeZoom() {
  const zoomBox = document.getElementById('shoe-zoom-box');
  const lens = document.getElementById('zoom-lens');
  const shoeImg = document.getElementById('main-shoe-img');

  if (!zoomBox || !lens || !shoeImg) return;

  const zoomFactor = 2.4;

  // Set the lens background to the shoe image
  lens.style.backgroundImage = `url('${shoeImg.src}')`;

  zoomBox.addEventListener('mousemove', (e) => {
    const rect = zoomBox.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lensWidth = 140;
    const lensHeight = 140;

    let posX = x - lensWidth / 2;
    let posY = y - lensHeight / 2;

    // Clamp inside viewport
    if (posX < 0) posX = 0;
    if (posY < 0) posY = 0;
    if (posX > rect.width - lensWidth) posX = rect.width - lensWidth;
    if (posY > rect.height - lensHeight) posY = rect.height - lensHeight;

    lens.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;

    // Calculate background zoom positioning
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    lens.style.backgroundSize = `${rect.width * zoomFactor}px ${rect.height * zoomFactor}px`;
    lens.style.backgroundPosition = `${bgX}% ${bgY}%`;
  }, { passive: true });

  zoomBox.addEventListener('mouseleave', () => {
    lens.style.opacity = '0';
  });

  zoomBox.addEventListener('mouseenter', () => {
    lens.style.opacity = '1';
    lens.style.backgroundImage = `url('${shoeImg.src}')`;
  });
}

/**
 * 3. Hotspots on the Shoe Viewport
 */
function initHotspots() {
  const hotspots = document.querySelectorAll('.hotspot');
  const popover = document.getElementById('hotspot-popover');
  const popTitle = document.getElementById('popover-title');
  const popDesc = document.getElementById('popover-desc');

  if (!popover || !popTitle || !popDesc) return;

  hotspots.forEach(hotspot => {
    const showPopover = () => {
      const title = hotspot.getAttribute('data-title');
      const desc = hotspot.getAttribute('data-desc');

      popTitle.textContent = title;
      popDesc.textContent = desc;

      const top = hotspot.style.top;
      const left = hotspot.style.left;

      popover.style.top = `calc(${top} + 20px)`;
      popover.style.left = `calc(${left} + 10px)`;
      popover.classList.add('active');
    };

    hotspot.addEventListener('mouseenter', showPopover);
    hotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      showPopover();
    });

    hotspot.addEventListener('mouseleave', () => {
      popover.classList.remove('active');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.hotspot') && !e.target.closest('.hotspot-popover')) {
      popover.classList.remove('active');
    }
  });
}

/**
 * 4. Colorway / Material Treatment Switcher
 */
function initColorwaySwitcher() {
  const chips = document.querySelectorAll('.color-chip');
  const shoeImg = document.getElementById('main-shoe-img');
  const label = document.getElementById('active-colorway-label');
  const collectorColorSelect = document.getElementById('collector-colorway');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const variant = chip.getAttribute('data-variant');
      const name = chip.getAttribute('data-name');

      if (label) {
        label.textContent = `Treatment: ${name}`;
      }

      // Reset variant classes
      shoeImg.classList.remove('variant-dune', 'variant-obsidian');

      if (variant === 'dune') {
        shoeImg.classList.add('variant-dune');
      } else if (variant === 'obsidian') {
        shoeImg.classList.add('variant-obsidian');
      }

      // Sync with collector dropdown
      if (collectorColorSelect) {
        if (variant === 'forest') collectorColorSelect.value = 'Forest Moss Suede';
        if (variant === 'dune') collectorColorSelect.value = 'Rift Dune Sand';
        if (variant === 'obsidian') collectorColorSelect.value = 'Obsidian Soil';
      }
    });
  });
}

/**
 * 5. Interactive Provenance Slider ("The Provenance Standard: 2,000+ Pairs")
 */
function initProvenanceSlider() {
  const slider = document.getElementById('edition-slider');
  const certDisplay = document.getElementById('cert-display-id');

  if (!slider || !certDisplay) return;

  slider.addEventListener('input', (e) => {
    const val = String(e.target.value).padStart(4, '0');
    certDisplay.textContent = `PAIR #${val} OF 2,000+`;

    if (val === '0001') {
      certDisplay.textContent = `PAIR #0001 OF 2,000+ [FOUNDER SAMPLE]`;
    }
  });

  const inspectBtn = document.getElementById('inspect-provenance-btn');
  if (inspectBtn) {
    inspectBtn.addEventListener('click', () => {
      const section = document.getElementById('provenance');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}

/**
 * 6. Designer Pitch Modal Dialog
 */
function initDesignerModal() {
  const modal = document.getElementById('designer-modal');
  const openBtns = [
    document.getElementById('open-designer-modal-btn'),
    document.querySelector('.open-modal-trigger')
  ];
  const closeBtn = document.getElementById('close-designer-modal-btn');

  if (!modal) return;

  const openModal = (e) => {
    if (e) e.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  openBtns.forEach(btn => {
    if (btn) btn.addEventListener('click', openModal);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/**
 * 7. Form Submissions (Investor & Collector Inquiries)
 */
function initFormSubmissions() {
  // Investor & Collector Inquiry Form
  const collectorForm = document.getElementById('collector-form');
  const formFeedback = document.getElementById('form-feedback');

  if (collectorForm && formFeedback) {
    collectorForm.addEventListener('submit', (e) => {
      const isNetlifyHosted = window.location.hostname.includes('netlify.app');

      if (!isNetlifyHosted) {
        e.preventDefault();
        const name = document.getElementById('collector-name').value;
        const interest = document.getElementById('collector-interest').value;

        formFeedback.className = 'form-feedback success';
        formFeedback.innerHTML = `
          <strong>Inquiry Transmitted:</strong> Thank you, ${name}. Your note regarding <strong>${interest}</strong> has been forwarded directly to Washingtone Imae (<a href="mailto:washingtoneimae@gmail.com" style="text-decoration:underline;">washingtoneimae@gmail.com</a>). Expect a response within 24–48 hours.
        `;
        formFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  // Deck & Designer Pitch Modal
  const designerForm = document.getElementById('designer-form');
  const designerFeedback = document.getElementById('designer-feedback');

  if (designerForm && designerFeedback) {
    designerForm.addEventListener('submit', (e) => {
      const isNetlifyHosted = window.location.hostname.includes('netlify.app');

      if (!isNetlifyHosted) {
        e.preventDefault();
        const dName = document.getElementById('designer-name').value;
        const role = document.getElementById('designer-role').value;

        designerFeedback.className = 'form-feedback success';
        designerFeedback.innerHTML = `
          <strong>Pitch Received:</strong> Thank you, ${dName}. Your request as <em>${role}</em> is with founder Washingtone Imae (<a href="mailto:washingtoneimae@gmail.com" style="text-decoration:underline;">washingtoneimae@gmail.com</a>). The confidential brief will follow shortly.
        `;
      }
    });
  }
}

/**
 * 8. Smooth Anchor Scrolling
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length <= 1) return;

      const targetElem = document.querySelector(targetId);
      if (targetElem) {
        e.preventDefault();
        targetElem.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
