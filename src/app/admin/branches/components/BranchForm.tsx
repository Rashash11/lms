'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Button, TextField, CircularProgress } from '@mui/material';
import { useSnackbar } from 'notistack';
import SectionCard from '../components/SectionCard';
import SettingRow from '../components/SettingRow';
import ToggleRow from '../components/ToggleRow';
import SelectRow from '../components/SelectRow';
import ImageUploadRow from '../components/ImageUploadRow';
import SignupModeEditor from '../components/SignupModeEditor';
import DomainsEditor from '../components/DomainsEditor';
import TextEditorModal from '../components/TextEditorModal';
import AnnouncementEditor from '../components/AnnouncementEditor';

const TIMEZONES = [
    { value: 'UTC', label: '(GMT +00:00) Greenwich Mean Time: Edinburgh, Lisbon, London' },
    { value: 'America/New_York', label: '(GMT -05:00) Eastern Time: New York, Washington DC' },
    { value: 'America/Chicago', label: '(GMT -06:00) Central Time: Chicago, Dallas' },
    { value: 'America/Los_Angeles', label: '(GMT -08:00) Pacific Time: Los Angeles, San Francisco' },
    { value: 'Europe/Paris', label: '(GMT +01:00) Central European Time: Paris, Berlin' },
    { value: 'Asia/Tokyo', label: '(GMT +09:00) Japan Standard Time: Tokyo' },
];

const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
];

const BADGE_SETS = [
    { value: 'old-school', label: 'Old school' },
    { value: 'modern', label: 'Modern' },
    { value: 'minimal', label: 'Minimal' },
];

interface BranchFormData {
    name: string;
    title: string;
    description: string;
    isActive: boolean;
    languageCode: string;
    timezone: string;
    internalAnnouncementEnabled: boolean;
    internalAnnouncement: string;
    externalAnnouncementEnabled: boolean;
    externalAnnouncement: string;
    signupMode: string;
    allowedDomains: string[];
    maxRegistrations: number | null;
    disallowMainDomainLogin: boolean;
    termsOfService: string;
    defaultUserTypeId: string;
    defaultGroupId: string;
    ecommerceProcessor: string;
    subscriptionEnabled: boolean;
    creditsEnabled: boolean;
    badgeSet: string;
    aiFeaturesEnabled: boolean;
    brandingLogoUrl: string | null;
    brandingFaviconUrl: string | null;
    defaultCourseImageUrl: string | null;
}

interface BranchFormProps {
    branchId?: string;
}

