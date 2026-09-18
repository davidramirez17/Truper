import nodemailer from 'nodemailer';

type AlertDetails = {
    proyecto: string;
    error: string;
    contexto?: string;
};

export async function notificarFallo({ proyecto, error, contexto }: AlertDetails) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        console.error('ADMIN_EMAIL no está configurado.', { proyecto, error });
        return;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: adminEmail,
            subject: `[Plataforma de Ventas] Fallo en ${proyecto}`,
            text: [
                `Proyecto: ${proyecto}`,
                `Error: ${error}`,
                contexto ? `Contexto: ${contexto}` : '',
                `Fecha: ${new Date().toISOString()}`,
            ].filter(Boolean).join('\n'),
        });
    } catch (notificationError) {
        console.error('No se pudo enviar la alerta administrativa.', notificationError);
    }
}
