import { Server } from 'socket.io';
import app from './src/server.js';
import { accionesSocket } from './src/socket.js';

const port = app.get("port");

const servidor = app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});

const io = new Server(servidor, {
  cors: {
    origin: "*"
  }
});

io.on("connection", accionesSocket);
