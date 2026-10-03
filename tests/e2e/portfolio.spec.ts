import { expect, test, type Page } from "@playwright/test"

const slides = (page: Page) => page.locator("[data-landing-slide]")

async function assertSlideVisible(page: Page, index: number, withinViewport = true) {
  const slide = slides(page).nth(index)
  const heading = slide.locator("h2")
  await expect(slide).toBeVisible()
  await expect(heading).toBeVisible()
  await expect.poll(() => heading.evaluate((element, checkViewport) => {
    const box = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return style.visibility !== "hidden" && Number(style.opacity) > 0 &&
      (!checkViewport || (box.bottom > 0 && box.top < innerHeight))
  }, withinViewport)).toBe(true)
}

for (const viewport of [{ width: 390, height: 844 }, { width: 412, height: 915 }, { width: 768, height: 1024 }]) {
  test(`mobile and tablet slides remain visible at ${viewport.width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    await page.goto("/")
    await expect.poll(() => slides(page).count()).toBeGreaterThanOrEqual(3)
    await assertSlideVisible(page, 0, false)

    // Jump past slides, then reverse direction: skipped slides cannot become permanently hidden.
    for (const index of [2, 1, 0, 2]) {
      await slides(page).nth(index).evaluate((slide) => slide.scrollIntoView({ block: "start", behavior: "instant" }))
      await assertSlideVisible(page, index)
    }
    await page.setViewportSize({ width: viewport.width === 390 ? 844 : 390, height: viewport.height })
    await assertSlideVisible(page, 2, false)
    await slides(page).nth(2).evaluate((slide) => slide.scrollIntoView({ block: "start", behavior: "instant" }))
    await assertSlideVisible(page, 2)
    await page.reload()
    await expect(slides(page).first()).toBeVisible()
    await context.close()
  })
}

test("desktop dot navigation follows the internal scroll container", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  const dots = page.getByRole("navigation", { name: "Project slide navigation" }).getByRole("button")
  await expect.poll(() => dots.count()).toBeGreaterThanOrEqual(3)
  await dots.nth(2).click()
  await expect(dots.nth(2)).toHaveAttribute("aria-current", "true")
  await assertSlideVisible(page, 2)
  await slides(page).nth(1).evaluate((slide) => slide.scrollIntoView({ block: "start", behavior: "instant" }))
  await expect(dots.nth(1)).toHaveAttribute("aria-current", "true")
  await assertSlideVisible(page, 1)
})

test("reduced motion, history and image dialog stay usable", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
  const page = await context.newPage()
  await page.goto("/")
  await slides(page).nth(1).evaluate((slide) => slide.scrollIntoView({ block: "start", behavior: "instant" }))
  await assertSlideVisible(page, 1)
  await page.getByRole("button", { name: /^Open / }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(page.getByRole("button", { name: "Close image preview" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /^Open / }).first()).toBeFocused()
  await slides(page).first().locator('a:has-text("View Project")').first().click()
  await expect(page).toHaveURL(/\/projects\//)
  await page.goBack()
  await expect(slides(page).first()).toBeVisible()
  await page.goForward()
  await expect(page).toHaveURL(/\/projects\//)
  await context.close()
})

test("SSR content remains visible without animation JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto("/")
  await assertSlideVisible(page, 0, false)
  await slides(page).nth(2).evaluate((slide) => slide.scrollIntoView({ block: "start" }))
  await assertSlideVisible(page, 2)
  await context.close()
})

test("animated lightbox uses the lightweight asset only when opened", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const slide = slides(page).filter({ hasText: "Switch On Creative" })
  const preview = slide.getByRole("button", { name: /^Open Professional portrait/ })
  await expect(preview).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await preview.click()
  await expect(page.getByRole("dialog").locator("img")).toHaveAttribute(
    "src", "/project-media/switch-on-creative/output-motion.webp",
  )
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("project gallery traps and restores keyboard focus", async ({ page }) => {
  await page.goto("/projects/switch-on-creative")
  const trigger = page.getByRole("button", { name: "Open Brand Identity Campaigns" })
  await trigger.click()
  await expect(page.getByRole("button", { name: "Close image preview" })).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(page.getByRole("button", { name: "Next image" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(trigger).toBeFocused()
})

test("projects, detail, profile fallback, and canonical redirects", async ({ page, request }) => {
  await page.goto("/")
  await expect(page.locator("aside")).toBeVisible()
  await expect(page.locator("aside img")).toHaveCount(0)
  await page.goto("/projects")
  await expect(page.getByRole("main")).toBeVisible()
  const projectLink = page.locator('a[href^="/projects/"]').first()
  await expect(projectLink).toBeVisible()
  await projectLink.click()
  await expect(page).toHaveURL(/\/projects\/[^/]+/)
  for (const path of ["/portfolio", "/portfolio/", "/portfolio/foo"]) {
    const response = await request.get(path)
    expect(response.url()).toMatch(/\/$/)
    expect(response.ok()).toBe(true)
  }
})
