// Vibración táctil breve (solo Android/Chrome la soportan; en iOS no hace nada, sin error)
function vibrar(patron = 15) {
    if (navigator.vibrate) {
        try { navigator.vibrate(patron); } catch (e) {}
    }
}

// Fundido suave de volumen (antes era un salto brusco de golpe)
let duckVolumenId = null;
function duckVolumen(destino, duracionMs = 400) {
    cancelAnimationFrame(duckVolumenId);
    const inicio = musicaFondo.volume;
    const inicioTiempo = performance.now();
    function paso(ahora) {
        const t = Math.min(1, (ahora - inicioTiempo) / duracionMs);
        musicaFondo.volume = inicio + (destino - inicio) * t;
        if (t < 1) duckVolumenId = requestAnimationFrame(paso);
    }
    duckVolumenId = requestAnimationFrame(paso);
}

// --- SISTEMA DE DESBLOQUEO PERMANENTE ---
window.onload = () => {
    // Ocultamos el splash de carga apenas todo está listo
    const splash = document.getElementById('pantalla-splash');
    if (splash) setTimeout(() => splash.classList.add('splash-oculto'), 350);

    // Si ya llenó el cuestionario antes, saltamos el login directo a la bienvenida
    if (localStorage.getItem('regaloZabdiDesbloqueado') === 'true') {
        document.getElementById('pantalla-login').classList.add('oculto');
        document.getElementById('pantalla-login').classList.remove('pantalla-activa');

        const bienvenida = document.getElementById('pantalla-bienvenida');
        bienvenida.classList.remove('oculto');
        bienvenida.classList.add('pantalla-activa');
        bienvenida.style.opacity = '1';
    }
};

// Al enviar el formulario final: guardamos el candado abierto, mandamos las
// respuestas por AJAX (sin recargar) y mostramos una pantalla de agradecimiento
// propia con confeti, en vez de dejarla en la página genérica de Formspree.
// (protegido: si por algo el formulario no existe, esto solo avisa en
// consola en vez de detener TODO el script, incluido el login)
const formularioFinal = document.querySelector('.formulario-final');
if (formularioFinal) {
    formularioFinal.addEventListener('submit', async (e) => {
        e.preventDefault();
        localStorage.setItem('regaloZabdiDesbloqueado', 'true');

        const btnEnviar = document.getElementById('btn-enviar-final');
        if (btnEnviar) {
            btnEnviar.disabled = true;
            btnEnviar.innerText = 'Enviando... 💌';
        }

        const datosFormulario = new FormData(formularioFinal);
        const resumenTexto = construirResumenRespuestas(datosFormulario);

        // Respaldo local (queda guardado en este navegador aunque falle el envío)
        try {
            localStorage.setItem('respuestasRegaloZabdi', JSON.stringify({
                fecha: new Date().toISOString(),
                resumen: resumenTexto,
            }));
        } catch (err) { /* si el navegador bloquea localStorage, seguimos sin respaldo */ }

        let envioExitoso = false;
        try {
            const respuesta = await fetch(formularioFinal.action, {
                method: 'POST',
                body: datosFormulario,
                headers: { 'Accept': 'application/json' },
            });
            envioExitoso = respuesta.ok;
        } catch (err) {
            console.log('No se pudo confirmar el envío por internet.', err);
            envioExitoso = false;
        }

        mostrarPantallaAgradecimiento(envioExitoso, resumenTexto);
    });
} else {
    console.error('No se encontró el formulario final (.formulario-final).');
}

