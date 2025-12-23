import { EMessageTypes } from "./enums";

export const getCookieHeader = async (
  message: any,
  sender: Browser.runtime.MessageSender
): Promise<string> => {
  const cookies = await browser.cookies.getAll({
    domain: "byok-ai-code-reviewer.vercel.app",
  });

  const authCookies = cookies.filter(
    (cookie) =>
      cookie.name.endsWith("-auth-token-code-verifier") ||
      cookie.name.endsWith("-auth-token.0") ||
      cookie.name.endsWith("-auth-token.1")
  );

  const cookieHeader = authCookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  if (cookieHeader.length < 150) {
    await browser.tabs.create({
      url: "https://byok-ai-code-reviewer.vercel.app",
    });
    if (sender.tab?.id) {
      browser.tabs.sendMessage(sender.tab.id, {
        type: EMessageTypes.UPDATE_UI,
        payload: {
          prNumber: message.payload.prNumber,
          status: "idle",
        },
      });
    }
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/48.png"),
      title: "Authentication Required",
      message:
        "Please log in to the Reviewer App to enable code review functionality.",
    });
    return "";
  }

  return cookieHeader;
};

export const getRepoId = async (
  message: any,
  sender: Browser.runtime.MessageSender
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://byok-ai-code-reviewer.vercel.app/api/extension/internal-repo-id?ownerName=${message.payload.prOwnerName}&repoName=${message.payload.prRepoName}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data.repoId) {
      return data.repoId;
    } else {
      throw new Error("repoId not found in response");
    }
  } catch (error) {
    await browser.tabs.create({
      url: "https://byok-ai-code-reviewer.vercel.app/repos",
    });
    if (sender.tab?.id) {
      browser.tabs.sendMessage(sender.tab.id, {
        type: EMessageTypes.UPDATE_UI,
        payload: {
          prNumber: message.payload.prNumber,
          status: "idle",
        },
      });
    }
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/48.png"),
      title: "Could not Find Repository",
      message:
        "Please Add the Repository in the Reviewer App to enable code review functionality.",
    });
    return "";
  }
};

export const buildPrompt = async (
  message: any,
  sender: Browser.runtime.MessageSender,
  repoId: string,
  config: any
): Promise<{ prompt: string; reviewId: string } | null> => {
  try {
    const response = await fetch(
      "https://byok-ai-code-reviewer.vercel.app/api/extension/build-prompt",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          reviewParams: {
            repoId: repoId,
            githubPrNumber: parseInt(message.payload.prNumber),
            reviewRuleIds: config.reviewRuleIds || [],
            customPrompt: config.customPrompt || "",
            shouldComment: config.shouldComment || false,
            aiModel: "external",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    await browser.tabs.create({
      url: "https://byok-ai-code-reviewer.vercel.app/repos",
    });
    if (sender.tab?.id) {
      browser.tabs.sendMessage(sender.tab.id, {
        type: EMessageTypes.UPDATE_UI,
        payload: {
          prNumber: message.payload.prNumber,
          status: "idle",
        },
      });
    }
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/48.png"),
      title: "Something went wrong",
      message: "An error occurred while reviewing. Please try again.",
    });
    return null;
  }
};

