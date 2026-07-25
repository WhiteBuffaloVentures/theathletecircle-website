import Stripe from 'stripe';
import { google } from 'googleapis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Stripe client. The API key is not used for signature verification (that uses
// STRIPE_WEBHOOK_SECRET), but the SDK constructor requires a non-empty string,
// so fall back to a placeholder to avoid a cold-start crash if it is unset.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_webhook_verification_only');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.ATHLETECIRCLE_SHEET_ID;

// Website-hosted production copy of the paid product.
const BOOK_URL = 'https://athletecircle.ai/guide/TAC_Build_Your_Athlete_Circle_Ebook.pdf';

// Stripe signature verification needs the raw, unparsed request body, so Vercel's
// automatic body parsing must be disabled for this endpoint.
export const config = {
    api: {
        bodyParser: false,
    },
};

// Collect the raw request stream into a Buffer.
async function readRawBody(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify the Stripe signature against the raw body. Reject anything that is
    // missing a signature, has an invalid signature, or fails verification.
    let event;
    try {
        const rawBody = await readRawBody(req);
        const signature = req.headers['stripe-signature'];
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('[stripe-webhook] Signature verification failed:', err.message);
        return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Only completed Payment Link / Checkout purchases trigger fulfillment.
    // Acknowledge every other (valid) event type without acting on it.
    if (event.type !== 'checkout.session.completed') {
        return res.status(200).json({ received: true });
    }

    const session = (event.data && event.data.object) || {};
    const customerEmail =
        (session.customer_details && session.customer_details.email) ||
        session.customer_email ||
        null;

    const warnings = [];

    // Step 1: Send the buyer their confirmation + download email FIRST.
    // This is the user-facing outcome and must NOT depend on the CRM write.
    let confirmationSent = false;
    if (customerEmail) {
        try {
            await resend.emails.send({
                from: 'hello@athletecircle.ai',
                to: customerEmail,
                subject: 'Your Build Your Athlete Circle download 🎯',
                html: `
                    <h2>You're In The Circle Now</h2>
                    <p>Thanks for your purchase! Your copy of <strong>Build Your Athlete Circle</strong> — the complete decision playbook — is ready:</p>
                    <p><strong><a href="${BOOK_URL}">Download Build Your Athlete Circle (PDF)</a></strong></p>

                    <p><strong>What's inside:</strong></p>
                    <ul>
                        <li>5 modules: the Circle, agent evaluation, NIL deals, contracts, and your operating system</li>
                        <li>Scorecards, scripts, and contract red-flag playbooks</li>
                        <li>The Connor Barry case study and a 30-day action plan</li>
                    </ul>

                    <p><strong>Bonus:</strong> your purchase includes a strategy call. When you're ready, reply to this email or reach us at hello@athletecircle.ai and we'll set it up.</p>

                    <p>— Connor, The Athlete Circle</p>
                `,
            });
            confirmationSent = true;
        } catch (emailError) {
            console.error('[stripe-webhook] Buyer confirmation email failed:', emailError);
        }
    } else {
        warnings.push('no_customer_email');
        console.error('[stripe-webhook] checkout.session.completed had no customer email');
    }

    // Step 2: Best-effort CRM update (isolated — cannot block the buyer email).
    // Marks an existing lead as Paid $97. A first-time buyer with no prior row
    // is simply skipped; the purchase is still fulfilled via email + redirect.
    if (customerEmail) {
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
                    if (rows[i][emailColIndex] === customerEmail) {
                        rowIndex = i + 1; // Sheet rows are 1-indexed
                        break;
                    }
                }
            }

            if (rowIndex) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId: SHEET_ID,
                    range: `CRM!H${rowIndex}:J${rowIndex}`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: [[
                            new Date().toISOString().split('T')[0], // Paid Ebook date
                            'Paid $97',                              // Paid status
                            'Paid $97'                               // Status update
                        ]],
                    },
                });
            } else {
                warnings.push('crm_row_not_found');
            }
        } catch (sheetsError) {
            console.error('[stripe-webhook] CRM update failed:', sheetsError);
            warnings.push('crm_update_failed');
        }
    }

    // Acknowledge the verified event so Stripe does not retry; failures logged.
    return res.status(200).json({ success: true, emailed: confirmationSent, warnings });
}
