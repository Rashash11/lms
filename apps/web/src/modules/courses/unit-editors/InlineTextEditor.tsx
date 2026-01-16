import React from 'react';
import { Box } from '@mui/material';
import RichTextEditor from '../editor/RichTextEditor';

interface InlineTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function InlineTextEditor({ content, onChange, placeholder }: InlineTextEditorProps) {
    return (
        <Box sx={{ width: '100%' }}>
            <RichTextEditor
                content={content}
                onChange={onChange}
                placeholder={placeholder}
            />
        </Box>
    );
}
