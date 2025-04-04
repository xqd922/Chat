import {
  customProvider,
  defaultSettingsMiddleware,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai'

import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
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
    'gpt-4o': wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {
          temperature: 0.8,
        },
      }),
      model: copilot('gpt-4o'),
    }),
    'llama-3.3-70b-specdec': wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: groq('llama-3.3-70b-specdec'),
    }),
    'qwen-qwq-32b': wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
        startWithReasoning: true,
      }),
      model: groq('qwen-qwq-32b'),
    }),
    'openrouter/quasar-alpha': wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: openrouter('openrouter/quasar-alpha'),
    }),
  },
})

export type modelID = Parameters<(typeof myProvider)['languageModel']>['0']
export const ModelList = [
  'gpt-4o',
  'llama-3.3-70b-specdec',
  'qwen-qwq-32b',
  'openrouter/quasar-alpha',
] as const

export const ReasoningModelList = ['qwen-qwq-32b']

export const DefaultModelID = 'qwen-qwq-32b'

export const models: Record<modelID, string> = {
  'gpt-4o': 'GPT-4o',
  'llama-3.3-70b-specdec': 'Llama-3.3-70B SpecDec',
  'qwen-qwq-32b': 'Qwen-QWQ-32B',
  'openrouter/quasar-alpha': 'Quasar Alpha',
}
