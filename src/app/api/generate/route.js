import OpenAI from 'openai';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromToken } from '../../../lib/auth';
import { COLLECTIONS } from '../../../config/constants';

// Скільки коштує одне згенероване зображення (у USD, списується з user.balance.USD).
// Безкоштовний тестовий провайдер (Pollinations) коштує $0.
const COST_PER_IMAGE_USD = 0.04;

// "Категорії" з UI (Model Engine) -> стильові модифікатори промпту.
// gpt-image-1 не має окремих "моделей", тому стиль додається текстом до промпту.
const STYLE_PRESETS = {
  'Aether Ultra': 'premium ultra-detailed digital art, dramatic lighting, hyperrealistic, high production value',
  'Cinema 4K': 'cinematic film still, anamorphic lens flare, dramatic film lighting, 4K movie quality, color graded',
  'Product Studio': 'professional product photography, clean studio lighting, seamless background, commercial catalog photo',
  'Character Gen': 'detailed character design, concept art, expressive character illustration, clean line work',
};

// "Формати" з UI -> найближчий підтримуваний розмір gpt-image-1
function resolveSize(aspectRatio) {
  switch (aspectRatio) {
    case '1:1':
      return '1024x1024';
    case '16:9':
    case '4:3':
      return '1536x1024';
    case '9:16':
    case '3:4':
      return '1024x1536';
    default:
      return '1024x1024';
  }
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Безкоштовний провайдер для тестування, без API-ключа.
// image.pollinations.ai — публічний, без SLA; використовується автоматично,
// якщо OPENAI_API_KEY не заданий у .env.local.
async function generateWithPollinations({ prompt, size, count }) {
  const [width, height] = size.split('x').map(Number);
  const images = [];

  for (let i = 0; i < count; i += 1) {
    const seed = Math.floor(Math.random() * 1_000_000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Pollinations request failed with status ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    images.push(`data:image/jpeg;base64,${base64}`);
  }

  return images;
}

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return jsonResponse({ message: 'Authentication required.' }, 401);
  }

  const body = await req.json().catch(() => ({}));
  const {
    prompt,
    negativePrompt = '',
    model = 'Aether Ultra',
    aspectRatio = '1:1',
    imageCount = 1,
    projectId = null,
  } = body;

  if (!prompt || !prompt.trim()) {
    return jsonResponse({ message: 'Prompt is required.' }, 400);
  }

  const count = Math.min(Math.max(Number(imageCount) || 1, 1), 10);
  const usingOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const totalCost = usingOpenAI ? Number((COST_PER_IMAGE_USD * count).toFixed(2)) : 0;

  const currentBalance = user.balance?.USD ?? 0;
  if (usingOpenAI && currentBalance < totalCost) {
    return jsonResponse(
      { message: `Insufficient balance. This generation costs $${totalCost.toFixed(2)}, your balance is $${currentBalance.toFixed(2)}.` },
      402
    );
  }

  const stylePrefix = STYLE_PRESETS[model] || '';
  const fullPrompt = [
    prompt.trim(),
    stylePrefix,
    negativePrompt.trim() ? `Avoid: ${negativePrompt.trim()}.` : '',
  ]
    .filter(Boolean)
    .join('. ');

  const validProjectId = projectId && ObjectId.isValid(projectId) ? new ObjectId(projectId) : null;

  const size = resolveSize(aspectRatio);

  try {
    let images = [];

    if (usingOpenAI) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const result = await client.images.generate({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        size,
        n: count,
      });
      images = (result.data || []).map((item) => `data:image/png;base64,${item.b64_json}`);
    } else {
      // Немає OPENAI_API_KEY -> безкоштовний тестовий провайдер, без списання коштів.
      images = await generateWithPollinations({ prompt: fullPrompt, size, count });
    }

    if (images.length === 0) {
      return jsonResponse({ message: 'The image provider returned no images.' }, 502);
    }

    const { db } = await connectToDatabase();

    // Якщо переданий projectId, перевіряємо, що проект належить користувачу
    let project = null;
    if (validProjectId) {
      project = await db.collection(COLLECTIONS.PROJECTS).findOne({ _id: validProjectId, userId: user._id });
    }

    const generationDoc = {
      userId: user._id,
      projectId: project ? project._id : null,
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      model,
      aspectRatio,
      size,
      provider: usingOpenAI ? 'openai' : 'pollinations',
      imageCount: images.length,
      cost: totalCost,
      createdAt: new Date(),
    };
    const { insertedId } = await db.collection(COLLECTIONS.GENERATIONS).insertOne(generationDoc);

    await db.collection(COLLECTIONS.IMAGES).insertMany(
      images.map((dataUrl) => ({
        userId: user._id,
        projectId: project ? project._id : null,
        generationId: insertedId,
        prompt: prompt.trim(),
        model,
        aspectRatio,
        dataUrl,
        createdAt: new Date(),
      }))
    );

    if (project) {
      await db.collection(COLLECTIONS.PROJECTS).updateOne(
        { _id: project._id },
        {
          $inc: { imageCount: images.length },
          $set: { updatedAt: new Date(), status: project.status === 'draft' ? 'in-progress' : project.status },
        }
      );
    }

    if (totalCost > 0) {
      await db.collection(COLLECTIONS.USER).updateOne(
        { _id: user._id },
        {
          $inc: { 'balance.USD': -totalCost },
          $push: {
            transactions: {
              id: `GEN-${Date.now()}`,
              type: 'generation',
              amount: -totalCost,
              currency: 'USD',
              date: new Date(),
              status: 'completed',
            },
          },
        }
      );
    }

    return jsonResponse(
      {
        generationId: insertedId.toString(),
        images,
        cost: totalCost,
        balance: currentBalance - totalCost,
        provider: usingOpenAI ? 'openai' : 'pollinations',
        projectId: project ? project._id.toString() : null,
      },
      200
    );
  } catch (error) {
    console.error('Image generation failed:', error);
    const message =
      error?.status === 401
        ? 'Invalid OpenAI API key.'
        : error?.message || 'Image generation failed due to a server error.';
    return jsonResponse({ message }, error?.status && error.status < 500 ? error.status : 500);
  }
}
