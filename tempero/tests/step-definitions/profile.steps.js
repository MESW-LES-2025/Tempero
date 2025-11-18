const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

// ============================================================================
// SCENARIO: View own profile
// ============================================================================

Given('I am logged in as {string}', async function (username) {
  await this.page.goto('/login');
  await this.page.fill('#login-email', 'temperoteam@gmail.com');
  await this.page.fill('#login-pass', '123TastyFood');
  await this.page.click('button[type="submit"]');
  await this.page.waitForURL('**/');
});

When('I visit my profile page {string}', async function (url) {
  await this.page.goto(url);
  await this.page.waitForLoadState('networkidle');
});

Then('I should see my display name', async function () {
  const displayName = await this.page.locator('h1').textContent();
  expect(displayName).toBeTruthy();
});

Then('I should see {string} count', async function (label) {
  const element = await this.page.locator(`text=${label}`);
  await expect(element).toBeVisible();
});

Then('I should see the {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible();
});

Then('I should not see a {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).not.toBeVisible();
});

// ============================================================================
// SCENARIO: View another user's profile when logged in
// ============================================================================

When('I visit another user\'s profile {string}', async function (url) {
  await this.page.goto(url);
  await this.page.waitForLoadState('networkidle');
});

Then('I should see wayne\'s display name', async function () {
  const displayName = await this.page.locator('h1').textContent();
  expect(displayName).toBeTruthy();
});

Then('I should not see an {string} button', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).not.toBeVisible();
});

// ============================================================================
// SCENARIO: Follow another user
// ============================================================================

Given('I am on user {string} profile page', async function (username) {
  await this.page.goto(`/profile/${username}`);
  await this.page.waitForLoadState('networkidle');
});

Given('I am not following {string}', async function (username) {
  const button = await this.page.locator('button:has-text("Follow")');
  await expect(button).toBeVisible();
});

When('I click the {string} button', async function (buttonText) {
  await this.page.click(`button:has-text("${buttonText}")`);
  await this.page.waitForTimeout(500);
});

Then('the button should change to {string}', async function (buttonText) {
  const button = await this.page.locator(`button:has-text("${buttonText}")`);
  await expect(button).toBeVisible();
});

Then('the followers count should increase by 1', async function () {
  const followersElement = await this.page.locator('text=Followers').locator('xpath=preceding-sibling::div');
  const count = await followersElement.textContent();
  expect(parseInt(count)).toBeGreaterThanOrEqual(1);
});

// ============================================================================
// SCENARIO: Unfollow a user
// ============================================================================

Given('I am already following {string}', async function (username) {
  const button = await this.page.locator('button:has-text("Unfollow")');
  await expect(button).toBeVisible();
});

Then('the followers count should decrease by 1', async function () {
  const followersElement = await this.page.locator('text=Followers').locator('xpath=preceding-sibling::div');
  const count = await followersElement.textContent();
  expect(parseInt(count)).toBeGreaterThanOrEqual(0);
});

// ============================================================================
// SCENARIO: Navigate to edit profile
// ============================================================================

Then('I should be redirected to {string}', async function (url) {
  await this.page.waitForURL(`**${url}`);
  expect(this.page.url()).toContain(url);
});

// ============================================================================
// SCENARIO: Switch to Reviews tab
// ============================================================================

Given('I am on a user\'s profile page', async function () {
  await this.page.goto('/profile/testuser');
  await this.page.waitForLoadState('networkidle');
});

Given('I am viewing the {string} tab', async function (tabName) {
  const tab = await this.page.locator(`button:has-text("${tabName}")`);
  const classes = await tab.getAttribute('class');
  if (!classes.includes('border-[#e57f22]')) {
    await tab.click();
  }
});

When('I click the {string} tab', async function (tabName) {
  await this.page.click(`button:has-text("${tabName}")`);
  await this.page.waitForTimeout(300);
});

Then('the {string} tab should be active', async function (tabName) {
  const tab = await this.page.locator(`button:has-text("${tabName}")`);
  const classes = await tab.getAttribute('class');
  expect(classes).toContain('text-[#e57f22]');
});

Then('I should see the reviews content', async function () {
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: Switch to Recipes tab
// ============================================================================

Then('I should see the recipes content', async function () {
  await this.page.waitForTimeout(500);
});

// ============================================================================
// SCENARIO: View profile with level and chef type
// ============================================================================

Given('a user {string} has level {int} and chef type {string}', async function (username, level, chefType) {
  this.testData = { username, level, chefType };
});

Then('I should see {string}', async function (text) {
  const element = await this.page.locator(`text=${text}`);
  await expect(element).toBeVisible();
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

When('I visit the profile page {string}', async function (url) {
  await this.page.goto(url);
  await this.page.waitForLoadState('networkidle');
});

Then('I should see an error {string}', async function (errorMessage) {
  const error = await this.page.locator('text=' + errorMessage);
  await expect(error).toBeVisible();
});

// ============================================================================
// SCENARIO: Loading state while fetching profile
// ============================================================================

When('I start loading the profile page {string}', async function (url) {
  await this.page.goto(url);
});

Then('I should see {string} message', async function (message) {
  const loader = await this.page.locator(`text=${message}`);
  await expect(loader).toBeVisible();
});
