import {expect} from "./testFramework.js";

// maths logic
expect([1.99], '1.99');
expect([2], '1+1');
expect([2], '1   + 1  ');
expect([22], '2 + 4 * 5');
expect([30], '(2+4) * 5');
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
    while (!cb(n)) {
        n = n - 1;
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
expect(['N_function', 2], `
var myFunc = func () {
    return [0, 1, [0, 2]];
};
myFunc()[2][1];
`);

// objects + properties
expect(['Object', 1, 1, 1], `
    var a = {};
    a['a'] = 1;
    a.a;
    a['a'];
`);
expect(['Object', 1, 1, 1], `
    var a = {};
    a.a = 1;
    a.a;
    a['a'];
`);
expect(['Object', 6, 6, 6, 6, 6], `
    var a = {a: {}};
    a.a.a = 6;
    a.a.a;
    a['a'].a;
    a.a['a'];
    a['a']['a'];
`);
expect(['Object', 1], `
    var a = {a: 1};
    a.a;
`);
expect(['Object', 1, 1], `
    var a = {'a': 1};
    a['a'];
    a.a;
`);
expect(['a', 'Object', 1, 1], `
    var b = 'a';
    var a = {[b]: 1};
    a['a'];
    a.a;
`);
expect(['Object', 'N_function', 'e'], `
    var a = {a: func () {
        return 'hello world';
    }};
    a.a;
    a.a()[1];
`);

// classes
expect(['N_class'], `
    var myClass = class {
        init () {
            
        }
        
        publicFunction () {
            
        }
    };
`);
expect(['N_class'], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
    };
`);
expect(['N_class', 'myClass', 3], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
`);

expect(['N_class', 'myClass', 3, 'Undefined', 5], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        setA (a) {
            this.a = a;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    myInstance.setA(5);
    myInstance.a;
`);

expect(['N_class', 'myClass', 3, 'Undefined', 10], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        setA (a) {
            this.a = a;
        }
        
        doThing () {
            this.setA(10);
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    myInstance.doThing();
    myInstance.a;
`);
expect(['N_class', 'myClass', 3, 'myClass', true, false, false], `
    var myClass = class {
        init (a) {
            this.a = a;
        }
        
        getThis () {
            return this;
        }
    };
    
    var myInstance = myClass(3);
    myInstance.a;
    var this_ = myInstance.getThis();
    this_ == myInstance;
    this_ == myClass(3);
    myInstance == myClass(3);
`);
expect(['N_class', 'N_class', 'childClass', 2, 3, 'childClass'], `
    var parentClass = class {
        init (a) {
            log(a);
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var instance = childClass(2, 3);
    instance.a;
    instance.b;
    instance.constructor.name;
`);
expect(['N_class', 'N_class', 'N_class', 'grandChildClass', 2, 3, 4, 'grandChildClass'], `
    var parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    var instance = grandChildClass(2, 3, 4);
    instance.a;
    instance.b;
    instance.c;
    instance.constructor.name;
`);
expect(['N_class', 'N_class', 'N_class', 'N_class', 'greatGrandChildClass', 2, 3, 4, 5, 'greatGrandChildClass'], `
    var parentClass = class {
        init (a) {
            this.a = a;
        }
    };
    var childClass = class extends parentClass {
        init (a, b) {
            super(a);
            this.b = b;
        }
    };
    var grandChildClass = class extends childClass {
        init (a, b, c) {
            super(a, b);
            this.c = c;
        }
    };
    var greatGrandChildClass = class extends grandChildClass {
        init (a, b, c, d) {
            super(a, b, c);
            this.d = d;
        }
    };
    
    var instance = greatGrandChildClass(2, 3, 4, 5);
    instance.a;
    instance.b;
    instance.c;
    instance.d;
    instance.constructor.name;
`);

// vector library
expect(['N_class', 'v2', 'v2', '3, 4', 'v2', '8, 10', false, 'v2', '8, 10', '9, 11'], `
    var v2 = class {
        init (x, y) {
            this.x = x;
            this.y = y;
        }
        
        add (v) {
            this.x = this.x + v.x;
            this.y = this.y + v.y;
            return this;
        }
        
        scale (n) {
            this.x = this.x * n;
            this.y = this.y * n;
            return this;
        }
       
        clone () {
            return v2(this.x, this.y);
        }
        
        str () {
            return this.x + ', ' + this.y;
        }
    };
    
    var pos = v2(0, 0);
    pos.add(v2(3, 4));
    pos.str();
    pos.add(v2(1, 1)).scale(2);
    pos.str();
    pos.clone() == pos;
    var clone = pos.clone().add(v2(1, 1));
    pos.str();
    clone.str();
`);