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

// Fecha de hoy en Colombia: AAAA-MM-DD
const hoyColombia = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });

// Periodo sugerido: AAAA-1 (ene-jun) o AAAA-2 (jul-dic)
const periodoSugerido = () => {
    const [anio, mes] = hoyColombia().split('-').map(Number);
    return `${anio}-${mes <= 6 ? 1 : 2}`;
};

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

// ---------- Matrículas ----------
router.get('/matriculas', requiereSesion, async (req, res) => {
    try {
        const { data } = await api(req).get('/matriculas');
        res.render('matriculas', { matriculas: data });
    } catch (error) {
        falloVista(req, res, error, 'matriculas', { matriculas: [] });
    }
});

// Debe ir antes de /matriculas/:id para que "nueva" no se tome como un id
router.get('/matriculas/nueva', requiereSesion, async (req, res) => {
    try {
        const cliente = api(req);
        const [est, prog] = await Promise.all([cliente.get('/estudiantes'), cliente.get('/programas')]);
        res.render('matricula_nueva', {
            estudiantes: est.data,
            programas: prog.data.filter((p) => p.activo),
            hoy: hoyColombia(),
            periodo: periodoSugerido(),
            elegido: (req.query.estudiante || '').toString()
        });
    } catch (error) {
        falloVista(req, res, error, 'matricula_nueva', {
            estudiantes: [], programas: [], hoy: hoyColombia(), periodo: periodoSugerido(), elegido: ''
        });
    }
});

router.post('/matriculas', requiereSesion, async (req, res) => {
    try {
        const { data } = await api(req).post('/matriculas', req.body);
        avisar(req, 'success', 'Matrícula creada con sus cuotas');
        res.redirect(`/matriculas/${data.id}`);
    } catch (error) {
        falloAccion(req, res, error, '/matriculas/nueva');
    }
});

router.get('/matriculas/:id', requiereSesion, async (req, res) => {
    try {
        const { data } = await api(req).get(`/matriculas/${encodeURIComponent(req.params.id)}`);
        res.render('matricula_detalle', { m: data, hoy: hoyColombia() });
    } catch (error) {
        falloAccion(req, res, error, '/matriculas');
    }
});

router.post('/matriculas/:id/estado', requiereSesion, async (req, res) => {
    const id = encodeURIComponent(req.params.id);
    try {
        await api(req).put(`/matriculas/${id}/estado`, { estado: req.body.estado });
        avisar(req, 'success', 'Estado actualizado');
    } catch (error) {
        return falloAccion(req, res, error, `/matriculas/${id}`);
    }
    res.redirect(`/matriculas/${id}`);
});

// Registrar el pago de una cuota; vuelve a la matrícula a la que pertenece
router.post('/pagos/:id/pagar', requiereSesion, async (req, res) => {
    const volver = `/matriculas/${encodeURIComponent((req.body.matricula_id || '').toString())}`;
    try {
        await api(req).put(`/pagos/${encodeURIComponent(req.params.id)}/pagar`, {
            metodo: req.body.metodo,
            fecha_pago: req.body.fecha_pago || undefined
        });
        avisar(req, 'success', 'Pago registrado correctamente');
        res.redirect(volver);
    } catch (error) {
        falloAccion(req, res, error, req.body.matricula_id ? volver : '/matriculas');
    }
});

export default router;
