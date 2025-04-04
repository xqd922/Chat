import {
  customProvider,
  defaultSettingsMiddleware,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai'

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

// Model ID constants
const MODEL_GPT4O = 'gpt-4o'
const MODEL_LLAMA = 'llama-3.3-70b-specdec'
const MODEL_QWEN = 'qwen-qwq-32b'
const MODEL_QUASAR = 'openrouter/quasar-alpha'
const MODEL_DEEPSEEK_R1 = 'deepseek-r1-250120'
const MODEL_DEEPSEEK_V3 = 'deepseek-v3-250324'
const MODEL_GEMINI = 'gemini-2.5-pro'

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
})

const ark = createDeepSeek({
  apiKey: process.env.ARK_API_KEY,
  baseURL: process.env.ARK_API_URL,
})

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
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
    [MODEL_LLAMA]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: groq(MODEL_LLAMA),
    }),
    [MODEL_QWEN]: wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
        startWithReasoning: true,
      }),
      model: groq(MODEL_QWEN),
    }),
    [MODEL_QUASAR]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: openrouter(MODEL_QUASAR),
    }),
    [MODEL_DEEPSEEK_R1]: wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
      }),
      model: ark(MODEL_DEEPSEEK_R1),
    }),
    [MODEL_DEEPSEEK_V3]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: ark(MODEL_DEEPSEEK_V3),
    }),
  },
})

export type modelID = Parameters<(typeof myProvider)['languageModel']>['0']
export const ModelList = [
  MODEL_GPT4O,
  MODEL_LLAMA,
  MODEL_QWEN,
  MODEL_QUASAR,
  MODEL_DEEPSEEK_R1,
  MODEL_DEEPSEEK_V3,
  MODEL_GEMINI,
] as const

export const ReasoningModelList = [MODEL_QWEN, MODEL_DEEPSEEK_R1] as const

export const DefaultModelID = MODEL_QWEN

export const models: Record<modelID, string> = {
  [MODEL_DEEPSEEK_R1]: 'DeepSeek R1',
  [MODEL_DEEPSEEK_V3]: 'DeepSeek V3',
  [MODEL_GPT4O]: 'GPT-4o',
  [MODEL_LLAMA]: 'Llama-3.3-70B SpecDec',
  [MODEL_QWEN]: 'Qwen-QWQ-32B',
  [MODEL_QUASAR]: 'Quasar Alpha',
}
