bugID = urlParam('b');

request('get-bug', {},{
    bugID
}).then(report => {
    $('#report-message').html(report.problem);

    $('#time').html(`
        reported
		${secondsToReadable(
            Math.round(
                new Date().getTime() / 1000
            ) - report.date
        )} ago
    `);

    const isFixed = !!report.fixed;
    const fixedAt = secondsToReadable(
        Math.round(
            new Date().getTime() / 1000
        ) - report.fixed
    )

    const status = $('#status');
    status.css({
        'background-color': isFixed? 'rgb(0, 200, 0)' : 'rgb(200, 0, 0)',
    });
    status.html(isFixed? `Closed ${fixedAt} ago`: 'Open');

});