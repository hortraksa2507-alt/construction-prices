import { Telegraf, Markup } from "telegraf";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load categories (static - rarely changes)
const catFile = join(__dirname, "src", "data", "categories.js");
const catRaw = readFileSync(catFile, "utf-8");
const catMatch = catRaw.match(/export const CATEGORIES = (\[[\s\S]*\]);/);
const categories = eval(catMatch[1]);

// Supabase setup
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Fallback: load from static file
let staticProducts = [];
if (!supabase) {
  const productsFile = join(__dirname, "src", "data", "products.js");
  const raw = readFileSync(productsFile, "utf-8");
  const match = raw.match(/export const DEFAULT_PRODUCTS = (\[[\s\S]*\]);/);
  staticProducts = eval(match[1]);
  console.log("⚠️  No Supabase configured - using static products data");
}

// Get products (always fresh from DB)
async function getProducts() {
  if (!supabase) return staticProducts;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: true });
  if (error) {
    console.error("DB error:", error);
    return staticProducts;
  }
  return data;
}

const WEB_APP_URL =
  process.env.WEB_APP_URL ||
  "https://hortraksa2507-alt.github.io/construction-prices/";
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN in .env file");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// /start command
bot.start((ctx) => {
  const keyboard = Markup.keyboard([
    [Markup.button.webApp("🏗️ បើកកម្មវិធី", WEB_APP_URL)],
    ["📋 ប្រភេទទំនិញ", "🔍 ស្វែងរកតម្លៃ"],
    ["📊 ស្ថិតិ", "ℹ️ ជំនួយ"],
  ]).resize();

  ctx.reply(
    "🏗️ *សម្ភារៈសំណង់ \\- Construction Prices*\n\n" +
      "សូមស្វាគមន៍\\! ខ្ញុំអាចជួយអ្នកស្វែងរកតម្លៃសម្ភារៈសំណង់បាន។\n\n" +
      "📌 *របៀបប្រើ:*\n" +
      "• ចុច *បើកកម្មវិធី* ដើម្បីមើលទំនិញទាំងអស់\n" +
      "• វាយ `/p ទីប` ដើម្បីស្វែងរកតម្លៃ\n" +
      "• វាយ `/cat pipe` ដើម្បីមើលតាមប្រភេទ\n" +
      "• ចុច *ស្វែងរកតម្លៃ* ដើម្បីស្វែងរក",
    { parse_mode: "MarkdownV2", ...keyboard }
  );
});

// /help
bot.help((ctx) => {
  ctx.reply(
    "📖 *ការណែនាំ*\n\n" +
      "🔹 `/p <keyword>` \\- ស្វែងរកទំនិញតាមឈ្មោះ\n" +
      "🔹 `/cat <category>` \\- មើលទំនិញតាមប្រភេទ\n" +
      "🔹 `/cats` \\- មើលប្រភេទទាំងអស់\n" +
      "🔹 `/stats` \\- មើលស្ថិតិ\n" +
      "🔹 `/all` \\- មើលទំនិញទាំងអស់ \\(២០ ដំបូង\\)\n\n" +
      "💡 ឬវាយឈ្មោះទំនិញផ្ទាល់ ដើម្បីស្វែងរក",
    { parse_mode: "MarkdownV2" }
  );
});

// Search products: /p <keyword>
bot.command("p", async (ctx) => {
  const query = ctx.message.text.replace(/^\/p\s*/, "").trim().toLowerCase();
  if (!query) {
    return ctx.reply("⚠️ សូមវាយឈ្មោះទំនិញ។ ឧ: /p ទីប_21");
  }
  const products = await getProducts();
  const results = products.filter((p) => p.name.toLowerCase().includes(query));
  sendProductList(ctx, results, `🔍 ស្វែងរក: "${query}"`);
});

// List categories: /cats
bot.command("cats", async (ctx) => {
  const products = await getProducts();
  const lines = categories
    .filter((c) => c.key !== "all")
    .map((c) => {
      const count = products.filter((p) => p.cat === c.key).length;
      return `${c.icon} *${c.label}* \\(\`${c.key}\`\\) \\- ${count} ទំនិញ`;
    });
  ctx.reply(
    `📋 *ប្រភេទទំនិញ*\n\n${lines.join("\n")}\n\nវាយ /cat pipe ដើម្បីមើលទំនិញ`,
    { parse_mode: "MarkdownV2" }
  );
});

// Category products: /cat <key>
bot.command("cat", async (ctx) => {
  const key = ctx.message.text.replace(/^\/cat\s*/, "").trim().toLowerCase();
  if (!key) {
    return ctx.reply("⚠️ សូមជ្រើសប្រភេទ។ ឧ: /cat pipe\nមើលប្រភេទ: /cats");
  }
  const cat = categories.find((c) => c.key === key);
  if (!cat) {
    return ctx.reply(`❌ រកមិនឃើញប្រភេទ "${key}"\nមើលប្រភេទ: /cats`);
  }
  const products = await getProducts();
  const results = products.filter((p) => p.cat === key);
  sendProductList(ctx, results, `${cat.icon} ${cat.label}`);
});

