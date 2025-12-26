'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import FloatingMenuExtension from '@tiptap/extension-floating-menu';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

import { Box, IconButton, Toolbar, Divider, ToggleButton, ToggleButtonGroup, Paper, Tooltip, Zoom } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TableChartIcon from '@mui/icons-material/TableChart';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import LabelIcon from '@mui/icons-material/Label';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const FloatingToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    return (
        <BubbleMenu editor={editor}>
            <Paper
                elevation={6}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: '4px 8px',
                    borderRadius: '8px',
                    bgcolor: '#fff',
                    border: '1px solid #e2e8f0',
                    gap: 0,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
            >
                <Tooltip title="Bold (Ctrl+B)">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        sx={{ color: editor.isActive('bold') ? '#004282' : '#4a5568', borderRadius: '4px' }}
                    >
                        <FormatBoldIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Italic (Ctrl+I)">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        sx={{ color: editor.isActive('italic') ? '#004282' : '#4a5568', borderRadius: '4px' }}
                    >
                        <FormatItalicIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Underline (Ctrl+U)">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        sx={{ color: editor.isActive('underline') ? '#004282' : '#4a5568', borderRadius: '4px' }}
                    >
                        <FormatUnderlinedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 20, my: 'auto', alignSelf: 'center', borderColor: '#e2e8f0' }} />

                <Tooltip title="Text color">
                    <IconButton size="small" sx={{ color: '#4a5568', borderRadius: '4px' }}>
                        <FormatColorTextIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Font family">
                    <IconButton size="small" sx={{ color: '#4a5568', borderRadius: '4px' }}>
                        <TextFieldsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 20, my: 'auto', alignSelf: 'center', borderColor: '#e2e8f0' }} />

                <Tooltip title="TalentCraft AI">
                    <IconButton size="small" sx={{ color: '#7c4dff', borderRadius: '4px' }}>
                        <AutoFixHighIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Clear formatting">
                    <IconButton size="small" onClick={() => editor.chain().focus().unsetAllMarks().run()} sx={{ color: '#4a5568', borderRadius: '4px' }}>
                        <FormatPaintIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 20, my: 'auto', alignSelf: 'center', borderColor: '#e2e8f0' }} />

                <Tooltip title="Bullet list">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        sx={{ color: editor.isActive('bulletList') ? '#004282' : '#4a5568', borderRadius: '4px' }}
                    >
                        <FormatListBulletedIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Link">
                    <IconButton
                        size="small"
                        onClick={() => {
                            const url = window.prompt('URL');
                            if (url) {
                                editor.chain().focus().setLink({ href: url }).run();
                            }
                        }}
                        sx={{ color: editor.isActive('link') ? '#004282' : '#4a5568', borderRadius: '4px' }}
                    >
                        <LinkIcon fontSize="small" />
                    </IconButton>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.75, height: 20, my: 'auto', alignSelf: 'center', borderColor: '#e2e8f0' }} />

                <IconButton size="small" sx={{ color: '#4a5568', borderRadius: '4px' }}>
                    <MoreHorizIcon fontSize="small" />
                </IconButton>
            </Paper>
        </BubbleMenu>
    );
};

