import * as https from "https";
import * as fs from "fs";
import * as http from "http";
import { IncomingMessage, ServerResponse } from "http";

import * as accounts from './accounts';
import * as projects from './projects';
import * as misc from './misc';
import * as util from './util';

const DEV = process.argv.indexOf('--dev') !== -1;

let options = {};

if (!DEV) {
    options = {
        key: fs.readFileSync("./privatekey.pem"),
        cert: fs.readFileSync("./certificate.pem")
    };
}

const PORT = 50_001;

export type Handler = (props: {
    url: string[],
    req: any,
    res: any,
    body: {[k: string]: any},
    token?: {
        user: number,
        project: number
    }
}) => Promise<void>;

const handlers: {[k: string]: Handler} = {
    'robots.text': async ({res}) => {
        // block all bots from backend entirely
        res.end(`
            User-agent: *
            Disallow: /
        `);
    },
    'favicon.ico': async () => void 0,

    // Debug
    'ping': ({res}) => res.end('{"ok": "true"}'),
    
    // accounts
    'delete-account': accounts.deleteAccount,
    'new-user': accounts.newUser,
    'change-user': accounts.changeData,
    'get-id': accounts.id,
    'username-exists': accounts.usernameExists,
    'get-username': accounts.username,
    'get-details': accounts.details,
    'user-exists': accounts.userExists,
    
    'viewed-project': projects.viewed,
    'comment': misc.comment,
    'get-comments': misc.getComments,
    'get-comment': misc.getComment,
    'delete-comment': misc.deleteComment,
    
    // projects
    'new-project': projects.createProject,
    'delete-project': projects.deleteProject,
    'get-project-names': projects.getUserProjectNames,
    'save-project': projects.save,
    'get-project-access': projects.accessLevel,
    'get-project-editors': projects.getProjectEditors,
    'get-project-name': projects.getName,
    'share-project': projects.share,
    'get-assets': projects.getAssets,
    'build-project': projects.build,
    'delete-asset': projects.deleteAsset,
    'has-been-built': projects.beenBuilt,
    'contributor-info': projects.contributorInfo,
    'latest-contributor': projects.latestContributor,
    'all-contributions': projects.allContributors,
    'project-owner': projects.projectOwner,
    'project-views': projects.projectViews,
    'top-projects-by-views': projects.topProjectViews,
    'upload': projects.upload,
    'folder-size': util.folderSizePublic,
    'public-projects': projects.publicProjectsFromUser,
    'has-build': projects.beenBuilt,
    'find-scripts': projects.findScript,
    'eeclient-upload': misc.receiveEEClientScripts,
};

// goes strait to these function without any data handling
const rawPaths = [
    // done through forms
    'upload',
    // txt file request, no body
    'robots.txt',
    // must use fetch API for this, easier without body so just URL
    'all-contributions'
];

async function serverResponse (req: IncomingMessage, res: ServerResponse) {

    res.setHeader("Access-Control-Allow-Origin", "*");

    if (!req.url) {
        console.error('no url on request!');
        return;
    }

    try {
        const url = req.url.split('/');
        // expecting url of something like /api/987678,
        // so url[0] should be empty, and url[1] should be the actual path

        if (url[0] !== '' || !handlers.hasOwnProperty(url[1])) {
            // no handler can be found
            console.log(`ERROR: no handler '${url[1]}' for url '${req.url}'`);
            res.end('{}');
            return;
        }

        if (rawPaths.includes(url[1])) {
            url.shift();
            const handler = handlers[url[0]];
            await handler({url, req, res, body: {}});
            return;
        }


        let data = '';
        // need to get the data one packet at a time, and then deal with the whole lot at once
        req.on('data', chunk => {
            data += chunk;
        });

        req.on('end', () => {
            // the POST body has fully come through, continue on now

            res.writeHead(200);

            let body: any = {};
            try {
                body = JSON.parse(data ?? '{}');
            } catch (E) {
                console.log(`Error parsing JSON data from URL ${req.url} with JSON ${data}: ${E}`)
                return;
            }


            // so that the url now starts at index 0 from now on
            url.shift();

            const handler = handlers[url[0]];
            let token = body['token'];

            handler({url, res, body, req, token});
        });
    } catch(e) {
        console.log(`ERROR IN URL ${req.url}: ${e}`);
    }

}

if (DEV) {
    http.createServer(options, serverResponse)
        .listen(PORT, () => {
            console.log(`DEV: Server started on port ` + PORT);
        });
} else {
    https.createServer(options, serverResponse)
        .listen(PORT, () => {
            console.log(`PROD: Server started on port ` + PORT);
        });
}
