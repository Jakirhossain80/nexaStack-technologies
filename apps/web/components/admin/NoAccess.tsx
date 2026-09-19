export interface NoAccessProps {
  /** What the page is for, in the heading: "user accounts", "the audit log". */
  subject: string;
}

/**
 * Shown in place of a page's content when the signed-in admin's role does not include the capability
 * the page needs. The page never asks the API for data it would only refuse, and the API would refuse
 * it anyway (this is the courtesy, the endpoint is the boundary). It is the page's own `<h1>`, so the
 * heading order stays correct. Says what to do, not just what is wrong.
 */
export function NoAccess({ subject }: Readonly<NoAccessProps>) {
  return (
    <div>
      <h1 className="text-page font-semibold tracking-tight text-primary">No access to {subject}</h1>
      <p className="mt-2 max-w-prose text-body text-secondary">
        Your role does not include this. If you think it should, ask the site owner, who can change
        your role.
      </p>
    </div>
  );
}
