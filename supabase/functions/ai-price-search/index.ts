import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a price research AI assistant. When given a product name and category, you must respond with accurate, realistic market price data in JSON format.

Your response MUST be valid JSON with this exact structure:
{
  "productName": "exact product name",
  "category": "category",
  "currentPriceINR": number,
  "currentPriceUSD": number,
  "priceHistory": [
    {"month": "Jan 2024", "priceINR": number, "priceUSD": number},
    {"month": "Feb 2024", "priceINR": number, "priceUSD": number},
    ... (12 months of data)
  ],
  "predictedPrices": [
    {"month": "Jul 2025", "priceINR": number, "priceUSD": number},
    {"month": "Aug 2025", "priceINR": number, "priceUSD": number},
    ... (6 months prediction)
  ],
  "priceAnalysis": {
    "trend": "increasing" | "decreasing" | "stable",
    "percentChange": number,
    "bestTimeToBuy": "string",
    "recommendation": "string"
  },
  "specifications": {
    "brand": "string",
    "model": "string",
    "description": "string",
    "imageUrl": "placeholder image url"
  }
}

Use realistic prices based on current market data. For INR to USD conversion, use approximately 83 INR = 1 USD.
Generate 12 months of historical data and 6 months of future predictions.
Make price fluctuations realistic based on the product category and market trends.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Find price information for: "${productName}" in category: "${category}". Provide comprehensive price data including historical prices, current price, and future predictions.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let priceData;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      priceData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse price data");
    }

    return new Response(JSON.stringify(priceData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-price-search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
