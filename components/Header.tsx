import { Button } from "@/components/ui/button";

export function Header() {
  function goToReviwerApp() {
    const reviewerAppUrl = "https://byok-ai-code-reviewer.vercel.app/repos";
    window.open(reviewerAppUrl, "_blank");
  }

  function goToreviewRules() {
    const reviewRulesUrl = "https://byok-ai-code-reviewer.vercel.app/review-rules";
    window.open(reviewRulesUrl, "_blank");
  }
  
  return (
    <>
      <div className="p-4 text-lg font-semibold border-b">PR Reviewer</div>
        <div className="flex space-x-2 items-center justify-between w-full p-4 border-b">
          <Button variant="outline" className="w-[48%]" onClick={goToReviwerApp}>
            Go to Reviewer App
          </Button>
          <Button variant="outline" className="w-[48%]" onClick={goToreviewRules}>Add Review Rules</Button>
        </div>
    </>
  );
}