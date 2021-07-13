import * as es from './build/index.js';
import readline from 'readline';
import {Test} from "./build/testFramework.js";
import './build/tests.js';


es.init(console.log);

function askQuestion(query) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise(resolve => rl.question(query, ans => {
		rl.close();
		resolve(ans);
	}));
}

while (true) {
	const input = await askQuestion('>> ');
	if (input === 'exit')
		break;
	if (input === 'test') {
		const res = await Test.testAll();
		console.log(res.str());
		continue;
	}

	let res = await es.run(input);

	let out = res.val;

	if (res.error) out = res.error.str;
	if (out.length === 1) out = out[0];
	if (out) console.log(out);
}