import { expect, test, type Locator, type Page } from "@playwright/test";

type StoryTarget = {
  closeWithEscape?: boolean;
  content: string;
  id: string;
  interaction: "click" | "focus" | "hover";
  name: string;
  trigger: string;
};

const storyTargets: StoryTarget[] = [
  {
    name: "dialog",
    id: "testing-tailwind-animation-primitives--dialog",
    trigger: '[data-testid="dialog-trigger"]',
    content: '[data-testid="dialog-content"]',
    interaction: "click",
    closeWithEscape: true,
  },
  {
    name: "alert-dialog",
    id: "testing-tailwind-animation-primitives--alert-dialog",
    trigger: '[data-testid="alert-dialog-trigger"]',
    content: '[data-testid="alert-dialog-content"]',
    interaction: "click",
    closeWithEscape: true,
  },
  {
    name: "dropdown-menu",
    id: "testing-tailwind-animation-primitives--dropdown-menu",
    trigger: '[data-testid="dropdown-menu-trigger"]',
    content: '[data-testid="dropdown-menu-content"]',
    interaction: "click",
    closeWithEscape: true,
  },
  {
    name: "popover",
    id: "testing-tailwind-animation-primitives--popover",
    trigger: '[data-testid="popover-trigger"]',
    content: '[data-testid="popover-content"]',
    interaction: "click",
    closeWithEscape: true,
  },
  {
    name: "tooltip",
    id: "testing-tailwind-animation-primitives--tooltip",
    trigger: '[data-testid="tooltip-trigger"]',
    content: '[data-testid="tooltip-content"]',
    interaction: "click",
  },
  {
    name: "select",
    id: "testing-tailwind-animation-primitives--select",
    trigger: '[data-testid="select-trigger"]',
    content: '[data-testid="select-content"]',
    interaction: "click",
  },
  {
    name: "sheet",
    id: "testing-tailwind-animation-primitives--sheet",
    trigger: '[data-testid="sheet-trigger"]',
    content: '[data-testid="sheet-content"]',
    interaction: "click",
    closeWithEscape: true,
  },
];

async function readStyles(locator: Locator) {
  return locator.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      animationName: styles.animationName,
      opacity: styles.opacity,
      transform: styles.transform,
    };
  });
}

async function openTarget(page: Page, target: StoryTarget) {
  const trigger = page.locator(target.trigger);
  if (target.interaction === "hover") {
    await trigger.hover();
  } else if (target.interaction === "focus") {
    await trigger.focus();
  } else {
    await trigger.click({ force: true });
  }
}

async function closeTarget(page: Page, target: StoryTarget) {
  if (target.interaction === "hover") {
    await page.mouse.move(0, 0);
    return;
  }

  if (target.interaction === "focus") {
    await page.locator(target.trigger).blur();
    return;
  }

  if (target.closeWithEscape) {
    await page.keyboard.press("Escape");
    return;
  }

  await page.locator(target.trigger).click({ force: true });
}

for (const target of storyTargets) {
  test(`${target.name} keeps animation classes active in Storybook`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto(`/iframe.html?id=${target.id}&viewMode=story`);

    const content = page.locator(target.content);

    await expect(page.locator("body")).toHaveScreenshot(`${target.name}-closed.png`, {
      maxDiffPixelRatio: 0.01,
    });

    await openTarget(page, target);
    await page.waitForTimeout(target.interaction === "hover" ? 150 : 50);
    await expect(content).toBeAttached();
    await expect(content).toHaveAttribute("data-state", /open/);

    const openStyles = await readStyles(content);

    expect(openStyles.animationName).not.toBe("none");

    await expect(page.locator("body")).toHaveScreenshot(`${target.name}-open.png`, {
      maxDiffPixelRatio: 0.01,
    });

    await closeTarget(page, target);
    await expect
      .poll(
        async () => {
          if ((await content.count()) === 0) {
            return null;
          }

          return content.getAttribute("data-state");
        },
        { timeout: 2000 }
      )
      .toBe("closed");

    const closedStyles = await readStyles(content);
    const opacityChanged = openStyles.opacity !== closedStyles.opacity;
    const transformChanged = openStyles.transform !== closedStyles.transform;

    expect(opacityChanged || transformChanged).toBe(true);
  });
}
