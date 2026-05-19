# Test Report — Conversation History & Document Tagging Enhancement

**Date:** 2026-05-19  
**Tester:** GitHub Copilot (live browser testing via Playwright)  
**Feature:** Task 08 — Persisted Conversation History with Document Scoping  
**Status:** ✅ Complete — All 25 tests PASS, 1 bug found  

---

## 1. Environment

| Component | Details |
|-----------|---------|
| **Server** | NestJS v11 · `http://localhost:3000` |
| **Client** | React 19 + Vite + TanStack Router · `http://localhost:5173` |
| **Database** | PostgreSQL (Docker `postgres18`) · DB: `rag_naive_rag` |
| **Vector DB** | Qdrant `http://localhost:6333` · collection: `documents` · cosine · size 768 |
| **LLM** | Ollama `minimax-m2.5:cloud` · temp=0 |
| **Embeddings** | `nomic-embed-text:v1.5` |
| **Chunk config** | size=800, overlap=100, top-K=5 |
| **Auth user** | Ada Lovelace `ada@company.com` (HttpOnly cookie JWT) |
| **Test documents** | `test_doc.txt` (1 chunk · user management) · `flight_ops.txt` (3 chunks · SkyBuddy Flight Operations Manual) |

---

## 2. Summary

| Metric | Value |
|--------|-------|
| Total tests | 25 |
| ✅ PASS | 25 |
| ❌ FAIL | 0 |
| 🐛 Bugs found | 1 (medium severity) |
| ⚠️ Improvements | 10 |

---

## 3. Test Results

### 3.1 Page Load & Auto-Selection

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-01 | Page loads and auto-selects the first conversation | ✅ PASS | Sidebar highlighted `test_doc.txt` on initial load; no manual action required |
| ST-02 | Persisted messages load from the database | ✅ PASS | 2 previously sent messages appeared immediately on page load |
| ST-03 | Sidebar shows conversation title and document count badge | ✅ PASS | `test_doc.txt · 1 documents` rendered correctly in the sidebar |
| ST-18 | Hard page refresh persists all conversations and messages | ✅ PASS | After full reload, all 3 conversations and their full message history reloaded from DB |

### 3.2 Conversation Header & Composer UI

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-04 | Conversation header shows document scope badge | ✅ PASS | FileText icon badge with filename visible in `<ConversationHeader>` |
| ST-05 | Composer shows document scope badge above textarea | ✅ PASS | Badge rendered above input field for all conversations |
| ST-06 | Composer label reads "Scoped RAG · top 5 chunks" | ✅ PASS | Exact text confirmed in accessibility snapshot |
| ST-07 | Send button disabled when input is empty | ✅ PASS | `button "Send" [disabled]` confirmed with blank textarea |

### 3.3 New Chat Dialog

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-08 | New Chat dialog renders all indexed documents with chunk counts | ✅ PASS | Dialog showed `flight_ops.txt (3 chunks)` and `test_doc.txt (1 chunks)` |
| ST-09 | "Create chat" button is disabled when no document is selected | ✅ PASS | `button "Create chat" [disabled]` confirmed with no checkbox checked |
| ST-10 | Create conversation with 1 document → title = filename | ✅ PASS | Sidebar title = `flight_ops.txt`; composer badge = `flight_ops.txt` |
| ST-11 | Create conversation with 2 documents → title = "N documents" | ✅ PASS | Sidebar title = `2 documents`; both `flight_ops.txt` and `test_doc.txt` badges in composer |

### 3.4 SSE Streaming

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-12 | SSE streaming works — StreamingDots animate then content appears | ✅ PASS | Spinner visible during generation, full markdown content rendered after `done` event |
| ST-13 | Composer disables during streaming | ✅ PASS | Textarea and Send button both `[disabled]` during active stream |
| ST-14 | Suggested prompts auto-submit and stream correctly | ✅ PASS | Clicking "Summarize the selected documents in 5 bullets" sent message directly and streamed response |

