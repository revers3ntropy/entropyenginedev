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