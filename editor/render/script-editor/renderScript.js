import {state, scripts} from '../../state.js';
import {mapScripts} from "../../scripts.js";

export const renderScripts = (divID) => {
    const s = $(`#${divID}`);

    s.html(`
        <div style="width: 100%; height: 100%;">
            <!-- all scripts -->
            <div id="scripts-container">
                ${mapScripts((name, script) => `
                    <button 
                        onclick="window.switchScripts('${name}')" 
                        style="
                            border: none;
                            outline: none;
                            padding: 4px;
                            background-color: ${name === state.currentScript ? 'var(--input-bg)':'var(--input-opposite-bg)'}
                        "
                        onMouseOver="this.style.backgroundColor='var(--input-hover-bg)'"
                        onMouseOut="this.style.backgroundColor='${name === state.currentScript ? 'var(--input-bg)':'var(--input-opposite-bg)'}'"
                    >
                        ${name}.js
                    </button>
                `).join('')}
                <!-- for the spacing -->
                <span class="even-space-stretch"></span>
            </div>
            <!-- new scripts -->
            <input type="text" id="new-script-name" style="margin-right: 0" placeholder="new script name">
            <button onclick="window.blankScript('new-script-name')" class="short-button">+</button>

            
            <div id="script-editor" style="height: calc(100vh - 190px);"></div>
        </div>
    `);

    if (scripts.length < 1) return;
    if (!state.currentScript) return;

    const code = CodeMirror(document.getElementById(`script-editor`), {
        value: scripts[state.currentScript] ?? '',
        mode:  "javascript",
        theme: 'darcula',
        lineNumbers: true,
        gutter: true
    });

    // save the new code locally
    code.on('change', () => {
        scripts[state.currentScript] = code.getValue();
    });
};