import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"; // Import authOptions

export async function GET(request: Request) {
  const session = await getServerSession(authOptions); // Get session on the server

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Assert session.user has id after checking session exists
  const userId = (session.user as { id: string }).id;

  try {
    const client = await clientPromise;
    const db = client.db('quicknote'); // Use consistent DB name
    const notesCollection = db.collection('notes'); // Replace 'notes' with your notes collection name

    const notes = await notesCollection.find({ userId: userId }).toArray();

    // Map ObjectId to string for the client
    const serializableNotes = notes.map(note => ({
      ...note,
      _id: note._id.toString(),
      id: note._id.toString(), // Use _id as id for consistency with the Note interface
    }));

    return NextResponse.json(serializableNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Assert session.user has id after checking session exists
  const userId = (session.user as { id: string }).id;

  try {
    const client = await clientPromise;
    const db = client.db('quicknote'); // Replace 'quicknote' with your database name
    const notesCollection = db.collection('notes'); // Replace 'notes' with your notes collection name

    const { content, tags } = await request.json();

    if (!content) {
        return new NextResponse('Content is required', { status: 400 });
    }

    const newNote = {
      userId: userId,
      content: content,
      tags: tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = await notesCollection.insertOne(newNote);

    // Return the created note with the generated _id as id
    const createdNote = {
        ...newNote,
        _id: result.insertedId.toString(),
        id: result.insertedId.toString(),
    }

    return NextResponse.json(createdNote, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