// --- ELEMENTOS DEL DOM ---
const inputFecha = document.getElementById('fecha-pass');
const pantallaLogin = document.getElementById('pantalla-login');
const pantallaBienvenida = document.getElementById('pantalla-bienvenida');
const btnComenzar = document.getElementById('btn-comenzar');
const pantallaGaleria = document.getElementById('pantalla-galeria');
const mediaContainer = document.getElementById('media-container');
const textoNarrativo = document.getElementById('texto-narrativo');
const btnAnterior = document.getElementById('btn-anterior');
const btnSiguiente = document.getElementById('btn-siguiente');
const pantallaCuestionario = document.getElementById('pantalla-cuestionario');
const pantallaGracias = document.getElementById('pantalla-gracias');
const musicaFondo = document.getElementById('musica-fondo');
const btnRocola = document.getElementById('btn-rocola');
const modalPoema = document.getElementById('modal-poema');

let indiceEscena = 0;
let indiceCarrusel = 0;
let vozActual = null;
let vozPoemaActual = null; // Variable para controlar el audio del poema (Karaoke)
let rocolaEncendida = false;

// --- CONTENIDO (viene de contenido.js) ---
// Si olvidaste incluir contenido.js en el HTML, avisamos claro en consola
// en vez de que la página truene en silencio.
if (!window.CONTENIDO) {
    console.error('No se encontró contenido.js. Revisa que index.html lo cargue ANTES de script.js.');
}
const playlistConfig = (window.CONTENIDO && window.CONTENIDO.PLAYLIST) || [];
const historia = (window.CONTENIDO && window.CONTENIDO.HISTORIA) || [];

// --- LÓGICA DE PLAYLIST (ROCOLA) ---
const playlist = playlistConfig.map(c => c.archivo);
const nombresCanciones = playlistConfig.map(c => c.nombre);
let indiceCancionActual = 0;
if (playlist.length > 0) {
    musicaFondo.src = playlist[indiceCancionActual];
}

function mostrarNotificacionCancion(indice) {
    if (!nombresCanciones[indice]) return;
    const toast = document.getElementById('notificacion-cancion');
    document.getElementById('nombre-cancion').innerText = nombresCanciones[indice];
    toast.classList.remove('toast-oculto');
    setTimeout(() => { toast.classList.add('toast-oculto'); }, 4000);
}

musicaFondo.addEventListener('ended', () => {
    if (playlist.length === 0) return;
    indiceCancionActual++;
    if (indiceCancionActual >= playlist.length) indiceCancionActual = 0;
    musicaFondo.src = playlist[indiceCancionActual];
    musicaFondo.play();
    mostrarNotificacionCancion(indiceCancionActual);
});

// Si una canción de la playlist no existe todavía, pasamos a la siguiente
// en vez de dejar la rocola muda y sin avisar.
musicaFondo.addEventListener('error', () => {
    if (playlist.length <= 1 || !rocolaEncendida) return;
    console.log(`No se encontró "${playlist[indiceCancionActual]}". Probando la siguiente canción...`);
    indiceCancionActual++;
    if (indiceCancionActual >= playlist.length) indiceCancionActual = 0;
    musicaFondo.src = playlist[indiceCancionActual];
    musicaFondo.play().catch(() => {});
});

// --- LÓGICA DE LOGIN ---
inputFecha.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 2) valor = valor.slice(0, 2) + '/' + valor.slice(2);
    if (valor.length > 5) valor = valor.slice(0, 5) + '/' + valor.slice(5);
    e.target.value = valor.slice(0, 10);

    const mensajeError = document.getElementById('mensaje-error-login');
    if (mensajeError) mensajeError.classList.add('oculto');

    const cantidadDigitos = e.target.value.replace(/\D/g, '').length;
    const esCorrecta = (e.target.value === '27/02/26' || e.target.value === '27/02/2026');

    // Si ya escribió una fecha completa (6 u 8 dígitos) y NO es la correcta,
    // damos feedback claro en vez de dejarla en silencio sin saber qué pasó.
    if (!esCorrecta && (cantidadDigitos === 6 || cantidadDigitos === 8)) {
        vibrar(80);
        if (mensajeError) mensajeError.classList.remove('oculto');
        const tarjeta = document.querySelector('.tarjeta-invitacion');
        if (tarjeta) {
            tarjeta.classList.remove('agitar');
            void tarjeta.offsetWidth; // fuerza a reiniciar la animación si se repite
            tarjeta.classList.add('agitar');
        }
    }

    if (esCorrecta) {
        vibrar([15, 40, 15]);
        setTimeout(() => {
            pantallaLogin.style.opacity = '0';
            setTimeout(() => {
                pantallaLogin.classList.add('oculto');
                pantallaLogin.classList.remove('pantalla-activa');
                pantallaBienvenida.classList.remove('oculto');
                pantallaBienvenida.classList.add('pantalla-activa');
                setTimeout(() => { pantallaBienvenida.style.opacity = '1'; }, 50);
            }, 1000);
        }, 500);
    }
});

