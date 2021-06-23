var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Component } from '../component.js';
export class multiplayer extends Component {
    constructor(token) {
        super('multiplayer');
        this.token = token;
        this.fetching = false;
    }
    json() {
        return {};
    }
    updateState() {
        if (!this.token.valid)
            return;
        if (this.fetching)
            return;
        this.fetching = true;
        let url;
        if (this.token.isBuild) {
            url = `https://entropyengine.dev/projects/${this.token.projectID}/build/globalState.json`;
        }
        else {
            url = `https://entropyengine.dev/projects/${this.token.projectID}/globalState.json`;
        }
        fetch(url)
            .then(data => {
            if (!data) {
                console.error(`Cannot get globalState for project ${this.token.projectID}. Reponse: ${data}`);
                this.fetching = false;
                return;
            }
            data.json().then(json => {
                this.globalState = json;
                this.fetching = false;
            });
        });
    }
    tick() {
        this.updateState();
    }
    setGlobalState(prop, replace) {
        if (!this.token.valid)
            return;
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
    updateGlobalState(prop, replace) {
        if (!this.token.valid)
            return;
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
    getGlobalState() {
        if (!this.token.valid)
            return;
        return this.globalState;
    }
    testConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.token.valid)
                return false;
            if (!this.token.projectID)
                return false;
            let url = `https://entropyengine.dev/projects/${this.token.projectID}/globalState.json`;
            let data = yield fetch(url);
            if (!data) {
                return false;
            }
            let json = yield data.json();
            if (!json)
                return false;
            return true;
        });
    }
}
