const { chromium } = require('playwright');

async function testBookCreation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Listen for console messages
  page.on('console', (message) => {
    console.log(`Browser console: ${message.type()}: ${message.text()}`);
  });

  // Listen for network requests
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`API Request: ${request.method()} ${request.url()}`);
      if (request.method() === 'POST') {
        console.log(`Request body: ${request.postData()}`);
      }
    }
  });

  // Listen for network responses
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.status()} ${response.url()}`);
      try {
        const responseText = await response.text();
        console.log(`Response body: ${responseText}`);
      } catch (error) {
        console.log('Could not read response body');
      }
    }
  });

  try {
    console.log('🧪 Testing book creation...');

    // Navigate to the local app
    const baseUrl = 'http://localhost:5174';
    console.log(`🌐 Navigating to ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the app to fully load
    await page.waitForTimeout(2000);

    console.log('📝 Looking for New Book button in sidebar...');

    // Look for the New Book button in sidebar
    const newBookButton = page.locator('button:has-text("New Book")');
    await newBookButton.waitFor({ timeout: 10000 });

    console.log('🔘 Clicking New Book button...');
    await newBookButton.click();

    // Wait for modal to appear
    await page.waitForTimeout(1000);

    console.log('📋 Filling out book creation form...');

    // Fill in the form
    await page.fill('input#title', 'Test Book From Script');
    await page.fill('input#author', 'Test Author');
    await page.fill('textarea#description', 'Test description for the book');

    // Wait a moment
    await page.waitForTimeout(500);

    console.log('✨ Submitting form...');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the request to complete
    await page.waitForTimeout(3000);

    console.log('✅ Book creation test completed!');

  } catch (error) {
    console.error('❌ Error during book creation test:', error.message);

    try {
      await page.screenshot({ path: 'book-creation-error.png' });
      console.log('📷 Error screenshot saved');
    } catch (e) {
      console.error('Failed to capture error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testBookCreation();