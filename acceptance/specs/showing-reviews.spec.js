import { afterEach, beforeEach, describe, it } from 'node:test';
import { CHANNELS, createDsl } from '../dsl/index.js';

for (const channel of CHANNELS) {
  describe(`Showing a business's Google reviews on a client site [${channel}]`, () => {
    let dsl;
    beforeEach(() => (dsl = createDsl({ channel })));
    afterEach(() => dsl.close());

    it('shows the business rating and its reviews', async () => {
      const { google, agency, visitor } = dsl;
      await google.businessHasReviews('Sunrise Dental', {
        rating: 4.8,
        totalReviews: 212,
        reviews: [{ stars: 5, author: 'Maria' }, { stars: 4, author: 'James' }],
      });
      await agency.signsUp();
      await agency.publishesWidget('Homepage widget', { business: 'Sunrise Dental' });

      await visitor.viewsWidget('Homepage widget');

      visitor.assertSeesBusiness('Sunrise Dental', { rating: 4.8, totalReviews: 212 });
      visitor.assertSeesReviewsWithStars([5, 4]);
      visitor.assertSeesReviewBy('Maria');
    });

    it('only shows reviews at or above the minimum star rating the agency chose', async () => {
      const { google, agency, visitor } = dsl;
      await google.businessHasReviews('Sunrise Dental', {
        reviews: [{ stars: 5 }, { stars: 2 }, { stars: 4 }, { stars: 3 }, { stars: 5 }],
      });
      await agency.signsUp();
      await agency.publishesWidget('Homepage widget', { business: 'Sunrise Dental', minStars: 4 });

      await visitor.viewsWidget('Homepage widget');

      visitor.assertSeesReviewsWithStars([5, 4, 5]);
    });

    it('limits how many reviews are shown', async () => {
      const { google, agency, visitor } = dsl;
      await google.businessHasReviews('Sunrise Dental', {
        reviews: [{ stars: 5 }, { stars: 5 }, { stars: 5 }, { stars: 5 }],
      });
      await agency.signsUp();
      await agency.publishesWidget('Sidebar widget', { business: 'Sunrise Dental', layout: 'list', maxReviews: 2 });

      await visitor.viewsWidget('Sidebar widget');

      visitor.assertSeesReviewsWithStars([5, 5]);
    });
  });
}