const QuickInsertBar = ({ editor }: { editor: any }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (!editor) return;

        const updateVisibility = () => {
            const { selection } = editor.state;
            const { $from } = selection;
            const isEmptyLine = $from.parent.content.size === 0;
            const isEditorEmpty = editor.isEmpty;
            setIsVisible(isEmptyLine || isEditorEmpty);
        };

        // Check on mount
        updateVisibility();

        // Listen for selection changes
        editor.on('selectionUpdate', updateVisibility);
        editor.on('update', updateVisibility);
        editor.on('focus', updateVisibility);

        return () => {
            editor.off('selectionUpdate', updateVisibility);
            editor.off('update', updateVisibility);
            editor.off('focus', updateVisibility);
        };
    }, [editor]);

    if (!editor || !isVisible) return null;

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                    setIsExpanded(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleItemClick = (action: () => void) => {
        action();
        setIsExpanded(false);
    };

    const menuItems = [
        {
            icon: <CloudUploadIcon fontSize="small" />,
            label: 'Upload file or picture',
            onClick: () => fileInputRef.current?.click()
        },
        {
            icon: <TableChartIcon fontSize="small" />,
            label: 'Table',
            onClick: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        },
        {
            icon: <FormatListBulletedIcon fontSize="small" />,
            label: 'Bullet list',
            onClick: () => editor.chain().focus().toggleBulletList().run()
        },
        {
            icon: <FormatListNumberedIcon fontSize="small" />,
            label: 'Numbered list',
            onClick: () => editor.chain().focus().toggleOrderedList().run()
        },
        {
            icon: <HorizontalRuleIcon fontSize="small" />,
            label: 'Divider',
            onClick: () => editor.chain().focus().setHorizontalRule().run()
        },
        {
            icon: <LabelIcon fontSize="small" />,
            label: 'Insert Variable',
            onClick: () => { }
        },
        {
            icon: <AutoFixHighIcon fontSize="small" />,
            label: 'AI Content',
            onClick: () => { },
            color: '#004282'
        },
    ];

    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            minHeight: 44
        }}>
            <Tooltip title="Quick Insert">
                <IconButton
                    onClick={handleExpandToggle}
                    sx={{
                        width: 36,
                        height: 36,
                        bgcolor: isExpanded ? '#e9ecef' : '#f8f9fa',
                        border: '1px solid #dee2e6',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        '&:hover': {
                            bgcolor: '#e9ecef',
                        },
                        color: '#495057',
                        transition: 'all 0.15s ease'
                    }}
                >
                    {isExpanded ? <CloseIcon sx={{ fontSize: 18 }} /> : <AddIcon sx={{ fontSize: 18 }} />}
                </IconButton>
            </Tooltip>

            {isExpanded && (
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center'
                }}>
                    {menuItems.map((item, index) => (
                        <Zoom in={true} style={{ transitionDelay: `${index * 30}ms` }} key={index}>
                            <Tooltip title={item.label} placement="top">
                                <IconButton
                                    onClick={() => handleItemClick(item.onClick)}
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: '#fff',
                                        border: '1px solid #e9ecef',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                        '&:hover': {
                                            bgcolor: '#f8f9fa',
                                            borderColor: '#dee2e6',
                                            transform: 'scale(1.05)'
                                        },
                                        color: item.color || '#495057',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {item.icon}
                                </IconButton>
                            </Tooltip>
                        </Zoom>
                    ))}
                </Box>
            )}

            {/* Hidden file input for image uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
            />
        </Box>
    );
};

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null;
    }

    return (
        <Box sx={{ borderBottom: 'none', p: 0, bgcolor: 'transparent' }}>
            <Toolbar variant="dense" disableGutters sx={{ minHeight: 'auto', gap: 0.5 }}>
                <ToggleButtonGroup size="small" exclusive>
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
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <ToggleButtonGroup size="small" exclusive>
                    <ToggleButton
                        value="bulletList"
                        selected={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <FormatListBulletedIcon fontSize="small" />
                    </ToggleButton>
                    <ToggleButton
                        value="orderedList"
                        selected={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <FormatListNumberedIcon fontSize="small" />
                    </ToggleButton>
                </ToggleButtonGroup>

                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                <IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                    <UndoIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                    <RedoIcon fontSize="small" />
                </IconButton>
            </Toolbar>
        </Box>
    );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            FloatingMenuExtension,
            Link.configure({ openOnClick: false }),
            Image,
            Placeholder.configure({ placeholder: placeholder || 'Write something...' })
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
                style: 'min-height: 200px; padding: 1rem;'
            }
        }
    });

    return (
        <Box sx={{ bgcolor: '#fff' }}>
            <FloatingToolbar editor={editor} />
            <QuickInsertBar editor={editor} />
            {/* Main MenuBar hidden to match TalentLMS minimalist design until text is selected */}
            <Box sx={{ borderBottom: 'none', mb: 1, '& .MuiToolbar-root': { px: 0 }, display: 'none' }}>
                <MenuBar editor={editor} />
            </Box>
            <Box sx={{
                p: 0,
                '& .ProseMirror': {
                    minHeight: '100px',
                    outline: 'none',
                    fontSize: '1rem',
                    color: '#4a5568',
                    px: 0,
                    '& p.is-editor-empty:first-child::before': {
                        color: '#a0aec0',
                        content: 'attr(data-placeholder)',
                        float: 'left',
                        height: 0,
                        pointerEvents: 'none',
                    },
                    '& img': {
                        maxWidth: '100%',
                        height: 'auto',
                        display: 'block',
                        margin: '1rem 0',
                        borderRadius: '4px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }
                }
            }}>
                <EditorContent editor={editor} />
            </Box>
        </Box>
    );
}