// Stats: /stats
bot.command("stats", async (ctx) => {
  const products = await getProducts();
  const total = products.length;
  const withPrice = products.filter((p) => p.price).length;
  const withoutPrice = products.filter((p) => !p.price).length;
  const catCount = new Set(products.map((p) => p.cat)).size;

  ctx.reply(
    `📊 *ស្ថិតិ*\n\n` +
      `📦 ទំនិញសរុប: *${total}*\n` +
      `💰 មានតម្លៃ: *${withPrice}*\n` +
      `❓ គ្មានតម្លៃ: *${withoutPrice}*\n` +
      `📋 ប្រភេទ: *${catCount}*` +
      (supabase ? `\n\n☁️ _ទិន្នន័យភ្ជាប់ cloud \\- អាប់ដេតភ្លាមៗ_` : ""),
    { parse_mode: supabase ? "MarkdownV2" : "Markdown" }
  );
});

// All products: /all
bot.command("all", async (ctx) => {
  const products = await getProducts();
  sendProductList(ctx, products.slice(0, 20), "📦 ទំនិញ (២០ ដំបូង)");
});

// Handle text buttons
bot.hears("📋 ប្រភេទទំនិញ", (ctx) => ctx.reply("/cats", {}));
bot.hears("🔍 ស្វែងរកតម្លៃ", (ctx) =>
  ctx.reply(
    "🔍 វាយឈ្មោះទំនិញដែលអ្នកចង់ស្វែងរក:\n\nឧ: ទីប_21 ឬ កែង ឬ ថ្នាំប្រេង"
  )
);
bot.hears("📊 ស្ថិតិ", async (ctx) => {
  const products = await getProducts();
  const total = products.length;
  const withPrice = products.filter((p) => p.price).length;
  ctx.reply(
    `📊 ទំនិញសរុប: ${total} | មានតម្លៃ: ${withPrice} | គ្មានតម្លៃ: ${total - withPrice}`
  );
});
bot.hears("ℹ️ ជំនួយ", (ctx) => {
  ctx.reply("វាយ /help ដើម្បីមើលការណែនាំពេញលេញ");
});

// Handle direct text search
bot.on("text", async (ctx) => {
  const text = ctx.message.text.trim().toLowerCase();
  if (text.startsWith("/")) return;

  const products = await getProducts();
  const results = products.filter((p) => p.name.toLowerCase().includes(text));
  if (results.length === 0) {
    return ctx.reply(
      `❌ រកមិនឃើញ "${ctx.message.text}"\n\n💡 សាកល្បង: ទីប, កែង, វ៉ាន, ថ្នាំប្រេង...`
    );
  }
  sendProductList(ctx, results, `🔍 "${ctx.message.text}"`);
});

// Inline query
bot.on("inline_query", async (ctx) => {
  const query = ctx.inlineQuery.query.trim().toLowerCase();
  if (!query) return ctx.answerInlineQuery([]);

  const products = await getProducts();
  const results = products
    .filter((p) => p.name.toLowerCase().includes(query))
    .slice(0, 20)
    .map((p) => {
      const cat = categories.find((c) => c.key === p.cat);
      const priceText = p.price || "គ្មានតម្លៃ";
      return {
        type: "article",
        id: String(p.id),
        title: p.name.replace(/_/g, " "),
        description: `${cat?.icon || ""} ${cat?.label || ""} | ${priceText}${p.price2 ? " | " + p.price2 : ""}`,
        input_message_content: {
          message_text:
            `${cat?.icon || "📦"} *${escapeMarkdown(p.name.replace(/_/g, " "))}*\n` +
            `📋 ប្រភេទ: ${cat?.label || p.cat}\n` +
            `💰 តម្លៃ: *${escapeMarkdown(priceText)}*` +
            (p.price2
              ? `\n💰 តម្លៃ២: *${escapeMarkdown(p.price2)}*`
              : ""),
          parse_mode: "MarkdownV2",
        },
      };
    });

  ctx.answerInlineQuery(results, { cache_time: 10 });
});

// Helper: send product list
function sendProductList(ctx, results, title) {
  if (results.length === 0) {
    return ctx.reply("❌ រកមិនឃើញទំនិញ");
  }

  const MAX = 30;
  const showing = results.slice(0, MAX);
  const lines = showing.map((p) => {
    const cat = categories.find((c) => c.key === p.cat);
    const price = p.price || "—";
    const price2 = p.price2 ? ` | ${p.price2}` : "";
    return `${cat?.icon || "📦"} \`${p.name.replace(/_/g, " ")}\`\n   💰 ${price}${price2}`;
  });

  let msg = `${title}\n━━━━━━━━━━━━━━━\n\n${lines.join("\n\n")}`;

  if (results.length > MAX) {
    msg += `\n\n📌 បង្ហាញ ${MAX}/${results.length} — បើកកម្មវិធីដើម្បីមើលទាំងអស់`;
  }

  msg += `\n\n🔗 មើលទាំងអស់:`;

  ctx.reply(msg, {
    ...Markup.inlineKeyboard([
      Markup.button.webApp("🏗️ បើកកម្មវិធីពេញ", WEB_APP_URL),
    ]),
  });
}

// Helper: escape markdown v2
function escapeMarkdown(text) {
  return text.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

// Launch bot
bot.launch();
console.log("🤖 Bot is running...");
console.log(supabase ? "☁️  Connected to Supabase" : "📁 Using static data");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
