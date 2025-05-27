import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, context: { params: { id: string } }) {
  const session = await getServerSession(req, authOptions); // ✅ CORRECT usage

  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const noteId = context.params.id;

  try {
    const client = await clientPromise;
    const db = client.db("quicknote");
    const notesCollection = db.collection("notes");

    const { content, tags } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const objectIdNoteId = new ObjectId(noteId);
    const existingNote = await notesCollection.findOne({
      _id: objectIdNoteId,
      userId,
    });

    if (!existingNote) {
      return new NextResponse("Note not found or unauthorized", {
        status: 404,
      });
    }

    await notesCollection.updateOne(
      { _id: objectIdNoteId, userId },
      {
        $set: {
          content,
          tags: tags || [],
          updatedAt: new Date().toISOString(),
        },
      },
    );

    const updatedNote = await notesCollection.findOne({ _id: objectIdNoteId });

    return NextResponse.json({
      ...updatedNote,
      _id: updatedNote!._id.toString(),
      id: updatedNote!._id.toString(),
    });
  } catch (error) {
    console.error("Error updating note:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } },
) {
  const session = await getServerSession(request, authOptions);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Assert session.user has id after checking session exists
  const userId = (session.user as { id: string }).id;
  const noteId = context.params.id;

  try {
    const client = await clientPromise;
    const db = client.db("quicknote"); // Replace 'quicknote' with your database name
    const notesCollection = db.collection("notes"); // Replace 'notes' with your notes collection name

    const objectIdNoteId = new ObjectId(noteId);

    // Ensure the user owns the note before deleting
    const existingNote = await notesCollection.findOne({
      _id: objectIdNoteId,
      userId: userId,
    });

    if (!existingNote) {
      return new NextResponse("Note not found or unauthorized", {
        status: 404,
      });
    }

    const deleteResult = await notesCollection.deleteOne({
      _id: objectIdNoteId,
      userId: userId,
    });

    if (deleteResult.deletedCount === 0) {
      return new NextResponse("Note not found or unauthorized", {
        status: 404,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting note:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
