'use client';

import FeatureFlaggedPage from '@shared/ui/components/FeatureFlaggedPage';

export default function AchievementsPage() {
    return (
        <FeatureFlaggedPage
            featureName="Achievements & Badges"
            featureFlag="FEATURE_GAMIFICATION"
            description="The achievements module is part of the gamification feature which is not enabled for this deployment."
            requirements={[
                'Set FEATURE_GAMIFICATION=true in environment',
                'Configure badges and achievement criteria',
            ]}
        />
    );
}
