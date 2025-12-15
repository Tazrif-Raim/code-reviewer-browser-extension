import { EMessageTypes } from "@/lib/enums";
import {
  buildPrompt,
  getCookieHeader,
  getRepoId,
  postReview,
  runGeminiAutomation,
} from "@/lib/helpers";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.type === EMessageTypes.TRIGGER_REVIEW) {
      const cookieHeader = await getCookieHeader(message, sender);

      if (!cookieHeader) {
        return;
      }

      const repoId = await getRepoId(message, sender);
      if (!repoId) {
        return;
      }

      const promptData = await buildPrompt(message, sender, repoId);
      if (!promptData?.prompt || !promptData?.reviewId) {
        return;
      }

      const review = await runGeminiAutomation(promptData.prompt, sender);
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
        return;
      }

      const hasSuccess = await postReview(
        repoId,
        message.payload.prNumber,
        promptData.reviewId,
        reviewData,
        false
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
