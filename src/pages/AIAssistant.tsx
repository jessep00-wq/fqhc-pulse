import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, User, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Quality Assistant. Describe your failing UDS metric or quality challenge, and I'll help you identify the root cause and recommend an action plan.\n\nYou can start by telling me which measure is underperforming, or use one of the suggestion chips below.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (text?: string) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-root-cause", {
        body: {
          uds_measure: msg,
          context: messages
            .filter((m) => m.id !== "welcome")
            .slice(-10)
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n"),
        },
      });

      if (error) throw error;

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data?.analysis || "Unable to generate analysis. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("AI error:", err);
      const status = err?.status || err?.code;
      if (status === 429) {
        toast.error("Rate limited — please wait a moment and try again.");
      } else if (status === 402) {
        toast.error("AI credits exhausted. Please add funds in Settings.");
      } else {
        toast.error("Failed to get AI response. Please try again.");
      }
      // Add error message inline
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I couldn't generate an analysis right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
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
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
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
          {loading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
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
            <Button size="icon" className="h-auto" onClick={() => handleSend()} disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
