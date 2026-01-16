'use client';

import FeatureFlaggedPage from '@shared/ui/components/FeatureFlaggedPage';

export default function InstructorMessagesPage() {
    return (
        <FeatureFlaggedPage
            featureName="Messages"
            featureFlag="FEATURE_MESSAGES"
            description="The internal messaging system is not enabled for this deployment."
            requirements={[
                'Set FEATURE_MESSAGES=true in environment',
            ]}
        />
    );
}
