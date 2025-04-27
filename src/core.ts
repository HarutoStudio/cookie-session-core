import {Request, Response, NextFunction} from "express";

declare global {
    namespace Express {
        interface Request {
            sessionCtx: {
                payload: any | null;
                hasRefreshed: boolean;
                metadata: { cookieId: string; cookieName: string; lastAccess: number };
            }
        }
    }
}
import Cookies from "cookies";
import InternalSession from "./session";

export type CookieSessionOptions = {
    session: {
        defaultTTL: number;  // milliseconds (ms)
        schema?: { new(): any };
        sessionAutoRenewal?: {
            enabled: boolean;
            interval: number; // milliseconds (ms)
        };
    };
    cookie: (Cookies.SetOption & {
        signed?: boolean;
        keys?: string[];
    }) & (Cookies.SetOption extends { signed: true } ? { keys: string[] } : {});
};

export class CookieSessionCore {
    private readonly options!: CookieSessionOptions;
    private readonly cookieName: string = "_.yuki";
    private static sessionMap = new Map<string, InternalSession>();

    constructor(opts: Partial<CookieSessionOptions>) {
        if ((opts.session?.defaultTTL ?? 604800000) <= (opts.session?.sessionAutoRenewal?.interval ?? 300000)) {
            throw new Error("sessionAutoRenewal interval must be less than defaultTTL");
        } else if (opts.cookie?.signed && !opts.cookie.keys) {
            throw new Error("If cookie.signed is true, cookie.keys must be set.");
        }


        this.options = {
            session: {
                defaultTTL: 604800000, // 7 days
                schema: class {
                },
                sessionAutoRenewal: {
                    enabled: true,
                    interval: 300000, // 5 minutes
                },
                ...opts.session,
            },
            cookie: {
                signed: false,
                sameSite: "lax",
                ...opts.cookie
            },
        };
    }


    public middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const cookieOption = this.options.cookie
            const cookies = new Cookies(req, res, {keys: cookieOption.keys});

            const cookieId = cookies.get(this.cookieName, {signed: cookieOption.signed ?? false});
            let session = CookieSessionCore.sessionMap.get(cookieId ?? "") as InternalSession | undefined;
            if (session) {
                if ((Date.now() - this.options.session.sessionAutoRenewal!.interval) >= session.metadata.lastAccess) {
                    session.lastAccessUpdate()
                    cookies.set(this.cookieName, session.metadata.cookieId, {
                        ...cookieOption,
                        maxAge: this.options.session.defaultTTL,
                    });
                    req.sessionCtx.hasRefreshed = true;
                }
            } else {
                session = new InternalSession(this.cookieName, this.options.session.schema ? new this.options.session.schema : undefined);
                cookies.set(this.cookieName, session.metadata.cookieId, {
                    ...cookieOption,
                    maxAge: this.options.session.defaultTTL,
                });
                CookieSessionCore.sessionMap.set(session.metadata.cookieId, session);
            }
            req.sessionCtx = {
                payload: session.payload ?? null,
                hasRefreshed: req.sessionCtx.hasRefreshed ?? false,
                metadata: session.metadata,
            }

            next();
        };
    }
}