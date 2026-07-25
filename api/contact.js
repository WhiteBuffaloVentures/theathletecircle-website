import { Resend } from 'resend';
import { google } from 'googleapis';

const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.ATHLETECIRCLE_SHEET_ID; // CRM Database sheet ID

// Public, website-hosted copy of the current Free Guide.
// Stable production path — future guide updates replace the PDF at this same
// filename so this URL never has to change.
const FREE_GUIDE_URL = 'https://athletecircle.ai/guide/TAC_Free_Guide_5_Decisions.pdf';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, athlete, sport, grade, message } = req.body;

    // Validate required fields
    if (!name || !email || !athlete || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Each integration below is isolated so that one failure cannot block the
    // others. In particular, a Google Sheets outage must NOT prevent the
    // submitter confirmation email or the admin notification from being sent.
    const warnings = [];

    // Step 1: Add contact to Google Sheets CRM (best-effort, non-blocking).
    // Column K captures the Athlete Name (see CRM_SETUP_GUIDE.md).
    try {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'CRM!A:K',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    timestamp,           // A  Date
                    name,                // B  Name (submitter)
                    email,               // C  Email
                    phone || '',         // D  Phone
                    sport || '',         // E  Sport
                    grade || '',         // F  Grade (not collected on this form)
                    'Pending',           // G  Free Guide Sent
                    '',                  // H  Paid Ebook Status (empty until purchase)
                    message ? 'Yes' : '', // I  Advisory Interest
                    'Free Guide',        // J  Status
                    athlete || ''        // K  Athlete Name
                ]],
            },
        });
    } catch (sheetsError) {
        console.error('[contact] Google Sheets append failed:', sheetsError);
        warnings.push('crm_write_failed');
    }

    // Step 2: Send the Free Guide to the submitter.
    // This is the user-facing confirmation; its success drives the response.
    let confirmationSent = false;
    try {
        await resend.emails.send({
            from: 'hello@athletecircle.ai',
            to: email,
            subject: 'Your free guide — The 5 Decisions',
            html: `
                <h2>Hey ${name}!</h2>
                <p>Thanks for reaching out to The Athlete Circle. Here's your free guide:</p>
                <p><strong><a href="${FREE_GUIDE_URL}">The 5 Decisions That Make or Break Every Student-Athlete's Career (PDF)</a></strong></p>

                <p>It's about a 25-minute read, built for you and a parent to go through together. Inside you'll find:</p>
                <ul>
                    <li>The Circle — the five advisory roles every athlete needs</li>
                    <li>Four questions to ask any agent before you sign</li>
                    <li>A five-question filter for every NIL offer</li>
                    <li>Five contract red flags you'll recognize on sight</li>
                    <li>One sentence you can say to anyone applying pressure</li>
                </ul>

                <p>Start with "Where You Are Right Now" to find the decision that's live for you today, then run the 30-minute Family Conversation at the end — that's the step that turns reading into a plan.</p>

                <p>I read every submission personally, and I'll follow up about your situation (${sport || 'your sport'}) soon. If something's pressing, just reply to this email.</p>

                <p>— Connor, The Athlete Circle</p>
            `,
            reply_to: email,
        });
        confirmationSent = true;
    } catch (confirmationError) {
        console.error('[contact] Confirmation email to submitter failed:', confirmationError);
    }

    // Step 3: Notify the admin inbox (best-effort, independent of Steps 1 & 2).
    try {
        await resend.emails.send({
            from: 'noreply@athletecircle.ai',
            to: 'hello@athletecircle.ai',
            subject: `New Contact: ${name} (${sport || 'N/A'})`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>Submitter:</strong> ${name}</p>
                <p><strong>Athlete Name:</strong> ${athlete || 'Not provided'}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Sport / Background:</strong> ${sport || 'Not provided'}</p>
                <p><strong>Their situation:</strong> ${message || 'N/A'}</p>
                <p><strong>Status:</strong> Free guide (The 5 Decisions) link emailed to submitter</p>
                <hr>
                <p><a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}">View in CRM</a></p>
            `,
        });
    } catch (adminError) {
        console.error('[contact] Admin notification email failed:', adminError);
        warnings.push('admin_email_failed');
    }

    // The submitter confirmation email is the user-facing outcome. If it could
    // not be sent, report an error so the frontend keeps the user on the form.
    // Google Sheets and admin-email failures are surfaced as warnings but do
    // not, by themselves, fail the submission.
    if (!confirmationSent) {
        return res.status(502).json({
            error: 'We could not send your free guide right now. Please try again in a moment.',
            warnings,
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Welcome! Check your email for your free guide.',
        email,
        warnings,
    });
}
