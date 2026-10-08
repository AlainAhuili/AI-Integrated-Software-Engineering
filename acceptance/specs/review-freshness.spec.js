import { afterEach, beforeEach, describe, it } from 'node:test';
import { createDsl } from '../dsl/index.js';

describe('Keeping reviews fresh without overspending on Google', () => {
  let dsl;
  beforeEach(() => (dsl = createDsl()));
  afterEach(() => dsl.close());

  it('serves repeated widget views without asking Google again', async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Lakeside Vets', { reviews: [{ stars: 5 }] });
    await agency.signsUp();
    await agency.publishesWidget('Homepage widget', { business: 'Lakeside Vets' });

    await visitor.viewsWidget('Homepage widget');
    await visitor.viewsWidget('Homepage widget');
    await visitor.viewsWidget('Homepage widget');

    await google.assertWasAskedAboutBusinessTimes('Lakeside Vets', 1);
  });

  it("shows a new review after the agency refreshes the widget", async () => {
    const { google, agency, visitor } = dsl;
    await google.businessHasReviews('Lakeside Vets', { reviews: [{ stars: 4, author: 'Ana' }] });
    await agency.signsUp();
    await agency.publishesWidget('Homepage widget', { business: 'Lakeside Vets' });
    await visitor.viewsWidget('Homepage widget');

    await google.businessReceivesNewReview('Lakeside Vets', { stars: 5, author: 'Ben' });
    await agency.refreshesReviews('Homepage widget');
    await visitor.viewsWidget('Homepage widget');

    visitor.assertSeesReviewBy('Ben');
    visitor.assertSeesReviewsWithStars([5, 4]);
  });
});
