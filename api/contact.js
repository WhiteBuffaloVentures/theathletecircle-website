import { Resend } from 'resend';

const resend = new Resend('re_b32VuVpp_DUvHwqdBj3KczjtNJpUo2RzT');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, athlete, sport, message } = req.body;

    if (!name || !email || !athlete || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await resend.emails.send({
            from: 'noreply@athletecircle.ai',
            to: 'hello@athletecircle.ai',
            subject: `New Circle Consultation Request from ${name}`,
            html: `
                <h2>New Consultation Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Athlete:</strong> ${athlete}</p>
                <p><strong>Sport/Background:</strong> ${sport || 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `,
            reply_to: email,
        });

        return res.status(200).json({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
