'use client';

import React, { useState } from 'react';

export default function ThemePreviewPage() {
    const [isDark, setIsDark] = useState(true);

    const toggleTheme = () => {
        setIsDark(!isDark);
        if (!isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
    };

    return (
        <div className={`min-h-screen flex flex-col ${isDark ? 'dark' : 'light'}`} style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
            {/* Header */}
            <header className="glass-card rounded-none" style={{ borderLeft: 0, borderRight: 0, borderTop: 0 }}>
                <div className="container flex items-center justify-between py-4 px-4">
                    <div className="flex items-center gap-2">
                        <div style={{ width: 40, height: 40, background: 'hsl(var(--primary))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>N</div>
                        <span className="font-bold text-lg">NCOSH Health Hub</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="btn btn-ghost text-sm">EN / عربي</button>
                        <button className="btn btn-ghost text-sm" onClick={toggleTheme}>
                            {isDark ? '🌙' : '☀️'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container py-6 px-4" style={{ flex: 1 }}>
                {/* Hero Section */}
                <div className="hero-glass-card mb-6 text-center animate-slide-up">
                    <h1 className="text-2xl font-bold gradient-text">Welcome Back, Admin</h1>
                    <p className="text-muted mt-2">Manage your employee health records with ease.</p>
                </div>

                {/* Stepper */}
                <div className="glass-card p-4 mb-6 animate-fade-in">
                    <div className="flex items-center justify-between gap-4" style={{ overflowX: 'auto' }}>
                        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>1</div>
                            <span className="text-sm font-medium">Employees</span>
                        </div>
                        <div style={{ flex: 1, height: 2, background: 'hsl(var(--border))' }}></div>
                        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>2</div>
                            <span className="text-sm text-muted">Checkups</span>
                        </div>
                        <div style={{ flex: 1, height: 2, background: 'hsl(var(--border))' }}></div>
                        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>3</div>
                            <span className="text-sm text-muted">Healthcare Center</span>
                        </div>
                        <div style={{ flex: 1, height: 2, background: 'hsl(var(--border))' }}></div>
                        <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 120 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>4</div>
                            <span className="text-sm text-muted">Payment</span>
                        </div>
                    </div>
                </div>

                {/* Employee Table Card */}
                <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-col gap-4 mb-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Step 1: Select Employees</h2>
                            <div className="flex items-center gap-2">
                                <button className="btn btn-primary">+ Add Employee</button>
                                <button className="btn btn-ghost">Select All</button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                                <input type="text" className="input" placeholder="Search by name, job title, or code..." style={{ paddingLeft: '2.25rem' }} />
                                <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'hsl(var(--muted-foreground))' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                            </div>
                            <select className="select-trigger" style={{ width: 160 }}>
                                <option>All Departments</option>
                                <option>NCOSH HQ</option>
                                <option>Riyadh Branch</option>
                                <option>Jeddah Branch</option>
                            </select>
                            <select className="select-trigger" style={{ width: 176 }}>
                                <option>All Job Titles</option>
                                <option>Safety Engineer</option>
                                <option>Health Inspector</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ width: 48 }}></th>
                                    <th>Employee ID</th>
                                    <th>Name</th>
                                    <th>Department</th>
                                    <th>Job Title</th>
                                    <th>Job Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><input type="checkbox" className="checkbox" /></td>
                                    <td>EMP-001</td>
                                    <td className="font-medium">Ahmed Al-Rashid</td>
                                    <td>NCOSH HQ</td>
                                    <td>Safety Engineer</td>
                                    <td>SE-001</td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" className="checkbox" /></td>
                                    <td>EMP-002</td>
                                    <td className="font-medium">Fatima Hassan</td>
                                    <td>NCOSH HQ</td>
                                    <td>Health Inspector</td>
                                    <td>HI-002</td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" className="checkbox" /></td>
                                    <td>EMP-003</td>
                                    <td className="font-medium">Mohammed Ali</td>
                                    <td>Riyadh Branch</td>
                                    <td>Field Technician</td>
                                    <td>FT-003</td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" className="checkbox" /></td>
                                    <td>EMP-004</td>
                                    <td className="font-medium">Sara Abdullah</td>
                                    <td>Jeddah Branch</td>
                                    <td>Safety Officer</td>
                                    <td>SO-004</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                        <span className="text-sm text-muted">Showing 1-4 of 12 employees</span>
                        <div className="flex items-center gap-2">
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }}>←</button>
                            <span className="text-sm">Page 1 of 3</span>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }}>→</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
