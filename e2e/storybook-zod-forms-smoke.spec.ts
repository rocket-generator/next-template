import { expect, test } from "@playwright/test";

async function openStory(page: import("@playwright/test").Page, storyId: string) {
  await page.goto(`/iframe.html?id=${storyId}&viewMode=story`);
  await expect(page.locator("#storybook-root")).toBeVisible();
}

test.describe("storybook zod/rhf smoke", () => {
  test("AuthSigninForm story で zodResolver が動作する", async ({ page }) => {
    await openStory(page, "organisms-authsigninform--default");

    await page.getByTestId("email-input").fill("user@example.com");
    await page.getByTestId("password-input").fill("short");
    await page.getByTestId("signin-submit-button").click();

    await expect(
      page.getByText("パスワードは8文字以上で入力してください")
    ).toBeVisible();
  });

  test("PasswordChangeForm story で zodResolver が動作する", async ({
    page,
  }) => {
    await openStory(page, "organisms-passwordchangeform--default");

    await page.locator("#currentPassword").fill("Current1!");
    await page.locator("#newPassword").fill("short");
    await page.locator("#confirmPassword").fill("short");

    await expect(
      page.getByText(
        "パスワードは8文字以上で入力してください"
      )
    ).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });
});