btnComenzar.addEventListener('click', () => {
    vibrar(15);
    pantallaBienvenida.style.opacity = '0';
    btnRocola.classList.remove('oculto');

    // El volumen general sube a 0.8 para que se escuchen bien las canciones
    musicaFondo.volume = 0.8;
    let promesaAudio = musicaFondo.play();
    if (promesaAudio !== undefined) {
        promesaAudio.then(() => {
            rocolaEncendida = true;
            btnRocola.classList.add('activa');
            mostrarNotificacionCancion(indiceCancionActual);
        }).catch(e => {
            rocolaEncendida = false;
            btnRocola.classList.remove('activa');
        });
    }

    // AQUI INICIA TU AUDIO DE BIENVENIDA (OPCIONAL)
    // let vozBienvenida = new Audio("audio_bienvenida.mp3");
    // vozBienvenida.play();

    setTimeout(() => {
        pantallaBienvenida.classList.add('oculto');
        pantallaBienvenida.classList.remove('pantalla-activa');
        pantallaGaleria.classList.remove('oculto');
        pantallaGaleria.classList.add('pantalla-activa');
        setTimeout(() => {
            pantallaGaleria.style.opacity = '1';
            crearBarraProgreso();
            renderizarEscena();
        }, 50);
    }, 800);
});

btnRocola.addEventListener('click', () => {
    if (rocolaEncendida) {
        musicaFondo.pause();
        btnRocola.classList.remove('activa');
        rocolaEncendida = false;
    } else {
        rocolaEncendida = true;
        btnRocola.classList.add('activa');
        musicaFondo.volume = 0.8;
        let promesaAudio = musicaFondo.play();
        if (promesaAudio !== undefined) promesaAudio.catch(e => {});
    }
});

// --- BARRA DE PROGRESO (estilo "historias") ---
function crearBarraProgreso() {
    if (document.getElementById('barra-progreso') || historia.length === 0) return;
    const barra = document.createElement('div');
    barra.id = 'barra-progreso';
    historia.forEach(() => {
        const segmento = document.createElement('div');
        segmento.className = 'segmento-progreso';
        segmento.innerHTML = '<div class="segmento-relleno"></div>';
        barra.appendChild(segmento);
    });
    const contenedor = document.querySelector('.galeria-contenedor');
    contenedor.insertBefore(barra, contenedor.firstChild);
}

function actualizarBarraProgreso() {
    const segmentos = document.querySelectorAll('#barra-progreso .segmento-progreso');
    segmentos.forEach((seg, i) => {
        seg.classList.toggle('completo', i < indiceEscena);
        seg.classList.toggle('actual', i === indiceEscena);
    });
}

// --- NAVEGACIÓN CON TECLADO (comodidad al probar en computadora) ---
document.addEventListener('keydown', (e) => {
    if (!pantallaGaleria.classList.contains('pantalla-activa')) return;
    if (e.key === 'ArrowRight') btnSiguiente.click();
    if (e.key === 'ArrowLeft' && indiceEscena > 0) btnAnterior.click();
});

// --- MOTOR DE RENDERIZADO ---

