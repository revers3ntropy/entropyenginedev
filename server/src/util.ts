import fastFolderSize from 'fast-folder-size';
import { Handler } from "./index";

/**
 * Gets the total recursive size of a folder from this location
 * @param {string} path
 * @param {Function} cb
 */
export const folderSize = (path: string, cb: (sizes: {
	bits: number, b: number, kb: number, mb: number, gb: number, tb: number,
}) => void) => {
	fastFolderSize(path, (err, bytes) => {
		if (err) {
			console.error(err);
			return;
		}

		bytes ??= 0;

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

export const folderSizePublic: Handler = async ({res, body}) => {
	folderSize(body.path, sizes => {
		res.end(JSON.stringify(sizes));
	});
}

/**
 * Cleans user input
 * @param {string} txt - dirty user input
 * @param {string} [filterOut='<>/-"\\`\'?&='] - all characters that should be removed from txt
 * @return {string} - clean user input
 */
export const clean = (txt: any, filterOut='<>/-"\\`\'?&='): string => {
	let newString = '';

	if (typeof txt === 'number') {
		return String(txt);
	}

	if (!txt) return '';

	txt = txt.toString();

	for (let char of txt) {
		if (!filterOut.includes(char)) {
			newString += char;
		}
	}

	return newString
}