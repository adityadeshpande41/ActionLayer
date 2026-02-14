import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface IntakeQuestion {
  id: string;
  question: string;
  context?: string;
  required: boolean;
}

export const intakeQuestions: IntakeQuestion[] = [
  {
    id: "meeting_type",
    question: "What type of meeting or conversation was this?",
    context: "e.g., Client call, Internal standup, Planning session, Incident review",
    required: true,
  },
  {
    id: "participants",
    question: "Who were the key participants?",
    context: "Names and roles of people involved",
    required: true,
  },
  {
    id: "main_topic",
    question: "What was the main topic or agenda?",
    context: "Brief description of what was discussed",
    required: true,
  },
  {
    id: "decisions",
    question: "Were any decisions made? If so, what were they?",
    context: "Include who owns each decision if known",
    required: false,
  },
  {
    id: "risks",
    question: "Were any risks, concerns, or blockers raised?",
    context: "Include severity and potential impact if discussed",
    required: false,
  },
  {
    id: "action_items",
    question: "What action items or follow-ups came out of this?",
    context: "Include owners and deadlines if mentioned",
    required: false,
  },
  {
    id: "dependencies",
    question: "Were there any dependencies or things blocked by other work?",
    context: "What's waiting on what, and who owns it",
    required: false,
  },
  {
    id: "additional",
    question: "Anything else important that should be captured?",
    context: "Commitments, deadlines, escalations, etc.",
    required: false,
  },
];

export interface IntakeAnswers {
  [key: string]: string;
}

export async function synthesizeIntakeToContext(
  answers: IntakeAnswers
): Promise<string> {
  const prompt = `You are reconstructing a meeting context from PM intake answers. 
Create a coherent narrative that captures the essence of the conversation.

Intake Answers:
${Object.entries(answers)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

Generate a structured meeting summary that reads like a transcript summary, including:
- Meeting context and participants
- Key discussion points
- Decisions made
- Risks and concerns
- Action items
- Dependencies

Keep it factual and based only on the provided answers. Do not invent details.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return completion.choices[0].message.content || "";
}

export async function generateFollowUpQuestion(
  answers: IntakeAnswers,
  context: string
): Promise<string | null> {
  const prompt = `You are helping a PM capture meeting details. Based on their answers so far, identify if there's a critical gap.

Current answers:
${Object.entries(answers)
  .map(([key, value]) => `${key}: ${value}`)
  .join("\n")}

If there's an important missing detail (like a decision without an owner, or a risk without mitigation), 
ask ONE specific follow-up question. If everything seems complete, return "COMPLETE".

Return just the question or "COMPLETE".`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 100,
  });

  const response = completion.choices[0].message.content?.trim() || "";
  return response === "COMPLETE" ? null : response;
}
