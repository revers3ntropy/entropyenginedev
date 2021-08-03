import * as es from './build/index.js';
import readline from 'readline';
import {Test} from "./build/testFramework.js";
import './build/tests.js';
import {str} from "./build/util.js";
import {builtInFunctions} from "./build/builtInFunctions.js";

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

es.init(console.log, async (msg, cb) => cb(await askQuestion(msg)), ['./std.es']);


while (1) {
	const input = String(await askQuestion('>>> '));
	if (input === 'exit') break;

	else if (input === 'test') {
		const res = await Test.testAll();
		console.log(res.str());
		continue;
	}

	else if (/run [\w_\/.]+\.es/.test(input)) {
		builtInFunctions['import'](input.substring(4));
		// run breaks out of the loop, to allow inputs
		break;
	}

	else if (/run [\w_\/.]+/.test(input)) {
		builtInFunctions['import'](input.substring(4) + '.es');
		// run breaks out of the loop, to allow inputs
		break;
	}

	let res = es.run(input);

	let out = res.val;

	if (out === undefined) out = '--undefined--';
	if (out.length === 0)  out = '';
	if (out.length === 1)  out = out[0];
	if (res.error)         out = res.error.str;
	if (out !== undefined) console.log(str(out));
}