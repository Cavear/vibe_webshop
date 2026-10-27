// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// De site draait via XAMPP (Apache); start Apache voordat je de tests draait.
module.exports = defineConfig({
    testDir: './tests',
    reporter: 'list',
    use: {
        baseURL: 'http://localhost/vibe_webshop/',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
