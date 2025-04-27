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

// Model ID constants
export const MODEL_GPT4O = 'gpt-4o'
export const MODEL_GPT4_1 = 'gpt-4.1'
export const MODEL_GPT_O4 = 'o4-mini'
export const MODEL_GEMINI_2_5 = 'gemini-2.5-flash-preview-04-17'
export const MODEL_CLAUDE_3 = 'claude-3.7-sonnet'
export const MODEL_QWQ = 'qwen-qwq-32b'
export const MODEL_DEEPSEEK = 'deepseek-r1-250120'
export const MODEL_GROK = 'grok-3-mini'

const copilot = createOpenAI({
  apiKey: process.env.COPILOT_API_KEY,
  baseURL: process.env.COPILOT_API_URL,
  compatibility: 'compatible',
})

const dear = createDeepSeek({
  apiKey: process.env.DEAR_API_KEY,
  baseURL: process.env.DEAR_API_URL,
})

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
})

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const ark = createDeepSeek({
  apiKey: process.env.ARK_API_KEY,
  baseURL: process.env.ARK_API_URL,
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
    [MODEL_QWQ]: wrapLanguageModel({
      middleware: extractReasoningMiddleware({
        tagName: 'think',
        startWithReasoning: true,
      }),
      model: groq(MODEL_QWQ),
    }),
    [MODEL_DEEPSEEK]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: ark(MODEL_DEEPSEEK),
    }),
    [MODEL_GROK]: wrapLanguageModel({
      middleware: defaultSettingsMiddleware({
        settings: {},
      }),
      model: dear(MODEL_GROK),
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
  MODEL_QWQ,
  MODEL_DEEPSEEK,
  MODEL_GROK,
] as const

export const ReasoningModelList = [
  MODEL_GPT_O4,
  MODEL_GEMINI_2_5,
  MODEL_QWQ,
  MODEL_DEEPSEEK,
  MODEL_GROK,
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
    name: 'DeepSeek',
    description: 'DeepSeek系列模型',
    models: [MODEL_DEEPSEEK],
  },
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
    name: 'Qwen',
    description: 'Qwen系列模型',
    models: [MODEL_QWQ],
  },
  {
    name: 'Grok',
    description: 'Grok系列模型',
    models: [MODEL_GROK],
  },
  {
    name: 'Google',
    description: 'Google Gemini系列',
    models: [MODEL_GEMINI_2_5],
  },
]

export const models: Record<modelID, string> = {
  [MODEL_DEEPSEEK]: 'DeepSeek R1',
  [MODEL_CLAUDE_3]: 'Claude 3.7 Sonnet',
  [MODEL_QWQ]: 'Qwen QWQ 32B',
  [MODEL_GPT4O]: 'GPT-4o',
  [MODEL_GPT4_1]: 'GPT-4.1',
  [MODEL_GPT_O4]: 'o4-mini',
  [MODEL_GEMINI_2_5]: 'Gemini 2.5 Flash',
  [MODEL_GROK]: 'Grok 3 Mini',
}
