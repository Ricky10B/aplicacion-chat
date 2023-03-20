import { notificacionMensaje, stringMensajeUnico } from './strings.js';
import { btnIrHaciaAbajo, dejarDeObservarUltimoMensaje, renderizarChatSeleccionado } from './chatSeleccionado.js';
import { mostrarOcultarNotificacion } from './app.js';
import { escaparHtmlCaracteres } from './escaparCaracteres.js';

const d = document;

// Pasar a mayúscula la primer letra que escribe el usuario
// en el input del chat
function pasarMayuscula (letra) {
  if (letra?.length !== 1) return
  return letra.replace(/./g, l => l.toUpperCase())
}

// debouncer
// Le indica al usuario si le estan escribiendo
export function escribiendoMensaje(idUsuarioDest, usuarioLocal) {
  const mensajeUsuario = d.querySelector("#mensajeUsuario");
  let timeout;
  mensajeUsuario.addEventListener("input", function (e) {
    const { value } = e.target
    if (value.length === 1) {
      this.value = pasarMayuscula(value)
    }
    socket.emit("escribiendo", { mensaje: "escribiendo", idUsuarioDest, idUsuarioRem: usuarioLocal.id });
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      socket.emit("dejoDeEscribir", { mensaje: "", idUsuarioDest, idUsuarioRem: usuarioLocal.id });
    }, 1000);
  });
}

export function enviarMensaje(e, usuarioDest, usuarioRem) {
  e.preventDefault();
  const mensajeUsuario = d.querySelector("#mensajeUsuario");
  const mensajesChat = d.querySelector(".mensajesChat");
  const mensaje = mensajeUsuario.value;
  
  if (mensaje.trim() != '') {
    const fecha = new Date();
    const minutos = fecha.getMinutes();
    const horaMensaje = `${fecha.getHours()}:${minutos < 10 ? `0${minutos}` : minutos}`;

    const sinMensajes = d.querySelector(".sinMensajes");
    sinMensajes && sinMensajes.remove();
    
    dejarDeObservarUltimoMensaje();
    // Agrega la fecha del mensaje si es necesario
    const ultimoMensaje = [...d.querySelectorAll(".contenedorMensaje")].at(-1);
    let fechaAnterior = '';
    if(ultimoMensaje) fechaAnterior = ultimoMensaje.getAttribute("aria-fecha");
    fechaMensaje(fecha, new Date(+fechaAnterior));

    const mensajeEscapado = escaparHtmlCaracteres(mensaje)
    mensajesChat.insertAdjacentHTML("beforeend", stringMensajeUnico('', false, mensajeEscapado, horaMensaje, fecha.getTime()));

    // Eliminar el mensaje de mensajes sin leer si existe
    const mensajesNoLeidos = document.querySelector("#contenedorMensajesNoLeidos");
    mensajesNoLeidos && mensajesNoLeidos.remove();

    // Observar el ultimo mensaje para mostrar el icono de ir hacia abajo
    btnIrHaciaAbajo();

    socket.emit("mensaje", {
      mensaje,
      usuarioDest,
      usuarioRem
    });
    // Indica al otro usuario que el usuario remitente dejó de escribir
    socket.emit("dejoDeEscribir", {
      mensaje: "",
      idUsuarioDest: usuarioDest.id,
      idUsuarioRem: usuarioRem.id
    });

    const chatDest = d.querySelector(`.chat[aria-id='${usuarioDest.id}']`);
    const ultimoMensajeRecibido = chatDest.querySelector(".ultimoMensajeRecibido");
    ultimoMensajeRecibido.textContent = mensaje;

    const chats = d.querySelector(".chats");
    chats.insertBefore(chatDest, chats.firstElementChild);

    mensajesChat.scrollTo(0, mensajesChat.scrollHeight);
    mensajeUsuario.value = '';
    mensajeUsuario.focus();
  }
}

export function fechaMensaje(fechaMensaje, fechaAnterior) {
  if(fechaAnterior && fechaMensaje.getDate() == fechaAnterior.getDate()) return;
  const milisegundosDia = 86400000;
  const diaFechaActual = new Date().getDate();
  const diaFechaAnterior = new Date(new Date().getTime() - milisegundosDia).getDate();
  const listaMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  let fecha = '';
  if(diaFechaActual == fechaMensaje.getDate()) fecha = 'Hoy';
  else if(diaFechaAnterior == fechaMensaje.getDate()) fecha = 'Ayer';
  else fecha = `${fechaMensaje.getDate()} de ${listaMeses[fechaMensaje.getMonth()]} del ${fechaMensaje.getFullYear()}`;

  d.querySelector(".mensajesChat").insertAdjacentHTML("beforeend", `
    <div class="contenedorDiaFechaMensaje">
      <div class="diaFechaMensaje">${fecha}</div>
    </div>`);
}

