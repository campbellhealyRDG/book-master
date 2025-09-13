const { chromium } = require('playwright');

async function captureLocalScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Set viewport size for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });

  try {
    console.log('📸 Capturing local app screenshots...');

    // Navigate to the local app
    const baseUrl = 'http://localhost:5173';
    console.log(`🌐 Navigating to ${baseUrl}`);

    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a moment for the app to fully load
    await page.waitForTimeout(2000);

    // Take full page screenshot
    console.log('📷 Taking local full page screenshot...');
    await page.screenshot({
      path: 'reference-screenshots/local-01-full-page.png',
      fullPage: true
    });

    // Take viewport screenshot
    console.log('📷 Taking local viewport screenshot...');
    await page.screenshot({
      path: 'reference-screenshots/local-02-viewport.png'
    });

    // Capture page source for comparison
    const pageContent = await page.content();
    require('fs').writeFileSync('reference-screenshots/local-page-source.html', pageContent);
    console.log('💾 Saved local page source');

    // Capture metadata
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
      'reference-screenshots/local-metadata.json',
      JSON.stringify(metadata, null, 2)
    );

    console.log('✅ Local screenshots captured successfully!');
    console.log(`📋 Page title: ${title}`);
    console.log(`🔗 URL: ${url}`);

  } catch (error) {
    console.error('❌ Error capturing local screenshots:', error.message);

    // Try to capture error state
    try {
      await page.screenshot({ path: 'reference-screenshots/local-error-state.png' });
      console.log('📷 Local error state screenshot saved');
    } catch (e) {
      console.error('Failed to capture local error state screenshot');
    }
  } finally {
    await browser.close();
  }
}

captureLocalScreenshots();