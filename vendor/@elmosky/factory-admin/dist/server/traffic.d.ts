export type TrafficData = {
    rangeDays: number;
    ga4: {
        users: number;
        sessions: number;
        topPages: {
            path: string;
            views: number;
        }[];
    } | null;
    ga4Error?: string;
    gsc: {
        clicks: number;
        impressions: number;
        topQueries: {
            query: string;
            clicks: number;
            impressions: number;
        }[];
        topPages: {
            page: string;
            clicks: number;
            impressions: number;
        }[];
    } | null;
    gscError?: string;
};
export declare function getTrafficData(): Promise<TrafficData>;
