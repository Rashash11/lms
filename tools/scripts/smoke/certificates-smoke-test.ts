export { };
const CERTIFICATES_TEST_BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SKIP_AUTH_HEADER = { 'x-lms-skip-rate-limit': '1' };

const TEST_ACCOUNTS = {
    LEARNER1: { email: 'learner-a@test.local', password: 'TestPass123!' },
    LEARNER2: { email: 'learner-b@test.local', password: 'TestPass123!' }, // Same password as learner1
    ADMIN: { email: 'admin-a@test.local', password: 'TestPass123!' }
};

// Helper: Login and get session cookies
async function login(email: string, password: string): Promise<string | null> {
    const res = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...SKIP_AUTH_HEADER },
        body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
        console.error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
        return null;
    }

    const cookies = res.headers.get('set-cookie');
    return cookies || null;
}

// Helper: Log test result
function logResult(testName: string, passed: boolean, details: string = '') {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}${details ? ' - ' + details : ''}`);
    return passed;
}

// Main test runner
async function runCertificatesSmoke() {
    console.log('🚀 Starting Certificates End-to-End Smoke Tests...\n');

    const results: boolean[] = [];

    try {
        // ==== ADMIN SETUP PHASE ====
        console.log('📋 Setup Phase: Ensuring certificate template exists...\n');

        const adminCookies = await login(TEST_ACCOUNTS.ADMIN.email, TEST_ACCOUNTS.ADMIN.password);
        if (!adminCookies) throw new Error('Admin login failed');

        // Ensure at least one certificate template exists
        let templateId: string;
        const templatesRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/admin/certificates/templates`, {
            headers: { Cookie: adminCookies, ...SKIP_AUTH_HEADER }
        });
        const templates = templatesRes.ok ? await templatesRes.json() : [];

        if (templates.length > 0) {
            templateId = templates[0].id;
            console.log(`✓ Using existing template: ${templates[0].name} (${templateId})\n`);
        } else {
            // Create a template
            const createTemplateRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/admin/certificates/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: adminCookies,
                    ...SKIP_AUTH_HEADER
                },
                body: JSON.stringify({
                    name: 'Smoke Test Certificate',
                    htmlBody: '<html><body><h1>Certificate of Completion</h1><p>Awarded to {{learnerName}} for completing {{courseName}}</p></body></html>',
                    smartTags: { learnerName: 'Learner Name', courseName: 'Course Name' }
                })
            });

            if (!createTemplateRes.ok) {
                throw new Error(`Failed to create template: ${createTemplateRes.status}`);
            }

            const newTemplate = await createTemplateRes.json();
            templateId = newTemplate.id;
            console.log(`✓ Created new template: ${newTemplate.name} (${templateId})\n`);
        }

        // ==== LEARNER TEST PHASE ====
        console.log('👤 Learner Test Phase:\n');

        // 1. Login as Learner 1
        const learner1Cookies = await login(TEST_ACCOUNTS.LEARNER1.email, TEST_ACCOUNTS.LEARNER1.password);
        results.push(logResult('Login Learner 1', !!learner1Cookies));
        if (!learner1Cookies) throw new Error('❌ Login Learner 1 - Could not login');

        // 2. Get enrollments to find a course
        const enrollmentsRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/enrollments`, {
            headers: { Cookie: learner1Cookies, ...SKIP_AUTH_HEADER }
        });
        const enrollments = await enrollmentsRes.json();
        const hasCourse = enrollments.length > 0;
        results.push(logResult('Fetch Enrollments', hasCourse, `${enrollments.length} found`));
        if (!hasCourse) throw new Error('No enrollments found');

        const courseId = enrollments[0].courseId;
        const courseName = enrollments[0].courseName || courseId;
        console.log(`Using course: ${courseName}\n`);

        // 3. Admin: Assign certificate template to the course
        console.log(`Assigning template ${templateId} to course ${courseId}...`);
        const assignRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/admin/courses/${courseId}/certificate-template`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Cookie: adminCookies,
                ...SKIP_AUTH_HEADER
            },
            body: JSON.stringify({ certificateTemplateId: templateId })
        });

        const assignText = await assignRes.text();
        if (!assignRes.ok) {
            console.error(`❌ Template assignment failed: ${assignRes.status}`);
            console.error(`Response: ${assignText.substring(0, 300)}`);
        } else {
            console.log(`✓ Template assigned successfully`);
            console.log(`Response: ${assignText.substring(0, 200)}\n`);
        }

        const assigned = assignRes.ok;

        // 4. Complete the course (should issue certificate)
        console.log(`Completing course ${courseId} as learner...`);
        const completeRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/courses/${courseId}/complete`, {
            method: 'POST',
            headers: { Cookie: learner1Cookies, ...SKIP_AUTH_HEADER }
        });

        const completeText = await completeRes.text();
        console.log(`Complete course status: ${completeRes.status}`);
        console.log(`Complete response: ${completeText.substring(0, 300)}\n`);

        let completion: any = null;
        try {
            completion = JSON.parse(completeText);
        } catch (e) {
            console.error('Failed to parse completion response as JSON');
        }

        const courseCompleted = completeRes.ok && completion?.success;
        const certificateIssued = completion?.certificateIssued || false;

        console.log(`Course completed: ${courseCompleted}`);
        console.log(`Certificate issued: ${certificateIssued}`);
        if (completion?.certificateId) {
            console.log(`Certificate ID: ${completion.certificateId}\n`);
        }

        results.push(logResult('Complete Course', courseCompleted && certificateIssued,
            certificateIssued ? `Certificate ID: ${completion.certificateId}` : 'No certificate issued'
        ));

        const certificateId = completion?.certificateId;
        if (!certificateId) {
            console.error('\n❌ CRITICAL: No certificate was issued!');
            console.error(`Template assigned: ${assigned}`);
            console.error(`Completion response:`, completion);
            throw new Error('No certificate was issued');
        }

        // 5. List certificates
        const certListRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/certificates`, {
            headers: { Cookie: learner1Cookies, ...SKIP_AUTH_HEADER }
        });
        const certificates = certListRes.ok ? await certListRes.json() : [];
        const hasCertificates = certificates.length > 0;
        results.push(logResult('List Certificates', certListRes.ok && hasCertificates,
            `${certificates.length} certificate${certificates.length !== 1 ? 's' : ''} found`
        ));

        // 6. Get certificate details
        const certDetailRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/certificates/${certificateId}`, {
            headers: { Cookie: learner1Cookies, ...SKIP_AUTH_HEADER }
        });
        const certDetail = certDetailRes.ok ? await certDetailRes.json() : null;
        const hasDetails = certDetailRes.ok && certDetail?.id === certificateId;
        results.push(logResult('Get Certificate Details', hasDetails,
            hasDetails ? `Course: ${certDetail.course?.title || courseName}` : ''
        ));

        // 7. Download certificate (MVP: placeholder)
        const downloadRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/certificates/${certificateId}/download`, {
            headers: { Cookie: learner1Cookies, ...SKIP_AUTH_HEADER }
        });
        const downloadData = downloadRes.ok ? await downloadRes.json() : null;
        const canDownload = downloadRes.ok && downloadData?.certificateId === certificateId;
        results.push(logResult('Download Certificate', canDownload,
            canDownload ? '(MVP: placeholder)' : ''
        ));

        // 8. Privacy Check - Login as Learner 2 and try to access Learner 1's certificate
        const learner2Cookies = await login(TEST_ACCOUNTS.LEARNER2.email, TEST_ACCOUNTS.LEARNER2.password);
        if (learner2Cookies) {
            const leakRes = await fetch(`${CERTIFICATES_TEST_BASE_URL}/api/learner/certificates/${certificateId}`, {
                headers: { Cookie: learner2Cookies, ...SKIP_AUTH_HEADER }
            });
            const leaked = leakRes.status === 200;
            results.push(logResult('Privacy: Certificate Access Check', !leaked,
                leakRes.status === 403 || leakRes.status === 404
                    ? `Correctly returned ${leakRes.status}`
                    : `Returned status ${leakRes.status}`
            ));
        } else {
            results.push(logResult('Privacy: Certificate Access Check', false, 'Skipped (L2 login failed)'));
        }

        // 9. Admin template permissions test
        results.push(logResult('Admin: Manage Templates', templatesRes.ok,
            `${templatesRes.ok ? 'Permission granted' : 'Access denied'}`
        ));

        // Final summary
        console.log('\n' + '='.repeat(50));
        const allPassed = results.every(r => r);
        if (allPassed) {
            console.log('✅ ALL CERTIFICATE TESTS PASSED!');
            process.exit(0);
        } else {
            const passedCount = results.filter(r => r).length;
            console.log(`❌ SOME TESTS FAILED - ${passedCount}/${results.length} passed`);
            process.exit(1);
        }

    } catch (error) {
        console.error('\n❌ Test Cycle Error:', error);
        process.exit(1);
    }
}

// Run tests
runCertificatesSmoke();