// Crea el <img> o <video> con un aviso claro en pantalla si el archivo
// todavía no existe, en vez de mostrar un ícono roto sin explicación.
function crearElementoMedia(tipo, archivo, alt) {
    if (!archivo) return crearAvisoArchivoFaltante(archivo || '(sin nombre)');
    const el = document.createElement(tipo === 'video' ? 'video' : 'img');
    el.src = archivo;
    if (alt) el.alt = alt;
    if (tipo === 'video') {
        el.controls = true;
        el.autoplay = true;
        el.loop = true;
    }
    el.onerror = () => {
        el.replaceWith(crearAvisoArchivoFaltante(archivo));
    };
    return el;
}

function crearAvisoArchivoFaltante(archivo) {
    const aviso = document.createElement('div');
    aviso.className = 'aviso-archivo-faltante';
    aviso.innerText = `📁 Falta subir: ${archivo}`;
    return aviso;
}

// Precarga en segundo plano la imagen/video de la siguiente escena para
// que al darle "Siguiente" no haya parpadeo ni espera de carga.
const cachePrecarga = new Set();
function precargarArchivo(archivo) {
    if (!archivo || cachePrecarga.has(archivo)) return;
    cachePrecarga.add(archivo);
    if (/\.(mp4|webm|mov)$/i.test(archivo)) {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.src = archivo;
    } else {
        const img = new Image();
        img.src = archivo;
    }
}

function precargarSiguienteEscena() {
    const siguiente = historia[indiceEscena + 1];
    if (!siguiente) return;
    if (siguiente.tipo === 'carrusel') {
        siguiente.diapositivas.forEach(d => precargarArchivo(d.archivo));
    } else if (siguiente.archivo) {
        precargarArchivo(siguiente.archivo);
    }
}

function renderizarEscena() {
    const escena = historia[indiceEscena];

    // Fundido de salida antes de cambiar el contenido (transición más pulida)
    mediaContainer.style.opacity = '0';

    setTimeout(() => {
        mediaContainer.innerHTML = "";
        indiceCarrusel = 0;

        if (escena.tipo === "unica") {
            mediaContainer.appendChild(crearElementoMedia('img', escena.archivo, 'Foto única'));
            textoNarrativo.innerText = escena.texto;
            mostrarPistaCorazonUnaVez();
        } else if (escena.tipo === "carrusel") {
            renderizarDiapositivaCarrusel();
        } else if (escena.tipo === "video") {
            mediaContainer.appendChild(crearElementoMedia('video', escena.archivo));
            textoNarrativo.innerText = escena.texto;
        }

        renderizarSobreEscena(escena);
        mediaContainer.style.opacity = '1';
    }, 120);

    btnAnterior.classList.toggle('oculto', indiceEscena === 0);
    btnSiguiente.innerText = (indiceEscena === historia.length - 1) ? "Finalizar" : "Siguiente";

    actualizarBarraProgreso();
    precargarSiguienteEscena();

    if (vozActual) vozActual.pause();

    // Lógica para bajar la música cuando hablas
    if (escena.audio && escena.audio !== "") {
        vozActual = new Audio(escena.audio);
        if (rocolaEncendida) duckVolumen(0.05); // Baja el volumen a 5%

        vozActual.play().catch(e => {
            console.log(`Aún no has subido "${escena.audio}". Restaurando volumen de fondo.`);
            if (rocolaEncendida) duckVolumen(0.8); // Si el archivo no existe, devuelve el volumen a la normalidad
        });

        vozActual.onended = () => {
            if (rocolaEncendida) duckVolumen(0.8); // Vuelve a subir al terminar de hablar
        };
    } else {
        if (rocolaEncendida) duckVolumen(0.8);
    }

}

