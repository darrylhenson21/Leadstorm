import axios from 'axios';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  website?: string;
  international_phone_number?: string;
}

// Location coordinates mapping for nearby search fallback
const LOCATION_COORDS: Record<string, { lat: number; lng: number }> = {
  // Major cities
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'atlanta': { lat: 33.7490, lng: -84.3880 },
  
  // NYC boroughs and neighborhoods
  'manhattan': { lat: 40.7831, lng: -73.9712 },
  'brooklyn': { lat: 40.6782, lng: -73.9442 },
  'queens': { lat: 40.7282, lng: -73.7949 },
  'bronx': { lat: 40.8448, lng: -73.8648 },
  'staten island': { lat: 40.5795, lng: -74.1502 },
  
  // Popular ZIP codes
  '10001': { lat: 40.7505, lng: -73.9934 }, // NYC Midtown
  '10010': { lat: 40.7394, lng: -73.9883 }, // NYC Flatiron
  '90210': { lat: 34.0901, lng: -118.4065 }, // Beverly Hills
  '90212': { lat: 34.0669, lng: -118.3987 }, // Beverly Hills
  '78701': { lat: 30.2711, lng: -97.7437 }, // Austin Downtown
  '78704': { lat: 30.2500, lng: -97.7594 }, // Austin South
  '75201': { lat: 32.7767, lng: -96.7970 }, // Dallas Downtown
  '77002': { lat: 29.7589, lng: -95.3677 }, // Houston Downtown
  '33139': { lat: 25.7907, lng: -80.1300 }, // Miami Beach
  '94102': { lat: 37.7849, lng: -122.4094 }, // San Francisco
  '60611': { lat: 41.8959, lng: -87.6298 }, // Chicago Near North
  '02101': { lat: 42.3601, lng: -71.0589 }, // Boston Downtown
};

// Text Search with pagination (up to 3 pages)
async function textSearch(city: string, keyword: string, apiKey: string): Promise<any[]> {
  const allResults: any[] = [];
  let nextPageToken: string | null = null;
  
  for (let page = 0; page < 3; page++) {
    try {
      let url: string;
      
      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
      } else {
        const query = encodeURIComponent(`${keyword} in ${city}`);
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${apiKey}`;
      }

      const response = await axios.get(url, {
        headers: { 'User-Agent': getRandomUserAgent() },
        timeout: 10000
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.warn(`Text search page ${page + 1} status: ${response.data.status}`);
        break;
      }

      if (response.data.results) {
        allResults.push(...response.data.results);
        console.log(`Text search page ${page + 1}: found ${response.data.results.length} results`);
      }

      nextPageToken = response.data.next_page_token;
      if (!nextPageToken) break;

      // Required delay before using next_page_token
      if (page < 2) {
        await delay(2000);
      }
    } catch (error) {
      console.error(`Error on text search page ${page + 1}:`, error);
      break;
    }
  }

  return allResults;
}

// Nearby Search with pagination (fallback when text search yields few results)
async function nearbySearch(lat: number, lng: number, radius: number, type: string, apiKey: string): Promise<any[]> {
  const allResults: any[] = [];
  let nextPageToken: string | null = null;
  
  for (let page = 0; page < 3; page++) {
    try {
      let url: string;
      
      if (nextPageToken) {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${nextPageToken}&key=${apiKey}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;
      }

      const response = await axios.get(url, {
        headers: { 'User-Agent': getRandomUserAgent() },
        timeout: 10000
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.warn(`Nearby search page ${page + 1} status: ${response.data.status}`);
        break;
      }

      if (response.data.results) {
        allResults.push(...response.data.results);
        console.log(`Nearby search page ${page + 1}: found ${response.data.results.length} results`);
      }

      nextPageToken = response.data.next_page_token;
      if (!nextPageToken) break;

      // Required delay before using next_page_token
      if (page < 2) {
        await delay(2000);
      }
    } catch (error) {
      console.error(`Error on nearby search page ${page + 1}:`, error);
      break;
    }
  }

  return allResults;
}

export async function fetchPlaces(city: string, keyword: string, apiKey: string): Promise<PlaceResult[]> {
  try {
    console.log(`Starting comprehensive search for "${keyword}" in "${city}"`);
    
    // Step 1: Text Search with pagination
    let allResults = await textSearch(city, keyword, apiKey);
    console.log(`Text search completed: ${allResults.length} total results`);

    // Step 2: If fewer than 50 results, try nearby search as fallback
    if (allResults.length < 50) {
      // Try multiple location key formats
      const locationKeys = [
        city.toLowerCase().trim(),
        city.toLowerCase().replace(/\s+/g, ''),
        city.toLowerCase().replace(/\s+/g, ' '),
        city.trim()
      ];
      
      let coords = null;
      for (const key of locationKeys) {
        if (LOCATION_COORDS[key]) {
          coords = LOCATION_COORDS[key];
          break;
        }
      }
      
      if (coords) {
        console.log(`Low results (${allResults.length}), trying nearby search for ${city}...`);
        const nearbyResults = await nearbySearch(coords.lat, coords.lng, 25000, 'establishment', apiKey);
        allResults = allResults.concat(nearbyResults);
        console.log(`After nearby search: ${allResults.length} total results`);
      } else {
        console.log(`No coordinates found for "${city}" (tried: ${locationKeys.join(', ')}), skipping nearby search`);
      }
    }

    // Step 3: Deduplicate by place_id
    const uniqueResults: Record<string, any> = {};
    for (const result of allResults) {
      if (result.place_id && !uniqueResults[result.place_id]) {
        uniqueResults[result.place_id] = result;
      }
    }

    const finalResults = Object.values(uniqueResults);
    console.log(`Final deduplicated results: ${finalResults.length} places`);

    // Step 4: Transform to our format
    const places: PlaceResult[] = finalResults.map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      website: place.website,
      international_phone_number: place.international_phone_number
    }));

    return places;
  } catch (error) {
    console.error('Error in comprehensive places search:', error);
    throw error;
  }
}

export async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceResult | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,website,international_phone_number&key=${apiKey}`;
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': getRandomUserAgent()
      },
      timeout: 10000
    });

    if (response.data.status !== 'OK') {
      console.warn(`Place details error for ${placeId}: ${response.data.status}`);
      return null;
    }

    const place = response.data.result;
    return {
      place_id: placeId,
      name: place.name,
      formatted_address: place.formatted_address,
      website: place.website,
      international_phone_number: place.international_phone_number
    };
  } catch (error) {
    console.error(`Error fetching place details for ${placeId}:`, error);
    return null;
  }
}

export { delay };