### 3.5 Scoped Retrieval

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-15 | In-scope question returns answer with matching sources | ✅ PASS | In `flight_ops.txt` conv: "What are the catering inventory requirements?" → correct answer, 3 chunks from `flight_ops.txt` (scores: 0.787, 0.660, 0.625) |
| ST-16 | Sources are strictly limited to selected documents | ✅ PASS | Zero chunks from `test_doc.txt` appeared in a `flight_ops.txt`-only conversation |
| ST-17 | Out-of-scope question returns fallback message | ✅ PASS | In `flight_ops.txt` conv, "Can admin users create, edit, and delete accounts?" → `"I could not find this information in the uploaded document. The provided context covers flight operations topics..."` |
| ST-19 | 2-doc conversation retrieves sources from both documents | ✅ PASS | "What can admin users do and what is the crew rotation policy?" → Sources: `flight_ops.txt · 0.590`, `flight_ops.txt · 0.554`, **`test_doc.txt · 0.547`**, `flight_ops.txt · 0.546` |

### 3.6 Conversation History (Context Window)

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-20 | Full conversation history included in LLM prompt | ✅ PASS | Second message: "What are the main facts in this conversation?" → LLM referenced "The user requested a 5-bullet summary" from the prior message, confirming history is sent to LLM |

### 3.7 Conversation Switching

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-21 | Switching conversations reloads messages correctly | ✅ PASS | Clicking `test_doc.txt` in sidebar instantly loaded its 2-message history; composer badge switched accordingly |
| ST-22 | Switching conversation updates document scope badges | ✅ PASS | Header and composer badges updated to match the newly active conversation's document set |
| ST-23 | Mid-stream conversation switch closes the SSE stream cleanly | ✅ PASS | Network log showed `ERR_ABORTED` on the stream URL after switching; new conversation loaded without spinner or stream bleed-over. No crash or stale output. |

### 3.8 Clipboard & UX

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| ST-24 | Copy button shows "Copied to clipboard" toast | ✅ PASS | `data-sonner-toast` and `aria-live` region both confirmed `"Copied to clipboard"` notification |
| ST-25 | Empty state renders with suggested prompts for new conversations | ✅ PASS | "Start the conversation" heading + 4 prompt buttons rendered on freshly created conversation |

---

## 4. Bug Report

### BUG-01 — Documents Query Not Refreshed After Upload via Header Upload Button

| Field | Value |
|-------|-------|
| **ID** | BUG-01 |
| **Severity** | Medium |
| **Component** | `client/src/components/app/app-header.tsx` |
| **Status** | Open |

**Description:**  
When a user uploads a document using the "Upload" button in the application header (visible on all pages including Chat), the `documentsQuery` in `app.chat.tsx` is not invalidated. Newly uploaded documents do not appear in the "New Chat" dialog until the page is manually refreshed.

**Steps to Reproduce:**
1. Log in and navigate to the Chat page
2. Click the "Upload" button in the app header (top-right)
3. Upload any `.txt` file
4. Click "New chat" in the sidebar
5. **Observe:** The newly uploaded file is absent from the document selection list

**Root Cause:**  
`app-header.tsx` renders `<UploadDialog>` without an `onUploaded` callback:

```tsx
// app-header.tsx — CURRENT (buggy)
<UploadDialog />
```

The `upload-dialog.tsx` component calls `onUploaded?.()` on successful upload, but the prop is optional and the call is a no-op when not provided. `app.documents.tsx` correctly wires this:

```tsx
// app.documents.tsx — CORRECT (reference)
<UploadDialog onUploaded={refreshDocuments} />
```

**Recommended Fix:**

```tsx
// app-header.tsx — add inside component body
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Pass onUploaded to UploadDialog:
<UploadDialog
  onUploaded={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
/>
```

**Workaround:** Manually reload the page (F5) after uploading via the header button.

---

## 5. What Can Be Improved

### IMP-01 (Fix — High Priority) — Wire `onUploaded` Callback in `app-header.tsx`

This is the fix for BUG-01. Should be shipped before or alongside the feature release. It is a 3-line change:
1. Import `useQueryClient`
2. Call `const queryClient = useQueryClient()` inside the component
3. Pass `onUploaded` to `<UploadDialog>`

---

### IMP-02 — Allow Conversation Title Editing

Conversation titles are auto-generated at creation and cannot be changed:
- 1 document → filename (e.g., `flight_ops.txt`)
- 2+ documents → `N documents`

**Improvement:** Add inline title editing (double-click or pencil icon on sidebar item) backed by a new `PATCH /api/v1/chat/conversations/:id` endpoint. Lets users distinguish between multiple conversations scoped to the same documents.

---

### IMP-03 — Allow Adding/Removing Documents from an Existing Conversation

The document scope is frozen at creation. Adding a new document to an existing conversation requires creating a brand-new conversation and re-establishing context.

