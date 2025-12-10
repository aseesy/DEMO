import React from 'react';
import { BlogArticleLayout } from './BlogArticleLayout';

export function AiVsImpulse() {
    const meta = {
        title: "Why Co-Parents Trust LiaiZen More Than Their Own Impulse in Hard Moments",
        subtitle: "When the red mist descends, even the best parents make mistakes. Here is why an AI pause button is the ultimate safety net.",
        date: "Dec 16, 2025",
        readTime: "5 min read"
    };

    const breadcrumbs = [
        { label: "Resources", href: "/liaizen-ai-co-parenting" },
        { label: "AI + Co-Parenting Tools" }
    ];

    const keyTakeaways = [
        "Impulse control is biological; stress chemicals hijack your brain's logic center.",
        "LiaiZen serves as an <strong>external regulator</strong> when your internal one fails.",
        "Trusting the app means trusting your <strong>best self</strong>, not your reactive self."
    ];

    return (
        <BlogArticleLayout meta={meta} breadcrumbs={breadcrumbs} keyTakeaways={keyTakeaways}>
            <h2>The "Red Mist" Phenomenon</h2>
            <p>
                You know the feeling. You read a text from your ex, and your heart rate spikes. Your face gets hot. You type out a furious reply. You hit send.
            </p>
            <p>
                Thirty minutes later, the adrenaline fades, and you think: <em>"I shouldn't have sent that."</em>
            </p>
            <p>
                This is the refractory period—the time during which your brain is biologically incapable of processing new information because it is locked in a threat response.
            </p>

            <h2>Why We Can't Always Trust Ourselves</h2>
            <p>
                We like to think we are rational beings. But under chronic stress—which defines most high-conflict co-parenting—we are survival beings.
            </p>
            <p>
                Your impulse is designed to protect you <em>right now</em> (by fighting back). It is not designed to protect your court case next month, or your child's mental health next year.
            </p>

            <h2>Why LiaiZen Earns Trust</h2>
            <p>
                Parents tell us they trust LiaiZen because it <strong>validates</strong> them without <strong>enabling</strong> them.
            </p>
            <p>
                When you type a furious draft, LiaiZen effectively says: <em>"I see you are upset, and you have a right to be. But saying it this way will hurt you later. Let's say it this way instead."</em>
            </p>
            <p>
                It separates the <strong>valid emotion</strong> from the <strong>destructive action</strong>.
            </p>

            <h2>The "Sleep On It" Feature, Instantaneously</h2>
            <p>
                Old advice says to "write the letter but don't send it." That requires immense willpower.
            </p>
            <p>
                LiaiZen automates that advice. It forces the friction that your brain needs to switch gears from "fight" to "think."
            </p>

            <div className="bg-teal-900 text-teal-50 p-8 rounded-2xl my-8 text-center italic font-medium leading-relaxed shadow-lg">
                "I used to regret about 50% of the texts I sent my ex. Since using LiaiZen, I haven't regretted a single one. It saves me from myself."
                <br />
                <span className="text-sm font-normal not-italic opacity-70 mt-4 block">— Sarah M., Co-parent & User</span>
            </div>

            <h2>Surrendering the Need for the "Last Word"</h2>
            <p>
                Trusting the app often means letting go of the need to win the argument. This is hard. But users quickly find that the peace they gain is worth far more than the momentary satisfaction of a snarky comeback.
            </p>
            <p>
                LiaiZen proves that the real win isn't having the last word—it's having the last laugh, by living a peaceful life despite the conflict.
            </p>
        </BlogArticleLayout>
    );
}
