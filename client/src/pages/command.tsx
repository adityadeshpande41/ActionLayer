import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Terminal,
  Mic,
  Send,
  Zap,
  CheckCircle2,
  Pencil,
  Loader2,
} from "lucide-react";
import { commandSuggestions, commandResponse } from "@/lib/mock-data";

export default function Command() {
  const { toast } = useToast();
  const [command, setCommand] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>(
    Object.fromEntries(commandResponse.actions.map((a) => [a.id, a.selected]))
  );

  const handleSend = (text?: string) => {
    const cmd = text || command;
    if (!cmd.trim()) return;
    setCommand(cmd);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowResponse(true);
    }, 1200);
  };

  const handleVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setCommand("What are my top risks this week?");
      toast({ title: "Voice captured", description: "Command recognized. Press Send to execute." });
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full">
      <AppHeader title="Command Mode" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-3.5 w-3.5" />
              Ask ActionLayer
            </div>
            <p className="text-sm text-muted-foreground">
              Type a command or use voice input to interact with your project data.
            </p>
          </div>

          <Card data-testid="card-command-input">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Type a command... e.g. 'What are my top risks?'"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                  data-testid="input-command"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleVoice}
                  disabled={isListening}
                  data-testid="button-voice"
                >
                  {isListening ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={() => handleSend()} disabled={isProcessing} data-testid="button-send-command">
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {isListening && (
                <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                  <Mic className="h-4 w-4" />
                  Listening... Speak your command.
                </div>
              )}
              <div className="flex flex-wrap gap-2" data-testid="command-suggestions">
                {commandSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(suggestion)}
                    data-testid={`chip-suggestion-${suggestion.slice(0, 10).replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {isProcessing && (
            <Card>
              <CardContent className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Processing your command...</span>
              </CardContent>
            </Card>
          )}

          {showResponse && !isProcessing && (
            <div className="space-y-4">
              <Card data-testid="card-interpreted-intent">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">Interpreted Intent</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline" data-testid="badge-intent">
                    {commandResponse.intent}
                  </Badge>
                </CardContent>
              </Card>

              <Card data-testid="card-proposed-plan">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Proposed Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {commandResponse.plan.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-medium shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card data-testid="card-proposed-actions">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Proposed Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {commandResponse.actions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center gap-3 p-3 rounded-md bg-accent/30"
                      data-testid={`command-action-${action.id}`}
                    >
                      <Checkbox
                        checked={selectedActions[action.id]}
                        onCheckedChange={(checked) =>
                          setSelectedActions({ ...selectedActions, [action.id]: !!checked })
                        }
                      />
                      <span className="text-sm flex-1">{action.action}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button
                      className="gap-1.5"
                      onClick={() => toast({ title: "Approved", description: "Actions queued for execution." })}
                      data-testid="button-approve-command"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" className="gap-1.5" data-testid="button-edit-command">
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!showResponse && !isProcessing && (
            <div className="text-center py-12">
              <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                No commands yet. Try asking something or pick a suggestion above.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 italic">
                "Great PMs don't just track work \u2014 they command it."
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
