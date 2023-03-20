import {
  stringVideollamada,
  stringVideollamadaEntrante,
  notificacionErrorVideollamada,
  notificacionErrorPermisoDenegado
} from './strings.js';
import { quitarSpinner, mostrarOcultarNotificacion } from './app.js';

const d = document;
let localStream;
let pc;
let videoLocal;
let videoRemoto;

export function videollamada(imgUserChat, usuarioRem) {
  const nombreUsuario = d.querySelector(".contenedorDatosUsuario p").textContent;
  const btnVideoLlamada = d.querySelector("#btnVideoLlamada");
  btnVideoLlamada.addEventListener("click", () => peticionIniciarVideoLlamada(imgUserChat[0].src, nombreUsuario, usuarioRem.nombreUsuario));
}

async function peticionIniciarVideoLlamada(foto, nombreUsuario, usuarioRemitente) {
  d.body.insertAdjacentHTML("afterbegin", `
    <div class="contenedorSpinner contenedorSpinnerFondoClaro">
      <div class="spinner"></div>
    </div>`);
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    quitarSpinner();
  } catch(e) {
    console.log(e);
    quitarSpinner();
    let mensaje = '';
    if(e.name == 'NotReadableError') {
      mensaje = 'otra aplicación ya está usando la cámara o micrófono';      
    } else {
      mensaje = "Debe permitir usar la cámara y micrófono";
    }
    !d.querySelector(".errorVideollamada") && d.body.insertAdjacentHTML("afterbegin", notificacionErrorPermisoDenegado(mensaje));

    mostrarOcultarNotificacion();
    return;
  }

  const contestada = false;
  d.body.insertAdjacentHTML("afterbegin", stringVideollamada(contestada));

  videoLocal = d.getElementById("videoLlamadaLocal");
  videoLocal.srcObject = localStream;

  manejoAudioVideo();

  socket.emit("peticionVideollamada", { foto, nombreUsuario, usuarioRemitente });
  colgarLlamadaFn();
}

// Activa y desactiva el audio y video de la videollamada
function manejoAudioVideo() {
  const microfono = d.querySelector("ion-icon[name='mic-circle-outline']");
  microfono.addEventListener("click", () => {
    if(microfono.getAttribute("name") == "mic-circle-outline") {
      microfono.setAttribute("name", "mic-off-circle-outline");
      const tracks = localStream.getAudioTracks();
      tracks.forEach(track => track.enabled = false);
    } else {
      microfono.setAttribute("name", "mic-circle-outline");
      const tracks = localStream.getAudioTracks();
      tracks.forEach(track => track.enabled = true);
    }
  });

  const video = d.querySelector("ion-icon[name='videocam-outline']");
  video.addEventListener("click", () => {
    if(video.getAttribute("name") == "videocam-outline") {
      video.setAttribute("name", "videocam-off-outline");
      const tracks = localStream.getVideoTracks();
      tracks.forEach(track => track.enabled = false);
    } else {
      video.setAttribute("name", "videocam-outline");
      const tracks = localStream.getVideoTracks();
      tracks.forEach(track => track.enabled = true);
    }
  });
}

function colgarLlamadaFn() {
  const colgarLlamada = d.querySelector(".colgarLlamada");
  colgarLlamada.addEventListener("click", () => {
    const socketIdDest = JSON.parse(localStorage.getItem("socketIdDest"));
    socket.emit("colgarVideollamada", { type: 'colgarVideollamada', socketIdDest });
    colgar()
  });
}

function colgar() {
  const videollamandoEntrante = d.querySelector(".videollamandoEntrante");
  if(videollamandoEntrante) {
    videollamandoEntrante.remove();
    return;
  }
  const modalVideoLlamada = d.querySelector(".modalVideoLlamada");
  modalVideoLlamada && modalVideoLlamada.remove();
  localStream && localStream.getTracks().forEach(t => t.stop());
  localStream = null;
  if(!pc) return;
  pc.onconnectionstatechange = null;
  pc = null;
}

