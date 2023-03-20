import { establecerTemaApp } from './temaOscuro.js';
import { agregarFnImagenCompleta } from './imagenCompleta.js';
import { renderizarChatSeleccionado } from './chatSeleccionado.js';
import { stringChat } from './strings.js';

const d = document;
const modalCrearUsuario = d.querySelector(".modalCrearUsuario");
const formCrearUsuario = d.querySelector("#formCrearUsuario");
const contenedorCrearUsuario = d.querySelector(".contenedorCrearUsuario");

// Listeners
document.addEventListener('DOMContentLoaded', contenidoCargado);

// FUNCIONES
function contenidoCargado() {
  establecerTemaApp();
  // Maneja la subida de imagen del usuario si la sube
  d.querySelector("#seleccionarFoto").addEventListener("change", seleccionImagen);

  const sesionUsuario = JSON.parse(localStorage.getItem("sesionUsuario"));
  if (sesionUsuario) {
    socket.emit("verificarUsuarioExiste", sesionUsuario);
    return;
  }
  quitarSpinner();
  formCrearUsuario.addEventListener("submit", crearUsuario);
}

function seleccionImagen(e) {
  if(e.target.files[0]) {
    d.querySelector(".contenedorFotoUsuario").insertAdjacentHTML("beforeend",
      `<ion-icon name="checkmark-outline" class="iconoFotoSubida fotoSubida"></ion-icon>`
    );
    d.querySelector(".contenedorFotoUsuario").insertAdjacentHTML("afterend",
      `<div class="contenedorEliminarFoto">
        <button id="eliminarFoto">Eliminar Foto</button>
      </div>`
    );

    // Elimina la foto seleccionada por el usuario
    d.querySelector("#eliminarFoto").addEventListener("click", () => {
      d.getElementById("seleccionarFoto").value = '';
      d.querySelector(".iconoFotoSubida").remove();
      d.querySelector(".contenedorEliminarFoto").remove();
    });
  }
}

export function quitarSpinner() {
  d.querySelector(".contenedorSpinner").remove();
}

function chatSeleccionado(chat) {
  const ariaId = chat.getAttribute("aria-id");
  const spanMensajesNoLeidos = chat.querySelector(".mensajesEntrantesChat span");
  spanMensajesNoLeidos && spanMensajesNoLeidos.remove();
  renderizarChatSeleccionado(ariaId);
}

function agregarSeleccionarChat(chats) {
  chats.forEach(chat => chat.addEventListener("click", () => chatSeleccionado(chat)));
}

function renderizarTodosChats(mensaje) {
  d.querySelector(".chats")
    .insertAdjacentHTML("beforeend",
      stringChat(
        mensaje.usuario,
        mensaje.ultimoMensaje,
        mensaje.cantidadMensajesNoLeidos
      )
    );
}

// Inicia la aplicacion
function inicioApp(usuarios, usuarioEnLinea, mensajes) {
  const sesionUsuario = JSON.parse(localStorage.getItem("sesionUsuario"));
  modalCrearUsuario.remove();

  if (mensajes.length == 0) {
    // No hay mensajes y solo muestra todos los usuarios
    usuarios.forEach(usuario => {
      if (sesionUsuario?.nombreUsuario != usuario?.nombreUsuario) {
        renderizarTodosChats({
          usuario,
          ultimoMensaje: '',
          cantidadMensajesNoLeidos: 0
        });
      }
    });
  } else {
    // Hay mensajes y los chats están ordenados
    mensajes.forEach(mensaje => {
      if (sesionUsuario?.nombreUsuario != mensaje?.usuario?.nombreUsuario) {
        renderizarTodosChats(mensaje);
      }
    });
  }

  const imgUsersChats = [...d.querySelectorAll(".imgUserChat img")];
  agregarFnImagenCompleta(imgUsersChats);

  const chats = [...d.querySelectorAll(".chat")];
  agregarSeleccionarChat(chats);

  socket.emit("enLinea", { usuarioEnLinea, mensaje: "en linea" });
}

