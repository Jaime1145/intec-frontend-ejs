import { Router } from 'express';
import axios from 'axios';

const router = Router();
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

// Cliente del backend con el token de la sesión
const api = (req) => axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${req.session.token}` },
    timeout: 15000
});

const avisar = (req, tipo, texto) => { req.session.mensaje = { tipo, texto }; };

const textoError = (error) =>
    error.response?.data?.error || 'No se pudo conectar con el backend';

// Exige sesión y deja listos el mensaje flash y el formateador de dinero
const requiereSesion = (req, res, next) => {
    if (!req.session.token) return res.redirect('/');
    res.locals.mensaje = req.session.mensaje || null;
    delete req.session.mensaje;
    res.locals.dinero = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
    next();
};

// Token vencido: vuelve al login. Cualquier otro error: avisa y regresa a la página indicada
const falloAccion = (req, res, error, volver) => {
    if (error.response?.status === 401) {
        return req.session.destroy(() => res.redirect('/'));
    }
    avisar(req, 'danger', textoError(error));
    res.redirect(volver);
};

// Igual que falloAccion pero para páginas que muestran datos: se dibuja la vista vacía con el aviso
const falloVista = (req, res, error, vista, datos) => {
    if (error.response?.status === 401) {
        return req.session.destroy(() => res.redirect('/'));
    }
    res.locals.mensaje = { tipo: 'danger', texto: textoError(error) };
    res.status(502).render(vista, datos);
};

// ---------- Estudiantes ----------
router.get('/estudiantes', requiereSesion, async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    try {
        const { data } = await api(req).get('/estudiantes', { params: { q } });
        res.render('estudiantes', { estudiantes: data, q });
    } catch (error) {
        falloVista(req, res, error, 'estudiantes', { estudiantes: [], q });
    }
});

router.post('/estudiantes', requiereSesion, async (req, res) => {
    try {
        await api(req).post('/estudiantes', req.body);
        avisar(req, 'success', 'Estudiante creado correctamente');
        res.redirect('/estudiantes');
    } catch (error) {
        falloAccion(req, res, error, '/estudiantes');
    }
});

router.get('/estudiantes/:id/editar', requiereSesion, async (req, res) => {
    try {
        const { data } = await api(req).get(`/estudiantes/${encodeURIComponent(req.params.id)}`);
        res.render('estudiante_editar', { e: data });
    } catch (error) {
        falloAccion(req, res, error, '/estudiantes');
    }
});

router.post('/estudiantes/:id', requiereSesion, async (req, res) => {
    const id = encodeURIComponent(req.params.id);
    try {
        await api(req).put(`/estudiantes/${id}`, req.body);
        avisar(req, 'success', 'Estudiante actualizado correctamente');
        res.redirect('/estudiantes');
    } catch (error) {
        falloAccion(req, res, error, `/estudiantes/${id}/editar`);
    }
});

router.post('/estudiantes/:id/eliminar', requiereSesion, async (req, res) => {
    try {
        await api(req).delete(`/estudiantes/${encodeURIComponent(req.params.id)}`);
        avisar(req, 'success', 'Estudiante eliminado');
        res.redirect('/estudiantes');
    } catch (error) {
        falloAccion(req, res, error, '/estudiantes');
    }
});

// ---------- Programas ----------
router.get('/programas', requiereSesion, async (req, res) => {
    try {
        const { data } = await api(req).get('/programas');
        res.render('programas', { programas: data });
    } catch (error) {
        falloVista(req, res, error, 'programas', { programas: [] });
    }
});

router.post('/programas', requiereSesion, async (req, res) => {
    try {
        await api(req).post('/programas', req.body);
        avisar(req, 'success', 'Programa creado correctamente');
        res.redirect('/programas');
    } catch (error) {
        falloAccion(req, res, error, '/programas');
    }
});

router.post('/programas/:id', requiereSesion, async (req, res) => {
    try {
        await api(req).put(`/programas/${encodeURIComponent(req.params.id)}`, req.body);
        avisar(req, 'success', 'Programa actualizado correctamente');
        res.redirect('/programas');
    } catch (error) {
        falloAccion(req, res, error, '/programas');
    }
});

export default router;
