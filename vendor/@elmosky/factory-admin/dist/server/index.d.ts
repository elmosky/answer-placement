import type { AdminConfig, AdminHooks } from "../config.js";
export type { AdminConfig, AdminHooks } from "../config.js";
export { getSession } from "./auth.js";
export { getTrafficData, type TrafficData } from "./traffic.js";
export declare function createAdminRoutes(config: AdminConfig, hooks?: AdminHooks): {
    GET: (req: Request, ctx: {
        params: Promise<{
            route?: string[];
        }>;
    }) => Promise<Response>;
    POST: (req: Request, ctx: {
        params: Promise<{
            route?: string[];
        }>;
    }) => Promise<Response>;
    PATCH: (req: Request, ctx: {
        params: Promise<{
            route?: string[];
        }>;
    }) => Promise<Response>;
    DELETE: (req: Request, ctx: {
        params: Promise<{
            route?: string[];
        }>;
    }) => Promise<Response>;
};
