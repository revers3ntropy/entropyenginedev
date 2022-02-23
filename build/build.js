/**
 * Builds and deploys the project to entropyengine.dev
 * OPTIONS:
 * --quiet       | limited console output
 * --silent      | no console output
 * --no-tests    | Don't run tests. Cannot be combined with --prod
 * --no-frontend | Don't rebuild the HTML, CSS and JS
 * --no-backend  | Don't rebuild the node backend server
 * --no-upload   | Don't upload anything
 */

// utils
const fs = require('fs');
const {run, sortObjectEntries} = require('./utils');
const performanceNow = require("performance-now");
const now = () => Math.round(performanceNow());

// beatify
const chalk = require('chalk');
const Confirm = require('prompt-confirm');

const {buildHTML} = require('./buildHTMLPath');

const
	timings = {
		'Compile TS': 0,
		'Compile LESS': 0
	},
	QUIET = process.argv.indexOf('--quiet') !== -1;

if (process.argv.indexOf('--silent') !== -1) {
	console = {
		log: () => {},
		error: () => {},
	};
}

let MAIN = '';

async function cpServer () {
	const start = now();

	const paths = fs.readdirSync('./server/');
	const distPath = `./dist/server/`;

	for (const path of paths) {
		if (
			fs.statSync('./server/' + path).isDirectory() ||
			path.split('.').pop() !== 'py'
		) {
			continue;
		}
		await run(`cp ./server/${path} ${distPath}`);
	}

	timings[`Build Node Server`] = now() - start;
}

async function upload () {
	const start = now();

	const paths = fs.readdirSync('./dist/');

	for (const path of paths) {
		console.log('Uploading path ' + path);
		if (fs.statSync('./dist/' + path).isDirectory()) {
			await run(
				`sshpass -f './build/sshPass.txt' scp -r ./dist/${path} entropyengine@entropyengine.dev:~/`);
			continue;
		}
		await run(
			`sshpass -f './build/sshPass.txt' scp ./dist/${path} entropyengine@entropyengine.dev:~/`);
	}

	console.log(chalk.green('Finished Uploading'));

	timings['Upload'] = now() - start;
}

function logTimings () {
	const namePadding = 60;
	const timePadding = 10;

	let width = namePadding + timePadding + 10;

	console.log('');
	console.log(` Timings `.padStart(width/2 + 4, '-').padEnd(width, '-'));

	const sortedTimings = sortObjectEntries(timings);

	let highlight = false;
	for (let key in sortedTimings) {
		let time = sortedTimings[key];
		let unit = 'ms';
		let decimalPlaces = 0;

		if (time > 1000) {
			time /= 1000;
			unit = 's ';
			decimalPlaces = 2;
		}

		let timeStr = chalk.yellow(time.toFixed(decimalPlaces).padStart(timePadding))
		if (highlight) {
			console.log('|' + chalk.bgBlack` ${key.padEnd(namePadding)} | ${timeStr} ${unit} ` + '|');
		} else {
			console.log(`| ${key.padEnd(namePadding)} | ${timeStr} ${unit} |`);
		}
		highlight = !highlight;
	}
	console.log(''.padStart(width, '-'))
}

async function buildWebpack () {
	const start = now();

	await run('webpack --config webpack.config.js > webpack_log.txt');
	if (!fs.existsSync('./webpack_out.js')) {
		console.error(chalk.red`NO WEBPACK OUTPUT!`);
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');

	timings['Build WebPack'] = now() - start;
}

async function main () {

	const prompt = new Confirm(chalk.blue('Are you sure you want to deploy to production?'));
	const res = await prompt.run();
	if (!res) {
		return;
	}

	const start = now();

	if (process.argv.indexOf('--no-frontend') === -1) {
		if (!QUIET) console.log('Building WebPack...');
		await buildWebpack().catch(handleError);

		await buildHTML('', QUIET, MAIN, timings, true).catch(handleError);
	}

	if (process.argv.indexOf('--no-backend') === -1) {
		if (!QUIET) console.log('Building Node Server...');
		await cpServer().catch(handleError);
	}

	if (process.argv.indexOf('--no-upload') === -1) {
		if (!QUIET) console.log('Uploading...');
		await upload().catch(handleError);
	}

	console.log(chalk.green`\nBuild Successful`);

	timings['Total'] = now() - start;

	if (!QUIET) {
		logTimings();
	}
}

function handleError (e) {
	console.log(e);
	console.log(chalk.red('\n Build Failed'));
	throw '';
}

try {
	main().catch(handleError);
} catch (e) {
	handleError(e)
}
