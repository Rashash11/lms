type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function isEnabled(level: LogLevel) {
    if (process.env.NODE_ENV !== 'production') return true;
    const debug = process.env.DEBUG?.toLowerCase();
    if (debug === '1' || debug === 'true') return true;
    return level === 'warn' || level === 'error';
}

function safeArgs(args: any[]) {
    return args.map((a) => {
        if (a instanceof Error) {
            return { name: a.name, message: a.message, stack: process.env.NODE_ENV !== 'production' ? a.stack : undefined };
        }
        return a;
    });
}

export const logger = {
    debug: (...args: any[]) => {
        if (!isEnabled('debug')) return;
        console.debug(...safeArgs(args));
    },
    info: (...args: any[]) => {
        if (!isEnabled('info')) return;
        console.info(...safeArgs(args));
    },
    warn: (...args: any[]) => {
        if (!isEnabled('warn')) return;
        console.warn(...safeArgs(args));
    },
    error: (...args: any[]) => {
        if (!isEnabled('error')) return;
        console.error(...safeArgs(args));
    },
};

