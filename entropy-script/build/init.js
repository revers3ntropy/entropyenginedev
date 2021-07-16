var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { builtInArgs, builtInFunctions } from "./builtInFunctions.js";
import { N_builtInFunction } from "./nodes.js";
import { ImportError } from "./errors.js";
import { Position } from "./position.js";
import { run } from "./index.js";
import { globalConstants } from "./constants.js";
import { str } from "./util.js";
export function initialise(globalContext, printFunc) {
    builtInFunctions['import'] = (context) => __awaiter(this, void 0, void 0, function* () {
        const url = context.get('url');
        function error(detail = 'Import Failed') {
            return new ImportError(Position.unknown, Position.unknown, url, detail + '. Remember that relative URLs are only allowed with node.js');
        }
        if (!url)
            return error('No URL given');
        let fetch_;
        try {
            fetch_ = fetch;
        }
        catch (e) {
            // @ts-ignore
            fetch_ = (yield import('../../node_modules/node-fetch/lib/index.js')).default;
        }
        let result;
        let pat = /^https?:\/\//i;
        if (pat.test(url)) {
            result = yield fetch_(url);
            return yield run(yield result.text());
        }
        else {
            try {
                const fs = yield import('fs');
                // data is actually a string
                const data = fs.readFileSync(url, { encoding: 'utf8' });
                return yield run(data);
            }
            catch (e) {
                return new ImportError(Position.unknown, Position.unknown, `
                Could not import file ${url}
            `);
            }
        }
    });
    builtInArgs['import'] = ['url'];
    builtInFunctions['print'] = (context) => __awaiter(this, void 0, void 0, function* () {
        printFunc('> ' + str(context.get('message')));
    });
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
