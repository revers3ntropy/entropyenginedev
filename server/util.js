const fastFolderSize = require('fast-folder-size');

/**
 * Gets the total recursive size of a folder from this location
 * @param {string} path
 * @param {Function} cb
 */
exports.folderSize = (path, cb) => {
	fastFolderSize(path, (err, bytes) => {
		if (err) {
			console.error(err);
			return;
		}

		const mb = bytes / 1_000_000;

		cb({
			bits: mb * 8_000_000,
			b: mb * 1_000_000,
			kb: mb * 1_000,
			mb,
			gb: mb / 1_000,
			tb: mb / 1_000_000,
		});
	});
}

exports.folderSizePublic = ({res, body}) => {
	exports.folderSize(body.path, sizes => {
		res.end(JSON.stringify(sizes));
	});
}

/**
 * Cleans user input
 * @param {string} string - dirty user input
 * @param {string} [filterOut='<>/-"\\`\'?&='] - all characters that should be removed from the string
 * @return {string} - clean user input
 */
exports.clean = (string, filterOut='<>/-"\\`\'?&=') => {
	let newString = '';

	if (typeof string === 'number')
		return String(string);

	for (let char of string)
		if (!filterOut.includes(char))
			newString += char;

	return newString
}