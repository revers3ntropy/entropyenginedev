import {APIToken, request} from './request.js';

export function signOut () {
    localStorage.id = undefined;
}

export function forceSignOut (error) {
    signOut();
    window.location.href = 'https://entropyengine.dev/accounts/error?type=' + error;
}

export async function validID (userID) {
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
        ].includes(userID)
    ) && (await request('/user-exists', new APIToken({user: userID}))).exists;
}

export function mustBeSignedIn (whenSignedIn, whenNotSignedIn) {
    validID(localStorage.id).then(signedIn => {
        if (!signedIn) {
            forceSignOut('notSignedIn');
            whenNotSignedIn();
            return;
        }

        whenSignedIn();
    });
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

export function secondsToReadable (seconds) {
    const rawSeconds = seconds;
    let mins = seconds/60;
    let hours = mins/60;
    let days = hours/24;
    const years = days/365;

    let str = '';

    if (years >= 1) {
        str += `${Math.floor(years)} years `;
        days %= 365;
    }

    if (days >= 1 &&  rawSeconds < 31540000) {
        str += `${Math.floor(days)} days `;
        hours %= 24;
    }

    if (hours >= 1 && rawSeconds < 86400) {
        str += `${Math.floor(hours)} hours `;
        mins %= 60;
    }

    if (mins >= 1 && rawSeconds < 2600) {
        str += `${Math.floor(mins)} minutes `;
        seconds %= 60;
    }

    if (rawSeconds < 60)
        str += `${seconds} seconds`;
    return str;
}

export function unixTimeAgo (time) {
    return secondsToReadable(
        Math.round(
            new Date().getTime() / 1000
        ) - time
    );
}

export function nameFromScriptURL (path) {
    // ../projects/12345/assets/folder/script.es for example
    let file = path.substring(path.lastIndexOf('/')+1);
    return file.substring(0, file.length-3);
}