(function() {
    // ---------- ශබ්දය (page flip sound) ----------
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

        // පිටු හැරෙන ශබ්දය
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

    // ---------- පොතේ ප්‍රමාණය හදන්න ----------
    const $book = $('#book');

    function resizeBook() {
        let containerWidth = $('.book-container').width();
        let spreadWidth = Math.min(containerWidth * 0.9, 1200);
        let bookHeight = spreadWidth * 0.707; // A4 aspect ratio

        $book.width(spreadWidth);
        $book.height(bookHeight);

        if ($book.data('turn')) {
            $book.turn('size', spreadWidth, bookHeight);
        }
    }

    // ---------- turn.js පටන් ගන්න ----------
    $(window).on('load', function() {
        resizeBook();

        $book.turn({
            width: $book.width(),
            height: $book.height(),
            autoCenter: true,           // පොත මැදට ගන්න
            elevation: 50,               // පිටුව උඩට එන උස
            gradients: true,             // පිටු අතර සෙවනැල්ල
            shadows: true,               // පිටු යට සෙවනැල්ල
            turnCorners: 'bl,br',        // **මෙතනයි වැදගත්ම දේ** පහළ කොන් දෙකෙන් විතරක් අල්ලන්න පුළුවන්
            duration: 600                 // පිටු හැරෙන වේගය
        });

        // පිටුව හැරෙනකොට සහ අදින්න පටන් ගන්නකොට ශබ්දය
        $book.on('turning', function() { playFlipSound(); });
        $book.on('start', function() { playFlipSound(); });
    });

    $(window).on('resize', function() {
        resizeBook();
    });

    // fallback
    $(document).ready(function() {
        setTimeout(function() {
            if (!$book.data('turn')) {
                resizeBook();
                $book.turn({
                    width: $book.width(),
                    height: $book.height(),
                    autoCenter: true,
                    elevation: 50,
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
