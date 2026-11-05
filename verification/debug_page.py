from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 1200})

        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"PAGEERROR: {err}"))

        page.goto("http://localhost:5173")
        page.wait_for_timeout(3000)

        html = page.content()
        with open("verification/page_dump.html", "w") as f:
            f.write(html)
        print("HTML length:", len(html))
        browser.close()

if __name__ == "__main__":
    run()
