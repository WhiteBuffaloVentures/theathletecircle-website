# AthleteCircle CRM Setup Guide

## Overview
This document covers setting up the complete CRM system that:
- ✅ Captures all form submissions in Google Sheets
- ✅ Tracks contact info + email status
- ✅ Automatically sends 5-day email sequence
- ✅ Updates CRM when people purchase ($97 ebook)
- ✅ Tracks advisory service inquiries

## Step 1: Create Google Sheets CRM Database

### 1.1 Create the CRM Spreadsheet
1. Go to [Google Drive - AthleteCircle Folder](https://drive.google.com/drive/folders/TBD)
2. Create new Google Sheet: **"AthleteCircle CRM Database"**
3. Name the first sheet tab: **"CRM"**
4. Add these column headers in row 1:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Date | Name | Email | Phone | Sport | Grade | Free Ebook Sent | Paid Ebook ($97) | Advisory Interest | Status |

### 1.2 Format the Sheet
- Column A (Date): Format as MM/DD/YYYY
- Column G-H: Use dropdowns: "Pending" | "Sent" | "Yes" | ""
- Column J: Use dropdowns: "Free Ebook" | "Paid $97" | "Advisory Inquiry" | "Advisory Engaged" | "Nurture"

## Step 2: Google Service Account Setup

### 2.1 Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: **"athletecircle-api"**
3. Enable APIs:
   - Google Sheets API
   - Gmail API (for Resend integration)
4. Create Service Account:
   - Go to Service Accounts
   - Create new service account: **"athletecircle-backend"**
   - Generate JSON key
5. Copy the JSON key (you'll need this)

### 2.2 Share Google Sheet with Service Account
1. Get the service account email from the JSON key (looks like: `service-account@project.iam.gserviceaccount.com`)
2. Open the CRM Sheet
3. Click Share → Add the service account email
4. Grant **Editor** access

## Step 3: Environment Variables

Add these to your Vercel environment:

```
GOOGLE_SERVICE_ACCOUNT_KEY=<paste entire JSON key here>
ATHLETECIRCLE_SHEET_ID=<Sheet ID from URL: https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit>
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_b32VuVpp_DUvHwqdBj3KczjtNJpUo2RzT
```

**How to get SHEET_ID:**
- Open CRM Sheet → Look at URL
- It's the long ID between `/d/` and `/edit`

## Step 4: Stripe Webhook Setup

### 4.1 Add Webhook Endpoint
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → Webhooks
2. Add endpoint:
   - URL: `https://athletecircle.ai/api/stripe-webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
3. Copy the signing secret → add as `STRIPE_WEBHOOK_SECRET`

### 4.2 Test Webhook
```bash
# Send test event
curl -X POST https://athletecircle.ai/api/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"customer_email":"test@example.com","amount":9700}}}'
```

## Step 5: Update Website Forms

All forms now post to these endpoints:

### Main Form (homepage)
- **Endpoint:** `/api/contact`
- **Fields:** name, email, phone, athlete, sport, grade, message
- **Auto-triggers:** 
  - Google Sheets CRM entry
  - Free ebook email (Day 1)
  - 5-day email sequence

### Advisory Inquiry Form
- **Endpoint:** `/api/advisory-inquiry`
- **Fields:** name, email, phone, sport, grade, situation
- **Auto-triggers:**
  - CRM update with "Advisory Inquiry" status
  - Email to Connor with details
  - Confirmation email to prospect

## Step 6: Email Sequences

### 5-Day Automation Flow

```
Day 0 (Form Submission)
├─ Form captured → Google Sheets
├─ Confirmation email sent
└─ Free ebook attached (Day 1 email)

Day 2
└─ Email: "Biggest Mistakes Athletes Make" (includes form link)

Day 3
└─ Email: "Connor's Brother Story" (includes form link)

Day 4
└─ Email: "Framework Explained"

Day 5
└─ Email: "$97 Ebook Offer" + Stripe checkout link
└─ Also includes: "Advisory Services" CTA with form link

Purchase ($97 Ebook)
├─ Stripe webhook fires
├─ CRM updated with "Paid $97"
└─ Post-purchase email with advisory CTA

Advisory Inquiry Submitted
├─ CRM updated with "Advisory Inquiry"
├─ Email sent to Connor with full details
└─ Confirmation sent to prospect
```

## Step 7: CRM Status Values

Use these in the "Status" column (J) for tracking:

| Status | Meaning |
|--------|---------|
| `Free Ebook` | On Day 1-5 sequence, hasn't purchased |
| `Paid $97` | Purchased full ebook, accessed post-purchase page |
| `Advisory Inquiry` | Submitted advisory inquiry form |
| `Advisory Engaged` | SoW signed, engagement active |
| `Nurture` | Inactive but still on list (low priority) |

## Step 8: Testing

### Test Form Submission
```bash
curl -X POST https://athletecircle.ai/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Athlete",
    "email": "test@example.com",
    "phone": "555-1234",
    "athlete": "Test",
    "sport": "Football",
    "grade": "Junior",
    "message": "Looking for guidance"
  }'
```

### Verify in Google Sheets
- Check CRM sheet → should see new row
- Check email inbox → should see confirmation

### Test Stripe Webhook
- Make $97 test purchase
- Verify CRM updates to "Paid $97"
- Check email for post-purchase message

## Step 9: Deployment

1. Update `.env.local` with all environment variables
2. Deploy to Vercel:
   ```bash
   vercel deploy
   ```
3. Set production environment variables in Vercel dashboard
4. Test all endpoints in production

## Monitoring

### Daily CRM Review
1. Open [CRM Sheet](https://drive.google.com/drive/folders/TBD)
2. Check new rows from yesterday
3. Column J shows who needs follow-up:
   - `Free Ebook` → let sequence run
   - `Advisory Inquiry` → Connor responds personally
   - `Paid $97` → check for advisory interest

### Email Delivery
- Resend dashboard shows delivery + open rates
- Track which emails get highest engagement
- Adjust messaging based on results

## Troubleshooting

### Form submissions not appearing in Sheets
- Check Google service account has Editor access
- Verify `ATHLETECIRCLE_SHEET_ID` is correct
- Check Vercel logs for API errors

### Emails not sending
- Verify Resend API key is correct
- Check email address is valid
- Review Resend dashboard for bounce/spam

### Stripe webhook not firing
- Verify webhook URL is correct in Stripe dashboard
- Check webhook signing secret matches
- Test webhook event in Stripe dashboard

## Files Changed
- `/api/contact.js` — Now writes to Google Sheets + sends Day 1 email
- `/api/stripe-webhook.js` — NEW: Updates CRM on purchase
- `/api/advisory-inquiry.js` — NEW: Handles advisory inquiry form
- `/email-sequences.config.js` — Updated with form links in Days 2, 3, 5

## Next Steps
1. Set up Google Sheet + service account
2. Add environment variables to Vercel
3. Deploy updated API endpoints
4. Test form submission → check CRM + email
5. Test purchase → check CRM update + post-purchase email
6. Monitor daily CRM for advisory inquiries

---

**Questions?** Review the complete request flow in MEMORY.md or reach out to Logan.
