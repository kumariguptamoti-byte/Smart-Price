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

    const systemPrompt = `You are an expert price research AI with LIVE access to real e-commerce data. Provide EXACT current market prices from Amazon, Flipkart, Walmart, Best Buy as of January 2026.

STRICT PRICING DATABASE (Use these EXACT price ranges - no exceptions):

VEGETABLES & FRUITS (per kg):
- Tomato: ₹30-80, Onion: ₹25-60, Potato: ₹20-40, Garlic: ₹150-300
- Apple: ₹120-200, Banana: ₹40-60, Orange: ₹80-150, Mango (season): ₹100-300

GROCERIES:
- Rice (1kg): ₹45-120, Wheat flour (1kg): ₹35-60, Sugar (1kg): ₹40-55
- Cooking oil (1L): ₹140-220, Milk (1L): ₹55-75, Butter (500g): ₹250-350
- Dal/Lentils (1kg): ₹100-180, Tea (250g): ₹120-300, Coffee (200g): ₹200-500

ELECTRONICS:
- iPhone 15: ₹79,900-₹89,900, iPhone 15 Pro: ₹1,29,900-₹1,49,900, iPhone 16: ₹89,900-₹99,900
- Samsung S24: ₹74,999-₹89,999, Samsung S24 Ultra: ₹1,29,999-₹1,49,999
- OnePlus 12: ₹64,999-₹74,999, Pixel 8: ₹75,999-₹85,999
- MacBook Air M3: ₹1,14,900-₹1,34,900, Dell XPS 15: ₹1,49,990-₹1,89,990
- TV 55" (LG/Samsung): ₹45,000-₹80,000, Laptop (basic): ₹35,000-₹55,000

MEDICINES (common OTC):
- Paracetamol (strip): ₹15-35, Crocin: ₹25-45, Dolo 650: ₹30-50
- Vitamin C (30 tabs): ₹150-350, Multivitamin (30 tabs): ₹200-500
- Cough syrup: ₹80-180, Pain relief spray: ₹150-300, Antacid: ₹60-120

FOOTWEAR:
- Nike Air Max: ₹8,995-₹16,995, Adidas Ultraboost: ₹12,999-₹19,999
- Puma running shoes: ₹3,999-₹8,999, Casual sneakers: ₹1,500-₹4,000
- Formal shoes: ₹2,500-₹8,000, Sandals: ₹500-₹2,500

VEHICLES:
- Maruti Swift: ₹6,49,000-₹9,40,000, Hyundai i20: ₹7,04,000-₹11,50,000
- Honda City: ₹12,50,000-₹16,50,000, Tata Nexon: ₹8,10,000-₹15,50,000
- Royal Enfield Classic 350: ₹1,93,000-₹2,30,000, Honda Activa: ₹76,000-₹90,000

CURRENCY: 1 USD = 83.5 INR (always use this)

IMAGE URL DATABASE (use EXACT URLs for each category):
- Tomato/Vegetables: "https://images.unsplash.com/photo-1546470427-227c7369a9b6?w=400"
- Fruits: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400"
- Rice/Grains: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400"
- Cooking Oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400"
- Milk/Dairy: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400"
- iPhone/Apple: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400"
- Samsung Phone: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400"
- Android Phone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
- Laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
- MacBook: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400"
- TV: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400"
- Medicines/Pills: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400"
- Vitamins: "https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=400"
- Nike Shoes: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
- Adidas Shoes: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400"
- Running Shoes: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400"
- Car: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"
- Motorcycle: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400"
- Scooter: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=400"

Your response MUST be valid JSON:
{
  "productName": "Full product name with brand, model, weight/size",
  "category": "category",
  "currentPriceINR": number (from price database above),
  "currentPriceUSD": number (INR / 83.5),
  "priceHistory": [12 months: Feb 2025 to Jan 2026],
  "predictedPrices": [6 months: Feb 2026 to Jul 2026],
  "priceAnalysis": {
    "trend": "increasing" | "decreasing" | "stable",
    "percentChange": number (1-20%),
    "bestTimeToBuy": "month + reason",
    "recommendation": "clear buy/wait/avoid advice"
  },
  "specifications": {
    "brand": "brand name",
    "model": "model/variant",
    "description": "2 sentences with key features",
    "imageUrl": "EXACT URL from database above matching product type"
  }
}

PRICE PATTERNS: Lower prices in Oct-Nov (festivals), stable Dec-Jan, slight rise Feb-Mar for groceries.`;

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
