const OPENAI_API_KEY = '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';

export async function queryOpenAI(prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw error;
  }
} 