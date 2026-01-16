'use client';

import FeatureFlaggedPage from '@shared/ui/components/FeatureFlaggedPage';

export default function MessagesPage() {
    return (
        <FeatureFlaggedPage
            featureName="Messages"
            featureFlag="FEATURE_MESSAGES"
            description="The internal messaging system is not enabled for this deployment. Contact your system administrator to enable this feature."
            requirements={[
                'Set FEATURE_MESSAGES=true in environment',
                'Configure message storage and notifications',
            ]}
        />
    );
}
