import { EMessageTypes } from "@/lib/enums";
import {
  buildPrompt,
  getCookieHeader,
  getRepoId,
  postReview,
  runGeminiAutomation,
} from "@/lib/helpers";
import { TReviewConfig } from "@/lib/types";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === EMessageTypes.GET_REVIEW_RULES) {
      console.log("Received GET_REVIEW_RULES message");
      try {
        const response = await fetch(
          "https://byok-ai-code-reviewer.vercel.app/api/extension/review-rules",
          {
            method: "GET",
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched review rules:", data);

          await browser.runtime.sendMessage({
            type: EMessageTypes.SET_REVIEW_RULES,
            payload: data.reviewRules || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch review rules:", error);
      }
      return;
    }

    if (message.type === EMessageTypes.TRIGGER_REVIEW) {
      const cookieHeader = await getCookieHeader(message, sender);

      if (!cookieHeader) {
        return;
      }

      const repoId = await getRepoId(message, sender);
      if (!repoId) {
        return;
      }

      const config = ((await storage.getItem("local:reviewConfiguration")) ||
        {}) as TReviewConfig;

      const promptData = await buildPrompt(message, sender, repoId, config);
      if (!promptData?.prompt || !promptData?.reviewId) {
        return;
      }

      const review = await runGeminiAutomation(
        promptData.prompt,
        sender,
        config.geminiUrl
      );
      if (!review) {
        return;
      }

      let reviewData = null;

      try {
        reviewData = JSON.parse(JSON.stringify(review));
      } catch (err) {
        return;
      }

      if (!reviewData) {
        await browser.notifications.create({
          type: "basic",
          iconUrl: browser.runtime.getURL("/icon/48.png"),
          title: "Gemini Review Failed",
          message:
            "An error occurred while generating the review via Gemini in the browser. Please try again.",
        });
        return;
      }

      const hasSuccess = await postReview(
        repoId,
        message.payload.prNumber,
        promptData.reviewId,
        reviewData,
        config.shouldComment || false
      );
      if (!hasSuccess) {
        await browser.tabs.sendMessage(sender.tab!.id!, {
          type: EMessageTypes.UPDATE_UI,
          payload: {
            prNumber: message.payload.prNumber,
            status: "idle",
          },
        });
        return;
      }

      await browser.tabs.sendMessage(sender.tab!.id!, {
        type: EMessageTypes.UPDATE_UI,
        payload: {
          prNumber: message.payload.prNumber,
          status: "reviewed",
        },
      });
    }
  });
});