function renderizarSobreEscena(escena) {
    const viejosSobres = document.querySelectorAll('.sobre-misterioso');
    viejosSobres.forEach(s => s.remove());

    if (escena.sobre) {
        const sobre = document.createElement('div');
        sobre.className = 'sobre-misterioso';
        sobre.style.top = escena.sobre.top || 'auto';
        sobre.style.left = escena.sobre.left || 'auto';
        sobre.style.bottom = escena.sobre.bottom || 'auto';
        sobre.style.right = escena.sobre.right || 'auto';
        const color = escena.sobre.colorTema || "#ffd700";

        sobre.innerHTML = `<svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/></svg>`;

        sobre.onclick = () => {
            vibrar(20);
            sobre.classList.add('abierto');
            // Detenemos la voz narrativa si aún estaba hablando
            if (vozActual) vozActual.pause();

            document.getElementById('titulo-poema').innerText = escena.sobre.titulo;
            const contenedorTextos = document.getElementById('texto-poema');
            contenedorTextos.innerHTML = ''; // Limpiamos

            // Lógica del Karaoke
            if (escena.sobre.karaoke) {
                // 1. Crear los párrafos de texto
                escena.sobre.karaoke.forEach((linea, index) => {
                    let p = document.createElement('p');
                    p.className = 'linea-poema';
                    p.id = 'karaoke-' + index;
                    p.innerText = linea.texto;
                    contenedorTextos.appendChild(p);
                });

                // 2. Reproducir tu voz recitando
                if (vozPoemaActual) vozPoemaActual.pause();
                vozPoemaActual = new Audio(escena.sobre.audioPoema);
                if (rocolaEncendida) duckVolumen(0.05);
                vozPoemaActual.play().catch(e => {
                    console.log(`Aún no has subido "${escena.sobre.audioPoema}".`);
                    if (rocolaEncendida) duckVolumen(0.8);
                });

                // 3. Sincronizar (Iluminar la línea según el segundo)
                vozPoemaActual.addEventListener('timeupdate', () => {
                    let tiempoActual = vozPoemaActual.currentTime;

                    escena.sobre.karaoke.forEach((linea, index) => {
                        let p = document.getElementById('karaoke-' + index);
                        let tiempoSiguiente = escena.sobre.karaoke[index + 1] ? escena.sobre.karaoke[index + 1].segundo : 9999;

                        if (tiempoActual >= linea.segundo && tiempoActual < tiempoSiguiente) {
                            p.classList.add('iluminada');
                        } else {
                            p.classList.remove('iluminada');
                        }
                    });
                });

                // Al terminar el poema, restaurar música
                vozPoemaActual.onended = () => {
                    if (rocolaEncendida) duckVolumen(0.8);
                }
            } else if (escena.sobre.poema) {
                // Fallback por si en otra escena solo quieres texto sin audio/karaoke
                contenedorTextos.innerText = escena.sobre.poema;
            }
            modalPoema.classList.remove('oculto');
        };
        mediaContainer.appendChild(sobre);
    }
}

let yaMostroPistaSwipe = false;
let yaMostroPistaCorazon = false;

function mostrarPistaCorazonUnaVez() {
    if (yaMostroPistaCorazon) return;
    yaMostroPistaCorazon = true;
    const pista = document.createElement('div');
    pista.className = 'pista-swipe';
    pista.innerText = '💖 Doble toque para dejar un corazón';
    mediaContainer.appendChild(pista);
}

function renderizarDiapositivaCarrusel() {
    const escena = historia[indiceEscena];
    const diapo = escena.diapositivas[indiceCarrusel];
    const sobresActuales = mediaContainer.querySelectorAll('.sobre-misterioso');
    mediaContainer.innerHTML = '';

    mediaContainer.appendChild(crearElementoMedia('img', diapo.archivo, 'Foto carrusel'));

    // Puntos indicadores (solo visuales, no son clicables: se navega con swipe)
    if (escena.diapositivas.length > 1) {
        const dots = document.createElement('div');
        dots.className = 'carrusel-dots';
        escena.diapositivas.forEach((_, i) => {
            const punto = document.createElement('span');
            punto.className = 'punto' + (i === indiceCarrusel ? ' activo' : '');
            dots.appendChild(punto);
        });
        mediaContainer.appendChild(dots);

        // La primera vez que ve un carrusel, mostramos una pista breve
        if (!yaMostroPistaSwipe) {
            yaMostroPistaSwipe = true;
            const pista = document.createElement('div');
            pista.className = 'pista-swipe';
            pista.innerText = '👉 Desliza para ver más';
            mediaContainer.appendChild(pista);
        }

        // Precargamos también la siguiente foto del carrusel, no solo la de la próxima escena
        const siguienteDiapo = escena.diapositivas[indiceCarrusel + 1];
        if (siguienteDiapo) precargarArchivo(siguienteDiapo.archivo);
    }

    sobresActuales.forEach(s => mediaContainer.appendChild(s));
    textoNarrativo.innerText = diapo.texto;
}

