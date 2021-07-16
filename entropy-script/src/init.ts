import {builtInArgs, builtInFunctions} from "./builtInFunctions.js";
import {N_builtInFunction} from "./nodes.js";
import {Context} from "./context.js";
import {ImportError} from "./errors.js";
import {Position} from "./position.js";
import {run} from "./index.js";
import {globalConstants} from "./constants.js";
import {str} from "./util.js";

export function initialise (globalContext: Context, printFunc: (...args: any[]) => void) {
    builtInFunctions['import'] = async context => {

        const url = context.get('url');

        function error (detail = 'Import Failed') {
            return new ImportError(Position.unknown, Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
        }

        if (!url) return error('No URL given');

        let fetch_;

        try {
            fetch_ = fetch;
        } catch (e) {
            // @ts-ignore
            fetch_ = (await import('../../node_modules/node-fetch/lib/index.js')).default;
        }

        let result: any;

        let pat = /^https?:\/\//i;
        if (pat.test(url)) {

            result = await fetch_(url);
            return await run(await result.text());

        } else {
            try {
                const fs = await import('fs');

                // data is actually a string
                const data: any = fs.readFileSync(url, {encoding:'utf8'});
                return await run(data);

            } catch (e) {
                return new ImportError(Position.unknown, Position.unknown, `
                Could not import file ${url}
            `)
            }
        }
    }

    builtInArgs['import'] = ['url'];

    builtInFunctions['print'] = async context => {
        printFunc('> ' + str(context.get('message')));
    }

    builtInArgs['print'] = ['message'];

    for (let builtIn in builtInFunctions) {
        const node = new N_builtInFunction(builtInFunctions[builtIn], builtInArgs[builtIn] || []);
        globalContext.set(builtIn, node, true);
    }

    for (let constant in globalConstants) {
        globalContext.set(constant, globalConstants[constant], true);
    }

    globalContext.initialisedAsGlobal = true;
}
