(function() {
  // ==================================================
  // ඔයාගේ පින්තූරවල නම් මෙහි දමන්න (cover.jpg සිට back.jpg දක්වා)
  // පිටු ගණන ඉරට්ටේ විය යුතුයි. උදාහරණයක් ලෙස:
  // ==================================================
  const images = [
    "cover.jpg",      // front cover (දකුණු පැත්තේ පෙන්වනු ඇත)
    "page1.jpg",
    "page2.jpg",
    "page3.jpg",
    "page4.jpg",
    "page5.jpg",
    "page6.jpg",
    "back.jpg"        // back cover (වම් පැත්තේ අවසානයේ)
  ];
  // ==================================================

  // ---------- Audio: Page flip sound (Web Audio, no external file) ----------
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

    // Paper rustle sound
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

  // ---------- Dynamically generate pages from images array ----------
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

  // ---------- Initialize turn.js ----------
  const $flipbook = $('#flipbook');

  function initFlipbook() {
    // Destroy previous instance if exists
    if ($flipbook.data('turn')) {
      $flipbook.turn('destroy');
    }

    // Get current dimensions (set by CSS)
    const width = $flipbook.width();
    const height = $flipbook.height();

    $flipbook.turn({
      width: width,
      height: height,
      autoCenter: true,          // පොත මැදට ගෙන එයි
      display: 'double',          // පිටු දෙකක් එක පැත්තකින් පෙන්වයි
      gradients: true,            // පිටු අතර සෙවනැල්ල
      shadows: true,              // පිටු යට සෙවනැල්ල
      elevation: 50,              // පිටු හැරෙන විට උස
      duration: 600,              // පෙරලීමේ වේගය (ms)
      when: {
        // පිටුව හැරෙන සෑම විටම ශබ්දය
        turning: function(event, page, view) {
          playFlipSound();
        },
        // අදින්න පටන් ගන්නා විට ශබ්දය
        start: function(event, pageObject, corner) {
          playFlipSound();
        }
      }
    });

    // Force first view to show cover on right side
    // (turn.js automatically shows first two pages, but cover should be on right)
    // Go to page 1 to ensure cover is on right
    $flipbook.turn('page', 1);
  }

  // ---------- Resize handler (responsive) ----------
  function resizeFlipbook() {
    if ($flipbook.data('turn')) {
      $flipbook.turn('destroy');
    }
    initFlipbook();
  }

  // ---------- Zoom & Pan (using CSS transform) ----------
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

  // Pan (mouse drag)
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

  // ---------- Start everything after images load ----------
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
