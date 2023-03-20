const d = document;
const inputTemaOscuroClaro = d.querySelector("input[type=checkbox]");

inputTemaOscuroClaro.addEventListener("click", temaOscuroClaro);

function temaOscuroClaro() {
  // Si se checkea el input del tema pasará el tema de la app al oscuro
  if (inputTemaOscuroClaro.checked) {
    !d.body.classList.contains("temaOscuro") && d.body.classList.add("temaOscuro");
    localStorage.setItem("temaApp", JSON.stringify({
      tema: "oscuro"
    }));
    return;
  }

  d.body.classList.contains("temaOscuro") && d.body.classList.remove("temaOscuro");
  localStorage.setItem("temaApp", JSON.stringify({
    tema: "claro"
  }));

}

// Al iniciar la pagina establece el tema oscuro si estaba anteriormente seleccionado
export function establecerTemaApp() {
  const temaApp = JSON.parse(localStorage.getItem("temaApp"));
  if (temaApp && temaApp.tema.toLowerCase() == 'oscuro') {
    d.body.classList.add("temaOscuro");
    inputTemaOscuroClaro.checked = true;
  }

}