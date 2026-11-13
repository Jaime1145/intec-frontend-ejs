import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/frontend.routes.js';

const app = express();
const PORT = 4000; // Usamos el 4000 porque el 3000 lo tiene el backend

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuraciones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones (para guardar el token)
app.use(session({
    secret: 'secreto_intec',
    resave: false,
    saveUninitialized: true
}));

// Rutas
app.use('/', router);

app.listen(PORT, () => {
    console.log(`Frontend EJS corriendo en http://localhost:${PORT}`);
});