function mensajeAlerta(msg) {
  if(!d.querySelector(".mensajeAlertaCrearUsuario")) {
    contenedorCrearUsuario.insertAdjacentHTML("afterbegin", `
      <div class="mensajeAlertaCrearUsuario">
        <span>${msg}</span>
      </div>`
    );

    setTimeout(() => {
      d.querySelector(".mensajeAlertaCrearUsuario").remove();
    }, 3000);
  }
}

async function crearUsuario(e) {
  e.preventDefault();
  const nombreUsuario = d.querySelector("#inputNombreUsuario").value;
  const fotoSeleccionada = d.querySelector("#seleccionarFoto").files[0];

  // No escribió un nombre de usuario
  if(nombreUsuario.trim() == '') {
    const mensaje = "Debe escribir un nombre de usuario";
    mensajeAlerta(mensaje);
    return;
  }

  const fd = new FormData();
  fd.append("nombreUsuario", nombreUsuario);
  fd.append("foto", fotoSeleccionada);

  try {
    const resp = await fetch("/nuevoUsuario", {
      method: 'POST',
      body: fd
    })
    const respuesta = await resp.json();

    if(respuesta.ok) {
      const { usuarioAgregado } = respuesta;
      socket.emit("nuevoUsuario", { usuarioAgregado });
      return;
    }

    mensajeAlerta(respuesta.mensaje);
  } catch(err) {
    mensajeAlerta(err);
  }

}

// Maneja todas las notificaciones
// Las aparece y desaparece
export function mostrarOcultarNotificacion() {
  const notificacion = d.querySelector(".notificacion");
  const listaNotificaciones = d.querySelectorAll(".notificacion")

  if (listaNotificaciones[1]) {
    listaNotificaciones[1].remove();
  }

  notificacion.style.transform = "translateY(0px)";
  setTimeout(() => {
    notificacion.style.transform = "translateY(-100px)";
    setTimeout(() => {
      notificacion.remove();
    }, 1000);
  }, 3000);
}

// Sockets
socket.on("usuarioAgregado", respuesta => {
  // El usuario si se agregó
  if(respuesta.ok) {
    const { usuarios, usuarioAgregado, mensajes } = respuesta;
    localStorage.setItem("sesionUsuario", JSON.stringify(usuarioAgregado));
    inicioApp(usuarios, usuarioAgregado, mensajes);
    return;
  }
  mensajeAlerta(respuesta.mensaje);
});

// Verificar si el usuario es valido si ya ha iniciado sesion
socket.on("usuarioValido", respuesta => {
  quitarSpinner();
  if(respuesta.ok) {
    const { usuarios, usuarioValido, mensajes } = respuesta;
    inicioApp(usuarios, usuarioValido, mensajes);
    return;
  }

  formCrearUsuario.addEventListener("submit", crearUsuario);
});

// Recibe los nuevos usuarios
socket.on("nuevoUsuario", nuevoUsuario => {
  d.querySelector(".chats")
    .insertAdjacentHTML("afterbegin", stringChat(nuevoUsuario));

  const imgUsersChats = [d.querySelector(".imgUserChat img")];
  agregarFnImagenCompleta(imgUsersChats);

  const chats = [d.querySelector(".chat")];
  agregarSeleccionarChat(chats);
});

socket.on("fueraDeLinea", mensaje => {
  const { id } = mensaje.usuarioDesconectado

  const datosUsuarioChat = d.querySelector(`.datosUsuarioChat[aria-id='${id}']`);
  if(datosUsuarioChat) {
    const enLineaEscribiendo = datosUsuarioChat.querySelector("#enLineaEscribiendo");
    enLineaEscribiendo.textContent = "";
  }
});

socket.on("enLinea", mensaje => {
  const { id } = mensaje.usuarioEnLinea
  const datosUsuarioChat = d.querySelector(`.datosUsuarioChat[aria-id='${id}']`);
  if(datosUsuarioChat) {
    const enLineaEscribiendo = datosUsuarioChat.querySelector("#enLineaEscribiendo");
    enLineaEscribiendo.textContent = mensaje.mensaje;
  }
});
