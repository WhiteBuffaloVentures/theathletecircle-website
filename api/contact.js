import { Resend } from 'resend';
import { google } from 'googleapis';

const resend = new Resend('re_b32VuVpp_DUvHwqdBj3KczjtNJpUo2RzT');

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.ATHLETECIRCLE_SHEET_ID; // CRM Database sheet ID

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, phone, athlete, sport, grade, message } = req.body;

    // Validate required fields
    if (!name || !email || !athlete || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Step 1: Add contact to Google Sheets CRM
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'CRM!A:J',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[
                    timestamp,           // Date
                    name,                // Name
                    email,               // Email
                    phone || '',         // Phone
                    sport || '',         // Sport
                    grade || '',         // Grade
                    'Pending',           // Free Ebook Sent (pending initial email)
                    '',                  // Paid Ebook Status (empty until purchase)
                    message ? 'Yes' : '', // Advisory Interest
                    'Free Ebook'         // Status
                ]],
            },
        });

        // Step 2: Send immediate free ebook + Day 1 email
        await resend.emails.send({
            from: 'hello@athletecircle.ai',
            to: email,
            subject: 'Your Free Athlete Circle Playbook + Insider Tips',
            html: `
                <h2>Hey ${name}!</h2>
                <p>Thanks for joining The Athlete Circle. I'm Connor, and I've helped dozens of student-athletes avoid the biggest mistakes in the critical first 48 hours.</p>
                
                <p><strong>Your free playbook is attached.</strong> It covers:</p>
                <ul>
                    <li>The 3 roles you NEED on your advisory circle (most athletes miss 2 of these)</li>
                    <li>Red flags in agent contracts (these cost athletes 6-7 figures)</li>
                    <li>How to evaluate offers without mixing roles</li>
                </ul>
                
                <p><strong>What's next?</strong> Over the next 5 days, I'll share real stories from athletes who won—and what they did differently.</p>
                
                <p>Looking forward to helping you build your circle.</p>
                <p>— Connor</p>
                
                <hr>
                <p><small><a href="https://athletecircle.ai">Back to The Athlete Circle</a></small></p>
            `,
            reply_to: email,
        });

        // Step 3: Log to admin inbox for awareness
        await resend.emails.send({
            from: 'noreply@athletecircle.ai',
            to: 'hello@athletecircle.ai',
            subject: `✅ New Subscriber: ${name} (${sport || 'N/A'})`,
            html: `
                <h3>New Form Submission</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                <p><strong>Sport:</strong> ${sport || 'Not provided'}</p>
                <p><strong>Grade:</strong> ${grade || 'Not provided'}</p>
                <p><strong>Message/Advisory Interest:</strong> ${message || 'N/A'}</p>
                <p><strong>Status:</strong> Free ebook sent, Day 1 sequence initiated</p>
                <hr>
                <p><a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}">View in CRM</a></p>
            `,
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Welcome! Check your email for the free playbook.',
            email: email
        });
    } catch (error) {
        console.error('Error processing submission:', error);
        return res.status(500).json({ error: 'Failed to process subscription' });
    }
}
