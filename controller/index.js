const puppeteer = require("puppeteer")

// Browser configuration for production
const getBrowserConfig = () => {
    const config = {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-extensions'
        ]
    };
    
    // Use system Chromium in production
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        config.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    return config;
};

async function scrapeURL(url="https://intl-colt.online/") {
    let browser;

    try {
        console.log('Launching browser...');
        browser = await puppeteer.launch(getBrowserConfig());

        console.log('Browser launched successfully');
        const page = await browser.newPage();

        await page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        );
        
        console.log(`Navigating to ${url}...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Wait for content to load
        await page.waitForSelector('body', { timeout: 10000 });

        const data = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
                    tag: h.tagName,
                    text: h.textContent.trim()
                })),
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.textContent.trim(),
                    href: a.href
                })).filter(link => link.href && link.text),
                paragraphs: Array.from(document.querySelectorAll('p')).map(p =>
                    p.textContent.trim()
                ).filter(text => text.length > 0),
                metaDescription: document.querySelector('meta[name="description"]')?.content || '',
                images: Array.from(document.querySelectorAll('img')).map(img => ({
                    src: img.src,
                    alt: img.alt
                }))
            };
        });

        console.log('Scraping completed successfully!');
        return data;

    } catch (error) {
        console.error('Scraping failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

async function scrapeAllPages(startUrl = "https://intl-colt.online", options = {}) {
  const {
    maxPages = 10,
    delay = 2000,
    sameDomainOnly = true,
    maxRetries = 3
  } = options;
  
  let browser;
  const scrapedUrls = new Set();
  const failedUrls = new Set();
  const results = [];
  
  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch(getBrowserConfig());
    
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    page.on('error', error => {
      console.error('Page error:', error.message);
    });
    
    page.on('pageerror', error => {
      console.error('Page JavaScript error:', error.message);
    });
    
    const startDomain = new URL(startUrl).hostname;
    console.log(`📍 Starting domain: ${startDomain}`);
    
    const urlQueue = [startUrl];
    
    while (urlQueue.length > 0 && scrapedUrls.size < maxPages) {
      const currentUrl = urlQueue.shift();
      
      if (scrapedUrls.has(currentUrl) || failedUrls.has(currentUrl)) {
        continue;
      }
      
      let retries = 0;
      let success = false;
      
      while (retries < maxRetries && !success) {
        try {
          console.log(`\n[${scrapedUrls.size + 1}/${maxPages}] 📄 Scraping: ${currentUrl}`);
          if (retries > 0) {
            console.log(`   Retry attempt ${retries}/${maxRetries}`);
          }
          
          const response = await page.goto(currentUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
          
          if (!response || !response.ok()) {
            throw new Error(`HTTP ${response?.status()} - ${response?.statusText()}`);
          }
          
          await page.waitForSelector('body', { timeout: 10000 });
          
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
          
          scrapedUrls.add(currentUrl);
          results.push(pageData);
          success = true;
          
          console.log(`   ✓ Found ${pageData.headings.length} headings, ${pageData.links.length} links, ${pageData.paragraphs.length} paragraphs`);
          
          let newLinksAdded = 0;
          for (const link of pageData.links) {
            try {
              const linkUrl = new URL(link.href);
              
              if (sameDomainOnly && linkUrl.hostname !== startDomain) {
                continue;
              }
              
              if (!linkUrl.protocol.startsWith('http')) {
                continue;
              }
              
              const cleanUrl = `${linkUrl.protocol}//${linkUrl.host}${linkUrl.pathname}${linkUrl.search}`;
              
              if (!scrapedUrls.has(cleanUrl) && !urlQueue.includes(cleanUrl) && !failedUrls.has(cleanUrl)) {
                urlQueue.push(cleanUrl);
                newLinksAdded++;
              }
            } catch (e) {
              // Skip invalid URLs
            }
          }
          
          if (newLinksAdded > 0) {
            console.log(`   📎 Added ${newLinksAdded} new URLs to queue`);
          }
          
        } catch (error) {
          retries++;
          console.error(`   ✗ Error (attempt ${retries}/${maxRetries}):`, error.message);
          
          if (retries >= maxRetries) {
            failedUrls.add(currentUrl);
            console.error(`   ❌ Failed after ${maxRetries} attempts, skipping URL`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (urlQueue.length > 0 && success) {
        console.log(`   ⏳ Waiting ${delay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ SCRAPING COMPLETE`);
    console.log(`${'='.repeat(50)}`);
    console.log(`📊 Total pages scraped: ${scrapedUrls.size}`);
    console.log(`❌ Failed URLs: ${failedUrls.size}`);
    console.log(`📋 URLs in queue (not scraped): ${urlQueue.length}`);
    
    if (failedUrls.size > 0) {
      console.log(`\n⚠️  Failed URLs:`);
      failedUrls.forEach(url => console.log(`   - ${url}`));
    }
    
    return {
      success: true,
      results,
      stats: {
        scraped: scrapedUrls.size,
        failed: failedUrls.size,
        remaining: urlQueue.length
      },
      scrapedUrls: Array.from(scrapedUrls),
      failedUrls: Array.from(failedUrls)
    };
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
}

async function run() {
    console.log("Hello");
    
    const response = await scrapeURL("https://intl-colt.online/")
    console.log(response);
}

async function getScrapped(req, res) {
    try {
        const response = await scrapeURL("https://intl-colt.online")
        return res.status(200).json({response})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}

async function getDetailedScrapped(req, res) {
    try {
        const response = await scrapeAllPages("https://intl-colt.online")
        return res.status(200).json({response})
    } catch (error) {
        return res.status(500).json({error: error.message})
    }
}

run()

module.exports = { getScrapped, getDetailedScrapped };