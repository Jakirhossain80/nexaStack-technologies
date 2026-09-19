import { Button } from '@/components/ui/Button';
import { buildClientContactLinks, type ClientContactInput } from '@/lib/quotationContact';

export type ContactClientActionsProps = ClientContactInput;

/**
 * Reaching out TO the client, using what they submitted. Each action is a plain link: it opens the
 * founder's own email app, phone or WhatsApp with the client's real details and a short prefilled
 * message. Nothing is sent by this site.
 *
 * Every link's accessible name says the channel AND the recipient ("Email Rahim Uddin"), and starts
 * with the visible label, so it matches what a voice-control user would say. WhatsApp is only
 * offered when the number can be made international without guessing (see `lib/whatsapp.ts`);
 * otherwise the reason is stated in text instead of showing a button that would message a stranger.
 */
export function ContactClientActions(props: ContactClientActionsProps) {
  const links = buildClientContactLinks(props);
  const { fullName } = props;

  return (
    <div>
      <h3 className="text-body font-semibold text-primary">Contact the client</h3>
      <p className="mt-1 text-label text-secondary">
        Opens your own email app, phone or WhatsApp with their details and a short message filled
        in. Nothing is sent from this site.
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        <Button href={links.mailto} variant="secondary" aria-label={`Email ${fullName}`}>
          Email
        </Button>

        {links.whatsapp && (
          <Button
            href={links.whatsapp}
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${fullName} (opens in a new tab)`}
          >
            WhatsApp
          </Button>
        )}

        {links.tel && (
          <Button href={links.tel} variant="secondary" aria-label={`Call ${fullName}`}>
            Call
          </Button>
        )}
      </div>

      {!links.whatsapp && (
        <p className="mt-3 text-label text-secondary">
          WhatsApp isn&rsquo;t offered: the number was not entered with a country code (for example
          +880…), so it can&rsquo;t be opened reliably from here. Email or call instead.
        </p>
      )}
    </div>
  );
}
