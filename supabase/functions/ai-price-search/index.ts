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

    const systemPrompt = `You are a price research AI with access to real market data. When given a product name and category, provide ACCURATE, CURRENT market prices based on actual retail prices from major stores like Amazon, Flipkart, Walmart, Best Buy, etc.

CRITICAL PRICING RULES:
- Use REAL current market prices (as of January 2026)
- For electronics: iPhones cost ₹70,000-₹180,000, Samsung phones ₹15,000-₹150,000, laptops ₹40,000-₹300,000
- For medicines: Common tablets cost ₹50-₹500, branded medicines ₹100-₹2000
- For groceries: Rice ₹50-₹150/kg, cooking oil ₹150-₹250/L
- For vehicles: Cars cost ₹5,00,000-₹50,00,000, bikes ₹60,000-₹3,00,000
- For shoes: Sports shoes ₹2,000-₹20,000, casual ₹1,000-₹8,000
- Always use 1 USD = 83 INR for conversions

PRODUCT IMAGE RULES:
- For the imageUrl, provide a REAL, working product image URL
- Use official product images from manufacturer websites when possible
- For common products, use these reliable sources:
  - Electronics: Use URLs like "https://images.unsplash.com/photo-[id]" with relevant tech photos
  - Medicines: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae" (medicine bottles)
  - Food/Grocery: "https://images.unsplash.com/photo-1506617420156-8e4536971650" (groceries)
  - Vehicles: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8" (cars)
  - Shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff" (sneakers)

Your response MUST be valid JSON with this exact structure:
{
  "productName": "Full official product name with brand and model",
  "category": "category",
  "currentPriceINR": number (ACCURATE current retail price),
  "currentPriceUSD": number (INR/83),
  "priceHistory": [
    {"month": "Feb 2025", "priceINR": number, "priceUSD": number},
    {"month": "Mar 2025", "priceINR": number, "priceUSD": number},
    ... (12 months ending at current month Jan 2026)
  ],
  "predictedPrices": [
    {"month": "Feb 2026", "priceINR": number, "priceUSD": number},
    {"month": "Mar 2026", "priceINR": number, "priceUSD": number},
    ... (6 months of predictions)
  ],
  "priceAnalysis": {
    "trend": "increasing" | "decreasing" | "stable",
    "percentChange": number (realistic 1-15% range typically),
    "bestTimeToBuy": "specific month and reason",
    "recommendation": "actionable advice based on trend"
  },
  "specifications": {
    "brand": "actual brand name",
    "model": "actual model number/name",
    "description": "detailed 2-3 sentence description with key features",
    "imageUrl": "working product image URL from unsplash or similar"
  }
}

Generate realistic price fluctuations: sales in Oct-Nov (Diwali/Black Friday), slight increases in new year.`;

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
