from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:5173") # Assuming Vite dev server port
    page.wait_for_timeout(2000)

    # Click start raid (TitleScene starts GameScene)
    page.locator('canvas').click()
    page.wait_for_timeout(2000)

    # GameScene running. Motes should spawn every 4s during Day. Wait 5 seconds.
    page.wait_for_timeout(5000)

    # Let's take a screenshot to see if aether motes spawned or any visual changes
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
