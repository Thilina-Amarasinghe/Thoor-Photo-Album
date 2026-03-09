(function() {
    // ---------- Audio: generate page-turn sound ----------
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

        // Main flip sound (filtered noise)
        const noiseBuffer = ctx.createBuffer(1, 0.13 * ctx.sampleRate, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 700;
        filter.Q.value = 2.2;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.14, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.16);

        // Soft thump when page settles
        const thump = ctx.createOscillator();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(90, now + 0.13);
        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.05, now + 0.13);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
        thump.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        thump.start(now + 0.13);
        thump.stop(now + 0.19);
    }

    // ---------- Responsive A4 sizing ----------
    const $book = $('#book');
    const $wrapper = $('.book-wrapper');

    function resizeBook() {
        let containerWidth = $('.shelf').width();
        let spreadWidth = Math.min(containerWidth * 0.9, 1200);
        let bookHeight = spreadWidth * 0.707; // A4 aspect ratio (297/420)

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
            elevation: 60,
            gradients: true,
            shadows: true,
            turnCorners: 'bl,br',
            duration: 700
        });

        // Play sound on every page turn
        $book.on('turning', function() { playFlipSound(); });
        $book.on('start', function() { playFlipSound(); });
    });

    // Resize with window
    $(window).on('resize', function() {
        resizeBook();
    });

    // Fallback if images are cached
    $(document).ready(function() {
        setTimeout(function() {
            if (!$book.data('turn')) {
                resizeBook();
                $book.turn({
                    width: $book.width(),
                    height: $book.height(),
                    autoCenter: true,
                    elevation: 60,
                    gradients: true,
                    shadows: true,
                    turnCorners: 'bl,br',
                    duration: 700
                });
                $book.on('turning', function() { playFlipSound(); });
                $book.on('start', function() { playFlipSound(); });
            }
        }, 100);
    });
})();