function cambiarCarrusel(direccion) {
    const escena = historia[indiceEscena];
    const nuevoIndice = indiceCarrusel + direccion;
    if (nuevoIndice >= 0 && nuevoIndice < escena.diapositivas.length) {
        indiceCarrusel = nuevoIndice;
        renderizarDiapositivaCarrusel();
    }
}

// --- GESTOS: deslizar para pasar de foto en el carrusel ---
// Funciona con dedo (celular) y con el mouse (para probar en la compu).
// La foto sigue al dedo mientras arrastras (con resistencia) y rebota si no
// alcanza a pasar de página, para que se sienta como una app nativa.
let swipeInicioX = null;
let swipeInicioY = null;
let swipeElementoActivo = null;

function soltarSwipeVisual() {
    if (swipeElementoActivo) {
        swipeElementoActivo.style.transition = 'transform 0.25s ease';
        swipeElementoActivo.style.transform = 'translateX(0)';
    }
    swipeElementoActivo = null;
}

mediaContainer.addEventListener('pointerdown', (e) => {
    if (historia[indiceEscena]?.tipo !== 'carrusel') return;
    swipeInicioX = e.clientX;
    swipeInicioY = e.clientY;
    swipeElementoActivo = mediaContainer.querySelector('img');
    if (swipeElementoActivo) swipeElementoActivo.style.transition = 'none';
});

mediaContainer.addEventListener('pointermove', (e) => {
    if (swipeInicioX === null || !swipeElementoActivo) return;
    const deltaX = e.clientX - swipeInicioX;
    swipeElementoActivo.style.transform = `translateX(${deltaX * 0.55}px)`; // resistencia
});

mediaContainer.addEventListener('pointerup', (e) => {
    if (swipeInicioX === null || historia[indiceEscena]?.tipo !== 'carrusel') {
        soltarSwipeVisual();
        return;
    }
    const deltaX = e.clientX - swipeInicioX;
    const deltaY = e.clientY - swipeInicioY;
    swipeInicioX = null;
    swipeInicioY = null;

    const UMBRAL = 40; // píxeles mínimos para contar como swipe
    if (Math.abs(deltaX) > UMBRAL && Math.abs(deltaX) > Math.abs(deltaY)) {
        vibrar(12);
        if (deltaX < 0) cambiarCarrusel(1);  // deslizó a la izquierda -> siguiente foto
        else cambiarCarrusel(-1);            // deslizó a la derecha -> foto anterior
    } else {
        soltarSwipeVisual(); // no llegó al umbral: la foto rebota a su lugar
    }
});

mediaContainer.addEventListener('pointercancel', () => {
    swipeInicioX = null;
    swipeInicioY = null;
    soltarSwipeVisual();
});

btnSiguiente.addEventListener('click', () => {
    if (indiceEscena < historia.length - 1) {
        indiceEscena++;
        renderizarEscena();
    } else {
        if (vozActual) vozActual.pause();

        // Aquí disparas el último audio (El del cuestionario) - ¡Descomenta la siguiente línea si tienes el audio!
        // let vozFinal = new Audio("audio6_cuestionario.mp3");
        // if(rocolaEncendida) musicaFondo.volume = 0.05;
        // vozFinal.play();
        // vozFinal.onended = () => { if(rocolaEncendida) musicaFondo.volume = 0.8; };

        pantallaGaleria.style.opacity = '0';
        setTimeout(() => {
            pantallaGaleria.classList.add('oculto');
            pantallaGaleria.classList.remove('pantalla-activa');
            pantallaCuestionario.classList.remove('oculto');
            pantallaCuestionario.classList.add('pantalla-activa');
            // Mantenemos la rocola visible por si quiere seguir escuchando música mientras escribe
        }, 500);
    }
});

