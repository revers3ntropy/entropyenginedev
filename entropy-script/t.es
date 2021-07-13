var myFunc = func (n, cb) {
    while (!cb(n)) {
        n = n - 1;
    }
    return n;
};
myFunc(20, func (n) {
    return n < 5;
});