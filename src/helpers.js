export function buscarUsuario (usuarios, nombreUsuario, idUsuario) {
  return usuarios.find(usuario =>
    usuario?.nombreUsuario?.toLowerCase() === nombreUsuario?.toLowerCase() &&
    usuario?.id === idUsuario
  )
}

export function escaparHtmlCaracteres (texto) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&#39;')
    .replaceAll('"', '&#34;')
    .replaceAll('/', '&#47;')
    .replaceAll('\\', '&#92;')
}
