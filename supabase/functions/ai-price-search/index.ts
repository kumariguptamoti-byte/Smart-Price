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

// Fixed pricing database for stable, consistent prices
const PRICE_DATABASE: Record<string, { baseINR: number, variation: number, image: string }> = {
  // Phones
  "iphone 16 pro max": { baseINR: 159900, variation: 0.03, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400" },
  "iphone 16 pro": { baseINR: 139900, variation: 0.03, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400" },
  "iphone 16": { baseINR: 89900, variation: 0.04, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400" },
  "iphone 15": { baseINR: 69900, variation: 0.05, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400" },
  "samsung galaxy s24 ultra": { baseINR: 134999, variation: 0.04, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400" },
  "samsung galaxy s24": { baseINR: 79999, variation: 0.05, image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400" },
  // Laptops
  "macbook pro 16": { baseINR: 249900, variation: 0.02, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
  "macbook air m3": { baseINR: 114900, variation: 0.03, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
  "dell xps 15": { baseINR: 159990, variation: 0.04, image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400" },
  // Cars
  "bugatti chiron": { baseINR: 2500000000, variation: 0.01, image: "https://images.unsplash.com/photo-1566023456228-4a6e1f8d90a9?w=400" },
  "bugatti veyron": { baseINR: 1100000000, variation: 0.01, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400" },
  "lamborghini huracan": { baseINR: 35000000, variation: 0.02, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400" },
  "ferrari 488": { baseINR: 38000000, variation: 0.02, image: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400" },
  "porsche 911": { baseINR: 18500000, variation: 0.02, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400" },
  "bmw m5": { baseINR: 16900000, variation: 0.03, image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400" },
  "mercedes s class": { baseINR: 17500000, variation: 0.02, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400" },
  "audi a8": { baseINR: 13500000, variation: 0.03, image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400" },
  "range rover": { baseINR: 25000000, variation: 0.02, image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
  "toyota fortuner": { baseINR: 4500000, variation: 0.04, image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
  "mahindra thar": { baseINR: 1800000, variation: 0.05, image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
  "maruti swift": { baseINR: 699000, variation: 0.04, image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400" },
  "hyundai creta": { baseINR: 1399000, variation: 0.04, image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
  "tata nexon": { baseINR: 899000, variation: 0.05, image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=400" },
  // Bikes
  "royal enfield classic 350": { baseINR: 199000, variation: 0.03, image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400" },
  "ktm duke 390": { baseINR: 315000, variation: 0.04, image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400" },
  "kawasaki ninja 650": { baseINR: 745000, variation: 0.03, image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400" },
  // TVs
  "sony bravia 55": { baseINR: 89990, variation: 0.06, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
  "lg oled 65": { baseINR: 169990, variation: 0.05, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
  "samsung qled 55": { baseINR: 74990, variation: 0.06, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
  // Shoes
  "nike air jordan": { baseINR: 16995, variation: 0.08, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
  "adidas ultraboost": { baseINR: 18999, variation: 0.07, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
  "puma rs-x": { baseINR: 8999, variation: 0.08, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400" },
  // Groceries
  "tomato": { baseINR: 45, variation: 0.3, image: "https://images.unsplash.com/photo-1546470427-227c7369a9b6?w=400" },
  "onion": { baseINR: 35, variation: 0.35, image: "https://images.unsplash.com/photo-1580201092675-a0a6a6cafbb1?w=400" },
  "potato": { baseINR: 28, variation: 0.25, image: "https://images.unsplash.com/photo-1518977676601-b53f82ber6f?w=400" },
  "apple": { baseINR: 180, variation: 0.15, image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400" },
  "rice": { baseINR: 65, variation: 0.1, image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400" },
};

const systemPrompt = `You are a price research AI that provides CONSISTENT, STABLE prices. ALWAYS respond with valid JSON.

CRITICAL: Use these EXACT base prices (in INR) - do NOT vary more than the allowed percentage:
${Object.entries(PRICE_DATABASE).map(([name, data]) => `${name}: ₹${data.baseINR.toLocaleString()} (±${data.variation * 100}%)`).join('\n')}

For ANY product not in the list, estimate based on similar products and market research.
CURRENCY: 1 USD = 83.5 INR (divide INR by 83.5 for USD)

MANDATORY JSON OUTPUT FORMAT (respond ONLY with this JSON):
{
  "productName": "Full product name with brand",
  "category": "category",
  "currentPriceINR": <exact price from database or close estimate>,
  "currentPriceUSD": <INR / 83.5>,
  "priceHistory": [12 months with realistic ±3-5% variations],
  "predictedPrices": [6 months future predictions],
  "priceAnalysis": {
    "trend": "stable|increasing|decreasing",
    "percentChange": <1-8>,
    "bestTimeToBuy": "advice",
    "recommendation": "recommendation"
  },
  "specifications": {
    "brand": "brand",
    "model": "model", 
    "description": "2-sentence description",
    "imageUrl": "relevant unsplash URL from: phones(1511707171634), laptops(1517336714731), cars(1494976388531), bikes(1558981403-c5f9899a28bc), tvs(1593359677879), shoes(1542291026), vegetables(1546470427), fruits(1619546813926), groceries(1586201375761)"
  }
}

RULES:
1. Use EXACT prices from database when product matches
2. Keep price variations within allowed percentage
3. Always output valid JSON only`;

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
