/**
 * Two roles, deliberately only two.
 *
 * `admin` is everything the panel has always done. `partner` is a contributor
 * who can submit pitches and see their own, and nothing else: no posts, no
 * subscriber list, no traffic, no export. The split exists because the only way
 * to give somebody a door before this was to put them in ADMIN_EMAILS, which
 * handed them the mailing list.
 */
export type Role = "admin" | "partner";
export type Session = {
    email: string;
    via: "magic-link" | "bootstrap";
    role: Role;
};
export declare function allowedEmails(): string[];
export declare function partnerEmails(): string[];
/**
 * The role this email gets, or null if it gets nothing.
 *
 * ADMIN_EMAILS wins over PARTNER_EMAILS. An address in both is a mistake, and
 * resolving it upward means the mistake never locks an owner out of their own
 * panel.
 */
export declare function roleFor(email: string): Role | null;
export declare function isAllowed(email: string): boolean;
export declare function getSession(): Promise<Session | null>;
/** True when the session may do anything beyond submitting and reading its own pitches. */
export declare function isAdmin(session: Session | null): boolean;
export declare function setSession(session: Session): Promise<void>;
export declare function clearSession(): Promise<void>;
/** True when this site sends its own sign-in mail rather than leaning on Supabase's shared sender. */
export declare function hasSiteMailer(): boolean;
/**
 * Email the magic link. Response is identical whether or not the address is
 * allowlisted, so this can never be used to enumerate who has access.
 */
export declare function requestMagicLink(email: string, callbackUrl: string, siteName?: string): Promise<void>;
/** Verify the token_hash from the emailed link; returns the email if valid AND allowlisted. */
export declare function verifyMagicLink(tokenHash: string): Promise<string | null>;
export declare function bootstrapOk(password: string): boolean;
