// Vercel Serverless Function: Handle Stripe Charges
// Uses environment variable: STRIPE_SECRET_KEY

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const { token, amount, currency, description } = req.body;

    // Create Stripe charge
    const charge = await stripe.charges.create({
      amount: amount,
      currency: currency,
      source: token,
      description: description
    });

    if (!charge.paid) {
      return res.status(400).json({ error: 'Payment failed' });
    }

    // Return success + charge ID for post-purchase redirect
    return res.status(200).json({
      success: true,
      session_id: charge.id,
      charge: charge.id
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Payment processing failed'
    });
  }
};
