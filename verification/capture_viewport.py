from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3500)
        # Capture viewport and then scroll
        page.screenshot(path="verification/dashboard_view_top.png")
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/dashboard_view_middle.png")
        page.evaluate("window.scrollBy(0, 800)")
        page.wait_for_timeout(500)
        page.screenshot(path="verification/dashboard_view_bottom.png")
        print("Captured 3 sections")
        browser.close()

if __name__ == "__main__":
    run()
