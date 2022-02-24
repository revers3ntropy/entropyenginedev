const fs = require("fs");
const p = require('path');
const minifyHTML = require('html-minifier').minify;
const uglifyJS = require('uglify-js').minify;
const performanceNow = require("performance-now");
const chalk = require("chalk");
const {run} = require("./utils");

const
	now = () => Math.round(performanceNow()),
	HEAD = fs.readFileSync('./nav.html'),
	FOOT = fs.readFileSync('./footer.html');

/**
 * @param {string} dir
 * @param {boolean} QUIET
 * @param {string} MAIN
 * @param {any} timings
 * @param {boolean} recursive
 * @returns {Promise<number>} time taken to execute
 */
exports.buildHTML = async (dir, QUIET, MAIN, timings={}, recursive=true) => {
	if (!QUIET) console.log(`Building HTML at '${dir}'`);
	const start = now();

	const paths = fs.readdirSync(p.join('./src/', dir));

	const distPath = p.join('./dist/public_html', dir);

	let html = '';
	let css = '';
	let js = '';

	let subDirTime = 0;

	for (const path of paths) {
		if (path[path.length-1] === '~') {
			// is a backup file that will get deleted automatically by IDE
			continue;
		}
		const fullPath = p.join('./src', dir, path);

		if (fs.statSync(fullPath).isDirectory()) {
			if (recursive) {
				subDirTime += await exports.buildHTML(p.join(dir, path), QUIET, MAIN, timings);
			}
			continue;
		}

		if (path === 'index.html') {
			html = `
				${HEAD}
				${fs.readFileSync(fullPath)}
			`;
		}

		else if (path === 'index.less') {
			const start = now();
			await run (`lessc ${fullPath} ${distPath}/index.css > ts_less_log.txt`);
			if (!fs.existsSync(`${distPath}/index.css`)) {
				console.log(chalk.red`FILE '${distPath}/index.css' REQUIRED!`)
				continue;
			}
			const fileContent = fs.readFileSync(`${distPath}/index.css`);
			fs.unlinkSync(`${distPath}/index.css`);

			css = '<style>' + fileContent + '</style>';
			timings['Compile LESS'] += now() - start;
		}

		else if (path === 'index.ts') {
			const start = now();

			await run (`tsc --esModuleInterop --outDir ${distPath} --moduleResolution node --typeRoots "./types,./node_modules/@types" --module ES6 --lib "ES2018,DOM" ${fullPath} > ts_less_log.txt`);
			if (!fs.existsSync(`${distPath}/index.js`)) {
				console.log(chalk.red`FILE '${distPath}/index.js' REQUIRED!`);
				continue;
			}

			const fileContent = String(fs.readFileSync(`${distPath}/index.js`));
			fs.unlinkSync(`${distPath}/index.js`);

			const minified = uglifyJS(fileContent, {});

			if (minified.error) {
				console.error(`UglifyJS error: ${minified.error}`);
				return now() - start - subDirTime;
			}
			if (minified.warnings) {
				console.log(minified.warnings);
			}

			js = '<script defer>' + minified.code + '</script>';
			timings['Compile TS'] += now() - start;
		}
	}

	if (!fs.existsSync(distPath) && html) {
		fs.mkdirSync(distPath);
	}

	// main.ts, main.less
	js = '<script>' + MAIN + '</script>' + js;

	const final = minifyHTML(html + css + js + FOOT, {
		removeAttributeQuotes: false,
		removeComments: true,
		removeRedundantAttributes: false,
		removeScriptTypeAttributes: false,
		removeStyleLinkTypeAttributes: false,
		sortClassName: true,
		useShortDoctype: true,
		collapseWhitespace: true
	});

	fs.writeFileSync(distPath + '/index.html', final);

	let time = now() - start - subDirTime;

	timings[`'${distPath}' front-end path`] = time;

	return time;
}