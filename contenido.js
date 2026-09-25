// ==========================================================
// 💌 CONTENIDO DEL REGALO — Edita SOLO este archivo
// ==========================================================
// Regla de oro: TODOS los archivos (fotos, videos, audios .mp3)
// van sueltos en la MISMA carpeta que index.html (la raíz).
// Aquí solo escribes el NOMBRE del archivo, nada más.
//
// No necesitas tocar script.js NUNCA para agregar o cambiar
// fotos, textos, audios o canciones. Solo edita este archivo.
// ==========================================================


// 🎵 PLAYLIST DE LA ROCOLA
// Agrega, quita o reordena canciones aquí.
// "archivo" = nombre real del mp3 en tu carpeta.
// "nombre"  = como quieres que se vea en la notificación.
const PLAYLIST = [
    { archivo: "yoko.mp3",             nombre: "Yoko" },
    { archivo: "el_ultimo_baile.mp3",  nombre: "El Último Baile" },
    { archivo: "babysita.mp3",         nombre: "Babysita" },
    { archivo: "paranormal.mp3",       nombre: "Paranormal" },
    { archivo: "reina_pepiada.mp3",    nombre: "Reina Pepiada" },
    { archivo: "jpn.mp3",              nombre: "JPN" },
    { archivo: "super_estrella.mp3",   nombre: "Super Estrella" },
];


// 📖 ESCENAS DE LA GALERÍA (aparecen en este mismo orden)
//
// Tipos disponibles:
//   "unica"    -> una sola foto
//   "carrusel" -> varias fotos que se deslizan
//   "video"    -> un video
//
// Campos comunes:
//   archivo -> nombre del archivo (para "unica" y "video")
//   texto   -> lo que se lee debajo de la foto/video
//   audio   -> tu nota de voz para esa escena (deja "" si no hay)
//   sobre   -> (opcional) el sobrecito secreto con un poema/mensaje
//              tipo karaoke, sincronizado con un audio de voz
//
// 👉 PARA AGREGAR UNA ESCENA NUEVA:
//    copia uno de los bloques { ... } de abajo, pégalo antes del
//    "];" final, y cambia sus datos. No hace falta nada más.

const HISTORIA = [
    {
        tipo: "unica",
        archivo: "TU_FOTO_1.png",
        texto: "Mi amor... feliz cumpleaños. Para empezar, mira esta foto...",
        audio: "audio2_foto_unica.mp3",

        // Sobrecito secreto de esta escena (opcional, puedes borrar
        // todo este bloque "sobre" si no quieres uno aquí)
        sobre: {
            bottom: "15px",
            right: "15px",
            colorTema: "#ff66b2",
            titulo: "27 de Febrero",
            audioPoema: "audio3_recitacion.mp3", // tu voz recitando
            // Anota en qué segundo empiezas a decir cada frase
            karaoke: [
                { segundo: 0,   texto: "Eres la orquídea de mi jardín," },
                { segundo: 3.5, texto: "la luz en mi oscuridad," },
                { segundo: 6.0, texto: "feliz cumpleaños mi amor," },
                { segundo: 9.0, texto: "gracias por tanta felicidad." },
            ],
        },
    },

    {
        tipo: "carrusel",
        audio: "audio4_carrusel.mp3", // deja "" si esta escena no tiene audio
        diapositivas: [
            { archivo: "TU_CARRUSEL_1.jpg", texto: "Desliza para ver más recuerdos hermosos." },
            { archivo: "TU_CARRUSEL_2.jpg", texto: "Aquí nos veíamos guapísimos." },
            // Agrega más fotos del carrusel copiando esta línea:
            // { archivo: "TU_CARRUSEL_3.jpg", texto: "..." },
        ],
    },

    {
        tipo: "video",
        archivo: "TU_VIDEO.mp4",
        texto: "Sabes que amo ver películas contigo. Eres mi super estrella.",
        audio: "audio5_video.mp3",
    },

    // 👉 Copia y pega aquí para agregar más escenas...
];


// No toques esto: expone el contenido para que script.js lo use.
window.CONTENIDO = { PLAYLIST, HISTORIA };