**Improvement:** Add an "Edit scope" button in the conversation header that opens the document picker and PATCHes the `conversation_documents` join table. Show a warning that changing scope after messages exist may affect answer consistency.

---

### IMP-04 — Add Conversation Delete / Archive

No UI exists to delete or archive conversations. The sidebar grows indefinitely.

**Improvement:** Add a context menu (right-click or `···` menu) on each sidebar conversation item with "Rename", "Delete", and optionally "Archive" actions. Deletion should cascade-delete messages (FK already supports this).

---

### IMP-05 — Add "Stop Generating" Button During Streaming

During SSE streaming the composer is fully locked. Users cannot abort a long or unwanted generation.

**Improvement:** Replace the disabled Send button with an active "Stop" (◼ icon) button during streaming. Clicking it calls `eventSource.close()` on the `streamCleanupRef` and marks the message as `[truncated]`.

---

### IMP-06 — Implement the Header Search Box

The search box in the header (`Search... ⌘K`) is currently non-functional — clicking it does nothing.

**Improvement:** Wire it up as a command palette or conversation filter. At minimum, implement client-side filtering of conversation titles in the sidebar when text is typed.

---

### IMP-07 — More Descriptive Multi-Document Conversation Titles

`2 documents` is ambiguous when multiple multi-document conversations exist.

**Improvement:** Auto-generate compound titles such as `flight_ops + test_doc` (truncated at ~40 chars with ellipsis) instead of `N documents`. Still allow override via IMP-02.

---

### IMP-08 — Show Message Timestamps

No timestamps appear on any message. For a research/RAG tool, timestamps help trace which answers were based on what version of the data.

**Improvement:** Render a relative timestamp (e.g., "3 minutes ago") beneath each message bubble. The `createdAt` field already exists in `conversation_messages` and is returned by the API.

---

### IMP-09 — Loading Skeleton for Message History

When switching conversations there is a brief blank state while the `getConversation` query resolves. The current `<LoadingConversation>` renders a centered spinner.

**Improvement:** Replace with a skeleton layout matching the message structure (alternating left/right bubble placeholders at varied widths). This provides a better loading affordance and reduces layout shift.

---

### IMP-10 — SSE Reconnection / Error Recovery

`chatService.streamMessage()` uses a bare `EventSource` with no retry or error-recovery logic. A mid-stream network blip silently terminates the stream, leaving the user with a partial or empty response.

**Improvement:**
1. Handle `EventSource.onerror`: if `readyState === CLOSED`, show a toast "Connection lost — click to retry" with a retry button that re-calls `streamMessage` with the same `messageId`.
2. Alternatively, implement exponential back-off reconnection (up to 3 attempts) before surfacing the error to the user.

---

## 6. DB State After Testing

| Table | Rows | Notes |
|-------|------|-------|
| `users` | 3 | Ada Lovelace + 2 others |
| `documents` | 2 | `test_doc.txt` (1 chunk), `flight_ops.txt` (3 chunks) |
| `conversations` | 3 | `test_doc.txt` (1 doc), `flight_ops.txt` (1 doc), `2 documents` (2 docs) |
| `conversation_documents` | 4 | 1 + 1 + 2 join rows |
| `conversation_messages` | 10+ | All persisted across sessions and page reloads |

---

## 7. Conclusion

The **Conversation History & Document Tagging** feature is production-ready. All 25 manual browser tests pass, covering the full set of critical paths:

- Conversation creation with 1 or multiple documents
- Auto-generated title logic (filename vs. "N documents")
- SSE streaming with `StreamingDots` and progressive token rendering
- Strict document-scoped vector retrieval (no cross-conversation leakage)
- Fallback response when query is out of scope
- Full conversation history sent in LLM context window
- Conversation switching with state isolation and stream cleanup
- Mid-stream conversation switch without crash or bleed-over
- Persistence across hard page reloads
- Clipboard copy toast and suggested prompt auto-submit

**One medium-severity bug (BUG-01)** exists and should be resolved before shipping. The fix is trivial (3 lines in `app-header.tsx`).

**10 improvement items** are catalogued above. The five highest-priority are:
1. **IMP-01** — Fix BUG-01 (header upload → invalidate documents query)
2. **IMP-02** — Conversation title editing
3. **IMP-04** — Conversation delete/archive
4. **IMP-05** — Stop generating button
5. **IMP-10** — SSE reconnection/error recovery
