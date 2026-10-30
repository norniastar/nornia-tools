#!/usr/bin/env python3
"""护栏：页面可见文本黄金测试 + 两种宽度截图视觉回归 + 每个工具的功能冒烟。

用法：
  python3 guard.py capture --url http://127.0.0.1:8080 --out perf/bench/golden   # 在基线版本上记录黄金
  python3 guard.py check   --url http://127.0.0.1:8081 --golden perf/bench/golden # 新版本对比，任一项红则退出码 1

时间固定为 2026-01-01 08:00:00 +08:00，crypto.randomUUID 固定，保证同一代码每次输出一致。
依赖：pip install playwright pillow
"""
import argparse
import asyncio
import json
import os
import re
import sys

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

PAGES = json.load(open(os.path.join(os.path.dirname(__file__), "pages.json"), encoding="utf-8"))
WIDTHS = [1440, 390]
FIXED_MS = 1767225600000  # 2026-01-01T00:00:00Z
PIXEL_THRESHOLD = 0.002  # 差异像素占比上限

INIT = "crypto.randomUUID = () => '11111111-2222-4333-8444-555555555555';"


async def open_page(browser, url, width, ready):
    ctx = await browser.new_context(viewport={"width": width, "height": 900}, timezone_id="Asia/Shanghai")
    page = await ctx.new_page()
    await page.clock.set_fixed_time(FIXED_MS)
    await page.add_init_script(INIT)
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    await page.goto(url)
    await page.wait_for_function(f"!!({ready})", timeout=30000, polling=50)
    await page.wait_for_timeout(1500)  # 等入场动画和编辑器布局结束
    return ctx, page, errors


async def snapshot(browser, base, out):
    os.makedirs(out, exist_ok=True)
    texts = {}
    for name, p in PAGES.items():
        for w in WIDTHS:
            ctx, page, errors = await open_page(browser, base + p["path"], w, p["ready"])
            await page.mouse.move(0, 0)
            await page.screenshot(path=f"{out}/{name}-{w}.png", full_page=True)
            texts[f"{name}-{w}"] = {
                "title": await page.title(),
                "text": await page.evaluate("document.body.innerText"),
                "errors": errors,
            }
            await ctx.close()
    return texts


