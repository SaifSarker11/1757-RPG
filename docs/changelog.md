# Changelog & Project Enhancements — 1757 RPG Game

This document records the architectural changes, gameplay fixes, and UI/UX design enhancements made to the **1757 RPG Game** codebase.

---

## 1. UI/UX Redesigns & Custom Themes

*   **DaisyUI v5 Upgrade:** Upgraded the Next.js web application to **DaisyUI v5** (`^5.7.8`), ensuring complete compatibility with the CSS-first architecture of **Tailwind CSS v4**.
*   **CSS-First Configuration:** Added the `@plugin` block configuration directly inside `globals.css` to load all built-in DaisyUI design tokens:
    ```css
    @import "tailwindcss";
    @plugin "daisyui" {
      themes: all;
    }
    ```
*   **Theme Selection Dropdown:** Integrated a theme selection control in both `/home` and `/room/[id]` screens, allowing players to toggle between all 32 core DaisyUI themes (e.g. `retro`, `dim`, `dracula`, `synthwave`, `cupcake`). The selected theme is cached in `localStorage` to persist across navigations.
*   **Clean Page Styles:** Cleaned out all browser colored emojis from layout screens, headings, status notifications, and buttons to give the game a professional, clean social deduction atmosphere.

---

## 2. Profile Settings & Custom Display Names

*   **Player Settings Panel:** Introduced a player settings card on the `/home` dashboard, allowing users to customize their display name instead of remaining anonymous.
*   **Profile Update API:** Created a `POST /users/update-profile` REST endpoint in the Fastify server. It updates the Prisma database records for the authenticated session user.
*   **Session Syncing:** Triggered an active `better-auth` session revalidation upon profile saves to immediately refresh name displays across header banners and cards.
*   **Real Profile Names in Game:** Modified `GET /rooms/:roomId` to include the `user` table relation inside the players array, populating the lobby lists with actual player profile names instead of guest placeholders.

---

## 3. Scope Isolation & Chat Security

*   **No Chat Bleed:** Isolated global lobby chats from private game rooms.
*   **Lobby Scoping:** The socket server now places connected clients into a `"lobby"` socket room on connection. The Lobby Chat panel has been removed from `/home` to avoid public chat confusion.
*   **Private Room Scoping:** Upon joining a game room, the socket leaves `"lobby"` and joins the specific `roomId` room.
*   **Room Chat Caching (Tab Sleep Fix):**
    *   Added a `roomChatHistories` Map in the Socket.IO server to store private room chats in memory.
    *   When the browser tab is sent to the background (sleeping), the WebSocket disconnects. Upon return, the socket reconnects and rejoins the room.
    *   The server now pushes the room's specific chat history back to the client upon joining (`room:join` event), ensuring chat messages never disappear when switching tabs or apps.

---

## 4. Connection State & Status Indicators

*   **Active Status Tracker:** Implemented real-time tracking for players online status in rooms.
*   **Join/Leave Notifications:** The server registers and broadcasts `player:status` alerts with `{ userId, online: true/false }` on `room:join`, `room:leave`, and socket `disconnect` events.
*   **Active Socket Query:** When a client joins, the server fetches all current active sockets in that room via `io.in(roomId).fetchSockets()` and sends the active list down as `room:online-list`.
*   **Visual dot indicator:** Displayed a green dot `●` for online and a grey dot `○` for offline (with name strike-through and "Offline" badge) next to names in the players column.

---

## 5. Room Lookup & Casing Fallbacks

*   **Pasting Room Codes:** Removed forced uppercase formatting from the join code field to allow pasting low-case registry IDs.
*   **Flexible Lookup Endpoint:** Modified `GET /rooms/code/:code` to look up rooms in the database using:
    *   The 6-character random room code (case-insensitive).
    *   The full UUID room ID.
    *   The first 6 characters (prefix) of the room ID.
*   This prevents "Invalid Room Code" errors if a user copies fallback prefixes from the URL or copies lowercase letters.

---

## 6. Leave Room Mechanics

*   **API Leave Endpoint:** Connected the client to the `POST /rooms/:roomId/leave` endpoint.
*   **Leave Room Controls:** Added a prominent **"Leave Room"** button to the navbar of [room/[id]/page.tsx](file:///d:/iut%20student%20life/labtasks/spl2/1757/apps/web/app/room/%5Bid%5D/page.tsx). Clicking it removes the player from the database list, broadcasts a leave event to the socket channel, and redirects them to the main dashboard.
