import { videollamada } from './videoLlamada.js';
import { escribiendoMensaje, enviarMensaje, fechaMensaje } from './enviarMensaje.js';
import { agregarFnImagenCompleta } from './imagenCompleta.js';
import { stringChatSeleccionado, stringMensajeUnico, stringMensajesNoLeidos } from './strings.js';
import { quitarSpinner } from './app.js';

const d = document;
let observer;

// Functions
function existenMensajes() {
  const mensajesChat = d.querySelector(".mensajesChat");
  if(!mensajesChat.firstElementChild) {
    mensajesChat.insertAdjacentHTML("beforeend", `
      <p class="sinMensajes" style="color: black">No hay mensajes para mostrar</p>
    `);
  }
}

function renderizarSinChatsSeleccionados () {
  const contenedorChat = document.querySelector(".contenedorChat");
  const sinChatSeleccionado = document.querySelector(".sinChatSeleccionado");
  if (contenedorChat) sinChatSeleccionado.style.display = 'none'
  else sinChatSeleccionado.style.display = 'block'
}

export function renderizarChatSeleccionado(ariaId) {
  const contenedorChat = document.querySelector(".contenedorChat");
  if(contenedorChat && contenedorChat.querySelector(".datosUsuarioChat").getAttribute("aria-id") == ariaId) return;

  const usuarioLocal = JSON.parse(localStorage.getItem("sesionUsuario"));
  socket.emit("chatSeleccionado", {
    ariaId,
    usuarioLocal
  });
}

function vaciarMensajesDelChat(idChat) {
  dejarDeObservarUltimoMensaje();
  const menuOpcionesChat = d.querySelector(".menuOpcionesChat");
  const mensajesChat = d.querySelector(".mensajesChat");
  menuOpcionesChat.classList.add("hide");
  const listaIdsMensajes = [];

  while(mensajesChat.firstElementChild) {
    if(mensajesChat.firstElementChild.classList.contains("contenedorMensaje")) {
      // Guarda los ids de los mensajes a eliminar
      listaIdsMensajes.push(mensajesChat.firstElementChild.getAttribute("aria-id"));
    }
    
    mensajesChat.firstElementChild.remove();
  }

  listaIdsMensajes.forEach(idMensaje => {
    // Se elimina el mensaje del back
    socket.emit("eliminarMensaje", {
      idUserDest: idChat,
      idMensaje
    });
  });

  d.querySelector(`.chat[aria-id="${idChat}"]`).querySelector(".ultimoMensajeRecibido").textContent = '';
  existenMensajes();
  const iconoIrHaciaAbajo = d.querySelector(".iconoIrHaciaAbajo");
  iconoIrHaciaAbajo.style.display = 'none';
}

export function btnIrHaciaAbajo() {
  const contenedorMensaje = Array.from(d.querySelectorAll(".contenedorMensaje"));
  if(contenedorMensaje.length == 0) return;
  const ultimoMensaje = contenedorMensaje.at(-1);
  observer = new IntersectionObserver(entries => {
    const iconoIrHaciaAbajo = d.querySelector(".iconoIrHaciaAbajo");
    if(!entries[0].isIntersecting) {
      if(iconoIrHaciaAbajo) iconoIrHaciaAbajo.style.display = 'block';
    } else {
      if(iconoIrHaciaAbajo) iconoIrHaciaAbajo.style.display = 'none';
    }
  }, {
    threshold: .2
  });

  observer.observe(ultimoMensaje);
}

export function dejarDeObservarUltimoMensaje() {
  const contenedorMensaje = Array.from(d.querySelectorAll(".contenedorMensaje"));
  if(contenedorMensaje.length == 0) return;
  const ultimoMensaje = contenedorMensaje.at(-1);

  observer && observer.unobserve(ultimoMensaje);
}

