(function() {
    // --- Web Audio setup (self‑contained, no external files) ---
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

        // Main flip – filtered noise burst
        const noiseBuffer = ctx.createBuffer(1, 0.1 * ctx.sampleRate, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.15);

        // Soft thump for page seating
        const thump = ctx.createOscillator();
        thump.type = 'sine';
        thump.frequency.setValueAtTime(120, now + 0.12);
        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.08, now + 0.12);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        thump.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        thump.start(now + 0.12);
        thump.stop(now + 0.2);
    }

    // --- Responsive A4 sizing ---
    const book = $('#book');
    const container = book.parent();

    function resizeBook() {
        let containerWidth = container.width();
        let spreadWidth = Math.min(containerWidth * 0.95, 1200);
        let bookHeight = spreadWidth * 0.707; // A4 aspect ratio

        book.width(spreadWidth);
        book.height(bookHeight);

        if (book.data('turn')) {
            book.turn('size', spreadWidth, bookHeight);
        }
    }

    // --- Initialise turn.js after images are loaded ---
    $(window).on('load', function() {
        resizeBook();

        book.turn({
            width: book.width(),
            height: book.height(),
            autoCenter: true,
            elevation: 50,
            gradients: true,
            shadows: true,
            turnCorners: 'bl,br'
        });

        book.on('turning', function() { playFlipSound(); });
        book.on('start', function() { playFlipSound(); });
    });

    $(window).on('resize', function() {
        resizeBook();
    });

    // Fallback if images are cached
    $(document).ready(function() {
        setTimeout(function() {
            if (!book.data('turn')) {
                resizeBook();
                book.turn({
                    width: book.width(),
                    height: book.height(),
                    autoCenter: true,
                    elevation: 50,
                    gradients: true,
                    shadows: true,
                    turnCorners: 'bl,br'
                });
                book.on('turning', function() { playFlipSound(); });
                book.on('start', function() { playFlipSound(); });
            }
        }, 100);
    });
})();
