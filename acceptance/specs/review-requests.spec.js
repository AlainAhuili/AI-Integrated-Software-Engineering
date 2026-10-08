import { afterEach, beforeEach, describe, it } from 'node:test';
import { createDsl } from '../dsl/index.js';

describe('Asking customers for reviews', () => {
  let dsl;
  beforeEach(() => (dsl = createDsl()));
  afterEach(() => dsl.close());

  it("sends customers who follow the review link to the business's Google review form", async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Oak Street Bakery', { reviews: [{ stars: 5 }] });
    await agency.signsUp();
    await agency.publishesWidget('Footer widget', { business: 'Oak Street Bakery' });

    await visitor.followsReviewLink('Footer widget');

    visitor.assertLandsOnGoogleReviewFormFor('Oak Street Bakery');
  });

  it('sends every customer to Google, regardless of the star filter (no review gating)', async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Oak Street Bakery', { reviews: [{ stars: 5 }] });
    await agency.signsUp();
    await agency.publishesWidget('Footer widget', { business: 'Oak Street Bakery', minStars: 5 });

    await visitor.followsReviewLink('Footer widget');

    visitor.assertLandsOnGoogleReviewFormFor('Oak Street Bakery');
  });
});
