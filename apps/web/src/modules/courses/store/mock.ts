// Mock data for Course Store page

export interface Logo {
    id: string;
    name: string;
    imageUrl: string;
}

export interface Course {
    id: string;
    title: string;
    code: string;
    price: string;
    imageUrl: string;
}

export interface StoreSection {
    id: string;
    title: string;
    chips: string[];
    description: string;
    viewAllUrl: string;
    courses: Course[];
}

export const marqueeLogos: Logo[] = [
    { id: '1', name: 'MITRATECH', imageUrl: 'https://via.placeholder.com/140x40/00D4FF/ffffff?text=MITRATECH' },
    { id: '2', name: 'BIGGER BRAINS', imageUrl: 'https://via.placeholder.com/140x40/FF6B35/ffffff?text=BIGGER+BRAINS' },
    { id: '3', name: 'CFISA', imageUrl: 'https://via.placeholder.com/140x40/004E89/ffffff?text=CFISA' },
    { id: '4', name: 'IAM', imageUrl: 'https://via.placeholder.com/140x40/00A878/ffffff?text=IAM' },
    { id: '5', name: 'HSI', imageUrl: 'https://via.placeholder.com/140x40/6A4C93/ffffff?text=HSI' },
    { id: '6', name: 'TRALIANT', imageUrl: 'https://via.placeholder.com/140x40/1982C4/ffffff?text=TRALIANT' },
];

export const talentLibraryCourses: Course[] = [
    {
        id: 'tl1',
        title: 'OKRs – Vision, Planning & Measuring',
        code: 'TL001',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=260&h=150&fit=crop',
    },
    {
        id: 'tl2',
        title: 'Ups and Downs Beyond Vanity Metrics',
        code: 'TL002',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=260&h=150&fit=crop',
    },
    {
        id: 'tl3',
        title: 'Setting Challenging KPIs',
        code: 'TL003',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=260&h=150&fit=crop',
    },
    {
        id: 'tl4',
        title: 'Ties & Window Performance Management',
        code: 'TL004',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=260&h=150&fit=crop',
    },
    {
        id: 'tl5',
        title: 'Leadership Development Essentials',
        code: 'TL005',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=260&h=150&fit=crop',
    },
    {
        id: 'tl6',
        title: 'Effective Communication Skills',
        code: 'TL006',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=260&h=150&fit=crop',
    },
    {
        id: 'tl7',
        title: 'Time Management Mastery',
        code: 'TL007',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=260&h=150&fit=crop',
    },
    {
        id: 'tl8',
        title: 'Creative Problem Solving',
        code: 'TL008',
        price: 'Included',
        imageUrl: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=260&h=150&fit=crop',
    },
];

export const externalCourses: Course[] = [
    {
        id: 'ext1',
        title: 'Brain Bites - Email Management',
        code: 'BB003',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=260&h=150&fit=crop',
    },
    {
        id: 'ext2',
        title: 'Brain Bites - Organizing your Files',
        code: 'BB004',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=260&h=150&fit=crop',
    },
    {
        id: 'ext3',
        title: 'Brain Bites - Managing Interruptions and...',
        code: 'BB264',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=260&h=150&fit=crop',
    },
    {
        id: 'ext4',
        title: 'Brain Bites - Working Across Cultures',
        code: 'BB263',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=260&h=150&fit=crop',
    },
    {
        id: 'ext5',
        title: 'Brain Bites - Project Management Basics',
        code: 'BB265',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=260&h=150&fit=crop',
    },
    {
        id: 'ext6',
        title: 'Brain Bites - Collaboration Skills',
        code: 'BB266',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=260&h=150&fit=crop',
    },
    {
        id: 'ext7',
        title: 'Brain Bites - Digital Literacy',
        code: 'BB267',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=260&h=150&fit=crop',
    },
    {
        id: 'ext8',
        title: 'Brain Bites - Remote Work Success',
        code: 'BB268',
        price: '$10.00',
        imageUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=260&h=150&fit=crop',
    },
];

export const complianceCourses: Course[] = [
    {
        id: 'comp1',
        title: 'Harassment Prevention: US Supervisor; All States...',
        code: 'ELHD46',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=260&h=150&fit=crop',
    },
    {
        id: 'comp2',
        title: 'Harassment Prevention: US Non-Supervisor; All States...',
        code: 'ELHD36',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=260&h=150&fit=crop',
    },
    {
        id: 'comp3',
        title: 'HIPAA for Business Associates',
        code: 'ELDP62',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=260&h=150&fit=crop',
    },
    {
        id: 'comp4',
        title: 'Harassment Prevention: CT Supervisor, Professional...',
        code: 'ELHD14',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=260&h=150&fit=crop',
    },
    {
        id: 'comp5',
        title: 'Workplace Safety & OSHA Compliance',
        code: 'ELSF01',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=260&h=150&fit=crop',
    },
    {
        id: 'comp6',
        title: 'Data Privacy & GDPR Fundamentals',
        code: 'ELDP01',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=260&h=150&fit=crop',
    },
    {
        id: 'comp7',
        title: 'Anti-Bribery & Corruption Training',
        code: 'ELCM01',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=260&h=150&fit=crop',
    },
    {
        id: 'comp8',
        title: 'Workplace Ethics & Conduct',
        code: 'ELEH01',
        price: 'Contact us',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=260&h=150&fit=crop',
    },
];

export const sections: StoreSection[] = [
    {
        id: 'talent-library',
        title: 'TalentLibrary™',
        chips: ['POWER SKILLS', 'WORKPLACE ESSENTIALS', 'ADD-ON LEARNING', 'ENGAGING LEARNING'],
        description: 'A built-in collection of soft skills and business courses to boost everyday workplace knowledge. Add it directly to your <link>subscription plan</link>.',
        viewAllUrl: '/admin/course-store/talent-library',
        courses: talentLibraryCourses,
    },
    {
        id: 'external',
        title: 'External',
        chips: ['SEAMLESS INTEGRATION', 'GLOBAL CATALOG', 'MULTILINGUAL TRAINING'],
        description: 'Seamless, enterprise-ready integration to support the complex training needs of global teams. Connect OpenSesame via <link>Integrations</link>.',
        viewAllUrl: '/admin/course-store/external',
        courses: externalCourses,
    },
    {
        id: 'compliance',
        title: 'Compliance',
        chips: ['REGULATORY BUNDLES', 'COMPLIANCE TRAINING', 'ANTIHARASSMENT'],
        description: "Essential compliance bundles to help your teams stay on top of workplace requirements. If you'd like to know more <link>let us know</link>.",
        viewAllUrl: '/admin/course-store/compliance',
        courses: complianceCourses,
    },
];
