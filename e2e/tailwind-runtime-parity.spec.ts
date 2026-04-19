import { expect, test, type Page } from "@playwright/test";

const urls = {
  appDev: "http://localhost:3000/signin",
  appProd: "http://localhost:3001/signin",
  storybook:
    "http://localhost:6006/iframe.html?id=organisms-authsigninform--default&viewMode=story",
} as const;

const selectors = [
  {
    name: "signin email input",
    selector: '[data-testid="email-input"]',
    properties: ["background-color", "border-color", "border-radius", "color"] as const,
  },
  {
    name: "signin submit button",
    selector: '[data-testid="signin-submit-button"]',
    properties: ["background-color", "border-radius", "color"] as const,
  },
] as const;

async function collectCss(
  page: Page,
  url: string,
  selector: string,
  properties: readonly string[]
) {
  await page.goto(url);
  const locator = page.locator(selector);
  await expect(locator).toBeVisible();

  const result: Record<string, string> = {};
  for (const property of properties) {
    result[property] = await locator.evaluate(
      (element, cssProperty) => window.getComputedStyle(element).getPropertyValue(cssProperty),
      property
    );
  }

  return result;
}

test("signin route styles stay in parity across Turbopack, webpack, and Storybook", async ({
  page,
}) => {
  for (const target of selectors) {
    const baseline = await collectCss(page, urls.appDev, target.selector, target.properties);

    await page.goto(urls.appProd);
    const prodLocator = page.locator(target.selector);
    await expect(prodLocator).toBeVisible();
    for (const property of target.properties) {
      await expect(prodLocator, `${target.name} should match app dev for ${property}`).toHaveCSS(
        property,
        baseline[property]
      );
    }

    await page.goto(urls.storybook);
    const storyLocator = page.locator(target.selector);
    await expect(storyLocator).toBeVisible();
    for (const property of target.properties) {
      await expect(storyLocator, `${target.name} should match Storybook for ${property}`).toHaveCSS(
        property,
        baseline[property]
      );
    }
  }
});
