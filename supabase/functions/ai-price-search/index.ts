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

    const systemPrompt = `You are a price research AI. ALWAYS respond with valid JSON for ANY product the user asks about. Never refuse or explain - just provide the data.

PRICING REFERENCE (use as guide, estimate for unlisted products):

VEGETABLES/FRUITS (per kg): Tomato ₹30-80, Onion ₹25-60, Potato ₹20-40, Apple ₹120-200, Banana ₹40-60
GROCERIES: Rice ₹45-120/kg, Wheat flour ₹35-60/kg, Cooking oil ₹140-220/L, Milk ₹55-75/L
ELECTRONICS: iPhones ₹70,000-₹180,000, Samsung phones ₹15,000-₹150,000, Laptops ₹35,000-₹200,000, TVs ₹25,000-₹150,000
MEDICINES: OTC tablets ₹15-100/strip, Vitamins ₹150-500/bottle, Syrups ₹80-200
FOOTWEAR: Sports shoes ₹3,000-₹20,000, Casual shoes ₹1,000-₹8,000
VEHICLES: Cars ₹5,00,000-₹50,00,000, Bikes ₹60,000-₹3,00,000, Scooters ₹70,000-₹1,50,000

For products NOT in the list: Research and estimate realistic market prices based on the product type, brand positioning, and market segment.

CURRENCY: 1 USD = 83.5 INR

IMAGE URLS by category (pick the most relevant):
- Vegetables: "https://images.unsplash.com/photo-1546470427-227c7369a9b6?w=400"
- Fruits: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400"
- Groceries: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"
- Phones: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
- Laptops: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
- TVs: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"
- Medicines: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"
- Shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
- Cars: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"
- SUVs/Jeeps: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400"
- Motorcycles: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400"
- General: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"

MANDATORY JSON OUTPUT FORMAT (respond ONLY with this JSON, no other text):
{
  "productName": "Full product name with brand and model",
  "category": "category name",
  "currentPriceINR": 50000,
  "currentPriceUSD": 599,
  "priceHistory": [
    {"month": "Feb 2025", "priceINR": 52000, "priceUSD": 623},
    {"month": "Mar 2025", "priceINR": 51500, "priceUSD": 617},
    {"month": "Apr 2025", "priceINR": 51000, "priceUSD": 611},
    {"month": "May 2025", "priceINR": 50800, "priceUSD": 609},
    {"month": "Jun 2025", "priceINR": 50500, "priceUSD": 605},
    {"month": "Jul 2025", "priceINR": 50200, "priceUSD": 601},
    {"month": "Aug 2025", "priceINR": 50000, "priceUSD": 599},
    {"month": "Sep 2025", "priceINR": 49800, "priceUSD": 596},
    {"month": "Oct 2025", "priceINR": 48000, "priceUSD": 575},
    {"month": "Nov 2025", "priceINR": 47500, "priceUSD": 569},
    {"month": "Dec 2025", "priceINR": 49000, "priceUSD": 587},
    {"month": "Jan 2026", "priceINR": 50000, "priceUSD": 599}
  ],
  "predictedPrices": [
    {"month": "Feb 2026", "priceINR": 49500, "priceUSD": 593},
    {"month": "Mar 2026", "priceINR": 49000, "priceUSD": 587},
    {"month": "Apr 2026", "priceINR": 48500, "priceUSD": 581},
    {"month": "May 2026", "priceINR": 48000, "priceUSD": 575},
    {"month": "Jun 2026", "priceINR": 47500, "priceUSD": 569},
    {"month": "Jul 2026", "priceINR": 47000, "priceUSD": 563}
  ],
  "priceAnalysis": {
    "trend": "decreasing",
    "percentChange": 5,
    "bestTimeToBuy": "Wait until March for better prices",
    "recommendation": "Price is expected to drop. Consider waiting."
  },
  "specifications": {
    "brand": "Brand Name",
    "model": "Model Name",
    "description": "Brief 2-sentence product description with key features.",
    "imageUrl": "https://images.unsplash.com/photo-RELEVANT-ID?w=400"
  }
}

CRITICAL RULES:
1. ALWAYS output valid JSON - never refuse or explain
2. Use realistic prices based on product type and brand
3. Include exactly 12 months history and 6 months predictions
4. Pick the most relevant image URL from the list above`;

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
