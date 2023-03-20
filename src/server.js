import express from "express";
import fileUpload from 'express-fileupload';
import { v4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, rmSync } from 'fs';
import { buscarUsuario } from './helpers.js'
import {
  USUARIOS_POR_DEFECTO,
  RUTA_POR_DEFECTO,
  FOTO_POR_DEFECTO,
  IMAGENES_PERMANENTES
} from './consts.js'

export let usuarios = [];
export let mensajes = [];

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rutaImagenes = __dirname + '/../public/assets/imgs/';

// Configuraciones
app.set("port", PORT);

// Middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../", "public")));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }
}));

/* Un nuevo usuario ingresa a la aplicación */
app.post("/nuevoUsuario", (req, res) => {
  const { nombreUsuario } = req.body;

  const usuarioEncontrado = buscarUsuario(usuarios, nombreUsuario, null)
  if (usuarioEncontrado) {
    return res.json({
      mensaje: "El nombre de usuario ya existe",
      ok: false
    });
  }

  let nuevaFoto = '';
  if(!req.files || Object.keys(req.files).length == 0) {
    nuevaFoto = FOTO_POR_DEFECTO;
  } else {
    const extFoto = req.files.foto.name.split(".").at(-1);

    if(!["jpg", "png", "jpeg"].includes(extFoto)) {
      return res.json({
        mensaje: "El formato de la foto es incorrecta",
        ok: false
      });
    }

    const nombreImagen = v4();
    const imagen = nombreImagen + "." + extFoto;
    // ruta para subir las fotos de los usuarios
    let ruta = rutaImagenes + imagen;
    nuevaFoto = RUTA_POR_DEFECTO + imagen;

    // Sube la foto al servidor
    req.files.foto.mv(ruta, err => {
      if(err) {
        console.log(err);
        return res.send({
          ok: false,
          mensaje: err
        });
      }
    });
  }

  const id = v4();
  const nuevoUsuario = {
    id,
    nombreUsuario,
    foto: nuevaFoto,
    enLinea: true
  }

  usuarios.unshift(nuevoUsuario);
  return res.json({
    ok: true,
    usuarioAgregado: nuevoUsuario
  });
  
});

// Elimina todos los datos después de cierto tiempo
// en este caso después de 7 días
setInterval(() => {
  mensajes = [];
  // Elimina todos los usuarios y solo deja los usuarios de prueba
  usuarios = usuarios.filter(usuario => USUARIOS_POR_DEFECTO.includes(usuario.nombreUsuario.toLowerCase()));
  // Leer los archivos de assets/imgs y eliminar todas las fotos
  // excepto la imagen por defecto
  readdirSync(rutaImagenes).forEach(file => {
    if (!IMAGENES_PERMANENTES.includes(file)) {
      rmSync(rutaImagenes + file);
    }
  });
}, 60 * 60 * 24 * 7 * 1000);

export default app;
