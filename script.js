// --- SISTEMA DE DESBLOQUEO PERMANENTE ---
window.onload = () => {
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

// Al enviar el formulario final, guardamos el candado abierto en su navegador
document.querySelector('.formulario-final').addEventListener('submit', () => {
    localStorage.setItem('regaloZabdiDesbloqueado', 'true');
});

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
const musicaFondo = document.getElementById('musica-fondo');
const btnRocola = document.getElementById('btn-rocola');
const modalPoema = document.getElementById('modal-poema');

let indiceEscena = 0;
let indiceCarrusel = 0;
let vozActual = null;
let vozPoemaActual = null; // Variable para controlar el audio del poema (Karaoke)
let rocolaEncendida = false;

// --- LÓGICA DE PLAYLIST (ROCOLA) ---
const playlist = [
    "yoko.mp3", "el_ultimo_baile.mp3", "babysita.mp3", 
    "paranormal.mp3", "reina_pepiada.mp3", "jpn.mp3", "super_estrella.mp3"
];
const nombresCanciones = [
    "Yoko", "El Último Baile", "Babysita", 
    "Paranormal", "Reina Pepiada", "JPN", "Super Estrella"
];
let indiceCancionActual = 0;
musicaFondo.src = playlist[indiceCancionActual];

function mostrarNotificacionCancion(indice) {
    const toast = document.getElementById('notificacion-cancion');
    document.getElementById('nombre-cancion').innerText = nombresCanciones[indice];
    toast.classList.remove('toast-oculto');
    setTimeout(() => { toast.classList.add('toast-oculto'); }, 4000);
}

musicaFondo.addEventListener('ended', () => {
    indiceCancionActual++;
    if (indiceCancionActual >= playlist.length) indiceCancionActual = 0; 
    musicaFondo.src = playlist[indiceCancionActual];
    musicaFondo.play();
    mostrarNotificacionCancion(indiceCancionActual);
});

// --- LÓGICA DE LOGIN ---
inputFecha.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length > 2) valor = valor.slice(0, 2) + '/' + valor.slice(2);
    if (valor.length > 5) valor = valor.slice(0, 5) + '/' + valor.slice(5);
    e.target.value = valor.slice(0, 10);

    if (e.target.value === '27/02/26' || e.target.value === '27/02/2026') {
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

// =========================================================
// ¿CÓMO SUBIR TUS ARCHIVOS? (GUÍA)
// 1. Pon tus fotos (.jpg/.png), videos (.mp4) y audios de voz (.mp3) en la misma carpeta que este script.
// 2. Reemplaza los nombres de archivo falsos por los nombres reales de tus archivos.
// =========================================================

const historia = [
    {
        tipo: "unica",
        archivo: "TU_FOTO_1.png", 
        texto: "Mi amor... feliz cumpleaños. Para empezar, mira esta foto...",
        audio: "audio2_foto_unica.mp3", // El audio donde le dices que abra el sobre
        easterEgg: {
            bottom: "15px", 
            right: "15px", 
            colorTema: "#ff66b2", 
            titulo: "27 de Febrero",
            // --- AQUI ESTÁ LA MAGIA DEL KARAOKE ---
            audioPoema: "audio3_recitacion.mp3", // Tu nota de voz recitando el poema
            lineasKaraoke: [
                // Solo reproduce tu audio de voz en la PC y anota en qué segundo empiezas a decir cada frase
                { segundo: 0, texto: "Eres la orquídea de mi jardín," },
                { segundo: 3.5, texto: "la luz en mi oscuridad," },
                { segundo: 6.0, texto: "feliz cumpleaños mi amor," },
                { segundo: 9.0, texto: "gracias por tanta felicidad." }
            ]
        }
    },
    {
        tipo: "carrusel",
        diapositivas: [
            { archivo: "TU_CARRUSEL_1.jpg", texto: "Desliza para ver más recuerdos hermosos." },
            { archivo: "TU_CARRUSEL_2.jpg", texto: "Aquí nos veíamos guapísimos." }
        ],
        audio: "audio4_carrusel.mp3" // Audio donde explicas el carrusel (déjalo vacío "" si no hay)
    },
    {
        tipo: "video",
        archivo: "TU_VIDEO.mp4", 
        texto: "Sabes que amo ver películas contigo. Eres mi super estrella.",
        audio: "audio5_video.mp3" // Audio donde explicas el video
    }
];

// --- MOTOR DE RENDERIZADO ---
function renderizarEscena() {
    const escena = historia[indiceEscena];
    mediaContainer.innerHTML = ""; 
    indiceCarrusel = 0; 

    if (escena.tipo === "unica") {
        mediaContainer.innerHTML = `<img src="${escena.archivo}" alt="Foto única">`;
        textoNarrativo.innerText = escena.texto;
    } else if (escena.tipo === "carrusel") {
        renderizarDiapositivaCarrusel();
    } else if (escena.tipo === "video") {
        mediaContainer.innerHTML = `<video src="${escena.archivo}" controls autoplay loop></video>`;
        textoNarrativo.innerText = escena.texto;
    }

    btnAnterior.classList.toggle('oculto', indiceEscena === 0);
    btnSiguiente.innerText = (indiceEscena === historia.length - 1) ? "Finalizar" : "Siguiente";

    if (vozActual) vozActual.pause(); 
    
    // Lógica para bajar la música cuando hablas
    if (escena.audio && escena.audio !== "") {
        vozActual = new Audio(escena.audio);
        if (rocolaEncendida) musicaFondo.volume = 0.05; // Baja el volumen a 5%
        
        vozActual.play().catch(e => {
            console.log("Aún no has subido tu nota de voz. Restaurando volumen de fondo.");
            if (rocolaEncendida) musicaFondo.volume = 0.8; // Si el archivo no existe, devuelve el volumen a la normalidad
        });
        
        vozActual.onended = () => {
            if (rocolaEncendida) musicaFondo.volume = 0.8; // Vuelve a subir al terminar de hablar
        };
    } else {
        if (rocolaEncendida) musicaFondo.volume = 0.8;
    }

    const viejosSobres = document.querySelectorAll('.sobre-misterioso');
    viejosSobres.forEach(s => s.remove()); 

    if (escena.easterEgg) {
        const sobre = document.createElement('div');
        sobre.className = 'sobre-misterioso';
        sobre.style.top = escena.easterEgg.top || 'auto';
        sobre.style.left = escena.easterEgg.left || 'auto';
        sobre.style.bottom = escena.easterEgg.bottom || 'auto';
        sobre.style.right = escena.easterEgg.right || 'auto';
        const color = escena.easterEgg.colorTema || "#ffd700"; 
        
        sobre.innerHTML = `<svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"/></svg>`;
        
        sobre.onclick = () => {
            // Detenemos la voz narrativa si aún estaba hablando
            if(vozActual) vozActual.pause();
            
            document.getElementById('titulo-poema').innerText = escena.easterEgg.titulo;
            const contenedorTextos = document.getElementById('texto-poema');
            contenedorTextos.innerHTML = ''; // Limpiamos

            // Lógica del Karaoke
            if(escena.easterEgg.lineasKaraoke) {
                // 1. Crear los párrafos de texto
                escena.easterEgg.lineasKaraoke.forEach((linea, index) => {
                    let p = document.createElement('p');
                    p.className = 'linea-poema';
                    p.id = 'karaoke-' + index;
                    p.innerText = linea.texto;
                    contenedorTextos.appendChild(p);
                });

                // 2. Reproducir tu voz recitando
                if(vozPoemaActual) vozPoemaActual.pause();
                vozPoemaActual = new Audio(escena.easterEgg.audioPoema);
                if (rocolaEncendida) musicaFondo.volume = 0.05;
                vozPoemaActual.play();

                // 3. Sincronizar (Iluminar la línea según el segundo)
                vozPoemaActual.addEventListener('timeupdate', () => {
                    let tiempoActual = vozPoemaActual.currentTime;
                    
                    escena.easterEgg.lineasKaraoke.forEach((linea, index) => {
                        let p = document.getElementById('karaoke-' + index);
                        let tiempoSiguiente = escena.easterEgg.lineasKaraoke[index + 1] ? escena.easterEgg.lineasKaraoke[index + 1].segundo : 9999;
                        
                        if(tiempoActual >= linea.segundo && tiempoActual < tiempoSiguiente) {
                            p.classList.add('iluminada');
                        } else {
                            p.classList.remove('iluminada');
                        }
                    });
                });

                // Al terminar el poema, restaurar música
                vozPoemaActual.onended = () => {
                    if (rocolaEncendida) musicaFondo.volume = 0.8;
                }
            } else if (escena.easterEgg.poema) {
                // Fallback por si en otra escena solo quieres texto sin audio/karaoke
                contenedorTextos.innerText = escena.easterEgg.poema;
            }
            modalPoema.classList.remove('oculto');
        };
        mediaContainer.appendChild(sobre);
    }
}

function renderizarDiapositivaCarrusel() {
    const escena = historia[indiceEscena];
    const diapo = escena.diapositivas[indiceCarrusel];
    const sobresActuales = mediaContainer.querySelectorAll('.sobre-misterioso');
    mediaContainer.innerHTML = `
        <button class="btn-carrusel izq" onclick="cambiarCarrusel(-1)">&#10094;</button>
        <img src="${diapo.archivo}" alt="Foto carrusel">
        <button class="btn-carrusel der" onclick="cambiarCarrusel(1)">&#10095;</button>
    `;
    sobresActuales.forEach(s => mediaContainer.appendChild(s));
    textoNarrativo.innerText = diapo.texto;
    document.querySelector('.btn-carrusel.izq').style.display = (indiceCarrusel === 0) ? 'none' : 'block';
    document.querySelector('.btn-carrusel.der').style.display = (indiceCarrusel === escena.diapositivas.length - 1) ? 'none' : 'block';
}

window.cambiarCarrusel = function(direccion) {
    const escena = historia[indiceEscena];
    indiceCarrusel += direccion;
    if (indiceCarrusel >= 0 && indiceCarrusel < escena.diapositivas.length) renderizarDiapositivaCarrusel();
};

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
    if(vozPoemaActual) {
        vozPoemaActual.pause();
        if (rocolaEncendida) musicaFondo.volume = 0.8;
    }
    modalPoema.classList.add('oculto');
});