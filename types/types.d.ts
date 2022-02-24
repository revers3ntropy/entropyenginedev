export {};

declare global {
    let
        signOut: () => void,
        forceSignOut: (error: string) => void,
        validID: (userID: number) => Promise<boolean>,
        mustBeSignedIn: (wheSignedIn: () => void, whenNotSignedIn: () => void) => void,
        urlParam: (name: string) => string | null,
        sleep: (ms: number) => Promise<void>,
        genCacheBust: () => number,
        secondsToReadable: (seconds: number) => string,
        unixTimeAgo: (time: number) => string,
        nameFromScriptURL: (path: string) => string,
        request: (url: string, token?: apiTok, body?: {}) => Promise<any>;

    let apiToken: apiTok;

    const $: any;

    interface apiTok {
        user?: number,
        project?: number
    }

    interface commentData {
        _id: number,
        content: string,
        username: string,
        date: number
    }

    interface Window {
        [k: string]: any;
    }
}
