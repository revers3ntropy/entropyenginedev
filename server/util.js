const fastFolderSize = require('./node_modules/fast-folder-size')

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
	})
}

exports.folderSizePublic = (url, req, res, body) => {
	exports.folderSize(body.path, sizes => {
		res.end(JSON.stringify(sizes));
	});
}