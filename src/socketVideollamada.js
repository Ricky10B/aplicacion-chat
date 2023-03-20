import { usuarios } from './server.js';

export function metodosVideollamada(socket) {
  socket.on("peticionVideollamada", mensaje => {
    const { nombreUsuario } = mensaje;
    const usuarioEncontrado = usuarios.find(usuario => usuario.nombreUsuario == nombreUsuario);
    if(!usuarioEncontrado) return;

    mensaje.socketIdDest = socket.id;
    socket.emit("inicioComunicacionVideollamada", { socketIdDest: usuarioEncontrado.socketId });
    socket
      .to(usuarioEncontrado.socketId)
      .emit("peticionVideollamadaEntrante", mensaje);
  });

  socket.on("videollamadaContestada", mensaje => {
    const { nombreUsuarioRemitente } = mensaje;
    const usuarioEncontrado = usuarios.find(usuario => usuario.nombreUsuario == nombreUsuarioRemitente);

    if(!usuarioEncontrado) return;

    mensaje.socketId = usuarioEncontrado.socketId;
    mensaje.socketIdDest = socket.id;
    socket
      .to(usuarioEncontrado.socketId)
      .emit("videollamadaContestada", mensaje);
  });

  socket.on("iniciarConexionPeer", (dataPeerOffer, mensaje) => {
    if(!mensaje.socketIdDest) return;
    socket
      .to(mensaje.socketIdDest)
      .emit("iniciarConexionPeer", dataPeerOffer, { socketIdDest: socket.id });
  });

  socket.on("manejarRespuesta", (dataPeerAnswer, mensaje) => {
    if(!mensaje.socketIdDest) return;
    socket
      .to(mensaje.socketIdDest)
      .emit("manejarRespuesta", dataPeerAnswer, mensaje);
  });

  socket.on("newIceCandidate", (candidate, mensaje) => {
    if(!mensaje.socketIdDest) return;
    socket
      .to(mensaje.socketIdDest)
      .emit("newIceCandidate", candidate, mensaje);
  });

  socket.on("colgarVideollamada", ({ type, socketIdDest }) => {
    if(!socketIdDest.socketIdDest) return;
    socket
      .to(socketIdDest.socketIdDest)
      .emit("colgarVideollamada", { type });
  });
}
