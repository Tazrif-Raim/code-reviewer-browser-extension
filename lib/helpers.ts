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
    console.log(
      "Fetching repo ID for:",
      message.payload.prOwnerName,
      message.payload.prRepoName
    );
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
        "Please Create the Repository in the Reviewer App to enable code review functionality.",
    });
    return "";
  }
};

export const buildPrompt = async (
  message: any,
  sender: Browser.runtime.MessageSender,
  repoId: string
): Promise<string | null> => {
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
            reviewRuleIds: [],
            customPrompt: "",
            shouldComment: false,
            aiModel: "external",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.prompt;
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
        "Please Create the Repository in the Reviewer App to enable code review functionality.",
    });
    return null;
  }
};
