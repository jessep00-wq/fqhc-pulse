import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Clinical documentation issue",
  "Patient outreach issue",
  "Referral loop failure",
  "Scheduling & access issue",
  "Care coordination gap",
];

const MOCK_RESPONSES: Record<string, string> = {
  default: `Based on common FQHC quality patterns, here's my analysis:

**Potential Root Causes:**
1. **Documentation Gap** — The measure may not be failing clinically, but rather the documentation isn't capturing the care being delivered in the required structured fields.
2. **Workflow Bottleneck** — Check if the screening/intervention is part of the MA rooming workflow or if it relies solely on provider action during the visit.
3. **Patient Population Factor** — Review your Azara DRVS data to see if the gap is concentrated in a specific payer mix, age group, or site.

**Recommended Next Steps:**
- Run a chart audit on 20 random patients in the denominator
- Compare athenaOne template fields against UDS reporting logic
- Schedule a workflow observation day with your MA team`,
  "Clinical documentation issue": `**Clinical Documentation Root Cause Analysis:**

This is one of the most common issues at FQHCs. Here's what I typically find:

1. **Structured vs. Free-Text** — Providers are documenting the intervention in progress notes (free text) but not in the structured fields that Azara DRVS pulls from. Solution: Update your athenaOne templates to include required structured data elements.

2. **Code Mapping Errors** — The CPT/ICD codes being used may not align with the UDS measure specifications. Cross-reference your billing codes against the UDS 2024 manual.

3. **Historical Data Not Imported** — If patients received care externally, ensure your Health Information Exchange (HIE) data is flowing into the correct fields.

**Action Plan:** Start with an athenaOne template audit for this specific measure.`,
  "Patient outreach issue": `**Patient Outreach Root Cause Analysis:**

Low outreach effectiveness is often multi-factorial at FQHCs:

1. **Contact Information** — Many FQHC patients have frequently changing phone numbers. Implement a "verify contact info" step at every visit.

2. **Language Barriers** — Ensure outreach materials are available in your top 3 patient languages. Check if your outreach staff mirrors your patient demographics.

3. **Outreach Timing** — Analyze when your patients are most responsive. Many working patients can only respond during evening hours.

4. **No-Show Patterns** — Cross-reference your no-show data with the patients in your care gap list. You may need to implement a different engagement strategy for chronic no-show patients.

**Action Plan:** Deploy a multi-channel outreach strategy: text message first, phone call follow-up, then mailed letter.`,
  "Referral loop failure": `**Referral Loop Failure Analysis:**

This is critical for screening measures like CMS124 and CMS125. Here's the breakdown:

1. **Order Placed but Not Completed** — Track the referral completion rate in athenaOne. If orders are placed but patients don't follow through, you need a care coordinator follow-up workflow.

2. **Results Not Returned** — Even when patients complete the referral, results may not flow back to the ordering provider. Establish a closed-loop referral tracking process.

3. **External Provider Data** — If patients get screenings done at external facilities, those results may not be captured. Leverage your HIE connection and train front desk to ask about external care at check-in.

**Action Plan:** Implement a weekly "open referrals" scrub with your care coordination team.`,
};

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Quality Assistant. Describe your failing UDS metric or quality challenge, and I'll help you identify the root cause and recommend an action plan.\n\nYou can start by telling me which measure is underperforming, or use one of the suggestion chips below.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
    const response = MOCK_RESPONSES[msg] || MOCK_RESPONSES.default;
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: response };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <div className="p-6 h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Quality Assistant
        </h1>
        <p className="text-muted-foreground">Root cause analysis powered by FQHC quality intelligence</p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className={`rounded-lg p-3 max-w-[80%] text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}>
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </CardContent>

        <div className="border-t p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => handleSend(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your failing metric..."
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button size="icon" className="h-auto" onClick={() => handleSend()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
