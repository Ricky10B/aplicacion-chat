import { v4 } from 'uuid';
import { escaparHtmlCaracteres } from './helpers.js';
import { usuarios, mensajes } from './server.js';

export function metodosMensajes(socket) {
  socket.on("chatSeleccionado", ({ ariaId, usuarioLocal }) => {
    const usuarioEncontrado = usuarios.find(usuario => usuario.id == ariaId);
    if(!usuarioEncontrado) return;
    const todosMensajesChats = mensajes.filter(mensaje => {
      const idUsuarioRem = mensaje.usuarioRem.id;
      const idUsuarioDest = mensaje.usuarioDest.id;
      const idUsuarioLocal = usuarioLocal.id;

      // Condicion de los mensajes del usuario remitente
      const condicionUsuarioRem = (
        idUsuarioRem == idUsuarioLocal &&
        idUsuarioDest == usuarioEncontrado.id &&
        !mensaje.msjEliminado.usuarioRem
      );
      // Condicion de los mensajes del usuario destinatario
      const condicionUsuarioDest = (
        idUsuarioDest == idUsuarioLocal &&
        idUsuarioRem == usuarioEncontrado.id &&
        !mensaje.msjEliminado.usuarioDest
      );
      return condicionUsuarioRem || condicionUsuarioDest;
    });

    const cantidadMensajesNoLeidos = todosMensajesChats.filter(msj => msj.usuarioDest.id == usuarioLocal.id && !msj.leido).length;

    socket.emit("chatSeleccionado", {
      ariaId,
      usuarioLocal,
      usuarioEncontrado,
      todosMensajesChats,
      cantidadMensajesNoLeidos
    });
  });

  socket.on("escribiendo", mensaje => {
    const usuarioDest = usuarios.find(usuario => usuario.id == mensaje.idUsuarioDest);
    if(!usuarioDest) return;
    socket.to(usuarioDest.socketId).emit("escribiendo", mensaje);
  });

  socket.on("dejoDeEscribir", mensaje => {
    const usuarioDest = usuarios.find(usuario => usuario.id == mensaje.idUsuarioDest);
    
    if(!usuarioDest) return;
    mensaje.usuarioDest = usuarioDest;
    socket.to(usuarioDest.socketId).emit("dejoDeEscribir", mensaje);
  });

  socket.on("mensaje", event => {
    const { mensaje, usuarioDest, usuarioRem } = event;
    const usuarioEncontrado = usuarios.find(usuario => usuario.nombreUsuario == usuarioDest.nombreUsuario);
    
    if(!usuarioEncontrado) return;
    const fechaMensaje = new Date().getTime();

    const mensajeArreglado = escaparHtmlCaracteres(mensaje)

    const mensajeAGuardar = {
      id: v4(),
      mensaje: mensajeArreglado,
      leido: false,
      usuarioRem,
      usuarioDest,
      fechaMensaje,
      msjEliminado: {
        usuarioRem: false,
        usuarioDest: false
      }
    }
    mensajes.push(mensajeAGuardar);
    
    socket
      .to(usuarioEncontrado.socketId)
      .emit("mensaje", mensajeAGuardar);

    socket.emit("mensajeGuardado", mensajeAGuardar);
  });

  socket.on("mensajeLeido", event => {
    const indiceMensajeEncontrado = mensajes.findIndex(mensaje => mensaje.id == event.id);
    if(indiceMensajeEncontrado == -1) return;
    
    mensajes[indiceMensajeEncontrado].leido = true;
  });

  socket.on("eliminarMensaje", event => {
    const indiceMensajeBorrar = mensajes.findIndex(mensaje => mensaje.id == event.idMensaje);
    if(indiceMensajeBorrar == -1) return;
    
    const mensajeEncontrado = mensajes[indiceMensajeBorrar];

    // Marca como mensaje eliminado todos los mensajes del usuario que vació el chat
    // sin afectar los mensajes del otro usuario
    if(mensajeEncontrado.usuarioDest.id == event.idUserDest) {
      mensajeEncontrado.msjEliminado.usuarioRem = true;
    } else if(mensajeEncontrado.usuarioRem.id == event.idUserDest) {
      mensajeEncontrado.msjEliminado.usuarioDest = true;
    }
  });

}
