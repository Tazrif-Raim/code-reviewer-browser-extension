import { useForm } from "react-hook-form";
import { useEffect } from "react";
import z from "zod";
import {
  reviewConfigurationDefaultValues,
  reviewConfigurationResolver,
  reviewConfigurationSchema,
} from "./reviewConfigurationForm.helpers";

export function useReviewConfigurationForm({ isOpenConfigure, setIsOpenConfigure }: { isOpenConfigure: boolean; setIsOpenConfigure: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof reviewConfigurationSchema>>({
    resolver: reviewConfigurationResolver,
    defaultValues: reviewConfigurationDefaultValues,
  });

  useEffect(() => {
    const loadConfig = async () => {
      const config = await storage.getItem<z.infer<typeof reviewConfigurationSchema>>("local:reviewConfiguration");
      if (config) {
        form.reset(config);
      }
    };
    loadConfig();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof reviewConfigurationSchema>) => {
    console.log("Review Configuration Submitted:", data);
    await storage.setItem("local:reviewConfiguration", data);
    setIsOpenConfigure(false);
  };

  return { form, handleSubmit: form.handleSubmit(onSubmit) };
}
