import './styles/global.less';

import './scripts/util';
import './scripts/request';
import './scripts/globalComponents';
import { apiURL, SITE_ROOT } from "./scripts/constants";

window.apiToken = {
    user: localStorage.id
};

$('#NAV-account').attr('href', `${SITE_ROOT}/accounts/@`);
$('#NAV-docs').attr('href', `${SITE_ROOT}/docs`);
$('#NAV-home').attr('href', `${SITE_ROOT}/`);
$('#NAV-projects').attr('href', `${SITE_ROOT}/accounts/my-projects`);

const updatePing = async () => {
    const startTime = performance.now();

    let response = await fetch(`${apiURL}/ping`, {
        method: 'POST',
        body: JSON.stringify({})
    });

    response = await response.json();

    if (!response.ok) {
        console.error('Server ping failed');
        return;
    }

    const time = performance.now() - startTime;

    $('#ping').html(Math.floor(time).toFixed(0));
}

setInterval(updatePing, 5000);
updatePing();