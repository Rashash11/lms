async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin123!' })
        });
        console.log('Status:', res.status);
        const data = await res.text();
        console.log('Response:', data);
    } catch (e) {
        console.error('Fetch error:', e);
    }
}
test();
