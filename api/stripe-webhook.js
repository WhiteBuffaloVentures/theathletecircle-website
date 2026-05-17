import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend('re_b32VuVpp_DUvHwqdBj3KczjtNJpUo2RzT');

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

                // Step 3: Send post-purchase email with advisory CTA
                await resend.emails.send({
                    from: 'hello@athletecircle.ai',
                    to: customer_email,
                    subject: 'Welcome to The Athlete Circle 🎯',
                    html: `
                        <h2>You're In The Circle Now</h2>
                        <p>Your "Build Your Athlete Circle" playbook is ready to download from your account.</p>
                        
                        <p><strong>What's Inside:</strong></p>
                        <ul>
                            <li>Complete framework for building your advisory circle</li>
                            <li>Contract templates & red flags guide</li>
                            <li>Decision-making process for agents & offers</li>
                            <li>Real case studies from athletes who won</li>
                        </ul>
                        
                        <p><strong>Next Step:</strong> If you want personalized guidance on YOUR specific situation, we offer advisory services tailored to your sport, grade, and goals.</p>
                        
                        <p><a href="https://athletecircle.ai/advisory-inquiry" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Learn About Advisory Services</a></p>
                        
                        <p>— Connor</p>
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
