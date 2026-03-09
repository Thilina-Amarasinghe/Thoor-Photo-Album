// ========== Global variables ==========
let zoom = 1, currentX = 0, currentY = 0, isPanning = false, startX, startY;
const wrapper = document.getElementById('flipbook-wrapper');
const zoomLevelDisplay = document.getElementById('zoom-level');

// ========== Helper: update transform with boundaries ==========
function updateTransform() {
  wrapper.style.transform = `scale(${zoom}) translate(${currentX}px, ${currentY}px)`;
  zoomLevelDisplay.textContent = Math.round(zoom * 100) + '%';
}

// ========== Pan boundaries ==========
function applyBoundaries() {
  const wrapperRect = wrapper.getBoundingClientRect();
  const scaledWidth = 1130 * zoom;
  const scaledHeight = 800 * zoom;
  
  const maxX = Math.max(0, (scaledWidth - wrapperRect.width) / 2);
  const maxY = Math.max(0, (scaledHeight - wrapperRect.height) / 2);
  
  currentX = Math.min(maxX, Math.max(-maxX, currentX));
  currentY = Math.min(maxY, Math.max(-maxY, currentY));
}

// ========== Zoom with mouse position ==========
function zoomAtPointer(zoomDelta, mouseX, mouseY) {
  const oldZoom = zoom;
  const newZoom = Math.min(Math.max(zoom + zoomDelta, 0.5), 3);
  if (newZoom === oldZoom) return;

  const rect = wrapper.getBoundingClientRect();
  
  const mouseRelX = (mouseX - rect.left) / rect.width;
  const mouseRelY = (mouseY - rect.top) / rect.height;
  
  const width = 1130;
  const height = 800;
  
  const pointX = (mouseRelX * rect.width - currentX) / oldZoom;
  const pointY = (mouseRelY * rect.height - currentY) / oldZoom;
  
  zoom = newZoom;
  
  currentX = mouseRelX * rect.width - pointX * zoom;
  currentY = mouseRelY * rect.height - pointY * zoom;
  
  applyBoundaries();
  updateTransform();
}

// ========== Flipbook initialization ==========
function initFlipbook() {
  if ($('#flipbook').data('turn')) {
    $('#flipbook').turn('destroy');
  }

  $('#flipbook').turn({
    width: $('#flipbook').width(),
    height: $('#flipbook').height(),
    autoCenter: true,
    display: 'double',
    gradients: true,
    acceleration: true,
    elevation: 50,
    duration: 1000,
    when: {
      turning: function() {
        document.getElementById('flipSound').play().catch(e => console.log('Audio play failed:', e));
      },
      turned: function() {
        $('#flipbook .page').each(function(index) {
          $(this).toggleClass('left-page', index % 2 === 0);
        });
      }
    }
  });

  setTimeout(function() {
    $('#flipbook .page').each(function(index) {
      $(this).toggleClass('left-page', index % 2 === 0);
    });
  }, 100);
}

// ========== Corner clicks ==========
function bindCornerClicks() {
  $('#flipbook').off('click.corner', '.page');
  $('#flipbook').on('click.corner', '.page', function(e) {
    const $page = $(this);
    const pageWidth = $page.width();
    const clickX = e.pageX - $page.offset().left;
    const threshold = 60;

    const isLeftPage = $page.hasClass('left-page');
    
    if (clickX > pageWidth - threshold) {
      if (!isLeftPage) {
        e.stopPropagation();
        $('#flipbook').turn('next');
      }
    }
    else if (clickX < threshold) {
      if (isLeftPage) {
        e.stopPropagation();
        $('#flipbook').turn('previous');
      }
    }
  });
}

// ========== Hover effect ==========
function bindHoverEffect() {
  $('#flipbook').off('mouseenter.corner mouseleave.corner', '.page');
  $('#flipbook').on('mouseenter.corner', '.page', function() {
    $(this).addClass('corner-hover');
  }).on('mouseleave.corner', '.page', function() {
    $(this).removeClass('corner-hover');
  });
}

// ========== Resize handling ==========
let resizeTimer;
$(window).resize(function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    if ($('#flipbook').data('turn')) {
      const currentPage = $('#flipbook').turn('page');
      initFlipbook();
      $('#flipbook').turn('page', currentPage);
      setTimeout(function() {
        $('#flipbook .page').each(function(index) {
          $(this).toggleClass('left-page', index % 2 === 0);
        });
      }, 100);
    } else {
      initFlipbook();
    }
  }, 250);
});

// ========== Zoom and pan ==========
function initZoomPan() {
  document.getElementById('zoomIn').addEventListener('click', function() {
    zoom = Math.min(zoom + 0.2, 3);
    applyBoundaries();
    updateTransform();
  });
  
  document.getElementById('zoomOut').addEventListener('click', function() {
    zoom = Math.max(zoom - 0.2, 0.5);
    applyBoundaries();
    updateTransform();
  });
  
  document.getElementById('resetZoom').addEventListener('click', function() {
    zoom = 1;
    currentX = 0;
    currentY = 0;
    updateTransform();
  });

  wrapper.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomAtPointer(delta, e.clientX, e.clientY);
    }
  }, { passive: false });

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
      applyBoundaries();
      updateTransform();
    }
  });

  document.addEventListener('mouseup', function() {
    isPanning = false;
    wrapper.style.cursor = 'grab';
  });
}

// ========== Navigation buttons ==========
$('#prevBtn').click(function() {
  $('#flipbook').turn('previous');
});
$('#nextBtn').click(function() {
  $('#flipbook').turn('next');
});

// ========== Document ready ==========
$(document).ready(function() {
  initFlipbook();
  bindCornerClicks();
  bindHoverEffect();
  initZoomPan();

  setTimeout(function() {
    $('#flipbook .page').each(function(index) {
      $(this).toggleClass('left-page', index % 2 === 0);
    });
  }, 100);
});
