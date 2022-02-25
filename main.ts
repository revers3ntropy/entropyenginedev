import {} from './node_modules/@types/matter-js';

import './styles/global.less';

import './scripts/util';
import './scripts/request';
import './scripts/globalComponents';

apiToken = {
    user: localStorage.id
};

const updatePing = async () => {
    const startTime = performance.now();

    let response = await fetch(`https://entropyengine.dev:50001/ping`, {
        method: 'POST',
        body: JSON.stringify({})
    });

    response = await response.json();

    if (!response.ok) {
        console.error('Server ping failed');
        return;
    }

    const time = performance.now() - startTime;

    $('#ping').html(Math.floor(time).toFixed(3));
}

setInterval(updatePing, 5000);
updatePing();