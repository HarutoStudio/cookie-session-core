import {v4 as uuid} from "uuid";

export default class InternalSession {
    private readonly _id: string; // internal id for the session
    private readonly cookieId: string; // id for the cookie
    private readonly cookieName: string;
    private uniqueId: string | undefined;
    private lastAccess: number;

    public payload: any;

    constructor(cookieName: string, payload: any) {
        this.lastAccess = Date.now();
        this._id = uuid();
        this.cookieId = uuid();
        this.payload = payload;
        this.cookieName = cookieName;
    }


    get metadata(): { cookieId: string; cookieName: string; lastAccess: number } {
        return {
            cookieId: this.cookieId,
            cookieName: this.cookieName,
            lastAccess: this.lastAccess,
        };
    }

    get Id(): string | undefined {
        return this.uniqueId;
    }

    set Id(id: string) {
        if (this.uniqueId) {
            throw new Error("Cannot set userId to a new value. It is already set.");
        }

        if (id.trim() === '') {
            throw new Error("Cannot set userId to undefined.")
        }
    }

    public lastAccessUpdate(): void {
        this.lastAccess = Date.now();
        return;
    }
}
