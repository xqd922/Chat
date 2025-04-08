import { type modelID, myProvider } from '@/lib/models'
import { auth } from '@clerk/nextjs/server'
import {
  type Message,
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
  await auth.protect()

  const {
    messages,
    selectedModelId,
    isSearchEnabled,
  }: {
    messages: Array<Message>
    selectedModelId: modelID
    isReasoningEnabled: boolean
    isSearchEnabled: boolean
  } = await request.json()

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // Default system prompt
      let systemPrompt = 'you are a friendly assistant.'
      let searchResults = []

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
        const searchAnnotation = {
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
      const result = streamText({
        system: systemPrompt,
        model: myProvider.languageModel(selectedModelId),
        messages,
        experimental_transform: smoothStream({
          delayInMs: 20, // optional: defaults to 10ms
          chunking: 'line', // optional: defaults to 'word'
        }),
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
