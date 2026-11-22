// Redacta los recordatorios y arma los enlaces de WhatsApp y correo de cada alerta.
const INSTITUTO = process.env.INSTITUTO_NOMBRE || 'INTEC';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const dinero = (n) => '$' + Number(n || 0).toLocaleString('es-CO');

const fechaCorta = (iso) => {
    const [, m, d] = String(iso).slice(0, 10).split('-').map(Number);
    return `${d} de ${MESES[m - 1]}`;
};

// Celular colombiano de 10 dígitos (con o sin +57, espacios o guiones) -> '57' + número. Si no es válido, ''.
export const telefonoWhatsApp = (telefono) => {
    const digitos = String(telefono || '').replace(/\D/g, '');
    if (digitos.length === 10) return `57${digitos}`;
    if (digitos.length === 12 && digitos.startsWith('57')) return digitos;
    return '';
};

export const construirMensaje = (a) => {
    const partes = [`Hola ${a.nombres}, te escribimos de ${INSTITUTO}.`];

    if (a.por_mora) {
        partes.push(`Tienes ${a.cuotas_vencidas} ${a.cuotas_vencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'} `
            + `de tu programa ${a.programa}, por un valor de ${dinero(a.valor_vencido)}.`);
    }
    if (a.por_ingreso) {
        partes.push(a.ultimo_acceso
            ? `Notamos que hace ${a.dias_sin_ingreso} días no ingresas a tus clases.`
            : 'Notamos que aún no has ingresado a tus clases.');
    }
    if (a.por_vencer) {
        partes.push(`Te recordamos que tu próxima cuota de ${a.programa}, por ${dinero(a.proxima_valor)}, `
            + `vence el ${fechaCorta(a.proxima_cuota)}.`);
    }

    if (a.por_mora) partes.push('Si ya realizaste el pago, ignora este mensaje. Si necesitas ayuda para ponerte al día, escríbenos.');
    else if (a.por_ingreso) partes.push('¿Hay algo en lo que podamos ayudarte para que continúes con tu proceso?');
    else partes.push('Gracias por tu puntualidad.');

    return partes.join(' ');
};

export const enlaces = (a) => {
    const mensaje = construirMensaje(a);
    const telefono = telefonoWhatsApp(a.telefono);
    return {
        mensaje,
        whatsapp: telefono ? `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}` : '',
        correo: a.email
            ? `mailto:${a.email}?subject=${encodeURIComponent(`Recordatorio de ${INSTITUTO}: ${a.programa}`)}`
              + `&body=${encodeURIComponent(mensaje)}`
            : ''
    };
};
