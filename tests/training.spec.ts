import { test, expect, Page } from "@playwright/test";

const URL = "http://localhost:3737/异乡缴费-内部培训-v2026-03.html";

// 预期的 10 张幻灯片标题
const EXPECTED_TITLES = [
  "异乡缴费",                        // Slide 1 — 封面
  "平台介绍",                        // Slide 2
  "缴费类型",                        // Slide 3
  "为什么是比价平台",                  // Slide 4
  "合作机构与合规",                    // Slide 5
  "顾问成单流程",                     // Slide 6
  "推荐三大理由",                     // Slide 7
  "奖励机制",                        // Slide 8
  "内部对接模式",                     // Slide 9
  "问题答疑",                        // Slide 10
];

async function initPage(page: Page) {
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await expect(page.locator(".reveal.ready")).toBeVisible({ timeout: 10000 });
}

test.describe("异乡缴费培训演示", () => {
  test("页面正常加载，reveal.js 初始化成功", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await initPage(page);
    expect(errors).toHaveLength(0);
  });

  test("共有 10 张幻灯片，每张标题正确", async ({ page }) => {
    await initPage(page);

    const slides = page.locator(".slides > section");
    await expect(slides).toHaveCount(10);

    for (let i = 0; i < EXPECTED_TITLES.length; i++) {
      const titleText = await slides.nth(i).locator("h1, h2").first().textContent();
      expect(titleText).toContain(EXPECTED_TITLES[i]);
    }
  });

  test("键盘右箭头可以翻到下一张幻灯片", async ({ page }) => {
    await initPage(page);

    const getSlideIndex = () =>
      page.evaluate(() => (window as any).Reveal.getState().indexh);

    expect(await getSlideIndex()).toBe(0);

    // 跳到 Slide 10（index 9，无 fragment），测试从这里按右不会越界
    // 然后跳到 Slide 1（index 0，无 fragment）测试前进
    await page.evaluate(() => (window as any).Reveal.slide(0));
    expect(await getSlideIndex()).toBe(0);

    // 从封面按右箭头，应跳到 Slide 2（index 1）
    await page.keyboard.press("ArrowRight");
    expect(await getSlideIndex()).toBe(1);
  });

  test("键盘左箭头可以翻回上一张幻灯片", async ({ page }) => {
    await initPage(page);

    const getSlideIndex = () =>
      page.evaluate(() => (window as any).Reveal.getState().indexh);

    // 跳到第 4 张（index 3，无 fragment）
    await page.evaluate(() => (window as any).Reveal.slide(3));
    expect(await getSlideIndex()).toBe(3);

    // 按左箭头翻回
    await page.keyboard.press("ArrowLeft");
    expect(await getSlideIndex()).toBe(2);
  });

  test("Slide 2 平台介绍：四大优势 fragment 逐一步进", async ({ page }) => {
    await initPage(page);

    // 导航到 Slide 2
    await page.keyboard.press("ArrowRight");

    // 四大优势 fragment 初始应该不可见
    const fragments = page.locator(
      '.slides > section:nth-child(2) .fragment'
    );
    await expect(fragments).toHaveCount(4);

    // 初始状态：所有 fragment 都没有 .visible class
    for (let i = 0; i < 4; i++) {
      await expect(fragments.nth(i)).not.toHaveClass(/visible/);
    }

    // 逐个步进，每按一次出现一个
    const advantages = ["官方付款通道", "人民币快捷支付", "不占外汇额度", "快速到账"];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("ArrowRight");
      await expect(fragments.nth(i)).toHaveClass(/visible/);
      const text = await fragments.nth(i).textContent();
      expect(text).toContain(advantages[i]);
    }
  });

  test("Slide 4 比价对比表：初始只显示单一平台列，步进后异乡缴费列逐行浮出", async ({ page }) => {
    await initPage(page);

    // 跳到 Slide 4（index 3）
    await page.evaluate(() => (window as any).Reveal.slide(3));

    const slide4 = page.locator('.slides > section:nth-child(4)');

    // 对比表应该存在
    const table = slide4.locator('table');
    await expect(table).toBeVisible();

    // 比较维度行（6 行数据，不含表头）
    const rows = ["选择权", "价格透明度", "手续费", "合规性", "风险", "服务中立性"];

    // 「单一支付平台」列应始终可见
    for (const row of rows) {
      await expect(slide4.locator(`text=${row}`).first()).toBeVisible();
    }

    // 「异乡缴费」列的 fragment 初始不可见
    const comparisonFragments = slide4.locator('table .fragment');
    const fragmentCount = await comparisonFragments.count();
    expect(fragmentCount).toBeGreaterThanOrEqual(6);

    for (let i = 0; i < fragmentCount; i++) {
      await expect(comparisonFragments.nth(i)).not.toHaveClass(/visible/);
    }

    // 逐个步进，每个 fragment 变为 visible
    for (let i = 0; i < fragmentCount; i++) {
      await page.keyboard.press("ArrowRight");
      await expect(comparisonFragments.nth(i)).toHaveClass(/visible/);
    }

    // 最后一步：底部总结语出现
    await page.keyboard.press("ArrowRight");
    const summary = slide4.locator('.fragment').last();
    await expect(summary).toHaveClass(/visible/);
    const summaryText = await summary.textContent();
    expect(summaryText).toContain("中立第三方");
  });

  test("Slide 3 缴费类型：展示学费、房租、保险三种场景", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(2));

    const slide = page.locator('.slides > section:nth-child(3)');
    const text = await slide.textContent();
    expect(text).toContain("学费");
    expect(text).toContain("房租");
    expect(text).toContain("保险");
  });

  test("Slide 5 合作机构：logo 以 fragment 渐次淡入", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(4));

    const slide = page.locator('.slides > section:nth-child(5)');
    const fragments = slide.locator('.fragment');
    const count = await fragments.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // 文本中应包含合规声明
    const text = await slide.textContent();
    expect(text).toContain("持牌");
  });

  test("Slide 6 顾问成单流程：流程步骤和风险提示 fragment 步进", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(5));

    const slide = page.locator('.slides > section:nth-child(6)');
    const fragments = slide.locator('.fragment');
    const count = await fragments.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const text = await slide.textContent();
    expect(text).toContain("支付定金");
    expect(text).toContain("录单");
  });

  test("Slide 7 推荐三大理由：三栏卡片 fragment 逐一步进", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(6));

    const slide = page.locator('.slides > section:nth-child(7)');
    const fragments = slide.locator('.fragment');
    await expect(fragments).toHaveCount(3);

    const reasons = ["时间成本", "缴费问题", "佣金"];
    for (let i = 0; i < 3; i++) {
      await expect(fragments.nth(i)).not.toHaveClass(/visible/);
    }

    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowRight");
      await expect(fragments.nth(i)).toHaveClass(/visible/);
      const text = await fragments.nth(i).textContent();
      expect(text).toContain(reasons[i]);
    }
  });

  test("Slide 8 奖励机制：三个奖励模块 fragment 步进 + 计算示例", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(7));

    const slide = page.locator('.slides > section:nth-child(8)');
    const fragments = slide.locator('.fragment');
    const count = await fragments.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const text = await slide.textContent();
    expect(text).toContain("学费");
    expect(text).toContain("保险");
  });

  test("Slide 9 内部对接模式：双路径流程 fragment 步进", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(8));

    const slide = page.locator('.slides > section:nth-child(9)');
    const fragments = slide.locator('.fragment');
    const count = await fragments.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const text = await slide.textContent();
    expect(text).toContain("自动");
    expect(text).toContain("喊单");
  });

  test("Slide 10 答疑：包含联系方式和结束语", async ({ page }) => {
    await initPage(page);
    await page.evaluate(() => (window as any).Reveal.slide(9));

    const slide = page.locator('.slides > section:nth-child(10)');
    const text = await slide.textContent();
    expect(text).toContain("问题答疑");
    expect(text).toContain("北森");
  });
});
