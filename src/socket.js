import { metodosVideollamada } from './socketVideollamada.js';
import { metodosMensajes } from './socketMensajes.js';
import { FOTO_POR_DEFECTO } from './consts.js';
import { mensajes, usuarios } from './server.js';
import { buscarUsuario } from './helpers.js'

// Crea 5 usuarios de prueba
// No realizan ninguna acción, solo son de muestra
Array.from({ length: 5 }, (_, i) => i).forEach(index => {
  usuarios.unshift({
    id: index + 1,
    nombreUsuario: `Usuario ${index+1}`,
    foto: FOTO_POR_DEFECTO,
    enLinea: false
  });
});

export function accionesSocket(socket) {
  // Agrega el socketId al usuario y agrega el socket a la sala chatRoom para iniciar la app
  socket.on("nuevoUsuario", mensaje => {
    const { usuarioAgregado } = mensaje;

    const indiceUsuarioEncontrado = usuarios.findIndex(usuario => usuario.id == usuarioAgregado.id);
    if (indiceUsuarioEncontrado == -1) {
      socket.emit("usuarioAgregado", {
        mensaje: "Ocurrió un error inesperado al iniciar la app",
        ok: false
      });
      return;
    }
    const nuevoUsuario = usuarios[indiceUsuarioEncontrado];
    nuevoUsuario.socketId = socket.id
    socket.join("chatRoom");

    socket.emit("usuarioAgregado", {
      mensaje: "Usuario agregado con exito",
      ok: true,
      usuarios,
      usuarioAgregado: nuevoUsuario,
      mensajes: []
    });

    socket.to("chatRoom").emit("nuevoUsuario", nuevoUsuario);
  });

  socket.on("verificarUsuarioExiste", datosUsuario => {
    const { nombreUsuario, id: idUsuario } = datosUsuario
    
    const usuarioEncontrado = buscarUsuario(usuarios, nombreUsuario, idUsuario)
    if(!usuarioEncontrado) {
      socket.emit("usuarioValido", {
        msg: "El usuario no es valido o no existe",
        ok: false
      });
      return;
    }

    usuarioEncontrado.socketId = socket.id;
    // Filtra los mensajes que son del usuario y que no han sido eliminados
    const msjs = mensajes.filter(mensaje =>
      (mensaje.usuarioRem.id == usuarioEncontrado.id) ||
      (mensaje.usuarioDest.id == usuarioEncontrado.id)
      // (mensaje.usuarioRem.id == usuarioEncontrado.id && !mensaje.msjEliminado.usuarioRem) ||
      // (mensaje.usuarioDest.id == usuarioEncontrado.id && !mensaje.msjEliminado.usuarioDest)
    );

    const chatsOrdenados = ordenarMensajes(msjs, usuarioEncontrado);
    
    socket.join("chatRoom");
    socket.emit("usuarioValido", {
      msg: "Usuario valido",
      ok: true,
      usuarios,
      usuarioValido: usuarioEncontrado,
      mensajes: chatsOrdenados
    });

  });

  metodosMensajes(socket);
  metodosVideollamada(socket);

  socket.on("enLinea", mensaje => {
    const indiceUsuarioConectado = usuarios.findIndex(usuario => usuario.nombreUsuario == mensaje.usuarioEnLinea.nombreUsuario);
    
    if(indiceUsuarioConectado == -1) return;
    usuarios[indiceUsuarioConectado].enLinea = true;
    socket.to("chatRoom").emit("enLinea", mensaje);
  });

  socket.on("disconnect", () => {
    const indiceUsuarioDesconectado = usuarios.findIndex(usuario => usuario.socketId == socket.id);

    if(indiceUsuarioDesconectado == -1) return;
    socket.leave("chatRoom");
    usuarios[indiceUsuarioDesconectado].enLinea = false;
    socket.to("chatRoom").emit("fueraDeLinea", { usuarioDesconectado: usuarios[indiceUsuarioDesconectado] });
  });

}

function ordenarMensajes(msjs, usuarioEnSesion) {
  if(!usuarioEnSesion) return;
  let totalDatosChats = usuarios.map(usuario => {
    // filtramos por los mensajes entre los 2 usuarios del chat
    const totalMensajesChat = msjs
      .filter(mensaje => {
        const usuarioDest = mensaje.usuarioDest.id;
        const usuarioRem = mensaje.usuarioRem.id;
        return (
          // verifica que el usuario haya enviado o recibido mensajes con este usuario
          usuarioDest == usuario.id && usuarioRem == usuarioEnSesion.id ||
          usuarioRem == usuario.id && usuarioDest == usuarioEnSesion.id
        )
      });

    // Último mensaje del chat
    const ultimoMensaje = totalMensajesChat.at(-1);
    // Filtra los mensajes sin leer
    const cantidadMensajesNoLeidos = totalMensajesChat.filter(msj => msj.usuarioDest.id == usuarioEnSesion.id && !msj.leido).length;

    return {
      usuario,
      ultimoMensaje,
      cantidadMensajesNoLeidos
    }
  });

  /**
   * Se ordenan los chats con mensajes desde el más reciente al menos reciente
   * los chats sin mensajes van después de los chats con mensajes
   */
  // Chats sin mensajes
  let chatsFinal = totalDatosChats.filter(mensaje => !mensaje.ultimoMensaje);
  // Chats con mensajes
  let chatsInicio = totalDatosChats
    .filter(mensaje => mensaje.ultimoMensaje)
    // Ordena los mensajes por la fecha del ultimo mensaje
    .sort((a,b) => b.ultimoMensaje.fechaMensaje - a.ultimoMensaje.fechaMensaje)
    // Elimina el ultimo mensaje si no puede verlo el usuario
    .map(mensaje => {
      const um = mensaje.ultimoMensaje;
      if(!(um.usuarioRem.id == usuarioEnSesion.id && !um.msjEliminado.usuarioRem ||
        um.usuarioDest.id == usuarioEnSesion.id && !um.msjEliminado.usuarioDest)) {
        mensaje.ultimoMensaje = undefined;
      }
      return mensaje;
    });
  
  return chatsInicio.concat(chatsFinal);
}
