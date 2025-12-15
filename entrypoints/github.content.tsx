import ReactDOM from "react-dom/client";
import ReviewButton from "@/components/ReviewButton";

export default defineContentScript({
  matches: ["https://github.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ROW_SELECTOR = ".js-issue-row";
    const TARGET_COL_SELECTOR = ".col-4.col-md-3";

    const injectButtons = () => {
      const rows = document.querySelectorAll(ROW_SELECTOR);

      rows.forEach((row) => {
        if (row.getAttribute("data-wxt-injected")) return;

        const targetContainer = row.querySelector(TARGET_COL_SELECTOR);
        if (!targetContainer) return;

        const prNumber = row.id.replace("issue_", "");
        const linkElement = row.querySelector(
          "a.js-navigation-open"
        ) as HTMLAnchorElement;
        const prUrl = linkElement?.href;
        const prTitle = linkElement?.innerText;

        const urlObj = new URL(prUrl);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const prOwnerName = pathParts[0];
        const prRepoName = pathParts[1];

        const appContainer = document.createElement("div");
        appContainer.className = "d-flex flex-items-center ml-2";

        targetContainer.prepend(appContainer);

        const root = ReactDOM.createRoot(appContainer);
        root.render(
          <ReviewButton
            prNumber={prNumber}
            prOwnerName={prOwnerName}
            prRepoName={prRepoName}
            prTitle={prTitle}
          />
        );

        row.setAttribute("data-wxt-injected", "true");
      });
    };

    injectButtons();

    const observer = new MutationObserver((mutations) => {
      injectButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
});
