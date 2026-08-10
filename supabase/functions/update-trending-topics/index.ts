/**
 * Supabase Edge Function: update-trending-topics
 * 
 * Pipeline:
 * 1. Fetch current news from GDELT DOC 2.0 API
 * 2. Deduplicate articles
 * 3. Send to Google Gemini for topic extraction
 * 4. Upsert topics + articles into Supabase
 * 5. Expire stale topics
 * 
 * Invocation: POST with Authorization header (service_role or admin JWT)
 * Schedule: Every 6 hours via pg_cron or external scheduler
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// ─── Configuration ─────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "";

const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

// Categories to query GDELT for — each produces a batch of articles
const GDELT_QUERIES = [
  "artificial intelligence",
  "cybersecurity",
  "cloud computing",
  "software development",
  "startups technology",
  "data science machine learning",
  "business finance economy",
  "science research innovation",
  "education technology",
  "career employment jobs",
];

// ─── GDELT News Provider ───────────────────────────────────────

interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
}

async function fetchGDELTArticles(query: string, maxRecords = 25): Promise<GDELTArticle[]> {
  const url = `${GDELT_BASE}?query=${encodeURIComponent(query)}&mode=ArtList&maxrecords=${maxRecords}&format=json&timespan=24h&sort=DateDesc`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`GDELT returned ${response.status} for query "${query}"`);
      return [];
    }
    const data = await response.json();
    return data?.articles ?? [];
  } catch (error) {
    console.warn(`GDELT fetch failed for "${query}":`, error);
    return [];
  }
}

// ─── Deduplication ─────────────────────────────────────────────

interface NormalizedArticle {
  url: string;
  title: string;
  published_at: string;
  image_url: string;
  source_name: string;
  language: string;
  query_category: string;
}

function deduplicateArticles(articles: NormalizedArticle[]): NormalizedArticle[] {
  const seen = new Set<string>();
  const result: NormalizedArticle[] = [];
  
  for (const article of articles) {
    // Deduplicate by URL
    if (seen.has(article.url)) continue;
    
    // Deduplicate by normalized title (lowercase, stripped)
    const normalizedTitle = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    if (normalizedTitle.length < 10) continue;
    if (seen.has(normalizedTitle)) continue;
    
    seen.add(article.url);
    seen.add(normalizedTitle);
    result.push(article);
  }
  
  return result;
}

// ─── AI Topic Extraction (Gemini) ──────────────────────────────

interface ExtractedTopic {
  topic_name: string;
  slug: string;
  description: string;
  category: string;
  relevant_fields: string[];
  trend_score: number;
  supporting_article_urls: string[];
}

async function extractTopicsWithAI(articles: NormalizedArticle[]): Promise<ExtractedTopic[]> {
  if (!GEMINI_API_KEY) {
    console.warn("No GEMINI_API_KEY set, using fallback extraction");
    return fallbackExtraction(articles);
  }

  // Prepare article summaries for the AI
  const articleSummaries = articles.slice(0, 100).map((a, i) => 
    `[${i + 1}] "${a.title}" — ${a.source_name} (${a.query_category})`
  ).join("\n");

  const prompt = `You are a news analyst for a student career platform called CareerLink Nepal. 
You are given ${articles.length} recent news article titles from global sources.

Your task:
1. Identify 10-15 distinct TRENDING TOPICS from these articles
2. Group similar articles under the same topic
3. Each topic MUST be supported by at least 1 article from the list
4. DO NOT invent topics not supported by the articles

For each topic provide:
- topic_name: Clean, concise topic name (e.g., "AI Agents", "Quantum Computing")
- slug: URL-friendly lowercase slug (e.g., "ai-agents")
- description: 1-2 sentence explanation based on the articles (NOT invented)
- category: One of: Technology, Artificial Intelligence, Cybersecurity, Cloud Computing, Data Science, Business, Finance, Science, Education, Engineering, Healthcare, Environment, Startups, Career, Innovation, Software Development
- relevant_fields: Array of academic fields this is relevant to (e.g., ["Computer Science", "Data Science", "Software Engineering"])
- trend_score: Float 0.0-1.0 based on article frequency and source diversity
- supporting_article_urls: Array of indices [1], [2], etc. from the article list that support this topic

ARTICLES:
${articleSummaries}

Respond ONLY with a valid JSON array of topic objects. No markdown, no explanation.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", response.status, await response.text());
      return fallbackExtraction(articles);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    // Extract JSON from response (handle possible markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Could not parse Gemini response as JSON array");
      return fallbackExtraction(articles);
    }
    
    const topics: ExtractedTopic[] = JSON.parse(jsonMatch[0]);
    
    // Resolve article indices back to URLs
    return topics.map(topic => ({
      ...topic,
      supporting_article_urls: (topic.supporting_article_urls || []).map(ref => {
        const idx = typeof ref === "string" ? parseInt(ref.replace(/\D/g, "")) - 1 : Number(ref) - 1;
        return articles[idx]?.url ?? "";
      }).filter(Boolean),
    }));
  } catch (error) {
    console.error("Gemini extraction failed:", error);
    return fallbackExtraction(articles);
  }
}

// Fallback: simple keyword-frequency extraction when AI is unavailable
function fallbackExtraction(articles: NormalizedArticle[]): ExtractedTopic[] {
  const categoryMap: Record<string, { count: number; articles: NormalizedArticle[] }> = {};
  
  for (const article of articles) {
    const cat = article.query_category;
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, articles: [] };
    categoryMap[cat].count++;
    categoryMap[cat].articles.push(article);
  }

  return Object.entries(categoryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 12)
    .map(([cat, data]) => {
      const slug = cat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return {
        topic_name: cat.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        slug,
        description: `Trending topic based on ${data.count} recent articles.`,
        category: mapQueryToCategory(cat),
        relevant_fields: mapQueryToFields(cat),
        trend_score: Math.min(data.count / 25, 1.0),
        supporting_article_urls: data.articles.slice(0, 5).map(a => a.url),
      };
    });
}

function mapQueryToCategory(query: string): string {
  const map: Record<string, string> = {
    "artificial intelligence": "Artificial Intelligence",
    "cybersecurity": "Cybersecurity",
    "cloud computing": "Cloud Computing",
    "software development": "Software Development",
    "startups technology": "Startups",
    "data science machine learning": "Data Science",
    "business finance economy": "Business",
    "science research innovation": "Science",
    "education technology": "Education",
    "career employment jobs": "Career",
  };
  return map[query] || "Technology";
}

function mapQueryToFields(query: string): string[] {
  const map: Record<string, string[]> = {
    "artificial intelligence": ["Computer Science", "Data Science", "Software Engineering", "Information Technology"],
    "cybersecurity": ["Computer Science", "Information Technology", "Cybersecurity"],
    "cloud computing": ["Computer Science", "Information Technology", "Software Engineering"],
    "software development": ["Computer Science", "Software Engineering", "Information Technology"],
    "startups technology": ["Business", "Computer Science", "Entrepreneurship"],
    "data science machine learning": ["Data Science", "Computer Science", "Statistics", "Mathematics"],
    "business finance economy": ["Business", "Finance", "Economics", "Management"],
    "science research innovation": ["Science", "Engineering", "Research"],
    "education technology": ["Education", "Computer Science", "Information Technology"],
    "career employment jobs": ["Business", "Management", "Human Resources"],
  };
  return map[query] || ["General"];
}

// ─── Database Operations ───────────────────────────────────────

async function upsertTopics(
  supabase: ReturnType<typeof createClient>,
  topics: ExtractedTopic[],
  allArticles: NormalizedArticle[]
) {
  let processedCount = 0;

  for (const topic of topics) {
    // Upsert the topic
    const { data: upserted, error: topicError } = await supabase
      .from("trending_topics")
      .upsert(
        {
          topic_name: topic.topic_name,
          slug: topic.slug,
          description: topic.description,
          category: topic.category,
          relevant_fields: topic.relevant_fields,
          trend_score: topic.trend_score,
          article_count: topic.supporting_article_urls.length,
          source_diversity: new Set(topic.supporting_article_urls.map(u => {
            try { return new URL(u).hostname; } catch { return "unknown"; }
          })).size,
          last_updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();

    if (topicError) {
      console.error(`Failed to upsert topic "${topic.topic_name}":`, topicError);
      continue;
    }

    const topicId = upserted.id;

    // Delete old articles for this topic before inserting fresh ones
    await supabase
      .from("trending_topic_articles")
      .delete()
      .eq("topic_id", topicId);

    // Insert supporting articles
    const articleRows = topic.supporting_article_urls
      .map(url => {
        const article = allArticles.find(a => a.url === url);
        if (!article) return null;
        return {
          topic_id: topicId,
          source_name: article.source_name,
          article_title: article.title,
          article_url: article.url,
          article_published_at: article.published_at || null,
          article_image_url: article.image_url || null,
          article_description: null,
        };
      })
      .filter(Boolean);

    if (articleRows.length > 0) {
      const { error: articlesError } = await supabase
        .from("trending_topic_articles")
        .insert(articleRows);
      if (articlesError) {
        console.error(`Failed to insert articles for "${topic.topic_name}":`, articlesError);
      }
    }

    processedCount++;
  }

  return processedCount;
}

async function expireOldTopics(supabase: ReturnType<typeof createClient>) {
  const { error } = await supabase
    .from("trending_topics")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) console.error("Failed to expire old topics:", error);
}

// ─── Main Handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Log the run start
  const { data: logEntry } = await supabase
    .from("trending_topics_update_log")
    .insert({ status: "running" })
    .select("id")
    .single();

  try {
    console.log("Starting trending topics update pipeline...");

    // Step 1: Fetch articles from GDELT for each category
    const allRawArticles: NormalizedArticle[] = [];
    
    for (const query of GDELT_QUERIES) {
      const gdeltArticles = await fetchGDELTArticles(query);
      const normalized = gdeltArticles.map((a: GDELTArticle) => ({
        url: a.url,
        title: a.title || "",
        published_at: a.seendate || "",
        image_url: a.socialimage || "",
        source_name: a.domain || "",
        language: a.language || "English",
        query_category: query,
      }));
      allRawArticles.push(...normalized);
      
      // Small delay to avoid rate-limiting
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`Fetched ${allRawArticles.length} raw articles from GDELT`);

    // Step 2: Deduplicate
    const uniqueArticles = deduplicateArticles(allRawArticles);
    console.log(`${uniqueArticles.length} unique articles after dedup`);

    // Step 3: AI extraction
    const topics = await extractTopicsWithAI(uniqueArticles);
    console.log(`Extracted ${topics.length} topics`);

    // Step 4: Upsert to database
    const processedCount = await upsertTopics(supabase, topics, uniqueArticles);
    console.log(`Upserted ${processedCount} topics`);

    // Step 5: Expire stale topics
    await expireOldTopics(supabase);

    // Update log
    if (logEntry?.id) {
      await supabase
        .from("trending_topics_update_log")
        .update({
          status: "success",
          topics_processed: processedCount,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({ success: true, topics_processed: processedCount, articles_fetched: uniqueArticles.length }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Pipeline error:", error);

    if (logEntry?.id) {
      await supabase
        .from("trending_topics_update_log")
        .update({
          status: "error",
          error_message: error instanceof Error ? error.message : String(error),
          completed_at: new Date().toISOString(),
        })
        .eq("id", logEntry.id);
    }

    return new Response(
      JSON.stringify({ error: "Pipeline failed", message: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
