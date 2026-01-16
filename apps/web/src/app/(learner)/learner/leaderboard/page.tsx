'use client';

import FeatureFlaggedPage from '@shared/ui/components/FeatureFlaggedPage';

export default function LeaderboardPage() {
    return (
        <FeatureFlaggedPage
            featureName="Leaderboard"
            featureFlag="FEATURE_GAMIFICATION"
            description="The leaderboard is part of the gamification feature which is not enabled for this deployment."
            requirements={[
                'Set FEATURE_GAMIFICATION=true in environment',
                'Enable points system',
                'Configure leaderboard visibility',
            ]}
        />
    );
}
