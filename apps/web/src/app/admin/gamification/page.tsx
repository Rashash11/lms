'use client';

import FeatureFlaggedPage from '@shared/ui/components/FeatureFlaggedPage';

export default function GamificationPage() {
    return (
        <FeatureFlaggedPage
            featureName="Gamification"
            featureFlag="FEATURE_GAMIFICATION"
            description="The gamification module (badges, points, levels, and leaderboards) is not enabled for this deployment. Contact your system administrator to enable this feature."
            requirements={[
                'Set FEATURE_GAMIFICATION=true in environment',
                'Configure point values and badge definitions',
                'Enable leaderboard visibility settings',
            ]}
            docsLink="/docs/gamification"
        />
    );
}
