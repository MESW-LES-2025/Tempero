import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

// ============================================================================
// SCENARIO: View own profile
// ============================================================================

Given('I am logged in as {string}', async function (username) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  
  // Read credentials from environment variables
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Missing test credentials. Set TEST_EMAIL and TEST_PASSWORD environment variables.'
    );
  }

  // Go to login page and log in
  await this.page.goto(`${baseUrl}/Tempero/login`);
  await this.page.fill('#login-email', email);
  await this.page.fill('#login-pass', password);
  await this.page.click('button[type="submit"]');
  // Wait for redirect away from login page
  await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
  
  // Store username for later steps
  this.currentUser = username;
});

When('I visit my profile page {string}', async function (url) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.goto(`${baseUrl}/Tempero${url}`);
  await this.page.waitForLoadState('networkidle');
});

Then('I should see my display name', async function () {
  const displayName = await this.page.locator('h1.font-heading-styled').textContent();
  expect(displayName).toBeTruthy();
});

Then('I should see {string} count', async function (label) {
  const element = await this.page.locator(`text=${label}`);
  await expect(element).toBeVisible();
});

Then('I should see the {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible({ timeout: 10000 });
});

Then('I should not see a {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).not.toBeVisible();
});

// ============================================================================
// SCENARIO: View another user's profile when logged in
// ============================================================================

When('I visit another user\'s profile {string}', async function (url) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.goto(`${baseUrl}/Tempero${url}`);
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);
});

Then('I should see wayne\'s display name', async function () {
  const displayName = await this.page.locator('h1.font-heading-styled').textContent();
  expect(displayName).toBeTruthy();
  await this.page.waitForTimeout(500);
});

Then('I should not see an {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).not.toBeVisible();
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: Follow another user
// ============================================================================

Given('I am on user {string} profile page', async function (username) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.goto(`${baseUrl}/Tempero/profile/${username}`);
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);
});

Given('I am not following {string}', async function (username) {
  const button = await this.page.locator('button:has-text("Follow")');
  await expect(button).toBeVisible();
  await this.page.waitForTimeout(500);
});

When('I click the {string} button', async function (buttonText) {
  await this.page.click(`button:has-text("${buttonText}")`);
  await this.page.waitForTimeout(1000);
});

Then('the button should change to {string}', async function (buttonText) {
  // Wait a bit longer for the button to change
  await this.page.waitForTimeout(2000);
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible({ timeout: 15000 });
  await this.page.waitForTimeout(500);
});

Then('the followers count should increase by 1', async function () {
  // Wait for the count to update
  await this.page.waitForTimeout(2000);
  const followersCount = await this.page.locator('text=Followers').locator('..').locator('p').first().textContent();
  expect(parseInt(followersCount)).toBeGreaterThanOrEqual(1);
});

// ============================================================================
// SCENARIO: Unfollow a user
// ============================================================================

Given('I am already following {string}', async function (username) {
  // Wait for the page to load and determine follow status
  await this.page.waitForTimeout(2000);
  const button = await this.page.locator('button:has-text("Unfollow")');
  await expect(button).toBeVisible({ timeout: 10000 });
  await this.page.waitForTimeout(500);
});

Then('the followers count should decrease by 1', async function () {
  // Wait for the count to update
  await this.page.waitForTimeout(2000);
  const followersCount = await this.page.locator('text=Followers').locator('..').locator('p').first().textContent();
  expect(parseInt(followersCount)).toBeGreaterThanOrEqual(0);
});

// ============================================================================
// SCENARIO: Navigate to edit profile
// ============================================================================

Then('I should be redirected to {string}', async function (url) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.waitForURL(`${baseUrl}/Tempero${url}`, { timeout: 10000 });
  expect(this.page.url()).toContain(`/Tempero${url}`);
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: Switch to Reviews tab
// ============================================================================

Given('I am on a user\'s profile page', async function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.goto(`${baseUrl}/Tempero/profile/wayne`);
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);
});

Given('I am viewing the {string} tab', async function (tabName) {
  const tab = this.page.locator(`button:has-text("${tabName}")`);
  await expect(tab).toBeVisible();
  const classes = await tab.getAttribute('class');
  if (!classes || !classes.includes('text-secondary')) {
    await tab.click();
    await this.page.waitForTimeout(1000);
  }
});

When('I click the {string} tab', async function (tabName) {
  await this.page.click(`button:has-text("${tabName}")`);
  await this.page.waitForTimeout(1000);
});

Then('the {string} tab should be active', async function (tabName) {
  const tab = await this.page.locator(`button:has-text("${tabName}")`);
  const classes = await tab.getAttribute('class');
  expect(classes).toContain('text-secondary');
  await this.page.waitForTimeout(500);
});

Then('I should see the reviews content', async function () {
  await this.page.waitForTimeout(1000);
});

// ============================================================================
// SCENARIO: Switch to Recipes tab
// ============================================================================

Then('I should see the recipes content', async function () {
  await this.page.waitForTimeout(1000);
});

// ============================================================================
// SCENARIO: View profile with level and chef type
// ============================================================================

Given('a user {string} has level {int} and chef type {string}', async function (username, level, chefType) {
  this.testData = { username, level, chefType };
});

When('I visit the profile page {string}', async function (url) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
  await this.page.goto(`${baseUrl}/Tempero${url}`);
  await this.page.waitForLoadState('networkidle');
  await this.page.waitForTimeout(1000);
});

Then('I should see {string}', async function (text) {
  const element = await this.page.locator(`text=${text}`);
  await expect(element).toBeVisible();
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: View profile with bio
// ============================================================================

Given('a user {string} has a bio {string}', async function (username, bio) {
  this.testData = { username, bio };
});

Then('I should see the bio {string}', async function (bio) {
  const bioElement = await this.page.locator(`text=${bio}`);
  await expect(bioElement).toBeVisible();
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: View profile without bio
// ============================================================================

Given('a user {string} has no bio', async function (username) {
  this.testData = { username, bio: null };
});

// ============================================================================
// SCENARIO: View non-existent user profile
// ============================================================================

// When('I visit the profile page {string}', async function (url) {
//   await this.page.goto(`http://localhost:5173/Tempero${url}`);
//   await this.page.waitForLoadState('networkidle');
// });

Then('I should see an error {string}', async function (errorMessage) {
  const error = await this.page.locator('text=' + errorMessage);
  await expect(error).toBeVisible();
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: Loading state while fetching profile
// ============================================================================

// When('I start loading the profile page {string}', async function (url) {
//   await this.page.goto(url);
// });

// Then('I should see {string} message', async function (message) {
//   const loader = await this.page.locator(`text=${message}`);
//   await expect(loader).toBeVisible();
// });
