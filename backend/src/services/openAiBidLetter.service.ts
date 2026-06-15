import { OpenAI } from "openai";
const openai = new OpenAI();
export const analyzeBidContent = async (text: string): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `Convert this text into clean semantic HTML fragments. 
        Ensure do not miss any text exact copy all text with html content. 
        Identify table data and make as it is with table header and its values.
        also do not repeating watermark text, number. Use proper tags like <h1>, 
        <strong>, <address>, <table>, and <p>. Do NOT include <html>, <head>, <body> tags or markdown code blocks. 
        Output only the inner HTML content.`
      },
      { role: "user", content: text } 
    ],
  });

  const rawContent = response.choices[0]?.message?.content || "";
  return getCleanHtml(rawContent);
};

const getCleanHtml = (htmlStr: string): string => {
  let clean = htmlStr.replace(/```html|```/g, "").trim();

  if (clean.includes('<body>')) {
    const match = clean.match(/<body>([\s\S]*)<\/body>/i);
    
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return clean;
};
