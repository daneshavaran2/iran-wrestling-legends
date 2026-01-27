import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const getSystemPrompt = (language: string) => {
  const prompts: Record<string, string> = {
    fa: `شما دستیار هوشمند موزه کشتی ایران هستید. وظیفه شما پاسخ‌دهی به سوالات کاربران درباره:
- تاریخچه کشتی ایران از دوران باستان تا امروز
- معرفی کشتی‌گیران بزرگ و قهرمانان المپیک و جهان
- افتخارات ورزش کشتی ایران
- معرفی موزه کشتی ایران و اماکن ورزشی
- سبک‌های کشتی (آزاد و فرنگی)

پاسخ‌ها را به زبان فارسی، مودبانه، مختصر و آموزنده بدهید. اگر سوالی خارج از حوزه موزه و کشتی باشد، مودبانه توضیح دهید که تخصص شما در این زمینه است.`,

    en: `You are the intelligent assistant of the Iran Wrestling Museum. Your role is to answer questions about:
- History of Iranian wrestling from ancient times to today
- Introduction of great wrestlers and Olympic/World champions
- Achievements of Iranian wrestling
- Introduction of the wrestling museum and sports venues
- Wrestling styles (Freestyle and Greco-Roman)

Provide answers in English, politely, briefly and informatively. If a question is outside the scope of the museum and wrestling, politely explain that your expertise is in this field.`,

    ar: `أنت المساعد الذكي لمتحف المصارعة الإيرانية. مهمتك الإجابة على أسئلة المستخدمين حول:
- تاريخ المصارعة الإيرانية من العصور القديمة حتى اليوم
- تعريف المصارعين العظماء وأبطال الأولمبياد والعالم
- إنجازات رياضة المصارعة الإيرانية
- تعريف متحف المصارعة والأماكن الرياضية
- أساليب المصارعة (الحرة والرومانية)

قدم الإجابات باللغة العربية بأدب وإيجاز ومعلومات مفيدة. إذا كان السؤال خارج نطاق المتحف والمصارعة، اشرح بأدب أن تخصصك في هذا المجال.`,
  };

  return prompts[language] || prompts.fa;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'fa', stream = true } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(language);

    // Use faster model with streaming for 2x speed improvement
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Fastest model available
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: stream,
        max_tokens: 500, // Limit response length for faster responses
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    if (stream) {
      // Return streaming response directly
      return new Response(response.body, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "متأسفانه پاسخی دریافت نشد.";

      return new Response(
        JSON.stringify({ content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Museum assistant error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        content: "متأسفانه خطایی رخ داد. لطفاً دوباره تلاش کنید."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