export const runGeminiAutomation = async (
  userPrompt: string,
  sender: Browser.runtime.MessageSender,
  geminiUrl: string = "https://gemini.google.com/app"
) => {
  const tab = await browser.tabs.create({
    url: geminiUrl,
    active: true,
  });

  await new Promise((resolve) => {
    browser.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve(null);
      }
    });
  });

  const result = await browser.scripting.executeScript({
    target: { tabId: tab.id! },
    args: [userPrompt],
    func: async (prompt: string) => {
      const sleep = (ms: number) =>
        new Promise((r) => setTimeout(r, ms + Math.random() * 300));

      const waitFor = (selector: string, timeout = 10000): Promise<Element> => {
        return new Promise((resolve, reject) => {
          const el = document.querySelector(selector);
          if (el) return resolve(el);

          const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
              observer.disconnect();
              resolve(el);
            }
          });

          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
          });

          setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for selector: ${selector}`));
          }, timeout);
        });
      };

      const waitForResponseComplete = (timeout = 180000): Promise<void> => {
        return new Promise((resolve, reject) => {
          const checkCompletion = () => {
            const stopIcon = document.querySelector(
              '[data-mat-icon-name="stop"]'
            );
            const micIcon = document.querySelector(
              '[data-mat-icon-name="mic"]'
            );
            const sendIcon = document.querySelector(
              '[data-mat-icon-name="send"]'
            );
            return !stopIcon && (micIcon || sendIcon);
          };

          if (checkCompletion()) return resolve();

          const observer = new MutationObserver(() => {
            if (checkCompletion()) {
              observer.disconnect();
              resolve();
            }
          });

          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
          });

          setTimeout(() => {
            observer.disconnect();
            reject(new Error("Timeout waiting for response generation"));
          }, timeout);
        });
      };

      const clickByIcon = async (iconName: string): Promise<Element> => {
        const el = await waitFor(`[data-mat-icon-name="${iconName}"]`);
        (el.closest("button") as HTMLButtonElement)?.click();
        return el;
      };

      await sleep(2000);

      try {
        await clickByIcon("edit_square");
        await sleep(800);
      } catch {
        // Ignore
      }

      const editor = (await waitFor('[contenteditable="true"]')) as HTMLElement;
      editor.focus();
      await sleep(1000);

      try {
        const menuBtn = await waitFor(
          '[data-test-id="bard-mode-menu-button"], .input-area-switch',
          2000
        );
        (menuBtn.closest("button") as HTMLButtonElement)?.click();
        await sleep(500);

        const menuItems = Array.from(
          document.querySelectorAll(
            'li, div[role="menuitem"], button[role="menuitemradio"]'
          )
        );
        const targetModel = menuItems.find((el) =>
          el.textContent?.includes("Thinks longer for advanced maths and code")
        );
        if (targetModel) {
          (targetModel as HTMLElement).click();
        } else {
          console.warn("Could not find 'Pro' model, using default.");
          document.body.click();
        }
        await sleep(800);
      } catch {
        console.warn("Could not open model menu, using default model.");
      }

      editor.focus();
      await sleep(300);

      (editor as HTMLElement).innerText = prompt;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(500);

      await clickByIcon("send");
      await sleep(2000);

      await waitForResponseComplete();
      await sleep(1000);

      const responses = document.querySelectorAll(
        '[data-message-author-role="model"], .model-response-text, .response-content'
      );

      if (responses.length > 0) {
        return (responses[responses.length - 1] as HTMLElement).innerText;
      }

      const copyButtons = document.querySelectorAll(
        '[data-mat-icon-name="content_copy"]'
      );
      if (copyButtons.length > 0) {
        const lastCopyBtn = copyButtons[copyButtons.length - 1];
        (lastCopyBtn.closest("button") as HTMLButtonElement)?.click();
        await sleep(500);

        try {
          return await navigator.clipboard.readText();
        } catch {
          // Ignore
        }
      }

      return "";
    },
  });

  if (tab.id) {
    setTimeout(() => {
      browser.tabs.remove(tab.id!);
    }, 500);
  }

  if (sender.tab?.id) {
    await browser.tabs.update(sender.tab.id, { active: true });
  }

  return result[0].result;
};

export const postReview = async (
  repoId: string,
  pullNumber: number,
  reviewId: string,
  reviewData: object,
  shouldComment: boolean
): Promise<boolean> => {
  try {
    const response = await fetch(
      "https://byok-ai-code-reviewer.vercel.app/api/extension/post-review",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          repoId,
          pullNumber,
          reviewId,
          reviewData,
          shouldComment,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    await browser.notifications.create({
      type: "basic",
      iconUrl: browser.runtime.getURL("/icon/48.png"),
      title: "Could not Save Review",
      message: "An error occurred while saving the review. Please try again.",
    });
    return false;
  }
};
