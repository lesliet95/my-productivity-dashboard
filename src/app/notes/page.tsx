export const dynamic = "force-dynamic";

import { getNotes } from "@/lib/actions/notes";
import NoteEditor from "@/components/NoteEditor";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notes</h1>
        <p className="text-sm text-gray-500 mt-1">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
      </div>
      <NoteEditor initialNotes={notes} />
    </div>
  );
}
