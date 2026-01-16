import React from 'react';
import NextLink from 'next/link';

type Props = React.ComponentPropsWithoutRef<typeof NextLink>;

const AppLink = React.forwardRef<HTMLAnchorElement, Props>(function AppLink(props, ref) {
    const { prefetch, ...rest } = props;
    return <NextLink ref={ref} prefetch={prefetch ?? false} {...rest} />;
});

export default AppLink;
