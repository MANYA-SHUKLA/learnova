# AI content generation

Faculty and institution admins can draft a lesson outline, a quiz, and an exam blueprint from a course description. Gemini proposes JSON. Nothing is stored until the user saves the draft, and nothing is published.

## Turn it on

Set these in `backend/.env`:

- `ENABLE_AI=true`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional; defaults to `gemini-2.5-flash`)

If AI is off or the key is missing, generate requests return 502. There is no local fallback outline.

The course needs a description, short description, or at least one learning objective.

## What you can generate

| Action | Who | Saved as |
| --- | --- | --- |
| Outline | `course:write` | Draft modules and rich-text lessons, appended to the course |
| Quiz | `quiz:write` | Questions in a `{courseCode} AI` bank, plus one draft quiz |
| Exam blueprint | `examination:write` | A blueprint. Optional apply onto a draft exam you already created |

Faculty can generate only for courses they teach. Open **Courses** in the faculty sidebar, then the course builder. Institution admins use the same **Generate with AI** button on the institution course builder.

Review the proposal, edit it, then **Save draft**. Publish stays on the existing lesson, quiz, and exam controls.

The same panel includes a teacher brief used for every draft: chapters and topics, a free-text prompt, and negative marks. A quiz can also set marks per question. Those values are sent to Gemini and applied to the draft. For a quiz, each saved question keeps the marks and negative marks you set, and the draft quiz turns negative marking on when that value is above zero. For a blueprint, the topics, prompt, and negative marks are written into the blueprint description so you can edit them before saving.
