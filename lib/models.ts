import {
  customProvider,
  defaultSettingsMiddleware,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai'

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// Model ID constants
const MODEL_GPT4O = 'gpt-4o'
const MODEL_GPT4_1 = 'gpt-4.1'
const MODEL_QWEN = 'qwen-qwq-32b'
const MODEL_DEEPSEEK_R1 = 'DeepSeek-R1'
const MODEL_DEEPSEEK_V3 = 'DeepSeek-V3-0324'
const MODEL_GEMINI_2 = 'gemini-2.0-flash'
const MODEL_GEMINI_PRO = 'gemini-2.5-pro-preview-03-25'

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
})

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const githubDeepseek = createDeepSeek({
  apiKey: process.env.GITHUB_API_KEY,
  baseURL: process.env.GITHUB_API_URL,
})

// custom provider with different model settings:
export const myProvider = customProvider({
  languageModels: {
    [MODEL_GPT4O]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {
          temperature: 0.8,
        },
      }),
      model: copilot(MODEL_GPT4O),
    }),
    [MODEL_GPT4_1]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: copilot(MODEL_GPT4_1),
    }),
    [MODEL_GEMINI_PRO]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: copilot(MODEL_GEMINI_PRO),
    }),
    [MODEL_QWEN]: wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
        startWithReasoning: true,
      }),
      model: groq(MODEL_QWEN),
    }),
    [MODEL_DEEPSEEK_R1]: wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
      }),
      model: githubDeepseek(MODEL_DEEPSEEK_R1),
    }),
    [MODEL_DEEPSEEK_V3]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: githubDeepseek(MODEL_DEEPSEEK_V3),
    }),
    [MODEL_GEMINI_2]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: google(MODEL_GEMINI_2),
    }),
  },
})

export type modelID = Parameters<(typeof myProvider)['languageModel']>['0']
export const ModelList = [
  MODEL_GPT4O,
  MODEL_GPT4_1,
  MODEL_QWEN,
  MODEL_DEEPSEEK_R1,
  MODEL_DEEPSEEK_V3,
  MODEL_GEMINI_2,
  MODEL_GEMINI_PRO,
] as const

export const ReasoningModelList = [
  MODEL_QWEN,
  MODEL_DEEPSEEK_R1,
  MODEL_GEMINI_PRO,
]

export const DefaultModelID = MODEL_GPT4_1

export const models: Record<modelID, string> = {
  [MODEL_DEEPSEEK_R1]: 'DeepSeek R1',
  [MODEL_DEEPSEEK_V3]: 'DeepSeek V3',
  [MODEL_GPT4O]: 'GPT-4o',
  [MODEL_GPT4_1]: 'GPT-4.1',
  [MODEL_QWEN]: 'Qwen-QWQ-32B',
  [MODEL_GEMINI_2]: 'Gemini 2.0 Flash',
  [MODEL_GEMINI_PRO]: 'Gemini 2.5 Pro Preview',
}
