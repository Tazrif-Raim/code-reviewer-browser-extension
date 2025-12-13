import { Button } from "@/components/ui/button";

function App() {
  function goToReviwerApp() {
    const reviewerAppUrl = "https://byok-ai-code-reviewer.vercel.app";
    window.open(reviewerAppUrl, "_blank");
  }

  return (
    <>
      <div className="grid place-items-center h-36 w-96">
        <Button onClick={goToReviwerApp}>Go to Reviewer App</Button>
      </div>
    </>
  );
}

export default App;
