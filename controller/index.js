const puppeteer = require("puppeteer")

async function scrapeURL(url) {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox','--no-zygote', "--single-process"]
        });

        const page = await browser.newPage()

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        );
        console.log(`Navigating to ${url}...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        // Wait for content to load (adjust selector as needed)
        await page.waitForSelector('body');

        const data = await page.evaluate(() => {
            // You can customize what to extract here
            return {
                title: document.title,
                url: window.location.href,

                // Get all headings
                headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
                    tag: h.tagName,
                    text: h.textContent.trim()
                })),

                // Get all links
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.href
                })).filter(link => link.href && link.text),

                // Get all paragraphs
                paragraphs: Array.from(document.querySelectorAll('p')).map(p =>
                    p.textContent.trim()
                ).filter(text => text.length > 0),

                // Get meta description
                metaDescription: document.querySelector('meta[name="description"]')?.content || '',

                // Get all images
                images: Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt
                }))
            };
        });

        console.log('Scraping completed successfully!');
        return data;

    } catch (error) {
        console.error('Scraping failed:', error.message);
        throw error;
    } finally {
        // Always close browser
        if (browser) {
            await browser.close();
        }
    }
}
async function scrapeAllPages(startUrl, options = {}) {
  const {
    maxPages = 10,           // Maximum number of pages to scrape
    delay = 2000,            // Delay between requests (ms)
    sameDomainOnly = true    // Only scrape links from same domain
  } = options;
  
  let browser;
  const scrapedUrls = new Set();
  const results = [];
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox','--no-zygote', "--single-process"]
    });
    
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    // Get domain for filtering
    const startDomain = new URL(startUrl).hostname;
    
    // Queue of URLs to scrape
    const urlQueue = [startUrl];
    
    while (urlQueue.length > 0 && scrapedUrls.size < maxPages) {
      const currentUrl = urlQueue.shift();
      
      // Skip if already scraped
      if (scrapedUrls.has(currentUrl)) continue;
      
      try {
        console.log(`\n[${scrapedUrls.size + 1}/${maxPages}] Scraping: ${currentUrl}`);
        
        // Navigate to page
        await page.goto(currentUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });
        
        await page.waitForSelector('body');
        
        // Extract data from current page
        const pageData = await page.evaluate(() => {
          return {
            title: document.title,
            url: window.location.href,
            
            headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
              tag: h.tagName,
              text: h.textContent.trim()
            })),
            
            paragraphs: Array.from(document.querySelectorAll('p')).map(p => 
              p.textContent.trim()
            ).filter(text => text.length > 0),
            
            links: Array.from(document.querySelectorAll('a')).map(a => ({
              text: a.textContent.trim(),
              href: a.href
            })).filter(link => link.href && link.text),
            
            metaDescription: document.querySelector('meta[name="description"]')?.content || '',
            
            images: Array.from(document.querySelectorAll('img')).map(img => ({
              src: img.src,
              alt: img.alt
            }))
          };
        });
        
        // Mark as scraped
        scrapedUrls.add(currentUrl);
        results.push(pageData);
        
        console.log(`✓ Found ${pageData.headings.length} headings, ${pageData.links.length} links`);
        
        // Add new links to queue
        for (const link of pageData.links) {
          try {
            const linkUrl = new URL(link.href);
            
            // Filter by domain if needed
            if (sameDomainOnly && linkUrl.hostname !== startDomain) {
              continue;
            }
            
            // Clean URL (remove fragments)
            const cleanUrl = `${linkUrl.protocol}//${linkUrl.host}${linkUrl.pathname}${linkUrl.search}`;
            
            // Add to queue if not already scraped or queued
            if (!scrapedUrls.has(cleanUrl) && !urlQueue.includes(cleanUrl)) {
              urlQueue.push(cleanUrl);
            }
          } catch (e) {
            // Skip invalid URLs
          }
        }
        
        // Respectful delay between requests
        if (urlQueue.length > 0) {
          console.log(`Waiting ${delay}ms before next request...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`✗ Error scraping ${currentUrl}:`, error.message);
      }
    }
    
    console.log(`\n=== SCRAPING COMPLETE ===`);
    console.log(`Total pages scraped: ${scrapedUrls.size}`);
    console.log(`URLs in queue (not scraped): ${urlQueue.length}`);
    
    return results;
    
  } finally {
    if (browser) await browser.close();
  }
}


async function run() {

    console.log("Hello");
    
    const response = await scrapeAllPages("https://intl-colt.online/")
    console.log(response);
    
}

// run()

module.exports = { scrapeURL, scrapeAllPages };