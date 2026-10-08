const DETAILS_FIELDS = 'id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri,reviews';
const SEARCH_FIELDS =
  'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount';

export function writeReviewUrl(placeId) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Converts a Places API (New) place resource into the shape the widget renders.
 * The API returns at most 5 reviews per place.
 */
export function normalizePlace(place) {
  return {
    placeId: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? 0,
    mapsUrl: place.googleMapsUri || '',
    writeReviewUrl: writeReviewUrl(place.id),
    reviews: (place.reviews || []).map((r) => ({
      author: r.authorAttribution?.displayName || 'Google user',
      authorUrl: r.authorAttribution?.uri || '',
      authorPhotoUrl: r.authorAttribution?.photoUri || '',
      rating: r.rating ?? 0,
      text: r.text?.text || r.originalText?.text || '',
      relativeTime: r.relativePublishTimeDescription || '',
      publishTime: r.publishTime || '',
      reviewUrl: r.googleMapsUri || '',
    })),
  };
}

export class GooglePlacesClient {
  constructor(apiKey, { baseUrl = 'https://places.googleapis.com/v1', fetchImpl = fetch } = {}) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.fetch = fetchImpl;
  }

  async #request(path, { method = 'GET', fieldMask, body } = {}) {
    const res = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': fieldMask,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      const err = new Error(`Google Places API ${res.status}: ${detail.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async getPlace(placeId, languageCode = 'en') {
    const place = await this.#request(
      `/places/${encodeURIComponent(placeId)}?languageCode=${encodeURIComponent(languageCode)}`,
      { fieldMask: DETAILS_FIELDS },
    );
    return normalizePlace(place);
  }

  async searchPlaces(query) {
    const data = await this.#request('/places:searchText', {
      method: 'POST',
      fieldMask: SEARCH_FIELDS,
      body: { textQuery: query },
    });
    return (data.places || []).map((p) => ({
      placeId: p.id,
      name: p.displayName?.text || '',
      address: p.formattedAddress || '',
      rating: p.rating ?? null,
      userRatingCount: p.userRatingCount ?? 0,
    }));
  }
}