// Sockets
// Usuario escribiendo
socket.on("escribiendo", mensaje => {
  const datosUsuarioChat = d.querySelector(".datosUsuarioChat");
  if(datosUsuarioChat && datosUsuarioChat.getAttribute("aria-id") == mensaje.idUsuarioRem) {
    const enLineaEscribiendo = datosUsuarioChat.querySelector("#enLineaEscribiendo");
    enLineaEscribiendo.textContent = mensaje.mensaje;
  }
});

socket.on("dejoDeEscribir", mensaje => {
  const datosUsuarioChat = d.querySelector(".datosUsuarioChat");
  if(datosUsuarioChat && datosUsuarioChat.getAttribute("aria-id") == mensaje.idUsuarioRem) {
    const enLineaEscribiendo = datosUsuarioChat.querySelector("#enLineaEscribiendo");
    enLineaEscribiendo.textContent = mensaje.usuarioDest.enLinea ? "en linea": "";
  }
});

// Mensaje recibido
socket.on("mensaje", mensaje => {
  // Mostrar el mensaje nuevo en la lista de chats de todos los usuarios al mensaje destinatario
  const idUsuarioRem = mensaje.usuarioRem.id;
  const chatUsuarioRem = d.querySelector(`.chat[aria-id='${idUsuarioRem}']`);
  chatUsuarioRem.querySelector(".ultimoMensajeRecibido").innerHTML = mensaje.mensaje;

  const chats = d.querySelector(".chats");
  chats.insertBefore(chatUsuarioRem, chats.firstElementChild);

  let mensajesEntrantesChat = chatUsuarioRem.querySelector(".mensajesEntrantesChat span");

  // si el span que contiene los mensajes de no leidos no existe
  // se crea el span, se agrega y se establece el span a la variable mensajesEntrantesChat
  if(!mensajesEntrantesChat) {
    let span = d.createElement("span");
    span.textContent = 0;
    mensajesEntrantesChat = chatUsuarioRem.querySelector(".mensajesEntrantesChat");
    mensajesEntrantesChat.appendChild(span);
    mensajesEntrantesChat = mensajesEntrantesChat.querySelector("span");
  }
  mensajesEntrantesChat.style.display = 'block';
  let numero = mensajesEntrantesChat.textContent;
  let cantidadMensajesNoLeidos = numero == 'undefined' ? 0 : numero;
  mensajesEntrantesChat.textContent = ++cantidadMensajesNoLeidos;

  const datosUsuarioChat = d.querySelector(".datosUsuarioChat");
  if(
    !datosUsuarioChat || (datosUsuarioChat && datosUsuarioChat.getAttribute("aria-id") != idUsuarioRem)
  ) {
    // Mostrar la notificacion del mensaje entrante
    d.body.insertAdjacentHTML("afterbegin", notificacionMensaje(mensaje));
    // Si el usuario de la click a la notificacion ingresa al chat con ese usuario
    d.querySelector(".notificacionMensaje").addEventListener("click", () => {
      renderizarChatSeleccionado(idUsuarioRem);
      mensajesEntrantesChat.remove();
    });
    mostrarOcultarNotificacion();
    return;
  }

  const ariaId = datosUsuarioChat.getAttribute("aria-id");
  // Mostrar mensaje si la conversación actual es con el usuario remitente
  mensajesEntrantesChat && mensajesEntrantesChat.remove();

  const mensajesChat = d.querySelector(".mensajesChat");
  // Eliminar el mensaje de sin mensajes del chat
  const sinMensajes = d.querySelector(".sinMensajes");
  sinMensajes && sinMensajes.remove();

    // Crear la fecha apartir del valor proporcionado del servidor
  const fecha = new Date(mensaje.fechaMensaje);
  const minutos = fecha.getMinutes();
  const horaMensaje = `${fecha.getHours()}:${minutos < 10 ? `0${minutos}` : minutos}`;

  dejarDeObservarUltimoMensaje();
  // Agrega la fecha del mensaje si es necesario
  const ultimoMensaje = [...d.querySelectorAll(".contenedorMensaje")].at(-1);
  let fechaAnterior = '';
  if(ultimoMensaje) fechaAnterior = ultimoMensaje.getAttribute("aria-fecha");
  fechaMensaje(fecha, new Date(+fechaAnterior));

  // indica si el mensaje recibido es del receptor o no
  const receptor = ariaId == idUsuarioRem;
  mensajesChat.insertAdjacentHTML("beforeend", stringMensajeUnico(mensaje.id, receptor, mensaje.mensaje, horaMensaje, fecha.getTime()));

  btnIrHaciaAbajo();
  socket.emit("mensajeLeido", { id: mensaje.id });

});

socket.on("mensajeGuardado", event => {
  const contenedorMensaje = d.querySelector(".contenedorMensaje[aria-id='']");
  if(contenedorMensaje) {
    contenedorMensaje.setAttribute("aria-id", event.id);
  }
});
