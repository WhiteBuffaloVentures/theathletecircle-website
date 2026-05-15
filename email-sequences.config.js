// TAC Email Sequences — Resend Integration
// Manual trigger via: curl -X POST https://athletecircle.ai/api/send-email-sequence -H "Authorization: Bearer YOUR_SECRET_KEY"

const emailSequences = {
  day1: {
    hours: 0,
    subject: "Your Athlete Circle Playbook is Ready — Start Module 1",
    html: `<h2>Welcome to The Athlete Circle</h2>
           <p>Your playbook is ready to download.</p>
           <p><strong>Start here:</strong> Read Module 1 — The Circle Framework (8–10 min). It's the operating system everything else hangs from.</p>
           <p><a href='https://athletecircle.ai/post-purchase'>Download & Access Your Playbook</a></p>
           <p>—Logan White<br/>The Athlete Circle</p>`
  },
  day2: {
    hours: 24,
    subject: "The Biggest Mistakes Young Athletes Make (and How to Avoid Them)",
    html: `<h2>Three Costly Mistakes</h2>
           <p>In my experience working with athletes, the biggest mistakes happen in the first 48 hours after an agent reaches out. Athletes sign without legal review. They commit to exclusivity without understanding what it costs them later. They mistake the first big offer for the best offer.</p>
           <p><strong>Module 2 walks you through how to avoid all three.</strong></p>
           <p>How's Module 1 treating you? Reply to this email — I read every response.</p>
           <p>—Logan</p>`
  },
  day3: {
    hours: 48,
    subject: "How Connor Barry Built His Circle — Real Athlete, Real Decisions",
    html: `<h2>The Connor Barry Story</h2>
           <p>Connor was a high school senior when the first agent contacted him. He had offers. He had pressure. He had no framework.</p>
           <p>Here's how we structured his Circle to protect him and position him for long-term success:</p>
           <p><strong>1. Lawyer first</strong> — Before saying yes to anything</p>
           <p><strong>2. Agent second</strong> — Only after legal protection was in place</p>
           <p><strong>3. Financial advisor third</strong> — Once real money was on the table</p>
           <p>His full case study is in Bonus Section 3 of your playbook. Read it alongside Module 2 — it brings the framework to life.</p>
           <p>—Logan</p>`
  },
  day4: {
    hours: 72,
    subject: "The Circle Framework Explained — Your Operating System",
    html: `<h2>Why The Circle Works</h2>
           <p>Five roles. Right people. Clear boundaries.</p>
           <p>Most athletes fail because they mix roles. The agent becomes the financial advisor. The mentor becomes the agent. The lawyer gets cut out of the loop.</p>
           <p>That's when conflicts of interest compound into bad decisions.</p>
           <p><strong>The Circle prevents this.</strong> Each role has a defined function, a defined limit, and explicit boundaries. When it's structured, it works.</p>
           <p>You caught up yet? Where are you in the modules?</p>
           <p>—Logan</p>`
  },
  day5: {
    hours: 96,
    subject: "Your Next Step — Get the Full Circle",
    html: `<h2>You've Got the Framework</h2>
           <p>By now you've read the modules. You understand the Circle. You can see where your gaps are.</p>
           <p><strong>The next level is Roland's advisory.</strong></p>
           <p>If you're actively navigating an agent decision, evaluating a contract, or managing your first NIL deal, a single strategy call with Roland clarifies everything in 45 minutes.</p>
           <p>If you're interested in going deeper, reply to this email and let me know where you're stuck. We'll set up a call.</p>
           <p>The athletes who win in this space don't wing it. They build a Circle and stick to it.</p>
           <p>—Logan</p>`
  }
};

// Usage: Call via Resend API for each lead
// curl -X POST https://api.resend.com/emails \
//   -H "Authorization: Bearer re_33M1mSCu_FH1eVfQyy2y8QjTV6dF25Kwy" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "from": "hello@athletecircle.ai",
//     "to": "lead@example.com",
//     "subject": "EMAIL_SUBJECT",
//     "html": "EMAIL_HTML"
//   }'

module.exports = emailSequences;