// Sockets
socket.on("chatSeleccionado", event => {
  dejarDeObservarUltimoMensaje();
  // Elimina la notificacion si hay una
  const notificacion = d.querySelector(".notificacion");
  notificacion && notificacion.remove();

  const { ariaId, usuarioLocal, usuarioEncontrado, todosMensajesChats, cantidadMensajesNoLeidos } = event;
  let contenedorChat = document.querySelector(".contenedorChat");
  contenedorChat && contenedorChat.remove();
  
  d.querySelector("main").insertAdjacentHTML("beforeend", stringChatSeleccionado(ariaId, usuarioEncontrado));
  renderizarSinChatsSeleccionados()
  contenedorChat = document.querySelector(".contenedorChat");
  // Regresa a la seccion de todos los chats cuando es en pantallas pequeñas
  const btnDevolver = d.querySelector(".btnDevolver");
  btnDevolver.addEventListener("click", () => {
    if(contenedorChat) {
      // desaparece la seccion del chat seleccionado
      contenedorChat.animate([
        { transform: 'translateX(0%)' },
        { transform: 'translateX(100%)' }
      ], 300);
      setTimeout(() => {
        contenedorChat.remove();
        renderizarSinChatsSeleccionados()
      }, 310);
    }
  });

  let fechaAnterior = '';
  const mensajesChat = d.querySelector(".mensajesChat");
  todosMensajesChats.forEach(mensaje => {
    const fecha = new Date(mensaje.fechaMensaje);
    const minutos = fecha.getMinutes();
    const horaMensaje = `${fecha.getHours()}:${minutos < 10 ? `0${minutos}` : minutos}`;

    // Muestra la fecha del mensaje si la fecha de los mensajes es diferente a la anterior
    fechaMensaje(fecha, fechaAnterior);

    if(!mensaje.leido && !d.querySelector("#contenedorMensajesNoLeidos") && cantidadMensajesNoLeidos) {
      mensajesChat.insertAdjacentHTML("beforeend", stringMensajesNoLeidos(cantidadMensajesNoLeidos));
    }

    // valor booleano que indica si el mensaje es del remitente o no
    const receptor = ariaId == mensaje.usuarioRem.id;
    mensajesChat.insertAdjacentHTML("beforeend", stringMensajeUnico(mensaje.id, receptor, mensaje.mensaje, horaMensaje, fecha.getTime()));

    fechaAnterior = fecha;
    // Todos los mensajes de este chat que eran para el usuario
    // se marcan como leidos
    if(receptor) {
      socket.emit("mensajeLeido", { id: mensaje.id, usuarioDest: mensaje.usuarioDest.id });
    }
  });

  const contenedorMensajesNoLeidos = d.querySelector("#contenedorMensajesNoLeidos");
  if(!contenedorMensajesNoLeidos) {
    mensajesChat.scrollTo(0, mensajesChat.scrollHeight);
  } else {
    contenedorMensajesNoLeidos.scrollIntoViewIfNeeded();
    const msjAnterior = contenedorMensajesNoLeidos.previousElementSibling;
    if(msjAnterior) {
      document.querySelector(".mensajesChat").scrollBy(0, 50);
    }
  }

  const datosUsuarioChat = d.querySelector(".datosUsuarioChat");
  const imgUserChat = [datosUsuarioChat.querySelector(".imgUserChat img")];
  agregarFnImagenCompleta(imgUserChat);

  quitarSpinner();
  existenMensajes();
  btnIrHaciaAbajo();

  // Por defecto el icono de ir hacia abajo no se muestra
  const iconoIrHaciaAbajo = d.querySelector(".iconoIrHaciaAbajo");
  iconoIrHaciaAbajo.style.display = 'none';

  iconoIrHaciaAbajo.addEventListener("click", () => {
    iconoIrHaciaAbajo.style.display = 'none';
    mensajesChat.scrollTo(0, mensajesChat.scrollHeight);
  });

  // videollamada
  const usuarioRem = JSON.parse(localStorage.getItem("sesionUsuario"));
  videollamada(imgUserChat, usuarioRem);

  // Menu opciones del chat
  const menuOpcionesChat = d.querySelector(".menuOpcionesChat");
  const btnEllipsis = d.querySelector("#btnEllipsis");
  const btnVaciarChat = d.querySelector("#btnVaciarChat");

  btnEllipsis.addEventListener("click", () => menuOpcionesChat.classList.toggle("hide"));
  btnVaciarChat.addEventListener("click", () => vaciarMensajesDelChat(ariaId));

  // se ejecuta cuando el usuario escribe para mandar un mensaje
  escribiendoMensaje(ariaId, usuarioLocal);

  // Enviar Mensaje
  const formEnviarMensaje = d.querySelector("#formEnviarMensaje");
  const btnEnviarMensaje = d.querySelector("#btnEnviarMensaje");

  formEnviarMensaje.addEventListener("submit", e => enviarMensaje(e, usuarioEncontrado, usuarioRem));
  btnEnviarMensaje.addEventListener("click", e => enviarMensaje(e, usuarioEncontrado, usuarioRem));
});
