import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header - works for both logged in users and anonymous
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // Try to validate JWT if provided, but don't require it
    if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );

      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: claimsData } = await supabase.auth.getClaims(token);
        userId = claimsData?.claims?.sub || null;
        if (userId) {
          console.log('Authenticated user:', userId);
        }
      } catch (e) {
        console.log('Anonymous search (no valid user token)');
      }
    }

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
      "macbook pro m3": { baseINR: 199900, variation: 0.03, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
      "macbook air m3": { baseINR: 114900, variation: 0.04, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400" },
      "dell xps 15": { baseINR: 149990, variation: 0.05, image: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400" },
      // TVs
      "sony bravia 55": { baseINR: 89990, variation: 0.06, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
      "lg oled c3": { baseINR: 139990, variation: 0.05, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
      "samsung neo qled": { baseINR: 159990, variation: 0.04, image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400" },
      // Cars
      "mahindra thar": { baseINR: 1100000, variation: 0.02, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400" },
      "tata nexon": { baseINR: 850000, variation: 0.03, image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400" },
      "maruti swift": { baseINR: 650000, variation: 0.02, image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400" },
      "hyundai creta": { baseINR: 1200000, variation: 0.03, image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400" },
      // Appliances
      "lg washing machine": { baseINR: 35990, variation: 0.08, image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400" },
      "samsung refrigerator": { baseINR: 45990, variation: 0.07, image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400" },
      "dyson vacuum": { baseINR: 52990, variation: 0.05, image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400" },
    };

    // Find matching product from database
    const searchLower = productName.toLowerCase();
    let matchedProduct: { baseINR: number, variation: number, image: string } | null = null;
    let matchedName = productName;
    
    for (const [key, value] of Object.entries(PRICE_DATABASE)) {
      if (searchLower.includes(key) || key.includes(searchLower)) {
        matchedProduct = value;
        matchedName = key;
        break;
      }
    }

    // Default product if no match
    if (!matchedProduct) {
      matchedProduct = { baseINR: 25000, variation: 0.1, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" };
    }

    const currentPriceINR = matchedProduct.baseINR;
    const exchangeRate = 83.5;

    const systemPrompt = `You are a product pricing analyst. Provide price information for: "${productName}" in category "${category}".

IMPORTANT: Use this fixed current price: ₹${currentPriceINR.toLocaleString()} (this is the base reference).

Generate realistic price history for the last 12 months and predictions for the next 6 months.
The price variation should be within ${(matchedProduct.variation * 100).toFixed(0)}% of the current price.
Use INR as primary currency, USD conversion at rate ₹${exchangeRate}.

Respond ONLY in valid JSON format:
{
  "productName": "${productName}",
  "category": "${category}",
  "currentPriceINR": ${currentPriceINR},
  "currentPriceUSD": ${Math.round(currentPriceINR / exchangeRate * 100) / 100},
  "priceHistory": [
    {"month": "Feb 2025", "priceINR": <number>, "priceUSD": <number>},
    ...12 months total
  ],
  "predictedPrices": [
    {"month": "Mar 2026", "priceINR": <number>, "priceUSD": <number>},
    ...6 months total
  ],
  "priceAnalysis": {
    "trend": "increasing" | "decreasing" | "stable",
    "percentChange": <number>,
    "bestTimeToBuy": "<advice>",
    "recommendation": "<detailed advice>"
  },
  "specifications": {
    "brand": "<brand>",
    "model": "<model>",
    "description": "<brief description>",
    "imageUrl": "${matchedProduct.image}"
  }
}`;

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
          { role: "user", content: `Provide complete price analysis for ${productName}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean JSON from markdown
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Return fallback data
      parsedData = {
        productName,
        category,
        currentPriceINR,
        currentPriceUSD: Math.round(currentPriceINR / exchangeRate * 100) / 100,
        priceHistory: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2025, 1 + i).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          priceINR: Math.round(currentPriceINR * (0.95 + Math.random() * 0.1)),
          priceUSD: Math.round((currentPriceINR * (0.95 + Math.random() * 0.1)) / exchangeRate * 100) / 100,
        })),
        predictedPrices: Array.from({ length: 6 }, (_, i) => ({
          month: `+${i + 1}m`,
          priceINR: Math.round(currentPriceINR * (0.97 + Math.random() * 0.06)),
          priceUSD: Math.round((currentPriceINR * (0.97 + Math.random() * 0.06)) / exchangeRate * 100) / 100,
        })),
        priceAnalysis: {
          trend: "stable",
          percentChange: 0,
          bestTimeToBuy: "Current prices are fair",
          recommendation: "Monitor for deals during sales",
        },
        specifications: {
          brand: productName.split(" ")[0],
          model: productName,
          description: `${productName} - Quality product in ${category} category`,
          imageUrl: matchedProduct.image,
        },
      };
    }

    // Normalize response for frontend
    const normalizedData = {
      ...parsedData,
      currentPriceINR: Number(parsedData.currentPriceINR) || currentPriceINR,
      currentPriceUSD: Number(parsedData.currentPriceUSD) || Math.round(currentPriceINR / exchangeRate * 100) / 100,
      priceHistory: Array.isArray(parsedData.priceHistory) ? parsedData.priceHistory.map((p: any) => ({
        month: String(p?.month || ""),
        priceINR: Number(p?.priceINR) || 0,
        priceUSD: Number(p?.priceUSD) || 0,
      })) : [],
      predictedPrices: Array.isArray(parsedData.predictedPrices) ? parsedData.predictedPrices.map((p: any) => ({
        month: String(p?.month || ""),
        priceINR: Number(p?.priceINR) || 0,
        priceUSD: Number(p?.priceUSD) || 0,
      })) : [],
      specifications: {
        ...parsedData.specifications,
        imageUrl: parsedData.specifications?.imageUrl || matchedProduct.image,
      },
    };

    return new Response(JSON.stringify(normalizedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-price-search:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch price data";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
