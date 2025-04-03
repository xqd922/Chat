import {
  customProvider,
  defaultSettingsMiddleware,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai'

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_API_URL,
})

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
})

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

// custom provider with different model settings:
export const myProvider = customProvider({
  languageModels: {
    'deepseek-r1': wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
      }),
      model: deepseek('deepseek-ai/DeepSeek-R1'),
    }),
    'deepseek-r1-7B': wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
      }),
      model: deepseek('deepseek-ai/DeepSeek-R1-Distill-Qwen-7B'),
    }),
    'deepSeek-r1-distill-qwen-32B': wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
      }),
      model: deepseek('deepseek-ai/DeepSeek-R1-Distill-Qwen-32B'),
    }),
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
        startWithReasoning: true
      }),
      model: groq('qwen-qwq-32b'),
    }),
  },
})

export type modelID = Parameters<(typeof myProvider)['languageModel']>['0']
export const ModelList = [
  'deepseek-r1',
  'deepseek-r1-7B',
  'deepSeek-r1-distill-qwen-32B',
  'gpt-4o',
  'llama-3.3-70b-specdec',
  'qwen-qwq-32b',
] as const

export const DefaultModelID = 'qwen-qwq-32b'

export const models: Record<modelID, string> = {
  'deepseek-r1': 'DeepSeek-R1',
  'deepseek-r1-7B': 'DeepSeek-R1 Distill Qwen 7B',
  'deepSeek-r1-distill-qwen-32B': 'DeepSeek-R1 Distill Qwen 32B',
  'gpt-4o': 'GPT-4o',
  'llama-3.3-70b-specdec': 'Llama-3.3-70B SpecDec',
  'qwen-qwq-32b': 'Qwen-QWQ-32B',
}
