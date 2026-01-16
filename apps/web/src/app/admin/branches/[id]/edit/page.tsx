'use client';

import React from 'react';
import BranchForm from '../../components/BranchForm';

export default function EditBranchPage({ params }: { params: { id: string } }) {
    return <BranchForm branchId={params.id} />;
}
