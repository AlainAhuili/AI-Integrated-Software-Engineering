import { afterEach, beforeEach, describe, it } from 'node:test';
import { createDsl } from '../dsl/index.js';

// Attribution is a rendering concern, so these run through a real browser.
describe('White-label branding on client sites', () => {
  let dsl;
  beforeEach(() => (dsl = createDsl({ channel: 'browser' })));
  afterEach(() => dsl.close());

  it("shows the agency's own branding in the widget footer", async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Harbor Plumbing', { reviews: [{ stars: 5 }] });
    await agency.signsUp();
    await agency.setsBranding({ footerText: 'Reviews by BrightLocal Marketing', footerLink: 'https://brightlocal.example' });
    await agency.publishesWidget('Homepage widget', { business: 'Harbor Plumbing' });

    await visitor.viewsWidget('Homepage widget');

    visitor.assertSeesFooter('Reviews by BrightLocal Marketing');
    visitor.assertSeesGoogleAttribution();
  });

  it('hides all agency branding when fully white-labeled, but still credits Google', async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Harbor Plumbing', { reviews: [{ stars: 5 }] });
    await agency.signsUp();
    await agency.setsBranding({ footerText: 'Reviews by BrightLocal Marketing', hideFooter: true });
    await agency.publishesWidget('Homepage widget', { business: 'Harbor Plumbing' });

    await visitor.viewsWidget('Homepage widget');

    visitor.assertSeesNoAgencyBranding();
    visitor.assertSeesGoogleAttribution();
  });
});
