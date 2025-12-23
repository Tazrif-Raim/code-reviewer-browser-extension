import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";

export const reviewConfigurationDefaultValues = {
  reviewRuleIds: [],
  customPrompt: "",
  shouldComment: false,
  geminiUrl: "https://gemini.google.com/app",
};

export const reviewConfigurationSchema = z.object({
  reviewRuleIds: z.array(z.string()),
  shouldComment: z.boolean(),
  customPrompt: z
    .string()
    .max(5000, "Custom prompt must be at most 5000 characters")
    .optional(),
  geminiUrl: z.url("Please enter a valid URL").optional(),
});

export const reviewConfigurationResolver = zodResolver(reviewConfigurationSchema);
