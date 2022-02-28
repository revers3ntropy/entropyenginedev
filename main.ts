import './styles/global.less';

import './scripts/util';
import './scripts/request';
import './scripts/globalComponents';
import { apiURL } from "./scripts/constants";

window.apiToken = {
    user: localStorage.id
};

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