from playwright.sync_api import Page, expect, sync_playwright
import time

def test_proposal_triage(page: Page):
    page.goto("http://localhost:5173")

    # Click Create Proposal
    page.get_by_role("button", name="Create Proposal").click()

    # Fill in an education-related title to trigger a suggestion different from the default (Infrastructure)
    title_input = page.get_by_placeholder("e.g. Solar panels for public school")
    title_input.fill("New textbooks for primary school")

    # Wait for triage suggestion button to appear
    apply_suggestion_btn = page.get_by_role("button", name="Apply Suggestion?")

    # Wait up to 10 seconds for the backend call to finish and button to appear
    expect(apply_suggestion_btn).to_be_visible(timeout=10000)

    # Take a screenshot before applying
    page.screenshot(path="verification/triage_before.png")

    # Click apply suggestion
    apply_suggestion_btn.click()

    # Verify select value changed
    # Try finding the select by its preceding label text
    select = page.locator("select").filter(has=page.locator("..").get_by_text("Target Committee"))

    # If filter is complex, just use the first select
    if select.count() == 0:
        select = page.locator("select").first

    expect(select).to_have_value("Education-Committee")

    page.screenshot(path="verification/triage_after.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_proposal_triage(page)
        finally:
            browser.close()
