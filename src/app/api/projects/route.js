import { ObjectId } from 'mongodb';
import { connectToDatabase } from '../../../lib/mongodb';
import { getUserFromToken } from '../../../lib/auth';
import { COLLECTIONS } from '../../../config/constants';

const ALLOWED_STATUSES = new Set(['draft', 'in-progress', 'completed']);

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toClientProject(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || '',
    status: doc.status || 'draft',
    imageCount: doc.imageCount || 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export async function GET(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { db } = await connectToDatabase();
  const docs = await db
    .collection(COLLECTIONS.PROJECTS)
    .find({ userId: user._id })
    .sort({ createdAt: -1 })
    .toArray();

  return jsonResponse({ projects: docs.map(toClientProject) }, 200);
}

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { title, description = '' } = await req.json().catch(() => ({}));
  if (!title || !title.trim()) {
    return jsonResponse({ message: 'Project title is required.' }, 400);
  }

  const { db } = await connectToDatabase();
  const doc = {
    _id: new ObjectId(),
    userId: user._id,
    title: title.trim(),
    description: description.trim(),
    status: 'draft',
    imageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection(COLLECTIONS.PROJECTS).insertOne(doc);

  return jsonResponse({ project: toClientProject(doc) }, 201);
}

export async function PATCH(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { id, title, description, status } = await req.json().catch(() => ({}));
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse({ message: 'Valid project id is required.' }, 400);
  }

  const update = { updatedAt: new Date() };
  if (typeof title === 'string' && title.trim()) update.title = title.trim();
  if (typeof description === 'string') update.description = description.trim();
  if (status) {
    if (!ALLOWED_STATUSES.has(status)) {
      return jsonResponse({ message: 'Invalid status.' }, 400);
    }
    update.status = status;
  }

  const { db } = await connectToDatabase();
  const updatedDoc = await db.collection(COLLECTIONS.PROJECTS).findOneAndUpdate(
    { _id: new ObjectId(id), userId: user._id },
    { $set: update },
    { returnDocument: 'after' }
  );

  if (!updatedDoc) {
    return jsonResponse({ message: 'Project not found.' }, 404);
  }

  return jsonResponse({ project: toClientProject(updatedDoc) }, 200);
}

export async function DELETE(req) {
  const user = await getUserFromToken(req);
  if (!user) return jsonResponse({ message: 'Authentication required.' }, 401);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id || !ObjectId.isValid(id)) {
    return jsonResponse({ message: 'Valid project id is required.' }, 400);
  }

  const { db } = await connectToDatabase();
  const result = await db.collection(COLLECTIONS.PROJECTS).deleteOne({
    _id: new ObjectId(id),
    userId: user._id,
  });

  if (result.deletedCount === 0) {
    return jsonResponse({ message: 'Project not found.' }, 404);
  }

  return jsonResponse({ success: true }, 200);
}
