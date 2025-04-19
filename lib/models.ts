import {
  customProvider,
  defaultSettingsMiddleware,
  wrapLanguageModel,
} from 'ai'

import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'

// Model ID constants
export const MODEL_GPT4O = 'gpt-4o'
export const MODEL_GPT4_1 = 'gpt-4.1'
export const MODEL_GPT_O4 = 'o4-mini'
export const MODEL_GEMINI_2_5 = 'gemini-2.5-flash-preview-04-17'
export const MODEL_CLAUDE_3 = 'claude-3.7-sonnet'

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
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
    [MODEL_GPT_O4]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: copilot(MODEL_GPT_O4),
    }),
    [MODEL_CLAUDE_3]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: copilot(MODEL_CLAUDE_3),
    }),
    [MODEL_GEMINI_2_5]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: google(MODEL_GEMINI_2_5),
    }),
  },
})

export type modelID = Parameters<(typeof myProvider)['languageModel']>['0']
export const ModelList = [
  MODEL_GPT4O,
  MODEL_GPT4_1,
  MODEL_GEMINI_2_5,
  MODEL_GPT_O4,
  MODEL_CLAUDE_3,
] as const

export const ReasoningModelList = [
  MODEL_GPT_O4,
  MODEL_GEMINI_2_5,
]

export const ReasoningConfigurableModelList = [MODEL_GEMINI_2_5]

export const DefaultModelID = MODEL_GEMINI_2_5

// 定义模型分组类型
export type ModelGroup = {
  name: string
  description?: string
  models: modelID[]
}

// 按提供商分组
export const ModelGroups: ModelGroup[] = [
  {
    name: 'Copilot',
    description: 'GPT系列模型',
    models: [MODEL_GPT4O, MODEL_GPT4_1, MODEL_GPT_O4],
  },
  {
    name: 'Anthropic',
    description: 'Anthropic系列模型',
    models: [MODEL_CLAUDE_3],
  },
  {
    name: 'Google',
    description: 'Google Gemini系列',
    models: [MODEL_GEMINI_2_5],
  },
]

export const models: Record<modelID, string> = {
  [MODEL_CLAUDE_3]: 'Claude 3.7 Sonnet',
  [MODEL_GPT4O]: 'GPT-4o',
  [MODEL_GPT4_1]: 'GPT-4.1',
  [MODEL_GPT_O4]: 'o4-mini',
  [MODEL_GEMINI_2_5]: 'Gemini 2.5 Flash',
}
