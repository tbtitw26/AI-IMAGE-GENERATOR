import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromToken } from '../../../lib/auth';
import { COLLECTIONS } from '../../../config/constants';

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toClientImage(doc) {
  return {
    id: doc._id.toString(),
    title: doc.prompt,
    category: doc.model,
    model: doc.model,
    aspectRatio: doc.aspectRatio,
    src: doc.dataUrl,
    favorite: Boolean(doc.favorite),
    projectId: doc.projectId ? doc.projectId.toString() : null,
    createdAt: doc.createdAt,
  };
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return jsonResponse({ message: 'Authentication required.' }, 401);
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  const query = { userId: user._id };
  if (projectId && ObjectId.isValid(projectId)) {
    query.projectId = new ObjectId(projectId);
  }

  const { db } = await connectToDatabase();
  const docs = await db
    .collection(COLLECTIONS.IMAGES)
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  return jsonResponse({ images: docs.map(toClientImage) }, 200);
}

export async function PATCH(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return jsonResponse({ message: 'Authentication required.' }, 401);
  }

  const { id, favorite } = await req.json().catch(() => ({}));
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse({ message: 'Valid image id is required.' }, 400);
  }

  const { db } = await connectToDatabase();
  const updatedDoc = await db.collection(COLLECTIONS.IMAGES).findOneAndUpdate(
    { _id: new ObjectId(id), userId: user._id },
    { $set: { favorite: Boolean(favorite) } },
    { returnDocument: 'after' }
  );

  if (!updatedDoc) {
    return jsonResponse({ message: 'Image not found.' }, 404);
  }

  return jsonResponse({ image: toClientImage(updatedDoc) }, 200);
}

export async function DELETE(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return jsonResponse({ message: 'Authentication required.' }, 401);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse({ message: 'Valid image id is required.' }, 400);
  }

  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTIONS.IMAGES).deleteOne({
    _id: new ObjectId(id),
    userId: user._id,
  });

  if (result.deletedCount === 0) {
    return jsonResponse({ message: 'Image not found.' }, 404);
  }

  return jsonResponse({ success: true }, 200);
}
