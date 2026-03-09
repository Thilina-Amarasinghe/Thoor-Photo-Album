(function() {
    // ---------- Audio: generate page‑turn sound (no external files) ----------
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
            ctx.resume();   // Safari / Chrome require user gesture to start audio
        }
        const now = ctx.currentTime;

        // Main flip – a short burst of filtered noise
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

        // Very soft thump as the page settles
        const thump = ctx.createOscillator();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(100, now + 0.12);
        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.06, now + 0.12);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        thump.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        thump.start(now + 0.12);
        thump.stop(now + 0.18);
    }

    // ---------- Responsive A4 sizing ----------
    const $book = $('#book');
    const $wrapper = $('.book-wrapper');

    function resizeBook() {
        let containerWidth = $('body').width();
        // Use 90% of viewport width, max 1200px
        let spreadWidth = Math.min(containerWidth * 0.9, 1200);
        // A4 aspect ratio: height of two pages side by side = page height
        // page height / (2 * page width) = 297 / 420 = 0.707
        let bookHeight = spreadWidth * 0.707;

        $book.width(spreadWidth);
        $book.height(bookHeight);
        $wrapper.width(spreadWidth);
        $wrapper.height(bookHeight);

        if ($book.data('turn')) {
            $book.turn('size', spreadWidth, bookHeight);
        }
    }

    // ---------- Initialize turn.js ----------
    $(window).on('load', function() {
        resizeBook();

        $book.turn({
            width: $book.width(),
            height: $book.height(),
            autoCenter: true,
            elevation: 55,
            gradients: true,
            shadows: true,
            turnCorners: 'bl,br',      // only bottom corners can be grabbed
            duration: 600               // page turn speed (ms)
        });

        // Play sound on every page turn
        $book.on('turning', function() { playFlipSound(); });
        $book.on('start', function() { playFlipSound(); });
    });

    // Resize book when window changes
    $(window).on('resize', function() {
        resizeBook();
    });

    // Fallback in case images are already cached and 'load' doesn't fire
    $(document).ready(function() {
        setTimeout(function() {
            if (!$book.data('turn')) {
                resizeBook();
                $book.turn({
                    width: $book.width(),
                    height: $book.height(),
                    autoCenter: true,
                    elevation: 55,
                    gradients: true,
                    shadows: true,
                    turnCorners: 'bl,br',
                    duration: 600
                });
                $book.on('turning', function() { playFlipSound(); });
                $book.on('start', function() { playFlipSound(); });
            }
        }, 100);
    });
})();
