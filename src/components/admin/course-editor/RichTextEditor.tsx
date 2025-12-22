'use client';

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import {
    Box,
    IconButton,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import StrikethroughSIcon from '@mui/icons-material/StrikethroughS';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';

interface RichTextEditorProps {
    content?: string;
    onChange?: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ content = '', onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image,
            Youtube,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'rich-text-editor-content',
            },
        },
        immediatelyRender: false, // Fix SSR hydration warning
    });

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('Enter URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const url = window.prompt('Enter image URL:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
            {/* Toolbar */}
            <Box
                sx={{
                    display: 'flex',
                    gap: 0.5,
                    p: 1,
                    bgcolor: '#f5f5f5',
                    borderBottom: '1px solid #e0e0e0',
                    flexWrap: 'wrap',
                }}
            >
                {/* Text Formatting */}
                <ToggleButtonGroup size="small" sx={{ mr: 1 }}>
                    <ToggleButton
                        value="bold"
                        selected={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <FormatBoldIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                        value="italic"
                        selected={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <FormatItalicIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                        value="strike"
                        selected={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <StrikethroughSIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                        value="code"
                        selected={editor.isActive('code')}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                        <CodeIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem />

                {/* Headings */}
                <ToggleButtonGroup size="small" sx={{ mx: 1 }}>
                    <ToggleButton
                        value="h1"
                        selected={editor.isActive('heading', { level: 1 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    >
                        H1
                    </ToggleButton>
                    <ToggleButton
                        value="h2"
                        selected={editor.isActive('heading', { level: 2 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    >
                        H2
                    </ToggleButton>
                    <ToggleButton
                        value="h3"
                        selected={editor.isActive('heading', { level: 3 })}
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    >
                        H3
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem />

                {/* Lists */}
                <ToggleButtonGroup size="small" sx={{ mx: 1 }}>
                    <ToggleButton
                        value="bullet"
                        selected={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <FormatListBulletedIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                        value="ordered"
                        selected={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <FormatListNumberedIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem />

                {/* Insert */}
                <Box sx={{ display: 'flex', gap: 0.5, mx: 1 }}>
                    <Tooltip title="Add Link">
                        <IconButton size="small" onClick={addLink}>
                            <LinkIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Add Image">
                        <IconButton size="small" onClick={addImage}>
                            <ImageIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Divider orientation="vertical" flexItem />

                {/* Undo/Redo */}
                <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                    <Tooltip title="Undo">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                        >
                            <UndoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Redo">
                        <IconButton
                            size="small"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                        >
                            <RedoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Editor Content */}
            <Box
                sx={{
                    p: 2,
                    minHeight: 200,
                    maxHeight: 400,
                    overflow: 'auto',
                    '& .rich-text-editor-content': {
                        outline: 'none',
                        '& p': { mb: 1 },
                        '& h1': { fontSize: '2rem', fontWeight: 600, mb: 1 },
                        '& h2': { fontSize: '1.5rem', fontWeight: 600, mb: 1 },
                        '& h3': { fontSize: '1.25rem', fontWeight: 600, mb: 1 },
                        '& ul, & ol': { pl: 3, mb: 1 },
                        '& code': {
                            bgcolor: '#f5f5f5',
                            p: 0.5,
                            borderRadius: 0.5,
                            fontFamily: 'monospace',
                        },
                        '& pre': {
                            bgcolor: '#f5f5f5',
                            p: 2,
                            borderRadius: 1,
                            overflow: 'auto',
                        },
                        '& img': { maxWidth: '100%', height: 'auto' },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                    },
                }}
            >
                <EditorContent editor={editor} placeholder={placeholder} />
            </Box>
        </Box>
    );
}
