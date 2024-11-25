
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prompts } from "../../constants/constants.js";
import { handleResponseParsing } from "../../utils/helperFunctions.js";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


export const getChatResponse = async (message) => {
  const result = await model.generateContent(
    `${prompts}\n\nUser query:${message}`
  );
  const response = await result.response;
  const text = response.text()
  return handleResponseParsing(text);
};

