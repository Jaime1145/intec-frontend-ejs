
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/frontend.routes.js';
import modulos from './routes/modulos.routes.js';

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuraciones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'secreto_intec',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Rutas
app.use('/', router);
app.use('/', modulos);

// Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Frontend INTEC funcionando en el puerto ${PORT}`);
});
