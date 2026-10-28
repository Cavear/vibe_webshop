// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Lokaal draait de site via XAMPP (Apache); start Apache voordat je de tests draait.
// In GitHub Actions (CI) start Playwright zelf de ingebouwde PHP-server.
const CI = !!process.env.CI;
const PHP_BIN = process.env.PHP_BIN || 'C:\\xampp\\php\\php.exe';

module.exports = defineConfig({
    testDir: './tests',
    forbidOnly: CI,
    reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost/vibe_webshop/',
        trace: 'retain-on-failure',
    },
    webServer: CI
        ? {
            command: `${PHP_BIN} -S 127.0.0.1:8000`,
            url: 'http://127.0.0.1:8000/',
            reuseExistingServer: false,
        }
        : undefined,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
