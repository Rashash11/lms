import { Node, mergeAttributes } from '@tiptap/core';

export const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            type: {
                default: 'info',
                parseHTML: element => element.getAttribute('data-type'),
                renderHTML: attributes => ({
                    'data-type': attributes.type,
                }),
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[class="tlms-callout"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { class: 'tlms-callout' }), 0];
    },

    addCommands() {
        return {
            setCallout: () => ({ commands }: { commands: any }) => {
                return commands.toggleNode(this.name, 'paragraph');
            },
        } as any;
    },
});
