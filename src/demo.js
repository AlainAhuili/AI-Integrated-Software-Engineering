import { writeReviewUrl } from './google.js';

const DEMO_PLACE_ID = 'demo-place';

const DEMO_REVIEWS = [
  {
    author: 'Maria Schneider',
    rating: 5,
    text: 'Fantastic service from start to finish. The team explained every step and finished a day early. Highly recommend!',
    relativeTime: '2 weeks ago',
  },
  {
    author: 'James Okafor',
    rating: 5,
    text: 'Friendly staff, fair prices and they actually call you back. Will use them again.',
    relativeTime: 'a month ago',
  },
  {
    author: 'Lena Hoffmann',
    rating: 4,
    text: 'Very good work overall. Scheduling took a little longer than expected, but the result was worth it.',
    relativeTime: '2 months ago',
  },
  {
    author: 'Daniel Park',
    rating: 5,
    text: 'Professional, punctual and tidy. They left the place cleaner than they found it.',
    relativeTime: '3 months ago',
  },
  {
    author: 'Sophie Martin',
    rating: 3,
    text: 'Decent job, communication could be better.',
    relativeTime: '5 months ago',
  },
];

function demoPlace(placeId = DEMO_PLACE_ID, name = 'Sunrise Dental Studio') {
  return {
    placeId,
    name,
    address: '12 Example Street, Springfield',
    rating: 4.7,
    userRatingCount: 128,
    mapsUrl: 'https://maps.google.com/',
    writeReviewUrl: writeReviewUrl(placeId),
    reviews: DEMO_REVIEWS.map((r) => ({
      ...r,
      authorUrl: '',
      authorPhotoUrl: '',
      publishTime: '',
      reviewUrl: '',
    })),
  };
}

/** Stand-in for GooglePlacesClient when no API key is configured. */
export class DemoPlacesClient {
  async getPlace(placeId) {
    return demoPlace(placeId);
  }

  async searchPlaces(query) {
    const name = query.trim() || 'Sunrise Dental Studio';
    const place = demoPlace(DEMO_PLACE_ID, name);
    return [
      {
        placeId: place.placeId,
        name: place.name,
        address: place.address,
        rating: place.rating,
        userRatingCount: place.userRatingCount,
      },
    ];
  }
}
