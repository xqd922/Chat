import type { InfoAnnotation } from '@/components/message-part/message'
import { getChatSession, saveMessages } from '@/lib/message-storage'
import { MODEL_GEMINI_2_5, MODEL_QWQ, type modelID, myProvider } from '@/lib/models'
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import { auth } from '@clerk/nextjs/server'
import {
  type Message,
  appendClientMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai'
import type { NextRequest } from 'next/server'

// New function to call Tavily API
async function fetchTavilySearch(query: string) {
  try {
    // Get current date in YYYY-MM-DD format
    const today = new Date()
    const formattedDate = today.toISOString().split('T')[0]

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `today is ${formattedDate} \r\n ${query}`,
        max_results: 5,
        exclude_domains: [],
        api_key: process.env.TAVILY_API_KEY,
      }),
    })

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Error fetching from Tavily:', error)
    return []
  }
}

function getIconUrl(urlPath: string) {
  const url = new URL(urlPath)
  const hostname = url.hostname
  const iconUrl = `https://favicon.im/${hostname}`
  return iconUrl
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const {
    message,
    selectedModelId,
    isSearchEnabled,
    isReasoningEnabled,
    sessionId,
  }: {
    message: Message
    selectedModelId: modelID
    sessionId: string
    isReasoningEnabled: boolean
    isSearchEnabled: boolean
  } = await request.json()

  const session = await getChatSession(userId, sessionId)
  if (!session) {
    return new Response('Session not found', { status: 404 })
  }
  const messages = appendClientMessage({
    messages: session.messages,
    message,
  })

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Default system prompt
      let systemPrompt = 'you are a friendly assistant.'
      let searchResults = []
      let searchAnnotation = {}

      if (isSearchEnabled) {
        dataStream.writeData({
          type: 'fetch',
          status: 'pending',
        })

        // Get the user's latest message
        const lastMessage = messages[messages.length - 1]
        const userQuery = lastMessage.role === 'user' ? lastMessage.content : ''

        // Call Tavily API
        dataStream.writeData({
          type: 'fetch',
          status: 'Searching with Tavily API...',
        })

        searchResults = await fetchTavilySearch(userQuery)

        // Create annotation from search results
        searchAnnotation = {
          type: 'search_results',
          title: 'Search Results',
          results: searchResults.map(
            (result: { title: string; url: string; content: string }) => ({
              title: result.title,
              url: result.url,
              content: result.content,
              icon_url: getIconUrl(result.url),
            })
          ),
        }

        dataStream.writeData({
          type: 'fetch',
          status: 'Success',
        })

        // Write the search results as an annotation
        dataStream.writeMessageAnnotation(searchAnnotation)

        // If we have search results, update the system prompt
        if (searchResults.length > 0) {
          systemPrompt = `Please answer the question based on the reference materials 
## Citation Rules: 
- Please cite the context at the end of sentences when appropriate. 
- Please use the format of citation number [number] to reference the context in corresponding parts of your answer. 
- If a sentence comes from multiple contexts, please list all relevant citation numbers, e.g., [1][2][3][4]. 
Remember not to group citations at the end but list them in the corresponding parts of your answer. 
## My question is: ${userQuery}
## Reference Materials: \`\`\`json ${JSON.stringify(searchResults)} \`\`\` 
Please respond in the same language as the user's question.`
        }
      }

      const startTime = Date.now()
      let elapsedTime = 0

      const result = streamText({
        system: systemPrompt,
        model: myProvider.languageModel(selectedModelId),
        providerOptions:
          selectedModelId === MODEL_GEMINI_2_5
            ? {
                google: {
                  thinkingConfig: {
                    thinkingBudget: isReasoningEnabled ? 1024 : 0,
                  },
                } satisfies GoogleGenerativeAIProviderOptions,
              }
            : {},
        messages,
        experimental_transform: selectedModelId === MODEL_QWQ ? smoothStream({
          delayInMs: 10, // optional: defaults to 10ms
          chunking: 'line', // optional: defaults to 'word'
        }) : undefined,
        onChunk: () => {
          if (elapsedTime === 0) {
            elapsedTime = Date.now() - startTime
          }
        },
        onFinish: async ({ response }) => {
          const userMessage = messages[messages.length - 1]
          const [, assistantMessage] = appendResponseMessages({
            messages: [userMessage],
            responseMessages: response.messages,
          })

          if (isSearchEnabled) {
            assistantMessage.annotations = [searchAnnotation]
          }

          const infoAnnotation = {
            type: 'info',
            model: selectedModelId,
            waiting_time: elapsedTime,
            is_thinking: isReasoningEnabled,
          } satisfies InfoAnnotation

          assistantMessage.annotations = [
            ...(assistantMessage.annotations || []),
            infoAnnotation,
          ]
          dataStream.writeMessageAnnotation(infoAnnotation)

          // 添加到session消息中
          session.messages = messages
          session.messages.push(assistantMessage)
          // Save the updated session
          await saveMessages(userId, sessionId, session.messages)
        },
      })
      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      })
    },
    onError: (error) => {
      // Error messages are masked by default for security reasons.
      // If you want to expose the error message to the client, you can do so here:
      return error instanceof Error ? error.message : String(error)
    },
  })
}
