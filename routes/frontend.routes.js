import { Router } from 'express';
import axios from 'axios';

const router = Router();
const API_URL = 'http://localhost:3000/api'; // URL de tu backend

// 1. Mostrar la vista de Login
router.get('/', (req, res) => {
    res.render('login', { error: null });
});

// 2. Procesar el Login
router.post('/login', async (req, res) => {
    try {
        const { usuario, contraseña } = req.body;
        // Hacemos petición al backend
        const respuesta = await axios.post(`${API_URL}/login`, { usuario, contraseña });
        
        // Guardamos el token en la sesión
        req.session.token = respuesta.data.token;
        
        res.redirect('/dashboard');
    } catch (error) {
        res.render('login', { error: 'Credenciales incorrectas' });
    }
});

// 3. Mostrar el Dashboard (Ruta Protegida)
router.get('/dashboard', async (req, res) => {
    if (!req.session.token) {
        return res.redirect('/');
    }

    try {
        // Consultamos al backend usando el token
        const respuesta = await axios.get(`${API_URL}/usuarios`, {
            headers: { Authorization: `Bearer ${req.session.token}` }
        });
        
        // Enviamos los datos a la vista
        res.render('dashboard', { usuarios: respuesta.data });
    } catch (error) {
        res.redirect('/'); // Si el token expiró, vuelve al login
    }
});

// 4. Cerrar Sesión
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

export default router;