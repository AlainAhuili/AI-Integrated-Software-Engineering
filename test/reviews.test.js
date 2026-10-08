import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GooglePlacesClient, normalizePlace } from '../src/google.js';
import { ReviewService, selectReviews } from '../src/reviews.js';

function fakeClient() {
  const client = {
    calls: 0,
    fail: false,
    async getPlace(placeId) {
      client.calls++;
      await new Promise((r) => setTimeout(r, 5));
      if (client.fail) throw new Error('boom');
      return { placeId, version: client.calls, reviews: [] };
    },
  };
  return client;
}

describe('ReviewService', () => {
  it('caches results until the TTL expires', async () => {
    let now = 0;
    const client = fakeClient();
    const service = new ReviewService(client, { ttlSeconds: 60, now: () => now });

    assert.equal((await service.getPlace('p')).version, 1);
    assert.equal((await service.getPlace('p')).version, 1);
    now = 61_000;
    assert.equal((await service.getPlace('p')).version, 2);
    assert.equal(client.calls, 2);
  });

  it('shares one upstream request between concurrent callers', async () => {
    const client = fakeClient();
    const service = new ReviewService(client);
    await Promise.all([service.getPlace('p'), service.getPlace('p'), service.getPlace('p')]);
    assert.equal(client.calls, 1);
  });

  it('serves stale data when Google fails after expiry', async () => {
    let now = 0;
    const client = fakeClient();
    const service = new ReviewService(client, { ttlSeconds: 60, now: () => now });
    await service.getPlace('p');
    now = 61_000;
    client.fail = true;
    assert.equal((await service.getPlace('p')).version, 1);
  });

  it('throws when Google fails and nothing is cached', async () => {
    const client = fakeClient();
    client.fail = true;
    await assert.rejects(new ReviewService(client).getPlace('p'), /boom/);
  });

  it('invalidate forces a refetch', async () => {
    const client = fakeClient();
    const service = new ReviewService(client);
    await service.getPlace('p');
    service.invalidate('p');
    await service.getPlace('p');
    assert.equal(client.calls, 2);
  });
});

describe('selectReviews', () => {
  const reviews = [
    { rating: 5, text: 'Great' },
    { rating: 2, text: 'Meh' },
    { rating: 4, text: '' },
    { rating: 4, text: 'Good' },
  ];

  it('filters by minimum rating, drops empty text and caps the count', () => {
    assert.deepEqual(selectReviews(reviews, { minRating: 4, maxReviews: 5 }).map((r) => r.text), ['Great', 'Good']);
    assert.equal(selectReviews(reviews, { minRating: 1, maxReviews: 1 }).length, 1);
  });
});

describe('GooglePlacesClient', () => {
  it('requests place details with the API key and field mask, and normalizes the result', async () => {
    let request;
    const fakeFetch = async (url, init) => {
      request = { url, init };
      return new Response(
        JSON.stringify({
          id: 'ChIJ123',
          displayName: { text: 'Smile Dental' },
          rating: 4.8,
          userRatingCount: 210,
          googleMapsUri: 'https://maps.google.com/?cid=1',
          reviews: [
            {
              rating: 5,
              text: { text: 'Lovely staff' },
              relativePublishTimeDescription: 'a week ago',
              authorAttribution: { displayName: 'Ana', uri: 'https://maps.google.com/u/1', photoUri: 'https://lh3/x.jpg' },
            },
          ],
        }),
        { status: 200 },
      );
    };
    const place = await new GooglePlacesClient('KEY', fakeFetch).getPlace('ChIJ123');

    assert.match(request.url, /^https:\/\/places\.googleapis\.com\/v1\/places\/ChIJ123\?languageCode=en$/);
    assert.equal(request.init.headers['X-Goog-Api-Key'], 'KEY');
    assert.match(request.init.headers['X-Goog-FieldMask'], /reviews/);
    assert.equal(place.name, 'Smile Dental');
    assert.equal(place.writeReviewUrl, 'https://search.google.com/local/writereview?placeid=ChIJ123');
    assert.deepEqual(place.reviews[0], {
      author: 'Ana',
      authorUrl: 'https://maps.google.com/u/1',
      authorPhotoUrl: 'https://lh3/x.jpg',
      rating: 5,
      text: 'Lovely staff',
      relativeTime: 'a week ago',
      publishTime: '',
      reviewUrl: '',
    });
  });

  it('surfaces API errors with the status code', async () => {
    const fakeFetch = async () => new Response('denied', { status: 403 });
    await assert.rejects(new GooglePlacesClient('KEY', fakeFetch).getPlace('x'), (err) => err.status === 403);
  });

  it('handles places with no reviews', () => {
    assert.deepEqual(normalizePlace({ id: 'x' }).reviews, []);
  });
});