export default function BranchForm({ branchId }: BranchFormProps) {
    const router = useRouter();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [userTypes, setUserTypes] = useState<Array<{ id: string; name: string }>>([]);
    const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([]);

    // Modal states
    const [signupModeModal, setSignupModeModal] = useState(false);
    const [domainsModal, setDomainsModal] = useState(false);
    const [maxRegModal, setMaxRegModal] = useState(false);
    const [termsModal, setTermsModal] = useState(false);
    const [ecommerceModal, setEcommerceModal] = useState(false);
    const [subscriptionModal, setSubscriptionModal] = useState(false);
    const [internalAnnModal, setInternalAnnModal] = useState(false);
    const [externalAnnModal, setExternalAnnModal] = useState(false);

    const [formData, setFormData] = useState<BranchFormData>({
        name: '',
        title: '',
        description: '',
        isActive: false,
        languageCode: 'en',
        timezone: 'UTC',
        internalAnnouncementEnabled: false,
        internalAnnouncement: '',
        externalAnnouncementEnabled: false,
        externalAnnouncement: '',
        signupMode: 'direct',
        allowedDomains: [],
        maxRegistrations: null,
        disallowMainDomainLogin: false,
        termsOfService: '',
        defaultUserTypeId: '',
        defaultGroupId: '',
        ecommerceProcessor: 'none',
        subscriptionEnabled: false,
        creditsEnabled: false,
        badgeSet: 'old-school',
        aiFeaturesEnabled: false,
        brandingLogoUrl: null,
        brandingFaviconUrl: null,
        defaultCourseImageUrl: null,
    });

    // Load data on mount
    useEffect(() => {
        loadDropdownData();
        if (branchId) {
            loadBranch();
        }
    }, [branchId]);

    const loadDropdownData = async () => {
        try {
            const [userTypesRes, groupsRes] = await Promise.all([
                fetch('/api/user-types'),
                fetch('/api/groups?limit=100'),
            ]);
            const userTypesData = await userTypesRes.json();
            const groupsData = await groupsRes.json();
            setUserTypes(userTypesData.userTypes || []);
            setGroups(groupsData.groups || []);
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        }
    };

    const loadBranch = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/branches/${branchId}`);
            const data = await res.json();
            setFormData({
                name: data.name || '',
                title: data.title || '',
                description: data.description || '',
                isActive: data.isActive || false,
                languageCode: data.languageCode || 'en',
                timezone: data.timezone || 'UTC',
                internalAnnouncementEnabled: data.internalAnnouncementEnabled || false,
                internalAnnouncement: data.internalAnnouncement || '',
                externalAnnouncementEnabled: data.externalAnnouncementEnabled || false,
                externalAnnouncement: data.externalAnnouncement || '',
                signupMode: data.signupMode || 'direct',
                allowedDomains: data.allowedDomains || [],
                maxRegistrations: data.maxRegistrations,
                disallowMainDomainLogin: data.disallowMainDomainLogin || false,
                termsOfService: data.termsOfService || '',
                defaultUserTypeId: data.defaultUserTypeId || '',
                defaultGroupId: data.defaultGroupId || '',
                ecommerceProcessor: data.ecommerceProcessor || 'none',
                subscriptionEnabled: data.subscriptionEnabled || false,
                creditsEnabled: data.creditsEnabled || false,
                badgeSet: data.badgeSet || 'old-school',
                aiFeaturesEnabled: data.aiFeaturesEnabled || false,
                brandingLogoUrl: data.brandingLogoUrl,
                brandingFaviconUrl: data.brandingFaviconUrl,
                defaultCourseImageUrl: data.defaultCourseImageUrl,
            });
        } catch (error) {
            enqueueSnackbar('Failed to load branch', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || formData.name.length < 3) {
            enqueueSnackbar('Name must be at least 3 characters', { variant: 'error' });
            return;
        }

        setSaving(true);
        try {
            const url = branchId ? `/api/branches/${branchId}` : '/api/branches';
            const method = branchId ? 'PATCH' : 'POST';

            // Convert empty strings to null for UUID fields to avoid validation errors
            const payload = {
                ...formData,
                defaultUserTypeId: formData.defaultUserTypeId || null,
                defaultGroupId: formData.defaultGroupId || null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save branch');
            }

            const data = await res.json();
            enqueueSnackbar(branchId ? 'Branch updated successfully' : 'Branch created successfully', { variant: 'success' });

            if (!branchId) {
                // Redirect to edit page after creation
                router.push(`/admin/branches/${data.id}/edit`);
            }
        } catch (error: any) {
            enqueueSnackbar(error.message, { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File, type: 'logo' | 'favicon' | 'courseImage') => {
        if (!branchId) {
            enqueueSnackbar('Please save the branch first before uploading images', { variant: 'warning' });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`/api/branches/${branchId}/upload?type=${type}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error('Upload failed');
            }

            const data = await res.json();

            // Update local state
            setFormData(prev => ({
                ...prev,
                [`branding${type.charAt(0).toUpperCase() + type.slice(1)}Url`]: data.url
            }));

            enqueueSnackbar('Image uploaded successfully', { variant: 'success' });
        } catch (error) {
            enqueueSnackbar('Failed to upload image', { variant: 'error' });
        }
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 900, mx: 'auto', pb: 10 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Branches
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                    {branchId ? 'Edit branch' : 'Add branch'}
                </Typography>
            </Box>

            {/* IDENTITY */}
            <SectionCard title="IDENTITY">
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Name
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        The branch URL is generated automatically based on the branch name. The name must be at least 3 characters long and contain only lowercase letters and numbers.
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type the site name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                        URL: {generateSlug(formData.name || 'branch-name')}.talentlms.com
                    </Typography>
                </Box>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Title
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Title used in search engines
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type the branch title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                </Box>
                <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                        Description
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        Short description up to 255 characters
                    </Typography>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type the site description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        inputProps={{ maxLength: 255 }}
                    />
                </Box>
                <ToggleRow
                    label="Active"
                    checked={formData.isActive}
                    onChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
            </SectionCard>

            {/* BRANDING */}
            <SectionCard title="BRANDING">
                <ImageUploadRow
                    label="Logo"
                    description="Accepted file format: gif, jpg, jpeg, png. Size: 3MB."
                    imageUrl={formData.brandingLogoUrl}
                    onUpload={(file) => handleImageUpload(file, 'logo')}
                    disabled={!branchId}
                    helperText={!branchId ? 'Save to enable uploads' : ''}
                />
                <ImageUploadRow
                    label="Favicon"
                    description="Accepted file format: gif, jpg, jpeg, png. Size: 3MB."
                    imageUrl={formData.brandingFaviconUrl}
                    onUpload={(file) => handleImageUpload(file, 'favicon')}
                    disabled={!branchId}
                    helperText={!branchId ? 'Save to enable uploads' : ''}
                />
                <ImageUploadRow
                    label="Default course image"
                    description="Accepted file format: gif, jpg, jpeg, png. Size: 3MB."
                    imageUrl={formData.defaultCourseImageUrl}
                    onUpload={(file) => handleImageUpload(file, 'courseImage')}
                    disabled={!branchId}
                    helperText={!branchId ? 'Save to enable uploads' : ''}
                />
            </SectionCard>

            {/* LOCALE */}
            <SectionCard title="LOCALE">
                <SelectRow
                    label="Branch language"
                    description="Users can choose to view a branch in their preferred language. However, if you have selected a specific branch language through the branch settings (e.g., Spanish), your users will not be able to select the language themselves. Learn more"
                    value={formData.languageCode}
                    options={LANGUAGES}
                    onChange={(value) => setFormData({ ...formData, languageCode: value })}
                />
                <SelectRow
                    label="Branch timezone"
                    value={formData.timezone}
                    options={TIMEZONES}
                    onChange={(value) => setFormData({ ...formData, timezone: value })}
                />
            </SectionCard>

            {/* ANNOUNCEMENTS */}
            <SectionCard title="ANNOUNCEMENTS">
                <SettingRow
                    label="Internal announcement"
                    description="The internal announcement is displayed to logged-in branch members (on their dashboard)."
                    value={formData.internalAnnouncementEnabled ? 'Enabled' : 'Disabled'}
                    onClick={() => setInternalAnnModal(true)}
                />
                <SettingRow
                    label="External announcement"
                    description="The external announcement is displayed to non-logged-in branch members (on the branch login page)."
                    value={formData.externalAnnouncementEnabled ? 'Enabled' : 'Disabled'}
                    onClick={() => setExternalAnnModal(true)}
                />
            </SectionCard>

            {/* USERS */}
            <SectionCard title="USERS">
                <SelectRow
                    label="Default user type"
                    description="The default user type is assigned to new branch members upon registration. You can customize the new branch members permissions at Home > Account & Settings > User types. Learn more"
                    value={formData.defaultUserTypeId}
                    options={[
                        { value: '', label: 'Select a user type' },
                        ...userTypes.map(ut => ({ value: ut.id, label: ut.name }))
                    ]}
                    onChange={(value) => setFormData({ ...formData, defaultUserTypeId: value })}
                    placeholder="Select a user type"
                />
                <SelectRow
                    label="Default group"
                    description="New branch members are assigned to the default group upon registration and they're enrolled to all the group courses automatically. Learn more"
                    value={formData.defaultGroupId}
                    options={[
                        { value: '', label: 'Select a group' },
                        ...groups.map(g => ({ value: g.id, label: g.name }))
                    ]}
                    onChange={(value) => setFormData({ ...formData, defaultGroupId: value })}
                    placeholder="Select a group"
                />
                <SettingRow
                    label="Sign up"
                    value={formData.signupMode === 'direct' ? 'Direct' : formData.signupMode === 'invitation' ? 'Invitation only' : 'Approval required'}
                    onClick={() => setSignupModeModal(true)}
                />
                <SettingRow
                    label="Restrict registration to specific domains"
                    description="Restrict registration to email accounts related to a specified domain. Use 'example.com' to only accept registration from [user]@example.com emails, or '*.example.com' to reject all registrations from example.com emails. Add multiple domains as a comma-separated list."
                    value={formData.allowedDomains.length > 0 ? `${formData.allowedDomains.length} domain(s)` : 'Disabled'}
                    onClick={() => setDomainsModal(true)}
                />
                <SettingRow
                    label="Restrict registration"
                    description="Set the maximum number of users that can register to this branch."
                    value={formData.maxRegistrations ? `${formData.maxRegistrations} users max` : 'Disabled'}
                    onClick={() => setMaxRegModal(true)}
                />
                <ToggleRow
                    label="Disallow members of this branch to login from main domain URL"
                    description="Check if you'd like to prevent members of this branch from signing in through your main domain. They'll see an error message when they try."
                    checked={formData.disallowMainDomainLogin}
                    onChange={(checked) => setFormData({ ...formData, disallowMainDomainLogin: checked })}
                />
                <SettingRow
                    label="Terms of service"
                    description="The terms of service is shown to each user when they first login to the system. It is necessary to accept it in order to continue. Leave empty if you don't wish to display any."
                    value={formData.termsOfService ? 'Set' : 'None'}
                    onClick={() => setTermsModal(true)}
                />
            </SectionCard>

            {/* E-COMMERCE */}
            <SectionCard title="E-COMMERCE">
                <SettingRow
                    label="E-commerce processor"
                    value={formData.ecommerceProcessor || 'None'}
                    onClick={() => setEcommerceModal(true)}
                />
                <SettingRow
                    label="Subscription"
                    description="Allow users to subscribe to all paid courses for a monthly or annual fee."
                    value={formData.subscriptionEnabled ? 'Enabled' : 'Disabled'}
                    onClick={() => setSubscriptionModal(true)}
                />
                <ToggleRow
                    label="Activate credits"
                    description="Users can purchase credits off-site and use them to buy courses from your catalog. Learn more"
                    checked={formData.creditsEnabled}
                    onChange={(checked) => setFormData({ ...formData, creditsEnabled: checked })}
                />
            </SectionCard>

            {/* GAMIFICATION */}
            <SectionCard title="GAMIFICATION">
                <SelectRow
                    label="Badge set"
                    description="Award users with badges to highlight the milestones in their learning journey. Learn more"
                    value={formData.badgeSet}
                    options={BADGE_SETS}
                    onChange={(value) => setFormData({ ...formData, badgeSet: value })}
                />
            </SectionCard>

            {/* AI SETTINGS */}
            <SectionCard title="AI SETTINGS">
                <ToggleRow
                    label="AI features"
                    description="Enable all AI features on your branch to streamline your training management. Learn more"
                    checked={formData.aiFeaturesEnabled}
                    onChange={(checked) => setFormData({ ...formData, aiFeaturesEnabled: checked })}
                />
            </SectionCard>

            {/* Save/Cancel Buttons */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => router.push('/admin/branches')}
                >
                    Cancel
                </Button>
            </Box>

            {/* Modals */}
            <SignupModeEditor
                open={signupModeModal}
                value={formData.signupMode}
                onSave={(value) => setFormData({ ...formData, signupMode: value })}
                onClose={() => setSignupModeModal(false)}
            />
            <DomainsEditor
                open={domainsModal}
                domains={formData.allowedDomains}
                onSave={(domains) => setFormData({ ...formData, allowedDomains: domains })}
                onClose={() => setDomainsModal(false)}
            />
            <TextEditorModal
                open={maxRegModal}
                title="Restrict registration"
                label="Maximum number of users"
                value={formData.maxRegistrations?.toString() || ''}
                onSave={(value) => setFormData({ ...formData, maxRegistrations: value ? parseInt(value) : null })}
                onClose={() => setMaxRegModal(false)}
            />
            <TextEditorModal
                open={termsModal}
                title="Terms of service"
                label="Terms"
                value={formData.termsOfService}
                onSave={(value) => setFormData({ ...formData, termsOfService: value })}
                onClose={() => setTermsModal(false)}
                multiline
            />
            <TextEditorModal
                open={ecommerceModal}
                title="E-commerce processor"
                label="Processor"
                value={formData.ecommerceProcessor}
                onSave={(value) => setFormData({ ...formData, ecommerceProcessor: value })}
                onClose={() => setEcommerceModal(false)}
            />
            <TextEditorModal
                open={subscriptionModal}
                title="Subscription"
                label="Status"
                value={formData.subscriptionEnabled ? 'Enabled' : 'Disabled'}
                onSave={(value) => setFormData({ ...formData, subscriptionEnabled: value === 'Enabled' })}
                onClose={() => setSubscriptionModal(false)}
            />
            <AnnouncementEditor
                open={internalAnnModal}
                title="Internal announcement"
                enabled={formData.internalAnnouncementEnabled}
                message={formData.internalAnnouncement}
                onSave={(enabled, message) => setFormData({ ...formData, internalAnnouncementEnabled: enabled, internalAnnouncement: message })}
                onClose={() => setInternalAnnModal(false)}
            />
            <AnnouncementEditor
                open={externalAnnModal}
                title="External announcement"
                enabled={formData.externalAnnouncementEnabled}
                message={formData.externalAnnouncement}
                onSave={(enabled, message) => setFormData({ ...formData, externalAnnouncementEnabled: enabled, externalAnnouncement: message })}
                onClose={() => setExternalAnnModal(false)}
            />
        </Box>
    );
}
