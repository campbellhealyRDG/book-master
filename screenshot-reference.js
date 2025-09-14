const { chromium } = require('playwright');

async function captureReferenceScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport size for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('📸 Capturing reference screenshots of Book Master app...');

    // Navigate to the older app
    const baseUrl = 'http://192.168.1.123:5173';
    console.log(`🌐 Navigating to ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a moment for the app to fully load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    console.log('📷 Taking full page screenshot...');
    await page.screenshot({
      path: 'reference-screenshots/01-full-page.png',
      fullPage: true
    });

    // Take viewport screenshot
    console.log('📷 Taking viewport screenshot...');
    await page.screenshot({
      path: 'reference-screenshots/02-viewport.png'
    });

    // Try to capture sidebar if visible
    try {
      const sidebar = await page.locator('[class*="sidebar"], [class*="nav"], [id*="sidebar"]').first();
      if (await sidebar.isVisible()) {
        console.log('📷 Taking sidebar screenshot...');
        await sidebar.screenshot({ path: 'reference-screenshots/03-sidebar.png' });
      }
    } catch (e) {
      console.log('ℹ️ No sidebar element found or not visible');
    }

    // Try to capture main content area
    try {
      const mainContent = await page.locator('[class*="main"], [class*="content"], [id*="main"], [id*="content"]').first();
      if (await mainContent.isVisible()) {
        console.log('📷 Taking main content screenshot...');
        await mainContent.screenshot({ path: 'reference-screenshots/04-main-content.png' });
      }
    } catch (e) {
      console.log('ℹ️ No main content element found or not visible');
    }

    // Try to capture any book list or editor area
    try {
      const bookList = await page.locator('[class*="book"], [class*="list"], [class*="editor"]').first();
      if (await bookList.isVisible()) {
        console.log('📷 Taking book/editor area screenshot...');
        await bookList.screenshot({ path: 'reference-screenshots/05-book-editor-area.png' });
      }
    } catch (e) {
      console.log('ℹ️ No book/editor element found or not visible');
    }

    // Capture page source for reference
    const pageContent = await page.content();
    require('fs').writeFileSync('reference-screenshots/page-source.html', pageContent);
    console.log('💾 Saved page source to reference-screenshots/page-source.html');

    // Capture page title and URL
    const title = await page.title();
    const url = page.url();
    const metadata = {
      title,
      url,
      timestamp: new Date().toISOString(),
      viewportSize: await page.viewportSize(),
      userAgent: await page.evaluate(() => navigator.userAgent)
    };

    require('fs').writeFileSync(
      'reference-screenshots/metadata.json',
      JSON.stringify(metadata, null, 2)
    );

    console.log('✅ Reference screenshots captured successfully!');
    console.log(`📋 Page title: ${title}`);
    console.log(`🔗 URL: ${url}`);

  } catch (error) {
    console.error('❌ Error capturing screenshots:', error.message);

    // Try to capture error state
    try {
      await page.screenshot({ path: 'reference-screenshots/error-state.png' });
      console.log('📷 Error state screenshot saved');
    } catch (e) {
      console.error('Failed to capture error state screenshot');
    }
  } finally {
    await browser.close();
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('reference-screenshots')) {
  fs.mkdirSync('reference-screenshots');
  console.log('📁 Created reference-screenshots directory');
}

captureReferenceScreenshots();