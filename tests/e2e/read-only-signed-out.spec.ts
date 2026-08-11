import { expect, test } from "@playwright/test";
import { monitorApplicationMutations } from "./read-only-safety";

test("signed-out protected routes redirect to Clerk sign-in", async ({ page }) => {
  const mutationRequests = monitorApplicationMutations(page);

  for (const route of ["/dashboard", "/classes", "/submissions"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/sign-in(?:\/|\?|$)/);
  }

  expect(mutationRequests).toEqual([]);
});