btnAnterior.addEventListener('click', () => {
    if (indiceEscena > 0) {
        indiceEscena--;
        renderizarEscena();
    }
});

document.getElementById('btn-cerrar-poema').addEventListener('click', () => {
    if (vozPoemaActual) {
        vozPoemaActual.pause();
        if (rocolaEncendida) duckVolumen(0.8);
    }
    modalPoema.classList.add('oculto');
});

// --- CUESTIONARIO EN PASOS (una pregunta a la vez) ---
const pasosPregunta = document.querySelectorAll('.paso-pregunta');
const btnPasoAtras = document.getElementById('btn-paso-atras');
const btnPasoSiguiente = document.getElementById('btn-paso-siguiente');
const btnEnviarFinal = document.getElementById('btn-enviar-final');
let pasoActualCuestionario = 0;

function mostrarPasoCuestionario(indice) {
    pasosPregunta.forEach((paso, i) => paso.classList.toggle('paso-oculto', i !== indice));

    if (btnPasoAtras) btnPasoAtras.classList.toggle('oculto', indice === 0);
    const esUltimoPaso = indice === pasosPregunta.length - 1;
    if (btnPasoSiguiente) btnPasoSiguiente.classList.toggle('oculto', esUltimoPaso);
    if (btnEnviarFinal) btnEnviarFinal.classList.toggle('oculto', !esUltimoPaso);

    const numActual = document.getElementById('paso-actual-num');
    const numTotal = document.getElementById('paso-total-num');
    const relleno = document.getElementById('progreso-cuestionario-relleno');
    if (numActual) numActual.innerText = indice + 1;
    if (numTotal) numTotal.innerText = pasosPregunta.length;
    if (relleno) relleno.style.width = `${((indice + 1) / pasosPregunta.length) * 100}%`;
}

if (btnPasoSiguiente) {
    btnPasoSiguiente.addEventListener('click', () => {
        const camposPaso = pasosPregunta[pasoActualCuestionario].querySelectorAll('input, textarea, select');
        for (const campo of camposPaso) {
            if (!campo.checkValidity()) {
                campo.reportValidity();
                return;
            }
        }
        if (pasoActualCuestionario < pasosPregunta.length - 1) {
            pasoActualCuestionario++;
            mostrarPasoCuestionario(pasoActualCuestionario);
        }
    });
}

if (btnPasoAtras) {
    btnPasoAtras.addEventListener('click', () => {
        if (pasoActualCuestionario > 0) {
            pasoActualCuestionario--;
            mostrarPasoCuestionario(pasoActualCuestionario);
        }
    });
}

if (pasosPregunta.length > 0) mostrarPasoCuestionario(0);

// Convierte las respuestas del formulario en un texto legible (para el respaldo)
function construirResumenRespuestas(formData) {
    const etiquetas = [
        ['sentimientos', '¿Qué sentiste al ver todo esto?'],
        ['calificacion', 'Calificación del regalo'],
        ['lo_que_mas_gusto', 'Lo que más le gustó'],
        ['lo_que_no_gusto', 'Lo que cambiaría'],
        ['detalles_correctos', 'Sobre los detalles'],
        ['lo_presumiria', '¿Lo presumiría?'],
        ['mensaje_final', 'Mensaje final'],
    ];
    let texto = '💌 Mis respuestas:\n\n';
    etiquetas.forEach(([clave, etiqueta]) => {
        const valor = (formData.get(clave) || '').toString().trim() || '(sin responder)';
        texto += `${etiqueta}:\n${valor}\n\n`;
    });
    return texto.trim();
}

