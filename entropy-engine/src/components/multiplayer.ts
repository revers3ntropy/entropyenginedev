import {Component} from '../ECS/component.js';

export interface webAPIToken {
    projectID: number;
    isBuild: boolean;
    valid: boolean;
}

export type eventCallback = () => void;

export class multiplayer extends Component {
    token: webAPIToken;
    globalState: any;
    fetching: boolean;

    constructor(token: webAPIToken) {
        super('multiplayer');
        this.token = token;
        this.fetching = false;
    }

    json () {
        return {

        }
    }

    updateState () {
        if (!this.token.valid) return;
        if (this.fetching) return;
        
        this.fetching = true;

        let url;
        if (this.token.isBuild) {
            url = `https://entropyengine.dev/projects/${this.token.projectID}/build/globalState.json`;
        } else {
            url = `https://entropyengine.dev/projects/${this.token.projectID}/globalState.json`;
        }

        fetch(url)
            .then(data => {
                if (!data) {
                    console.error(`Cannot get globalState for project ${this.token.projectID}. Reponse: ${data}`);
                    this.fetching = false;
                    return;
                }

                data.json().then (json => {
                    this.globalState = json;
                    this.fetching = false;
                });
            });
    }

    setGlobalState (prop: string, replace: any) {
        if (!this.token.valid) return;

        fetch(`https://entropyengine.dev:50001/update-global-state`, {
            method: 'POST',
            body: JSON.stringify({
                override: true,
                name: prop,
                replace,
                token: this.token
            })
        });
    }

    updateGlobalState (prop: string, replace: any) {
        if (!this.token.valid) return;

        fetch(`https://entropyengine.dev:50001/update-global-state`, {
            method: 'POST',
            body: JSON.stringify({
                override: false,
                name: prop,
                replace,
                token: this.token
            })
        });
    }

    getGlobalState (): any {
        if (!this.token.valid) return;

        return this.globalState;
    }

    async testConnection () {
        if (!this.token.valid) return false;
        if (!this.token.projectID) return false;

        let url = `https://entropyengine.dev/projects/${this.token.projectID}/globalState.json`;

        let data = await fetch(url);

        if (!data) {
            return false;
        }

        let json = await data.json();

        if (!json)
            return false;

        return true;
    }
}