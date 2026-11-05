from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto("http://localhost:5173")
        page.wait_for_timeout(3500)
        page.screenshot(path="verification/dashboard_full_view.png", full_page=True)
        print("Captured full page")
        browser.close()

if __name__ == "__main__":
    run()
