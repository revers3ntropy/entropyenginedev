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
const API_PORT = 56787;

// UTILS

/**
 * @param {string} cmd
 * @returns {Promise<void>}
 */
const run = async (cmd) => {
	return new Promise((e) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) console.log(error);
			if (stdout) console.log(stdout);
			if (stderr) console.error(stderr);
			e();
		});
	});
}

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
const WEBPACK_PATHS = ['./footer.html', 'nav.html', 'types', 'main.ts', 'styles'];


async function startServer () {
	await (new Promise(async resolve => {
		run(`node ./server/index.js`);

		// keep on checking until the server is ready
		while (true) {
			await sleep(100);
			console.log('Waiting for server to start...');
			try {
				const res = await api().catch(() => {});
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
			console.log('serving ' + possiblePath);
			const content = fs.readFileSync(possiblePath).toString();
			res.end(content);
			return;
		}
		res.end('404');
	});

	server.listen(HTTP_PORT, hostname, () => {
		console.log(`Server running at http://${hostname}:${HTTP_PORT}/`);
	});
}

async function fileWatcher () {
	const watcher = chokidar.watch('./src', {
		persistent: true
	});

	watcher.on('change', p => {
		// remove src/ from stat of path and remove the actual filename
		p = path.dirname(p.substring(4));
		console.log('File changed in path ' + p);
		buildHTML(p, true, MAIN, {}, false);
	});
}

async function webpackBundleWatcher () {
	const watcher = chokidar.watch(WEBPACK_PATHS, {
		persistent: true
	});

	watcher.on('change', async p => {
		console.log('change in ' + p + '. Rebuilding WebPack Bundle...')
		await buildWebpack();
		console.log('Rebuilding with new bundle...');
		await buildHTML('', true, MAIN, {}, true);
		console.log('Finished rebuilding Webpack Bundle');
	});
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

	console.log(`Rebuild webpack bundle in ${now() - start} ms`);
}

(async () => {
	fs.truncateSync('server/log.txt', 0);
	
	await buildWebpack();

	await startServer();
	await startFileServer();
	await fileWatcher();
	await webpackBundleWatcher();
})();