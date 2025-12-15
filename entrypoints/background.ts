import { EMessageTypes } from "@/lib/enums";
import { buildPrompt, getCookieHeader, getRepoId } from "@/lib/helpers";

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

      const prompt = await buildPrompt(message, sender, repoId);

      console.log(prompt);
    }
  });
});
