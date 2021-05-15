export function signOut () {
    localStorage.id = undefined;
}

export function forceSignOut (error) {
    signOut();
    window.location.href = 'https://entropyengine.dev/accounts/error?type=' + error;
}

export function isSignedIn () {
    // get all possible cases
    return (
        ![
            undefined,
            0,
            '0',
            null,
            '',
            ' ',
            [],
            'undefined',
            'null',
            'none',
        ].includes(localStorage.id)
        // can't use yet as all ids are below 100...
        //&&
        //    localStorage.id > 100
    );
}

export function mustBeSignedIn (whenSignedIn) {
    if (!isSignedIn()) {
        forceSignOut('notSignedIn');
        return;
    }
    
    whenSignedIn();
}

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

export function urlParam (name) {
    return urlParams.get(name);
}

export function clean (string, filterOut) {
    if (!string || !filterOut) return string;

    let newString = '';

    for (let char of string) {
        if (!filterOut.includes(char)) {
            newString += char;
        }
    }

    return newString
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function genCacheBust () {
    return Math.ceil(Math.random() * 10000);
}

export function cullString (str, cutoff) { 
    if (cutoff >= str.length) 
        return str;

    let newStr = '';
    for (let i = 0; i < cutoff; i++)
        newStr += str[i] || '';
    
    if (newStr.length < str.length)
        newStr += '...';
    
    return newStr;
}

export function secondsToReadable (seconds) {
    const rawSeconds = seconds;
    let mins = seconds/60;
    let hours = mins/60;
    let days = hours/24;
    const years = days/365;

    let str = '';

    if (years >= 1) {
        str += `${Math.floor(years)}yr `;
        days = days % 365;
    }

    if (days >= 1) {
        str += `${Math.floor(days)} day `;
        hours = hours % 24;
    }

    if (hours >= 1 && rawSeconds < 31540000) {
        str += `${Math.floor(hours)}hr `;
        mins = mins % 60;
    }

    if (mins >= 1 && rawSeconds < 86400) {
        str += `${Math.floor(mins)}m `;
        seconds = seconds % 60;
    }

    if (rawSeconds < 3600)
        str += `${seconds}s`;

    return str;
}