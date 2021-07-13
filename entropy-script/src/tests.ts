import {expect} from "./testFramework.js";

// maths logic
expect([1.99], '1.99');
expect([2], '1+1');
expect([2], '1   +1  ');
expect([22], '2+4*5');
expect([30], '(2+4)*5');
expect([19], '3 + 4 ^ 2');


// global constants
expect([true], 'true');
expect([false], 'false');
expect([0], 'null');
expect(['Undefined'], 'undefined');


// boolean logic
expect([false], '2==1');
expect([true], '2==2');
expect([false], '2!=2');
expect([false], '2 == 4 | 3 == 2');
expect([true], '2 + 2 == 4 | 3 + 2 == 2');
expect([false], '2 + 2 == 4 & 3 + 2 == 2');
expect([true], 'true & 3 - 1 == 2');
expect([true], '!false');


// multi-line statements
expect([true, false], '2==2; 2==5');


// strings
expect(['a', 'bc', 'defg'], '"a"; `bc`; \'defg\'');
expect([`h'h`], `'h\\'h'`);


// variables
expect([1], 'var a = 1');
expect('ReferenceError', 'a');
expect([1], 'global a = 1');
expect([1], 'a = 1');
expect(['Undefined'], 'var a;');
expect([1, 2], 'var a = 1; a = a + 1;');
expect('ReferenceError', 'var a = a + 1;');
//expect([2, 2], 'var b = 2; b *= 2');
expect(['Undefined', true], 'var a; a == undefined;');


// if
expect(['Undefined'], `
    if (!true & 1 | 7 + 2) {
        
    } else {
        
    }
`);
expect([false, 'Undefined', 'Undefined', true], `
    var result = false;
    var output;
    if (result)
        output = false;
    else
        output = !result;
    output;
`);
expect(['Undefined', 'Undefined', false], `
    var output;
    if (true) {
        output = true;
        output = false;
    } else {
        output = 1;
    }
    output;
   
`);


// while
expect(['Undefined', 0, 'Undefined', 9, 10], `
    var output;
    var i = 0;
    while (i < 10) {
        output = i;
        i = i + 1;
    }
    output; i;
`);
expect([0, 'Undefined', 10], `
    var i = 0;
    while (i < 10)
        i = i + 1;
    i;
`);


// arrays
expect([[0, 1, 2]], `
    [0, 1, 2];
`);
expect([[[6, 8], 1, [8, 9]]], `
    [[6, 8], 1, [8, 9]];
`);
expect([[0, 1, 2], 1], `
    var arr = [0, 1, 2];
    arr[1];
`);
expect([[[1, 2], 1, 2], 2], `
    var arr = [[1, 2], 1, 2];
    arr[0][1];
`);
expect([[0, 1, 2], 2, [0, 2, 2]], `
    var arr = [0, 1, 2];
    arr[1] = 2;
    arr;
`);
expect([[[1, 2], 1, 2], 5, [[1, 5], 1, 2]], `
    var arr = [[1, 2], 1, 2];
    arr[0][1] = 5;
    arr;
`);


// for
expect (['Undefined', 'Undefined', 2], `
    var output;
    for (var i in [0, 1, 2]) {
        output = i;
    }
    output;
`);
expect (['Undefined', 2], `
    for (global i in [0, 1, 2]) {}
    i;
`);
expect (['Undefined', 'Undefined', 2], `
    var output;
    for (i in [0, 1, 2]) {
        output = i;
    }
    output;
`);


// run built in functions
expect (['hi'], `
    log('hi')
`);


// range
expect([[0, 1, 2]], 'range(3)');
expect (['Undefined', 2], `
    for (global i in range(3)) {}
    i;
`);


// comments
expect([], '');
expect([], '// hiii');
expect([1], '// hiii \n 1');

// functions
expect(['N_function', 1], `
var myFunc = func () {
    return 1; 
};
myFunc();
`);
// callbacks
expect(['N_function', 1], `
var myFunc = func (cb) {
    return cb(); 
};
myFunc(func () {
    return 1;
});
`);
// recursion
expect(['N_function', 3], `
var myFunc = func (n) {
    if (n < 4)
        return n;
    return myFunc(n-1);
};
myFunc(10);
`);


// nesting
expect(['N_function', 4], `
var myFunc = func (n, cb) {
    log('start');
    log(cb);
    log(cb(n));
    log(!cb(n));
    log('___');
    while (!cb(n)) {
        n = n - 1;
        log('hiiii');
        log(n);
    }
        
               
    return n;
};
myFunc(20, func (n) { 
    return n < 5; 
});
`);
expect(['N_function', 0], `
var myFunc = func (arr) {
    for (var n in arr) {
        return n;
    }
};
myFunc([0, 1, 2, 3]);
`);
expect(['N_function', 3], `
var myFunc = func (arr, cb) {
    for (var n in arr) {
        if (cb(n)) {
            return n;
        }
    }
};
myFunc([0, 1, 2, 3], func (n) { 
    return n == 3;
});
`);
