const d = document;

function verImagenCompleta(e, img) {
  e.stopPropagation();
  d.body.insertAdjacentHTML("afterbegin", `
    <div class="fondoModal">
      <div class="cerrarModal">
        <span>X</span>
      </div>
      <div class="contenedorFotoDeUsuario">
        <img src="${img.src}" alt="${img.alt}" width="35%" height="auto">
      </div>
    </div>
  `);

  const cerrarModal = d.querySelector(".cerrarModal");
  cerrarModal.addEventListener("click", () =>
    d.querySelector(".fondoModal").remove()
  );
}

export function agregarFnImagenCompleta(imgUsersChats) {
  imgUsersChats.forEach(img =>
    img.addEventListener("click", (e) => verImagenCompleta(e, img))
  );
}