// --- PANTALLA DE AGRADECIMIENTO FINAL ---
function mostrarPantallaAgradecimiento(envioExitoso = true, resumenTexto = '') {
    if (!pantallaCuestionario || !pantallaGracias) return;
    pantallaCuestionario.style.opacity = '0';
    setTimeout(() => {
        pantallaCuestionario.classList.add('oculto');
        pantallaCuestionario.classList.remove('pantalla-activa');
        pantallaGracias.classList.remove('oculto');
        pantallaGracias.classList.add('pantalla-activa');
        setTimeout(() => {
            pantallaGracias.style.opacity = '1';
            lanzarConfetiCorazones();

            // Si no se pudo confirmar el envío, mostramos el respaldo con sus respuestas
            if (!envioExitoso) {
                const bloqueRespaldo = document.getElementById('respaldo-respuestas');
                const textoRespaldo = document.getElementById('respaldo-texto');
                if (bloqueRespaldo && textoRespaldo) {
                    textoRespaldo.value = resumenTexto;
                    bloqueRespaldo.classList.remove('oculto');
                }
            }
        }, 50);
    }, 500);
}

const btnCopiarRespaldo = document.getElementById('btn-copiar-respaldo');
if (btnCopiarRespaldo) {
    btnCopiarRespaldo.addEventListener('click', async () => {
        const textoRespaldo = document.getElementById('respaldo-texto');
        if (!textoRespaldo) return;
        try {
            await navigator.clipboard.writeText(textoRespaldo.value);
        } catch (err) {
            // Navegador sin permiso de portapapeles: seleccionamos el texto para copiar manual
            textoRespaldo.select();
        }
        vibrar(15);
        btnCopiarRespaldo.innerText = '¡Copiado! ✅';
        setTimeout(() => { btnCopiarRespaldo.innerText = 'Copiar respuestas'; }, 2000);
    });
}

function lanzarConfetiCorazones() {
    const simbolos = ['💖', '💛', '✨', '🌸'];
    const cantidad = 26;
    for (let i = 0; i < cantidad; i++) {
        const trozo = document.createElement('span');
        trozo.className = 'corazon-confeti';
        trozo.innerText = simbolos[Math.floor(Math.random() * simbolos.length)];
        trozo.style.left = `${Math.random() * 100}vw`;
        trozo.style.fontSize = `${14 + Math.random() * 16}px`;
        const duracion = 3 + Math.random() * 2.5;
        trozo.style.animationDuration = `${duracion}s`;
        trozo.style.animationDelay = `${Math.random() * 1.5}s`;
        document.body.appendChild(trozo);
        setTimeout(() => trozo.remove(), (duracion + 2) * 1000);
    }
}

// --- CORAZONES AL DOBLE-TOQUE SOBRE LA FOTO/VIDEO (estilo "me gusta") ---
function crearExplosionCorazones(clientX, clientY) {
    const rect = mediaContainer.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cantidad = 7;
    for (let i = 0; i < cantidad; i++) {
        const corazon = document.createElement('span');
        corazon.className = 'corazon-flotante';
        corazon.innerText = '💖';
        corazon.style.left = `${x}px`;
        corazon.style.top = `${y}px`;
        corazon.style.fontSize = `${16 + Math.random() * 16}px`;
        const angulo = Math.random() * 100 - 50; // grados
        const distancia = 50 + Math.random() * 50;
        corazon.style.setProperty('--dx', `${Math.sin(angulo * Math.PI / 180) * distancia}px`);
        corazon.style.setProperty('--dy', `${-(distancia + Math.random() * 40)}px`);
        mediaContainer.appendChild(corazon);
        setTimeout(() => corazon.remove(), 950);
    }
}

mediaContainer.addEventListener('dblclick', (e) => {
    crearExplosionCorazones(e.clientX, e.clientY);
});
