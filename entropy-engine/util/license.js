export const license = (key) => {
    // UNFINISHED
    if (key.substr(0, 3) !== 'EE-')
        return 0;
    if (key.length !== 12)
        return 0;
    return 1;
};
