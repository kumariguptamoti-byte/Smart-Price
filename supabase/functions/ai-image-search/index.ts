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
        console.log('Anonymous image search (no valid user token)');
      }
    }

    const { image } = await req.json();
    
    // Input validation for image
    if (!image || typeof image !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid image: must be a non-empty string' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Validate image format - must be a data URL or valid image URL
    const isDataUrl = image.startsWith('data:image/');
    const isHttpUrl = image.startsWith('http://') || image.startsWith('https://');
    
    if (!isDataUrl && !isHttpUrl) {
      return new Response(JSON.stringify({ error: 'Invalid image format: must be a data URL or HTTP(S) URL' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Check size limit (~5MB for base64)
    if (image.length > 5000000) {
      return new Response(JSON.stringify({ error: 'Image too large: max 5MB' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a product identification expert. Analyze the image and identify the product.
            
Respond ONLY with a JSON object in this exact format:
{
  "productName": "exact product name (e.g., 'iPhone 16 Pro Max', 'Samsung Galaxy S24')",
  "category": "electronics" | "fashion" | "home" | "appliances" | "automotive" | "sports",
  "confidence": 0.0-1.0,
  "description": "brief product description"
}

Be specific with product names. Include brand, model, and variant if visible.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify the product in this image:" },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
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
        return new Response(JSON.stringify({ error: "AI service temporarily unavailable." }), {
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
      return new Response(JSON.stringify({ 
        error: "Could not identify product",
        productName: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in ai-image-search:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze image";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
