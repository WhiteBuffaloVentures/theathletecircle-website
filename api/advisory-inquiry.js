import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.ATHLETECIRCLE_SHEET_ID;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, sport, grade, situation } = req.body;

    if (!name || !email || !sport || !situation) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Each integration below is isolated so that one failure cannot block the
    // others. A Google Sheets outage must NOT prevent the prospect confirmation
    // email or the admin notification from being sent.
    const warnings = [];

    // Step 1: Look up the contact in the CRM and flag advisory interest
    // (best-effort, non-blocking for the emails below).
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SHEET_ID,
            range: 'CRM!A:J',
        });

        const rows = response.data.values || [];
        const headerRow = rows[0] || [];
        const emailColIndex = headerRow.indexOf('Email');

        let rowIndex = null;
        if (emailColIndex !== -1) {
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][emailColIndex] === email) {
                    rowIndex = i + 1;
                    break;
                }
            }
        }

        if (rowIndex) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: `CRM!I${rowIndex}:J${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        'Advisory Inquiry',  // Advisory Interest status
                        'Advisory Inquiry'   // Overall status
                    ]],
                },
            });
        }
    } catch (sheetsError) {
        console.error('[advisory-inquiry] Google Sheets lookup/update failed:', sheetsError);
        warnings.push('crm_update_failed');
    }

    // Step 2: Notify Connor / admin inbox (best-effort, independent of Sheets).
    try {
        await resend.emails.send({
            from: 'hello@athletecircle.ai',
            to: 'hello@athletecircle.ai',
            subject: `🎯 Advisory Inquiry: ${name} (${sport})`,
            html: `
                <h3>New Advisory Inquiry</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Sport:</strong> ${sport}</p>
                <p><strong>Grade:</strong> ${grade || 'Not provided'}</p>
                <p><strong>Situation:</strong></p>
                <p>${situation.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}">View in CRM</a></p>
                <p><strong>Next Step:</strong> Reply to confirm availability & scope discussion</p>
            `,
        });
    } catch (adminError) {
        console.error('[advisory-inquiry] Admin notification email failed:', adminError);
        warnings.push('admin_email_failed');
    }

    // Step 3: Send the confirmation to the prospect. This is the user-facing
    // outcome; its success drives the response.
    let confirmationSent = false;
    try {
        await resend.emails.send({
            from: 'hello@athletecircle.ai',
            to: email,
            subject: "Let's Build Your Advisory Circle",
            html: `
                <h2>We Got Your Inquiry</h2>
                <p>Thanks for sharing your situation. We're reviewing the details and will reach out within 24 hours with next steps.</p>

                <p><strong>What to expect:</strong></p>
                <ol>
                    <li>Initial call to understand your specific situation (30 min)</li>
                    <li>Custom advisory proposal based on your needs</li>
                    <li>Statement of Work (SoW) for agreed scope</li>
                </ol>

                <p>We'll be in touch soon.</p>
                <p>— The Athlete Circle Team</p>
            `,
            reply_to: email,
        });
        confirmationSent = true;
    } catch (confirmationError) {
        console.error('[advisory-inquiry] Confirmation email to prospect failed:', confirmationError);
    }

    // If the prospect confirmation email could not be sent, report an error so
    // the caller can keep the user on the form. Sheets and admin-email failures
    // are surfaced as warnings but do not, by themselves, fail the submission.
    if (!confirmationSent) {
        return res.status(502).json({
            error: 'We could not send your confirmation email right now. Please try again in a moment.',
            warnings,
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Inquiry received. Connor will reach out within 24 hours.',
        warnings,
    });
}
