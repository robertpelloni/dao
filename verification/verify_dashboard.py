import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 900})
        page = context.new_page()

        print("Navigating to http://localhost:5173...")
        page.goto("http://localhost:5173", timeout=20000)
        page.wait_for_selector("h1:has-text('LiquidGov')", timeout=15000)
        time.sleep(2)

        page.screenshot(path="verification/dashboard_overview.png", full_page=True)
        print("Captured verification/dashboard_overview.png")

        create_btn = page.locator("button:has-text('Create Proposal')").first
        if create_btn.is_visible():
            create_btn.click()
            time.sleep(1)
            page.screenshot(path="verification/dashboard_create_proposal.png")
            print("Captured verification/dashboard_create_proposal.png")

        browser.close()

if __name__ == "__main__":
    run()
