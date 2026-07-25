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

    try {
        const event = JSON.parse(req.body);

        // Handle Stripe payment_intent.succeeded event
        if (event.type === 'payment_intent.succeeded') {
            const { customer_email, amount, metadata } = event.data.object;

            if (!customer_email) {
                return res.status(400).json({ error: 'No customer email in event' });
            }

            // Step 1: Find contact in CRM by email
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId: SHEET_ID,
                range: 'CRM!A:J',
            });

            const rows = response.data.values || [];
            const headerRow = rows[0];
            const emailColIndex = headerRow.indexOf('Email'); // Column B (index 1)
            const paidEbookColIndex = headerRow.indexOf('Paid Ebook ($97)'); // Column H (index 7)
            const statusColIndex = headerRow.indexOf('Status'); // Column J (index 9)

            let rowIndex = null;
            for (let i = 1; i < rows.length; i++) {
                if (rows[i][emailColIndex] === customer_email) {
                    rowIndex = i + 1; // Sheet rows are 1-indexed
                    break;
                }
            }

            if (rowIndex) {
                // Step 2: Update CRM row with purchase status
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SHEET_ID,
                    range: `CRM!H${rowIndex}:J${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[
                            new Date().toISOString().split('T')[0], // Paid Ebook date
                            'Paid $97',                               // Paid status
                            'Paid $97'                                // Status update
                        ]],
                    },
                });

                // Step 3: Send post-purchase email with the download link
                await resend.emails.send({
                    from: 'hello@athletecircle.ai',
                    to: customer_email,
                    subject: 'Your Build Your Athlete Circle download 🎯',
                    html: `
                        <h2>You're In The Circle Now</h2>
                        <p>Thanks for your purchase! Your copy of <strong>Build Your Athlete Circle</strong> — the complete decision playbook — is ready:</p>
                        <p><strong><a href="https://athletecircle.ai/guide/TAC_Build_Your_Athlete_Circle_Ebook.pdf">Download Build Your Athlete Circle (PDF)</a></strong></p>

                        <p><strong>What's inside:</strong></p>
                        <ul>
                            <li>5 modules: the Circle, agent evaluation, NIL deals, contracts, and your operating system</li>
                            <li>Scorecards, scripts, and contract red-flag playbooks</li>
                            <li>The Connor Barry case study and a 30-day action plan</li>
                        </ul>

                        <p><strong>Bonus:</strong> your purchase includes a strategy call. When you're ready, reply to this email or reach us at hello@athletecircle.ai and we'll set it up.</p>

                        <p>— Connor, The Athlete Circle</p>
                    `,
                    reply_to: customer_email,
                });
            }

            return res.status(200).json({ success: true, message: 'Payment processed & CRM updated' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }
}
