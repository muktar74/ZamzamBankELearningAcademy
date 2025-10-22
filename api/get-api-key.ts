
// This file is a Vercel Serverless Function.
// It will be hosted at the endpoint /api/get-api-key
// It securely accesses the API_KEY from the Vercel environment variables on the server-side.

// Define basic types for the request and response to ensure compatibility.
interface VercelRequest {
  // We don't need any request properties for this function
}

interface VercelResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

export default function handler(request: VercelRequest, response: VercelResponse) {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    return response.status(500).json({ 
      error: 'API key is not configured on the server. Please set the API_KEY environment variable in your Vercel project settings.' 
    });
  }

  // Only return the key, nothing else.
  return response.status(200).json({ apiKey: apiKey });
}
