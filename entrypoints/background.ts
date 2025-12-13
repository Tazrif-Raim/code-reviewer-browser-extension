import { EMessageTypes } from "@/lib/enums";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === EMessageTypes.TRIGGER_REVIEW) {
      console.log(
        "Background received TRIGGER_REVIEW for PR:",
        message.payload.prNumber,
        message.payload.prUrl,
        message.payload.prTitle
      );
    }
  });
});
