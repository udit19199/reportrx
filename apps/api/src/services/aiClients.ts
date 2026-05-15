import axios from "axios";
import { OpenAI } from "openai";
import { env } from "../config/env.js";

export type GenerateInput = {
  prompt: string;
  system: string;
  maxTokens?: number;
};

export type GenerateJsonInput = {
  prompt: string;
  system: string;
  maxTokens?: number;
};

export type EmbeddingInput = {
  inputs: string[];
};

export interface LlmProvider {
  generate(input: GenerateInput): Promise<string>;
  generateJson<T = unknown>(input: GenerateJsonInput): Promise<T>;
}

export interface EmbeddingProvider {
  embed(input: EmbeddingInput): Promise<number[][]>;
}

const toJson = <T>(text: string, errorMessage: string): T => {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(errorMessage);
  }
};

class OpenAiProvider implements LlmProvider, EmbeddingProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(input: GenerateInput): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: env.aiModel,
      temperature: 0.2,
      max_tokens: input.maxTokens ?? 1024,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    });

    return (response.choices[0].message.content ?? "").trim();
  }

  async generateJson<T = unknown>(input: GenerateJsonInput): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: env.aiModel,
      temperature: 0.2,
      max_tokens: input.maxTokens ?? 1024,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.prompt },
      ],
    });

    return toJson((response.choices[0].message.content ?? "").trim(), "OpenAI returned invalid JSON");
  }

  async embed(input: EmbeddingInput): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: env.embedModel,
      input: input.inputs,
    });
    return response.data.map((item) => item.embedding as number[]);
  }
}

class OllamaProvider implements LlmProvider, EmbeddingProvider {
  constructor(private readonly baseUrl: string) {}

  async generate(input: GenerateInput): Promise<string> {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model: env.aiModel,
      prompt: `${input.system}\n\n${input.prompt}`,
      stream: false,
    });

    return (response.data?.response ?? "").trim();
  }

  async generateJson<T = unknown>(input: GenerateJsonInput): Promise<T> {
    const response = await axios.post(`${this.baseUrl}/api/generate`, {
      model: env.aiModel,
      prompt: `${input.system}\n\n${input.prompt}`,
      stream: false,
      format: "json",
    });

    return toJson((response.data?.response ?? "").trim(), "Ollama returned invalid JSON");
  }

  async embed(input: EmbeddingInput): Promise<number[][]> {
    const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
      model: env.embedModel,
      input: input.inputs,
    });

    return (response.data?.embeddings ?? []) as number[][];
  }
}

export type AiClients = {
  llm: LlmProvider;
  embed: EmbeddingProvider;
};

export const createAiClients = (): AiClients => {
  const llmProvider = env.aiProvider.toLowerCase();
  const embedProvider = env.embedProvider.toLowerCase();

  if (llmProvider === "openai" && !env.openAiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");
  }
  if (embedProvider === "openai" && !env.openAiKey) {
    throw new Error("OPENAI_API_KEY is required when EMBED_PROVIDER=openai");
  }

  const llm = llmProvider === "ollama" ? new OllamaProvider(env.aiBaseUrl) : new OpenAiProvider(env.openAiKey);
  const embed =
    embedProvider === "ollama" ? new OllamaProvider(env.embedBaseUrl) : new OpenAiProvider(env.openAiKey);

  return { llm, embed };
};
