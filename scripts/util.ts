/**
 * Removes the user ID from localStorage
 */
window.signOut = () => {
    localStorage.id = undefined;
}

/**
 * @param {string} error - error type: see accounts/error/index.html for the different types
 */
window.forceSignOut = (error: string) => {
    window.signOut();
    window.location.href = 'https://entropyengine.dev/accounts/error?type=' + error;
}

/**
 * Checks if the user is signed in and the account exists
 * @param userID
 * @return {Promise<boolean>}
 */
window.validID = async (userID: number) => {
    return (![undefined, 0, '0', null, '', ' ', [], 'undefined', 'null', 'none'].includes(userID))
        && !!(await window.request('user-exists', {user: userID})).exists;
}

/**
 *
 * @param {Function} whenSignedIn
 * @param {Function} whenNotSignedIn
 */
window.mustBeSignedIn = async (whenSignedIn, whenNotSignedIn) => {
    const signedIn = await window.validID(localStorage.id);

    if (!signedIn) {
        window.forceSignOut('notSignedIn');
        if (whenNotSignedIn) {
            whenNotSignedIn();
        }
        return;
    }

    whenSignedIn();
}

let queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

/**
 * Gets the URL param of the name passed in
 * @param name
 * @return {string}
 */
window.urlParam = (name: string) => {
    return urlParams.get(name);
};

/**
 * await sleep(n) to halt the code for n ms
 * @param {Number} ms
 * @return {Promise<unknown>}
 */
window.sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generates a random number. Add ?p= genCacheBust() to always get the latest version of the file from the server
 * @return {number}
 */
window.genCacheBust = () => {
    return Math.ceil(Math.random() * 10000);
};

/**
 * Returns the time in seconds as a nice human-readable string
 * @param {Number} seconds
 * @return {string}
 */
window.secondsToReadable = (seconds: number) => {
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
};

/**
 * @param {Number} time
 * @return {string} - for example, '3 weeks'
 */
window.unixTimeAgo = (time: number) => {
    return window.secondsToReadable(
        Math.round(
            new Date().getTime() / 1000
        ) - time
    );
};

/**
 * Strips a URL down to the file name. Only works on files with a 2-char extension like es, ts or js
 * @param {string} path - eg 'path/script.es'
 * @return {string} -  'script'
 */
window.nameFromScriptURL = (path: string) => {
    let file = path.substring(path.lastIndexOf('/')+1);
    return file.substring(0, file.length-3);
};

/**
 *
 * @param {string} text
 */
window.copyToClipboard = (text: string) => {
    const clipboard = document.createElement('input');
    clipboard.style.position = 'absolute';
    clipboard.style.position = '-10000px';
    clipboard.value = text;
    clipboard.select();
    clipboard.setSelectionRange(0, 99999); /* For mobile devices */
    document.execCommand("copy");
    clipboard.innerText = '';
    document.removeChild(clipboard);
}