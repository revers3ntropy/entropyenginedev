const { exec } = require("child_process");
/**
 * @param {string} cmd
 * @returns {Promise<void>}
 */
exports.run = async (cmd) => {
	return new Promise((e) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) console.log(error);
			if (stdout) console.error(stdout);
			if (stderr) console.error(stderr);
			e();
		});
	});
}

//src: https://stackoverflow.com/questions/1069666/sorting-object-property-by-values
exports.sortObjectEntries = (obj) => {
	let sortable = [];
	for (let vehicle in obj) {
		sortable.push([vehicle, obj[vehicle]]);
	}

	sortable.sort((a, b) => a[1] - b[1]);

	let objSorted = {}
	sortable.forEach(function(item){
		objSorted[item[0]] = item[1]
	});

	return objSorted
}