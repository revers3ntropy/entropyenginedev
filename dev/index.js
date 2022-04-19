#!/usr/bin/env zx

const fetch = require("axios");
const { exec } = require("child_process");
const path = require('path');
const http = require('http');
const fs = require("fs");
const { buildHTML } = require("../build/buildHTMLPath");
const chokidar = require('chokidar');
const chalk = require("chalk");
const performanceNow = require("performance-now");
const now = () => Math.round(performanceNow());

const hostname = '127.0.0.1';
const HTTP_PORT = 3000;
const API_PORT = 50001;

// UTILS

const api = async (path='', body={}) => {
	try {
		const res = await fetch.post(`http://${hostname}:${API_PORT}/${path}`, body);
		return res.data;
	} catch (error) {
		return {error};
	}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));


let MAIN = '';
const WEBPACK_PATHS = ['footer.html', 'nav.html', 'types', 'main.ts', 'styles', 'scripts'];


async function startServer () {
	await (new Promise(async resolve => {
		fs.writeFileSync('./server/log.txt', '');

		// run server asynchronously
		$`cd server; node --enable-source-maps index --dev > log.txt`;

		// keep on checking until the server is ready
		while (true) {
			await sleep(100);
			console.log(chalk.yellow`Waiting for server to start...`);
			try {
				const res = await api('ping')
					.catch(() => {});
				if (res['ok']) {
					resolve();
					return;
				}
			} catch (e) {}
		}
	}));
}

async function startFileServer () {
	const server = http.createServer((req, res) => {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/html');
		const paths = [
			path.join(__dirname, '../dist/public_html/', req.url, 'index.html'),
			path.join(__dirname, '../dist/public_html/', req.url)
		];

		for (let possiblePath of paths) {
			if (!fs.existsSync(possiblePath)) {
				continue;
			}
			console.log(`Serving ${possiblePath}`);
			const content = fs.readFileSync(possiblePath).toString();
			res.end(content);
			return;
		}
		res.end('404');
	});

	server.listen(HTTP_PORT, hostname, () => {
		console.log(chalk.green`Server running at http://${hostname}:${HTTP_PORT}/`);
	});
}

let REBUILDING_WEBPACK = false;

async function fileWatcher () {
	const watcher = chokidar.watch('./src', {
		persistent: true
	});

	let changedPaths = [];

	watcher.on('change', async p => {
		// remove src/ from stat of path and remove the actual filename
		p = path.dirname(p.substring(4));

		if (changedPaths.indexOf(p) !== -1) return;
		if (REBUILDING_WEBPACK) return;

		changedPaths.push(p);

		await buildHTML(p, true, MAIN, {}, false, true);
		changedPaths.splice(changedPaths.indexOf(p), 1);
	});
}

async function webpackBundleWatcher () {
	const watcher = chokidar.watch(WEBPACK_PATHS, {
		persistent: true
	});

	watcher.on('change', async p => {

		if (REBUILDING_WEBPACK) return;
		REBUILDING_WEBPACK = true;
		const start = now();

		console.log(chalk.yellow`Change in ${p} Rebuilding WebPack Bundle...`)
		await buildWebpack();
		console.log(chalk.yellow`Rebuilding with new bundle...`);
		await buildHTML('', true, MAIN, {}, true, true);
		console.log(chalk.green`Finished rebuilding Webpack Bundle in ${now() - start}ms`);
		REBUILDING_WEBPACK = false;
	});
}

async function buildWebpack () {
	const start = now();

	await $`webpack --config webpack.config.js > ./build/webpack_log.txt`;
	if (!fs.existsSync('./webpack_out.js')) {
		console.error(chalk.red`NO WEBPACK OUTPUT!`);
		return;
	}
	MAIN = fs.readFileSync('./webpack_out.js');
	fs.unlinkSync('./webpack_out.js');

	console.log(chalk.green`Rebuild webpack bundle in ${now() - start} ms`);
}

(async () => {
	fs.truncateSync('server/log.txt', 0);
	
	await buildWebpack();

	await startServer();
	await startFileServer();
	await fileWatcher();
	await webpackBundleWatcher();
})();