import axios from 'axios';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

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

export async function scrapeEmailFromWebsite(
  url: string, 
  requestDelay: number = 1000,
  retryAttempts: number = 3,
  backoffMultiplier: number = 2
): Promise<string | null> {
  if (!url) return null;

  // Ensure URL has protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      if (attempt > 1) {
        await delay(requestDelay * Math.pow(backoffMultiplier, attempt - 1));
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
        maxRedirects: 5,
      });

      const html = response.data;
      const matches = html.match(EMAIL_REGEX);
      
      if (matches && matches.length > 0) {
        // Filter out common false positives
        const validEmails = matches.filter(email => {
          const domain = email.split('@')[1]?.toLowerCase();
          return domain && 
                 !domain.includes('example.') &&
                 !domain.includes('test.') &&
                 !domain.includes('placeholder') &&
                 !domain.includes('yoursite') &&
                 !domain.includes('yourdomain') &&
                 !domain.includes('sentry.io') &&
                 !domain.includes('w3.org');
        });

        if (validEmails.length > 0) {
          return validEmails[0]; // Return first valid email
        }
      }

      return null;
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed for ${url}:`, error.message);
      
      if (error.response?.status === 429) {
        // Rate limited, apply exponential backoff
        if (attempt < retryAttempts) {
          await delay(requestDelay * Math.pow(backoffMultiplier, attempt));
          continue;
        }
      }
      
      if (attempt === retryAttempts) {
        console.error(`Failed to scrape ${url} after ${retryAttempts} attempts`);
        return null;
      }
    }
  }

  return null;
}

export { delay };
