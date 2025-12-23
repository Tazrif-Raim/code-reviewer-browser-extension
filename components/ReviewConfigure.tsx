import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ReviewConfigurationForm } from "./ReviewConfigurationForm/ReviewConfigurationForm";

export function ReviewConfigure() {
  const [isOpenConfigure, setIsOpenConfigure] = useState(false);

  return (
    <div className="p-4">
      <Accordion type="single" value={isOpenConfigure ? "item-1" : ""} onValueChange={(value) => setIsOpenConfigure(value === "item-1")} collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger onClick={() => setIsOpenConfigure(!isOpenConfigure)} className="border p-4 hover:no-underline">
            {isOpenConfigure ? "Close" : "Open"} Review Configuration
          </AccordionTrigger>
          <AccordionContent className="border p-4 rounded-md mt-4">
            <ReviewConfigurationForm isOpenConfigure={isOpenConfigure} setIsOpenConfigure={setIsOpenConfigure} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
