import { Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { EMessageTypes } from "@/lib/enums";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field";
import { useReviewConfigurationForm } from "./reviewConfigurationForm.hooks";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

export function ReviewConfigurationForm({ isOpenConfigure, setIsOpenConfigure }: { isOpenConfigure: boolean; setIsOpenConfigure: (open: boolean) => void }) {
  const { form, handleSubmit } = useReviewConfigurationForm({ isOpenConfigure, setIsOpenConfigure });
  const [reviewRules, setReviewRules] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === EMessageTypes.SET_REVIEW_RULES) {
        setReviewRules(message.payload || []);
        setIsLoading(false);
      }
    };

    browser.runtime.onMessage.addListener(listener);

    if (isOpenConfigure) {
      setIsLoading(true);
      browser.runtime.sendMessage({
        type: EMessageTypes.GET_REVIEW_RULES,
      }).catch((error) => {
        console.error("Failed to send GET_REVIEW_RULES message:", error);
        setIsLoading(false);
      });
    }

    return () => {
      browser.runtime.onMessage.removeListener(listener);
    };
  }, [isOpenConfigure]);

  return (
    <div className="w-full grid place-items-center">
      <div className="w-full">
        <form onSubmit={handleSubmit} className="w-full">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Review Configuration</FieldLegend>
              <FieldGroup>
                <Controller
                  name="geminiUrl"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="form-rhf-demo-title">
                        Gemini URL
                      </FieldLabel>
                      <Input
                        {...field}
                        id="form-rhf-demo-title"
                        aria-invalid={fieldState.invalid}
                        placeholder="Your Current Gemini Session Url"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="reviewRuleIds"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Select Review Rules (Optional)</FieldLabel>
                      <div className="space-y-2">
                        {isLoading ? (
                          <div className="text-sm text-gray-400">
                            Loading review rules...
                          </div>
                        ) : reviewRules.length === 0 ? (
                          <div className="text-sm text-gray-400">
                            No review rules available. Create one first.
                          </div>
                        ) : (
                          reviewRules.map((rule) => (
                            <div
                              key={rule.id}
                              className="flex items-center gap-4"
                            >
                              <Checkbox
                                id={rule.id}
                                checked={field.value.includes(rule.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, rule.id]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((id) => id !== rule.id)
                                    );
                                  }
                                }}
                              />
                              <Label
                                htmlFor={rule.id}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {rule.title}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      {reviewRules.length !== 0 ?<FieldDescription>
                        Select zero or more review rules to apply for this PR
                      </FieldDescription> : null}
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="shouldComment"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent>
                        <FieldLabel htmlFor="switch-shouldComment">
                          Auto comment on PR
                        </FieldLabel>
                        <FieldDescription>
                          The system will post the review directly to the PR
                        </FieldDescription>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldContent>
                      <Switch
                        id="switch-shouldComment"
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  )}
                />
                <Controller
                  name="customPrompt"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="new-review-custom-prompt">
                        Custom Prompt (Optional)
                      </FieldLabel>
                      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary">
                        <CodeMirror
                          value={field.value}
                          theme={"dark"}
                          height="30rem"
                          extensions={[
                            markdown({
                              base: markdownLanguage,
                              codeLanguages: languages,
                            }),
                          ]}
                          onChange={(val) => field.onChange(val)}
                          basicSetup={{
                            lineNumbers: true,
                            foldGutter: true,
                            highlightActiveLine: true,
                            highlightActiveLineGutter: true,
                          }}
                        />
                      </div>
                      <FieldDescription>
                        Write custom review guidelines in markdown format
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
            <Field orientation="horizontal" className="justify-end">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save
              </Button>
              <Button variant="outline" type="button" onClick={() => setIsOpenConfigure(false)}>
                Close
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </div>
    </div>
  );
}
