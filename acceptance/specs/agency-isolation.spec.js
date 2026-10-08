import { afterEach, beforeEach, describe, it } from 'node:test';
import { createDsl } from '../dsl/index.js';

describe('Agencies are isolated from each other', () => {
  let dsl;
  beforeEach(() => (dsl = createDsl()));
  afterEach(() => dsl.close());

  it("does not let one agency change another agency's widget", async () => {
    const { google, agency } = dsl;
    await google.businessHasReviews('Pine Dental', { reviews: [{ stars: 5 }] });
    await agency.signsUp('Acme Agency');
    await agency.signsUp('Rival Agency');
    await agency.publishesWidget('Acme widget', { business: 'Pine Dental', as: 'Acme Agency' });

    await agency.assertCannotChangeWidget('Acme widget', { as: 'Rival Agency' });
  });
});
