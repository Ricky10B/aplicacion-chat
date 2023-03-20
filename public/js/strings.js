export function stringChat(usuario, ultimoMensaje, cantidadMensajesNoLeidos) {
  return `
    <div class="chat" aria-id="${usuario.id}">
      <div class="imgUserChat">
        <img src="${usuario.foto}" alt="Foto de perfil del usuario" width="100%" height="100%">
      </div>
      <div class="descripcionUserChat">
        <div>
          <p class="nombreUsuarioChat">${usuario.nombreUsuario}</p>
          <small class="ultimoMensajeRecibido">${!ultimoMensaje ? '' : ultimoMensaje.mensaje}</small>
        </div>
      </div>
      <div class="mensajesEntrantesChat">
        <span style="display: ${cantidadMensajesNoLeidos ? 'block' : 'none'}">${cantidadMensajesNoLeidos}</span>
      </div>
    </div>`;
}

export function stringChatSeleccionado(ariaId, usuarioEncontrado) {
  return `
    <section class="contenedorChat">
      <div class="contenedorIconoIrHaciaAbajo">
        <ion-icon name="chevron-down-circle-outline" class="iconoIrHaciaAbajo"></ion-icon>
      </div>
      <div class="contenedorSpinner contenedorSpinnerFondoClaro">
        <div class="spinner"></div>
      </div>
      <div class="datosUsuarioChat" aria-id="${ariaId}">
        <ion-icon name="arrow-back-outline" class="btnDevolver"></ion-icon>
        <div class="imgUserChat">
          <img src="${usuarioEncontrado.foto}" alt="Foto de perfil del usuario" width="100%" height="100%">
        </div>
        <div class="contenedorDatosUsuario">
          <p>${usuarioEncontrado.nombreUsuario}</p>
          <small id="enLineaEscribiendo">${ usuarioEncontrado.enLinea ? 'en linea' : '' }</small>
        </div>
        <div class="contenedorIconos">
          <ion-icon name="videocam-outline" id="btnVideoLlamada"></ion-icon>
          <ion-icon name="ellipsis-vertical-outline" id="btnEllipsis"></ion-icon>
          <div class="menuOpcionesChat hide">
            <ul>
              <li id="btnVaciarChat">Vaciar Chat</li>
            </ul>
          </div>
        </div>
      </div>
      <div class="mensajesChat"></div>
      <div class="enviarMensajeChat">
        <form id="formEnviarMensaje">
          <input type="text" id="mensajeUsuario" placeholder="Mensaje" autocomplete="off" autofocus autocapitalize="on">
          <ion-icon name="send-outline" id="btnEnviarMensaje"></ion-icon>
        </form>
      </div>
    </section>`;
}

export function stringMensajeUnico(idMensaje, receptor, mensaje, horaMensaje, fecha) {
  return `
    <div class="contenedorMensaje ${receptor ? 'contenedorMensajeReceptor' : 'contenedorMensajeRemitente'}" aria-id="${idMensaje}" aria-fecha="${fecha}">
      <div class="mensaje ${receptor ? 'mensajeReceptor' : 'mensajeRemitente'}">
        <p>${mensaje}</p>
        <small>${horaMensaje}</small>
      </div>
    </div>`;
}

export function stringVideollamada(contestada) {
  return `
    <div class="fondoModal modalVideoLlamada">
      ${contestada ? '' : `<div class="contenedorTextoVideollamada">
        <p>llamando...</p>
      </div>`}
      <div class="contenedorIconosVideollamada">
        <ion-icon name="mic-circle-outline" class="iconoVideollamada"></ion-icon>
        <ion-icon name="call-outline" class="colgarLlamada btnCerrarVideollamada iconoVideollamada"></ion-icon>        
        <ion-icon name="videocam-outline" class="iconoVideollamada"></ion-icon>
      </div>
      <div class="contenedorVideo">
        <video src="" autoplay id="videoLlamadaRemota" class="videollamada"></video>
      </div>
      <div class="contenedorVideollamadaLocal" id="llamando">
        <video src="" autoplay id="videoLlamadaLocal" class="videollamada"></video>
      </div>
    </div>`
}

export function stringVideollamadaEntrante(foto, usuarioRemitente) {
  return `
    <div class="fondoModal modalVideoLlamada videollamandoEntrante">
      <div class="llamadaEntranteYSaliente">
        <div class="datosUsuarioLlamada">
          <img src="${foto}" alt="foto del usuario" width="100%" height="100%">
          <p>${usuarioRemitente}</p>
        </div>
        <div class="textoLlamada">
          <span>videollamando entrante</span>
        </div>
        <div class="botonesLlamadas">
          <button class="colgarLlamada">Colgar</button>
          <button class="contestarLlamada">Contestar</button>
        </div>
      </div>
    </div>`;
}

export function notificacionMensaje(mensaje) {
  return `
    <div class="notificacion notificacionMensaje">
      <div class="contenedorImagenNotificacion">
        <img src="${mensaje.usuarioDest.foto}" alt="Foto del usuario que mandó el mensaje" width="100%" height="100%">
      </div>
      <div class="contenedorDatosNotificacion">
        <ion-icon name="notifications" id="iconoCampanaNotificacion"></ion-icon>
        <p class="nombreUsuarioNotificacion">${mensaje.usuarioRem.nombreUsuario}</p>
        <small class="mensajeNotificacion">${mensaje.mensaje}</small>
      </div>
    </div>`;
}

export function notificacionErrorVideollamada() {
  return `
  <div class="notificacion errorVideollamada">
    <div class="contenedorMensajeErrorNotificacion">
      <p>Ocurrió un error de conexión y se finalizó la videollamada</p>
    </div>
  </div>`;
}

export function notificacionErrorPermisoDenegado(mensaje) {
  return `
    <div class="notificacion errorVideollamada">
      <div class="contenedorMensajeErrorNotificacion">
        <p>${mensaje}</p>
      </div>
    </div>`;
}

export function stringMensajesNoLeidos(cantidadMensajesNoLeidos) {
  return `
    <div id="contenedorMensajesNoLeidos">
      <div class="mensajesNoLeidos">
        <span>${cantidadMensajesNoLeidos} Mensajes no leidos</span>
      </div>
    </div>`;
}
