// Email Sequence Configuration for AthleteCircle
// Triggered on form submission, runs over 5 days

export const emailSequence = [
    {
        day: 0,
        subject: "Your Free Athlete Circle Playbook (Day 1)",
        trigger: "form_submission",
        from: "hello@athletecircle.ai",
        html: `
            <h2>Hey [FIRST_NAME]!</h2>
            <p>Thanks for joining The Athlete Circle. I'm Connor, and I've helped dozens of student-athletes avoid the biggest mistakes in the critical first 48 hours.</p>
            
            <p><strong>Your free playbook is attached.</strong> It covers:</p>
            <ul>
                <li>The 3 roles you NEED on your advisory circle (most athletes miss 2 of these)</li>
                <li>Red flags in agent contracts (these cost athletes 6-7 figures)</li>
                <li>How to evaluate offers without mixing roles</li>
            </ul>
            
            <p><strong>What's next?</strong> Over the next 5 days, I'll share real stories from athletes who won—and what they did differently.</p>
            
            <p><strong>Questions about your situation?</strong> <a href="https://athletecircle.ai">Tell us more here</a></p>
            
            <p>Looking forward to helping you build your circle.</p>
            <p>— Connor</p>
        `
    },
    {
        day: 2,
        subject: "The Biggest Mistakes Athletes Make (In Their First 48 Hours)",
        trigger: "email_2_days_after",
        from: "hello@athletecircle.ai",
        html: `
            <h2>The 48-Hour Window</h2>
            <p>In my experience working with athletes, the biggest mistakes happen in the first 48 hours after an agent reaches out. Athletes sign without legal review. They commit to exclusivity without understanding what it costs them later. They mistake the first big offer for the best offer.</p>
            
            <p><strong>Here's what changes the outcome:</strong></p>
            <p>Athletes who build a Circle first—before they're under pressure—make better decisions. They have someone who knows contracts, someone who knows finances, and someone who knows the long game.</p>
            
            <p>Without that structure, desperation makes the decisions.</p>
            
            <p><strong>Got a specific question about YOUR situation?</strong> <a href="https://athletecircle.ai">Share what's happening</a> and we can point you in the right direction.</p>
            
            <p>— Connor</p>
        `
    },
    {
        day: 3,
        subject: "How My Brother Turned Down $2M (And Why He Doesn't Regret It)",
        trigger: "email_3_days_after",
        from: "hello@athletecircle.ai",
        html: `
            <h2>The Trust Anchor</h2>
            <p>My brother was offered a 6-figure NIL deal his junior year. The agent was legit. The money was real. But something felt off.</p>
            
            <p>He called our family lawyer. He called a mentor who'd been through it. He called our dad. All three said: "Not yet. Wait."</p>
            
            <p>Senior year, a better offer came. Same agent, but now with the backing of a bigger brand. This time, with Circle in place, he could evaluate it properly.</p>
            
            <p><strong>That's what a Circle does:</strong> It gives you permission to say "not yet" when the money is real and the pressure is high.</p>
            
            <p><strong>Does this sound like you?</strong> <a href="https://athletecircle.ai">Let's talk about YOUR Circle</a></p>
            
            <p>— Connor</p>
        `
    },
    {
        day: 4,
        subject: "How The Athlete Circle Framework Works",
        trigger: "email_4_days_after",
        from: "hello@athletecircle.ai",
        html: `
            <h2>The Three Pillars</h2>
            <p>The framework we use is simple but powerful. Most athletes try to do it alone or let one person do everything.</p>
            
            <p><strong>The Three Pillars:</strong></p>
            <ol>
                <li><strong>The Agent</strong> — represents you, negotiates deals, knows the market</li>
                <li><strong>The Advisor</strong> — legal + financial, reviews contracts, thinks long-term</li>
                <li><strong>The Anchor</strong> — mentor/coach/parent, knows you as a person, keeps perspective</li>
            </ol>
            
            <p>Each role has a job. Each role stays in their lane. When they work together, athletes win.</p>
            
            <p>This is in your free playbook. Tomorrow, we're showing you the investment.</p>
            
            <p>— Connor</p>
        `
    },
    {
        day: 5,
        subject: "The $97 'Build Your Athlete Circle' Playbook (Complete Framework)",
        trigger: "email_5_days_after",
        from: "hello@athletecircle.ai",
        html: `
            <h2>The Full Framework</h2>
            <p>Over the past 5 days, you've seen how athletes succeed when they have a Circle.</p>
            
            <p>The free playbook gives you the mindset. The $97 playbook gives you the system.</p>
            
            <p><strong>What's in the paid version:</strong></p>
            <ul>
                <li>Complete contract evaluation checklist</li>
                <li>Offer comparison framework (how to evaluate competing deals)</li>
                <li>Interview scripts for agents, lawyers, advisors</li>
                <li>13-point due diligence process</li>
                <li>Real contracts (redacted) with annotations</li>
                <li>Decision-making template for when the pressure is on</li>
            </ul>
            
            <p><strong>Investment:** $97 (one-time)</p>
            <p><strong>Value:** Avoid one bad decision and this pays for itself 100x over.</p>
            
            <p><a href="https://athletecircle.ai/checkout" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Get Full Framework Now</a></p>
            
            <p><strong>Want personalized guidance?</strong> After you grab the framework, we offer advisory services—tailored to your sport, grade, and specific situation.</p>
            
            <p><a href="https://athletecircle.ai/advisory-inquiry">Book an Advisory Call</a></p>
            
            <p>— Connor</p>
        `
    }
];

// Stripe Webhook Configuration
export const stripeConfig = {
    productId: "prod_athletecircle_97",
    priceId: "price_athletecircle_97",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    webhookEndpoint: "https://athletecircle.ai/api/stripe-webhook"
};

// Manual trigger via: curl -X POST https://athletecircle.ai/api/send-email-sequence -H "Authorization: Bearer ***"
