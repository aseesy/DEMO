import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function AiSafety() {
  const meta = {
    title: 'Is AI Safe for Co-Parenting Communication?',
    subtitle:
      'Addressing privacy, security, and the reliability of AI in sensitive family matters. Why LiaiZen puts safety first.',
    date: 'Dec 15, 2025',
    readTime: '7 min read',
  };

  const breadcrumbs = [
    { label: 'Resources', href: '/liaizen-ai-co-parenting' },
    { label: 'AI + Co-Parenting Tools' },
  ];

  const keyTakeaways = [
    'Your data is <strong>encrypted and private</strong>. LiaiZen does not sell your conversations.',
    'The AI is <strong>neutral</strong>. It does not take sides in a dispute.',
    'You always have the <strong>final say</strong> on what gets sent.',
  ];

  return (
    <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
      <h2>The Trust Question</h2>
      <p>
        Handing over your most sensitive, stressful conversations to an algorithm is a big leap of
        faith. It's reasonable to ask:{' '}
        <em>Is this safe? Who is reading this? Can this be used against me?</em>
      </p>
      <p>
        At LiaiZen, we built our platform with these fears in mind. Here is exactly how we handle
        safety.
      </p>

      <h2>1. Privacy & Encryption</h2>
      <p>Your co-parenting messages shouldn't be fodder for ad targeting.</p>
      <ul>
        <li>
          <strong>Encryption:</strong> All messages are encrypted in transit and at rest.
        </li>
        <li>
          <strong>No Ad Sales:</strong> We do not sell your personal conversation data to
          advertisers. Our business model is subscription-based, meaning <em>you</em> are the
          customer, not the product.
        </li>
        <li>
          <strong>Data Ownership:</strong> You own your data. You can export your communication
          history for legal purposes anytime.
        </li>
      </ul>

      <h2>2. The "Bias" Myth</h2>
      <p>A common worry is that the AI might "side" with one parent.</p>
      <p>
        <em>"What if my ex manipulates the AI to make me look bad?"</em>
      </p>
      <p>
        LiaiZen's AI is trained on successful conflict resolution patterns, specifically the BIFF
        method (Brief, Informative, Friendly, Firm). It does not "know" who is right or wrong in
        your argument. It only judges the <strong>effectiveness</strong> of the communication.
      </p>
      <p>
        It will correct <em>both</em> parents equally if they use toxic language. It is a mirror,
        reflecting your words back to you without judgment.
      </p>

      <h2>3. The "Human in the Loop" (That's You)</h2>
      <p>
        LiaiZen is an <strong>assistant</strong>, not an agent. It never sends a message on your
        behalf automatically.
      </p>
      <p>
        You review every suggestion. You can edit it, ignore it, or rewrite it completely. The AI is
        there to offer a smarter option, but you retain full agency over your voice.
      </p>

      <div className="bg-orange-50 border-l-4 border-orange-400 p-6 my-8">
        <h4 className="font-bold text-orange-900 mb-2">Important Legal Note</h4>
        <p className="text-orange-900/80 m-0 text-sm">
          While LiaiZen helps create better documentation, we are not a law firm. The AI does not
          provide legal advice. Always consult with a family law attorney for legal strategy.
          However, presenting a clean, abuse-free communication log (which LiaiZen helps you create)
          is generally looked upon favorably by family courts.
        </p>
      </div>

      <h2>4. Reducing "Technological Abuse"</h2>
      <p>
        In high-conflict dynamics, technology is often used as a weapon (incessant texting,
        tracking, etc.).
      </p>
      <p>
        LiaiZen actually <strong>reduces</strong> this risk by imposing structure. Features like
        "Calm Mode" (which delays delivery of non-urgent messages) prevent devices from being used
        as tools of harassment.
      </p>

      <h2>Conclusion</h2>
      <p>
        AI isn't a replacement for human judgment, but it is a powerful shield against human
        fallibility. By using LiaiZen, you are adding a layer of safety and rationality to a part of
        your life that needs it most.
      </p>
    </BlogArticleLayout>
  );
}
