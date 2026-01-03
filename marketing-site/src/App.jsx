import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.jsx';

// Blog imports
import { BlogPillarPage } from './pages/Blog/BlogPillarPage.jsx';
import { WhyArgumentsRepeat } from './pages/Blog/WhyArgumentsRepeat.jsx';
import { EmotionalTriggers } from './pages/Blog/EmotionalTriggers.jsx';
import { EmotionalRegulation } from './pages/Blog/EmotionalRegulation.jsx';
import { ReactionVsResponse } from './pages/Blog/ReactionVsResponse.jsx';
import { PauseBeforeReacting } from './pages/Blog/PauseBeforeReacting.jsx';
import { DefensivenessStrategies } from './pages/Blog/DefensivenessStrategies.jsx';
import { WhyItFeelsImpossible } from './pages/Blog/WhyItFeelsImpossible.jsx';
import { DeEscalationTechniques } from './pages/Blog/DeEscalationTechniques.jsx';
import { GaslightingGuiltBlame } from './pages/Blog/GaslightingGuiltBlame.jsx';
import { MentalHealthProtection } from './pages/Blog/MentalHealthProtection.jsx';
import { EveryConversationFight } from './pages/Blog/EveryConversationFight.jsx';
import { LongTermEffects } from './pages/Blog/LongTermEffects.jsx';
import { WhatKidsNeed } from './pages/Blog/WhatKidsNeed.jsx';
import { StabilityStress } from './pages/Blog/StabilityStress.jsx';
import { ModelingCommunication } from './pages/Blog/ModelingCommunication.jsx';
import { AiGuidedMediation } from './pages/Blog/AiGuidedMediation.jsx';
import { EscalationPrevention } from './pages/Blog/EscalationPrevention.jsx';
import { CalmCommunication } from './pages/Blog/CalmCommunication.jsx';
import { AiSafety } from './pages/Blog/AiSafety.jsx';
import { AiVsImpulse } from './pages/Blog/AiVsImpulse.jsx';

function App() {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Blog Routes */}
      {/* Pillar 1: Communication */}
      <Route
        path="/co-parenting-communication"
        element={<BlogPillarPage categoryId="communication" />}
      />
      <Route
        path="/break-co-parenting-argument-cycle-game-theory"
        element={<WhyArgumentsRepeat />}
      />
      <Route
        path="/co-parenting-communication/why-arguments-repeat"
        element={<WhyArgumentsRepeat />}
      />
      <Route
        path="/co-parenting-communication/emotional-triggers"
        element={<EmotionalTriggers />}
      />
      <Route
        path="/co-parenting-communication/emotional-regulation"
        element={<EmotionalRegulation />}
      />
      <Route
        path="/co-parenting-communication/reaction-vs-response"
        element={<ReactionVsResponse />}
      />
      <Route
        path="/co-parenting-communication/pause-before-reacting"
        element={<PauseBeforeReacting />}
      />
      <Route
        path="/co-parenting-communication/defensiveness-strategies"
        element={<DefensivenessStrategies />}
      />

      {/* Pillar 2: High Conflict */}
      <Route
        path="/high-conflict-co-parenting"
        element={<BlogPillarPage categoryId="high-conflict" />}
      />
      <Route
        path="/high-conflict/why-it-feels-impossible"
        element={<WhyItFeelsImpossible />}
      />
      <Route
        path="/high-conflict/de-escalation-techniques"
        element={<DeEscalationTechniques />}
      />
      <Route
        path="/high-conflict/gaslighting-guilt-blame"
        element={<GaslightingGuiltBlame />}
      />
      <Route
        path="/high-conflict/mental-health-protection"
        element={<MentalHealthProtection />}
      />
      <Route
        path="/high-conflict/every-conversation-fight"
        element={<EveryConversationFight />}
      />

      {/* Pillar 3: Child Centered */}
      <Route
        path="/child-centered-co-parenting"
        element={<BlogPillarPage categoryId="child-centered" />}
      />
      <Route path="/child-impact/long-term-effects" element={<LongTermEffects />} />
      <Route path="/child-impact/what-kids-need" element={<WhatKidsNeed />} />
      <Route path="/child-impact/stability-stress" element={<StabilityStress />} />
      <Route
        path="/child-impact/modeling-communication"
        element={<ModelingCommunication />}
      />

      {/* Pillar 4: AI Tools */}
      <Route
        path="/liaizen-ai-co-parenting"
        element={<BlogPillarPage categoryId="liaizen-ai" />}
      />
      <Route path="/liaizen/how-ai-mediation-works" element={<AiGuidedMediation />} />
      <Route path="/liaizen/escalation-prevention" element={<EscalationPrevention />} />
      <Route path="/liaizen/calm-communication-ai" element={<CalmCommunication />} />
      <Route path="/liaizen/ai-safety-for-parents" element={<AiSafety />} />
      <Route path="/liaizen/ai-vs-impulse" element={<AiVsImpulse />} />

      {/* Catch-all - redirect to landing */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

export default App;