async def smoke(browser, base):
    """每个工具真跑一遍，返回 {名字: (是否通过, 说明)}。"""
    res = {}

    async def run(name, fn, path):
        ctx, page, errors = await open_page(browser, base + path, 1440, PAGES[name]["ready"] if name in PAGES else "true")
        try:
            detail = await fn(page)
            ok = detail is True and not errors
            res[name] = (ok, "ok" if ok else f"{detail} {errors}")
        except Exception as e:
            res[name] = (False, str(e)[:200])
        await ctx.close()

    async def json_tool(page):
        await page.click(".ace_content")
        await page.keyboard.press("Control+A")
        await page.keyboard.insert_text('{"b":1,"a":[1,2,12345678901234567890]}')
        await page.get_by_role("button", name="重新格式化").click() if await page.get_by_role("button", name="重新格式化").count() else None
        await page.wait_for_timeout(300)
        txt = await page.evaluate("document.querySelector('.ace_content').innerText")
        if "12345678901234567890" not in txt:
            return f"json 内容不对: {txt[:80]}"
        # 过滤表达式：属性访问 + 算术改写（走 Babel）+ 大数不丢精度
        for expr, want in [(".a.length", "3"), (".b * 10 + 0.5", "10.5"), (".a[2]", "12345678901234567890")]:
            await page.fill('main input[placeholder^="示例"]', expr)
            await page.wait_for_timeout(1500)
            out = await page.evaluate("[...document.querySelectorAll('.ace_content')].pop().innerText")
            if out.strip() != want:
                return f"过滤 {expr} 结果 {out!r}，期望 {want!r}"
        return True

    async def timestamp_tool(page):
        sel = 'main input[placeholder="请输入时间戳"]'
        await page.fill(sel, "1700000000")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(300)
        txt = await page.evaluate("document.querySelector('main').innerText")
        return True if "2023-11-15" in txt else f"时间戳未转换: {txt[:200]}"

    async def uuid_tool(page):
        txt = await page.evaluate("document.querySelector('main').innerText")
        return True if "11111111-2222-4333-8444-555555555555".upper() in txt else "UUID 未生成"

    async def diff_tool(page):
        await page.locator(".monaco-diff-editor .editor.original .view-lines").click()
        await page.keyboard.type("hello\nworld")
        await page.locator(".monaco-diff-editor .editor.modified .view-lines").click()
        await page.keyboard.type("hello\nthere")
        await page.wait_for_timeout(1500)
        txt = await page.evaluate("document.querySelector('main').innerText")
        return True if re.search(r"(新增|删除|修改) [1-9]", txt) else f"对比统计没变: {txt[:200]}"

    async def url_tool(page):
        await page.fill("main textarea", "a b&c=中")
        await page.wait_for_timeout(300)
        out = await page.evaluate("[...document.querySelectorAll('main textarea')][1].value")
        return True if out == "a%20b%26c%3D%E4%B8%AD" else f"URL 编码结果: {out}"

    async def calc_tool(page):
        await page.fill("main input", "1200 * 0.08 + 15")
        await page.keyboard.press("Enter")
        await page.wait_for_timeout(300)
        txt = await page.evaluate("document.querySelector('main').innerText")
        return True if "111" in txt else f"计算结果不对: {txt[:200]}"

    async def navigation(page):
        # 首页 → 每个工具 → 回首页；切换后 URL 草稿要保留
        for tool, ready in [("URL 编解码", PAGES["url"]["ready"]), ("JSON 编辑器", PAGES["json"]["ready"]),
                            ("文本代码对比", PAGES["diff"]["ready"]), ("计算稿纸", PAGES["calculator"]["ready"])]:
            await page.locator("aside").get_by_text(tool, exact=True).click()
            await page.wait_for_function(f"!!({ready})", timeout=30000)
            if tool == "URL 编解码":
                await page.fill("main textarea", "keep-me")
        await page.locator("aside").get_by_text("URL 编解码", exact=True).click()
        await page.wait_for_function(f"!!({PAGES['url']['ready']})", timeout=30000)
        await page.wait_for_timeout(500)
        v = await page.evaluate("document.querySelector('main textarea').value")
        return True if v == "keep-me" else f"切换后草稿丢了: {v!r}"

    await run("json", json_tool, PAGES["json"]["path"])
    await run("timestamp", timestamp_tool, PAGES["timestamp"]["path"])
    await run("uuid", uuid_tool, PAGES["uuid"]["path"])
    await run("diff", diff_tool, PAGES["diff"]["path"])
    await run("url", url_tool, PAGES["url"]["path"])
    await run("calculator", calc_tool, PAGES["calculator"]["path"])
    await run("navigation", navigation, "/")
    return res


def pixel_diff(a, b):
    ia, ib = Image.open(a).convert("RGB"), Image.open(b).convert("RGB")
    if ia.size != ib.size:
        return 1.0, f"尺寸不同 {ia.size} vs {ib.size}"
    diff = ImageChops.difference(ia, ib).convert("L").point(lambda v: 255 if v > 16 else 0)
    n = sum(1 for v in diff.getdata() if v)
    return n / (ia.size[0] * ia.size[1]), ""


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("action", choices=["capture", "check"])
    ap.add_argument("--url", required=True)
    ap.add_argument("--out")
    ap.add_argument("--golden")
    args = ap.parse_args()
    base = args.url.rstrip("/")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        out = args.out or (args.golden.rstrip("/") + "-check")
        texts = await snapshot(browser, base, out)
        smoke_res = await smoke(browser, base)
        await browser.close()

    with open(f"{out}/texts.json", "w", encoding="utf-8") as fh:
        json.dump(texts, fh, ensure_ascii=False, indent=1)
    failed = False
    for name, (ok, msg) in smoke_res.items():
        print(f"{'✓' if ok else '✗'} 冒烟 {name}: {msg}")
        failed |= not ok
    if args.action == "capture":
        sys.exit(1 if failed else 0)

    golden = json.load(open(f"{args.golden}/texts.json", encoding="utf-8"))
    for key, g in golden.items():
        t = texts.get(key)
        same = t and t["title"] == g["title"] and t["text"] == g["text"]
        print(f"{'✓' if same else '✗'} 文本 {key}")
        if t and t["errors"]:
            print(f"  页面报错: {t['errors']}")
            same = False
        failed |= not same
        ratio, note = pixel_diff(f"{args.golden}/{key}.png", f"{out}/{key}.png")
        ok = ratio <= PIXEL_THRESHOLD
        print(f"{'✓' if ok else '✗'} 截图 {key}: 差异 {ratio * 100:.3f}% {note}")
        failed |= not ok
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
