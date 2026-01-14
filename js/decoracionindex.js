// js/tech-decoration.js
// Efectos tecnológicos / cyber sutiles para portafolio

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Cursor personalizado (opcional – muy cyber)
    const cursor = document.createElement('div');
    cursor.classList.add('tech-cursor');
    document.body.appendChild(cursor);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    const speed = 0.14;

    const animateCursor = () => {
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;
        cursor.style.transform = `translate(${cursorX - 10}px, ${cursorY - 10}px)`;
        requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    animateCursor();


    // ── 2. Partículas de fondo muy sutiles (estilo código / datos flotando)
    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('tech-particle');

        // Posición y tamaño aleatorios
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';

        // Duración y retraso aleatorios
        const duration = Math.random() * 15 + 10;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = Math.random() * 5 + 's';

        document.body.appendChild(particle);

        // Eliminar después de la animación
        setTimeout(() => {
            particle.remove();
        }, duration * 1000 + 1000);
    }

    // Crear partículas cada cierto tiempo
    setInterval(createParticle, 800);

    // Crear unas cuantas al cargar
    for (let i = 0; i < 12; i++) {
        setTimeout(createParticle, i * 300);
    }


    // ── 3. Efecto glitch muy suave en los títulos al pasar el ratón
    const titles = document.querySelectorAll('h1, h2');

    titles.forEach(title => {
        title.addEventListener('mouseenter', () => {
            title.classList.add('glitch-hover');
        });
        title.addEventListener('mouseleave', () => {
            title.classList.remove('glitch-hover');
        });
    });


    // ── 4. Líneas de escaneo / horizon muy sutil (estilo matrix / sci-fi)
    const scanline = document.createElement('div');
    scanline.classList.add('scanline');
    document.body.appendChild(scanline);
});