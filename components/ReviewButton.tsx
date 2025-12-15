import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { EMessageTypes } from "@/lib/enums";

interface ReviewButtonProps {
  prNumber: string;
  prOwnerName: string;
  prRepoName: string;
  prTitle: string;
}

export default function ReviewButton({
  prNumber,
  prOwnerName,
  prRepoName,
  prTitle,
}: ReviewButtonProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "reviewed" | "error"
  >("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setStatus("loading");

    try {
      const response = await browser.runtime.sendMessage({
        type: EMessageTypes.TRIGGER_REVIEW,
        payload: { prNumber, prOwnerName, prRepoName, prTitle },
      });
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  useEffect(() => {
    const listener = (message: any) => {
      if (
        message.type === EMessageTypes.UPDATE_UI &&
        message.payload.prNumber === prNumber
      ) {
        setStatus(message.payload.status);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, [prNumber]);

  if (status === "reviewed") {
    return <span className="Label Label--success text-small">Reviewed</span>;
  }

  return (
    <Button
      className={`btn btn-sm ${status === "loading" ? "disabled" : ""}`}
      onClick={handleClick}
      disabled={status === "loading"}
    >
      {status === "loading" ? <span>Processing...</span> : <>Review with AI</>}
    </Button>
  );
}
