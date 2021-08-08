import {builtInArgs, builtInFunctions} from "./builtInFunctions.js";
import {N_builtInFunction} from "./nodes.js";
import {Context} from "./context.js";
import {ImportError} from "./errors.js";
import {Position} from "./position.js";
import {run} from "./index.js";
import {globalConstants} from "./constants.js";
import {nameFromScriptURL, str} from "./util.js";

export function initialise (globalContext: Context, printFunc: (...args: any[]) => void) {
    builtInFunctions['import'] = async (context: Context) => {
        const url = context.get('url');

        function error (detail = 'Import Failed') {
            return new ImportError(Position.unknown, Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
        }

        if (!url) return error('No URL given');

        let result: any;

        result = await fetch(url);
        let newContext = new Context(nameFromScriptURL(url));
        return await run(await result.text(), {
            env: newContext
        });
    }

    builtInArgs['import'] = ['url'];

    builtInFunctions['print'] = async (context: Context) => {
        let output = '> ';
        if (context instanceof Context) {
            for (let arg of context.get('args'))
                output += str(arg);
        } else {
            output += str(context);
        }

        printFunc(output);
    }

    for (let builtIn in builtInFunctions) {
        const node = new N_builtInFunction(builtInFunctions[builtIn], builtInArgs[builtIn] || []);
        globalContext.set(builtIn, node, {
            global: true,
            isConstant: true
        });
    }

    for (let constant in globalConstants) {
        globalContext.set(constant, globalConstants[constant], {
            global: true,
            isConstant: true
        });
    }

    globalContext.initialisedAsGlobal = true;
}
