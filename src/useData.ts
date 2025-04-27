import { Request } from "express";
import { CookieSessionCore } from "./core";

type Setter<T> = (value: T) => void;

type UseDataResult<T> = [Setter<T>, T];

export function useDataFactory(core: CookieSessionCore) {
    return function useData<T>(req: Request, Id?: string): UseDataResult<T> {
        
        return [set, session.data as T];
    };
}
