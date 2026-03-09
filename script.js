(function() {
  // ==================================================
  // 1. EDIT THIS ARRAY: ඔයාගේ පින්තූරවල නම් මෙහි දමන්න
  //    පිළිවෙල: cover, page1, page2, ..., backCover
  //    සම්පූර්ණ පිටු ගණන ඉරට්ටේ විය යුතුයි.
  // ==================================================
  const images = [
    "cover.jpg",      // front cover
    "page1.jpg",
    "page2.jpg",
    "page3.jpg",
    "page4.jpg",
    "page5.jpg",
    "page6.jpg",
    "back.jpg"        // back cover
  ];
  // ==================================================

  // ---------- Audio: Page flip sound (Web Audio) ----------
  let audioContext = null;
  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
  }

  function playFlipSound() {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Paper rustle
    const noiseBuffer = ctx.createBuffer(1, 0.12 * ctx.sampleRate, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 750;
    filter.Q.value = 2;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.13, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  // ---------- Dynamically generate pages ----------
  function generatePages() {
    const $flipbook = $('#flipbook');
    $flipbook.empty(); // Clear existing

    images.forEach(function(imgSrc) {
      const $page = $('<div class="page"></div>');
      const $img = $('<img>').attr('src', 'images/' + imgSrc).attr('alt', 'page');
      $page.append($img);
      $flipbook.append($page);
    });
  }

  // ---------- Initialize flipbook ----------
  const $flipbook = $('#flipbook');
  let currentWidth, currentHeight;

  function initFlipbook() {
    if ($flipbook.data('turn')) {
      $flipbook.turn('destroy');
    }

    // Use current dimensions
    currentWidth = $flipbook.width();
    currentHeight = $flipbook.height();

    $flipbook.turn({
      width: currentWidth,
      height: currentHeight,
      autoCenter: true,
      display: 'double',
      gradients: true,
      shadows: true,
      elevation: 50,
      duration: 600,
      when: {
        turning: function() { playFlipSound(); },
        start: function() { playFlipSound(); }
      }
    });
  }

  // ---------- Resize handler (responsive) ----------
  function resizeFlipbook() {
    if ($flipbook.data('turn')) {
      $flipbook.turn('destroy');
    }
    initFlipbook();
  }

  // ---------- Zoom & Pan ----------
  let zoom = 1, currentX = 0, currentY = 0, isPanning = false, startX, startY;
  const wrapper = document.getElementById('flipbook-wrapper');

  function updateTransform() {
    wrapper.style.transform = `scale(${zoom}) translate(${currentX}px, ${currentY}px)`;
  }

  // Zoom controls
  $('#zoomIn').click(function() {
    zoom = Math.min(zoom + 0.2, 3);
    updateTransform();
  });
  $('#zoomOut').click(function() {
    zoom = Math.max(zoom - 0.2, 0.5);
    updateTransform();
  });
  $('#resetZoom').click(function() {
    zoom = 1;
    currentX = 0;
    currentY = 0;
    updateTransform();
  });

  // Wheel zoom (Ctrl + scroll)
  wrapper.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.01;
      zoom += delta;
      zoom = Math.min(Math.max(0.5, zoom), 3);
      updateTransform();
    }
  }, { passive: false });

  // Pan
  wrapper.addEventListener('mousedown', function(e) {
    if (zoom > 1) {
      isPanning = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      wrapper.style.cursor = 'grabbing';
    }
  });

  document.addEventListener('mousemove', function(e) {
    if (isPanning) {
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;
      updateTransform();
    }
  });

  document.addEventListener('mouseup', function() {
    isPanning = false;
    wrapper.style.cursor = 'grab';
  });

  wrapper.addEventListener('dragstart', (e) => e.preventDefault());

  // ---------- Navigation buttons ----------
  $('#prevPage').click(function() {
    $flipbook.turn('previous');
  });
  $('#nextPage').click(function() {
    $flipbook.turn('next');
  });

  // ---------- Hover effect (corner curl) ----------
  $(document).on('mouseenter', '#flipbook .page', function() {
    $(this).addClass('corner-hover');
  }).on('mouseleave', '#flipbook .page', function() {
    $(this).removeClass('corner-hover');
  });

  // ---------- Start everything ----------
  $(window).on('load', function() {
    generatePages();      // Create pages from array
    initFlipbook();
  });

  // Fallback if images cached
  $(document).ready(function() {
    setTimeout(function() {
      if (!$flipbook.data('turn')) {
        generatePages();
        initFlipbook();
      }
    }, 200);
  });

  // Resize event
  $(window).on('resize', function() {
    resizeFlipbook();
  });
})();