async function contestarLlamadaFn(nombreUsuarioRemitente) {
  // Cierra el modal de videollamada entrante
  colgar();
  // Cuelga la llamada anterior si estaba en una
  colgar();

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  } catch(e) {
    console.log(e);
    let mensaje = '';
    if(e.name == 'NotReadableError') {
      mensaje = 'otra aplicación ya está usando la cámara o micrófono';      
    } else {
      mensaje = "Debe permitir usar la cámara y micrófono";
    }
    !d.querySelector(".errorVideollamada") && d.body.insertAdjacentHTML("afterbegin", notificacionErrorPermisoDenegado(mensaje));

    mostrarOcultarNotificacion();
    const socketIdDest = JSON.parse(localStorage.getItem("socketIdDest"));
    socket.emit("colgarVideollamada", { type: 'colgarVideollamada', socketIdDest });    
    return;
  }

  const contestada = true;
  d.body.insertAdjacentHTML("afterbegin", stringVideollamada(contestada));

  videoLocal = d.getElementById("videoLlamadaLocal");
  videoLocal.srcObject = localStream;

  manejoAudioVideo();
  colgarLlamadaFn();
  socket.emit("videollamadaContestada", { nombreUsuarioRemitente });
}

function conexionPeer(dataPeer, mensaje) {
  switch(dataPeer.type) {
    case 'offer':
      manejarOferta(dataPeer, mensaje);
      break;
    case 'answer':
      manejarRespuesta(dataPeer);
      break;
    case 'candidate':
      manejarCandidato(dataPeer);
      break;
    case 'colgarVideollamada':
      colgar();
      break;
    default:
      console.log("opción inválida");
      break;
  }
}

function crearPeer() {
  const configuracion = {
    'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]
  }
  pc = new RTCPeerConnection(configuracion);
  pc.onicecandidate = event => {
    if(event.candidate) {
      const socketIdDest = JSON.parse(localStorage.getItem("socketIdDest"));
      socket.emit("newIceCandidate", event.candidate, socketIdDest);
    }
  }
  pc.onconnectionstatechange = e => {
    if(e.target.connectionState == "disconnected") {
      colgar();
      d.body.insertAdjacentHTML("afterbegin", notificacionErrorVideollamada());

      mostrarOcultarNotificacion();
    }
  }
  pc.ontrack = e => videoRemoto.srcObject = e.streams[0];
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
}

async function manejarOferta(offer, mensaje) {
  crearPeer();

  const contenedorVideollamadaLocal = d.querySelector(".contenedorVideollamadaLocal");
  contenedorVideollamadaLocal.removeAttribute("id");

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  socket.emit("manejarRespuesta", { type: "answer", sdp: answer.sdp }, mensaje);
  await pc.setLocalDescription(answer);
}

async function manejarRespuesta(answer) {
  await pc.setRemoteDescription(answer);
}

async function manejarCandidato(candidato) {
  if(candidato.candidate) {
    await pc.addIceCandidate(candidato.candidate);
  }
}

// Sockets
socket.on("inicioComunicacionVideollamada", ({ socketIdDest }) => {
  localStorage.setItem("socketIdDest", JSON.stringify({ socketIdDest }));
});

socket.on("peticionVideollamadaEntrante", ({ foto, usuarioRemitente, socketIdDest }) => {
  localStorage.setItem("socketIdDest", JSON.stringify({ socketIdDest }));
  d.body.insertAdjacentHTML("afterbegin", stringVideollamadaEntrante(foto, usuarioRemitente));

  colgarLlamadaFn();

  const contestarLlamada = d.querySelector(".contestarLlamada");
  contestarLlamada.addEventListener("click", () => contestarLlamadaFn(usuarioRemitente));
});

socket.on("videollamadaContestada", async mensaje => {
  const contenedorVideollamadaLocal = d.querySelector(".contenedorVideollamadaLocal");
  const contenedorTextoVideollamada = d.querySelector(".contenedorTextoVideollamada");

  videoRemoto = d.getElementById("videoLlamadaRemota");
  contenedorTextoVideollamada.remove();
  contenedorVideollamadaLocal.removeAttribute("id");

  crearPeer();
  const offer = await pc.createOffer();
  // solo se usa el socketId
  socket.emit("iniciarConexionPeer", { type: 'offer', sdp: offer.sdp }, mensaje);
  await pc.setLocalDescription(offer);

});

socket.on("iniciarConexionPeer", (dataPeerOffer, mensaje) => {
  videoRemoto = d.getElementById("videoLlamadaRemota");
  conexionPeer(dataPeerOffer, mensaje);
});

socket.on("manejarRespuesta", (dataPeerAnswer, mensaje) => {
  conexionPeer(dataPeerAnswer, mensaje);
});

socket.on("newIceCandidate", (candidate, mensaje) => {
  conexionPeer({ type: 'candidate', candidate }, mensaje);
});

socket.on("colgarVideollamada", mensaje => {
  conexionPeer(mensaje);
});
