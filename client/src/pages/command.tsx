import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { command } from "@/lib/api";
import { Send, Loader2, Sparkles, ArrowRight, Mic, MicOff } from "lucide-react";

const SUGGESTED_COMMANDS = [
  "What are my top risks this week?",
  "Generate weekly status update",
  "Create Jira stories from last run",
  "What changed since last week?",
  "Who is blocked and why?",
];

export default function Command() {
  const { toast } = useToast();
  const [commandText, setCommandText] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<Array<{ command: string; result: any }>>([]);

  const handleExecute = async (cmd?: string) => {
    const commandToExecute = cmd || commandText;
    if (!commandToExecute.trim()) return;

    setIsExecuting(true);
    setCommandText("");
    
    try {
      const response = await command.execute({
        command: commandToExecute,
        projectId: "default-project", // TODO: Get from context
      });
      
      setResult(response);
      setHistory([{ command: commandToExecute, result: response }, ...history]);
      toast({ title: "Command Executed", description: "Response generated successfully." });
    } catch (error: any) {
      toast({ title: "Command Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Not Supported",
        description: "Voice input is not supported in your browser. Try Chrome or Edge.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: "Listening...", description: "Speak your command now" });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCommandText(transcript);
      toast({ title: "Got it!", description: `Heard: "${transcript}"` });
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      toast({
        title: "Voice Input Error",
        description: event.error === 'no-speech' ? "No speech detected" : "Could not recognize speech",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Command Mode" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ask ActionLayer
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Use natural language or voice to query your projects, generate reports, or execute actions
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your command or use voice input..."
                value={commandText}
                onChange={(e) => setCommandText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isExecuting && handleExecute()}
                disabled={isExecuting || isListening}
                className="flex-1"
              />
              <Button
                onClick={handleVoiceInput}
                disabled={isExecuting || isListening}
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                title="Voice input"
              >
                {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button onClick={() => handleExecute()} disabled={isExecuting || !commandText.trim() || isListening} className="gap-2">
                {isExecuting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isExecuting ? "Executing..." : "Send"}
              </Button>
            </div>

            {isListening && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <Mic className="h-4 w-4 text-destructive animate-pulse" />
                <span className="text-sm text-destructive font-medium">Listening... Speak now</span>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Suggested commands:</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_COMMANDS.map((cmd, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecute(cmd)}
                    disabled={isExecuting || isListening}
                    className="text-xs"
                  >
                    {cmd}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {result.intent && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Intent</p>
                  <Badge variant="secondary">{result.intent}</Badge>
                </div>
              )}

              {result.plan && result.plan.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Plan</p>
                  <ol className="space-y-1">
                    {result.plan.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-primary font-medium">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {result.response && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Response</p>
                  <div className="rounded-md bg-accent/30 p-4">
                    <p className="text-sm whitespace-pre-wrap">{result.response}</p>
                  </div>
                </div>
              )}

              {result.actions && result.actions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Proposed Actions</p>
                  <div className="space-y-2">
                    {result.actions.map((action: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-md bg-accent/30">
                        <ArrowRight className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{action.action}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">{action.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Command History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.map((item, i) => (
                <div key={i} className="border-b last:border-0 pb-3 last:pb-0">
                  <p className="text-sm font-medium mb-1">{item.command}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.result.intent || "Executed"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
