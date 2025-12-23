export const sendMessageToDify = async (
  query: string,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
) => {
  const apiUrl = import.meta.env.VITE_DIFY_API_URL;
  const apiKey = import.meta.env.VITE_DIFY_API_KEY;

  if (!apiUrl || !apiKey) {
    onError(new Error("Missing Dify API configuration. Please check .env file."));
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/chat-messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: "streaming",
        conversation_id: "", // Empty to start new conversation or manage state if needed
        user: "user-123", // Unique identifier for the user
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const block of lines) {
        // SSE blocks can contain multiple lines (e.g., "event: ...\ndata: ...")
        const blockLines = block.split("\n");

        for (const line of blockLines) {
          // We only care about lines starting with "data:"
          if (line.startsWith("data:")) {
            const messageLine = line.slice(5).trim(); // Remove "data:"

            if (messageLine === "[DONE]") {
              onComplete();
              return;
            }

            try {
              const data = JSON.parse(messageLine);
              // Handle different event types from the parsed JSON event field
              if (data.event === "message" || data.event === "agent_message") {
                const text = data.answer;
                if (text) {
                  console.log("%c[Dify Chunk]", "color: #00ff00", text);
                  onChunk(text);
                }
              } else if (data.event === "error") {
                throw new Error(data.message || "Unknown error from Dify");
              }
            } catch (e) {
              console.warn("Error parsing SSE message:", e, messageLine);
            }
          }
        }
      }
    }

    // Process remaining buffer
    if (buffer.length > 0) {
      const messageLine = buffer.replace(/^data: /, "").trim();
      if (messageLine !== "[DONE]") {
        try {
          const data = JSON.parse(messageLine);
          if (data.event === "message" || data.event === "agent_message") {
            if (data.answer) onChunk(data.answer);
          }
        } catch (e) {
          // ignore incomplete final chunk
        }
      }
    }
    onComplete();

  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error occurred"));
  }
};
