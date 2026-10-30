# Global Command Palette Search (⌘K)

A fast, unified command palette search modal allowing engineers to search across all managed DNS records, domains, and audit trail events with direct navigation and visual highlighting.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers, the global search will operate as a keyboard-driven and touch-friendly **Command Palette Modal** (`⌘K` / `Ctrl+K` or quick search button on the top bar and mobile bar). Selecting any result will automatically route to the corresponding tab, select the relevant domain, and scroll/highlight the specific item.

- **Confirmed Interface**: Command palette modal with instant fuzzy search, categorical grouping (Domains, DNS Records, Audit Logs), and keyboard navigation (Up/Down/Enter/Escape).
- **Confirmed Navigation Behavior**: Direct jump to the item's location with persistent domain switching and visual highlight pulse.
- **Mobile Compatibility**: Fully optimized for touch devices with a bottom-sheet presentation on mobile screens and dedicated tap-friendly result rows ($\ge 48\text{px}$).

---

## 1. Overview & Core Concept

- **What It Does**: Provides a universal search interface accessible anywhere in the application. As users type, results are instantly queried across all domains (Apex and subdomains), all DNS record types (`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `SRV`, `CAA`), and all audit trail events (user, action, target IP, and details).
- **Target Audience**: DevOps engineers, network architects, and SecOps auditors managing multi-domain corporate infrastructure who need to locate a specific IP, hostname, or change event without manual browsing.
- **Key Value**: Reduces the time required to locate a malfunctioning record, audit an IP change, or switch between client projects from 4–5 manual clicks to a 2-second keystroke search.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Activation**:
   - Desktop: Pressing `⌘K` (macOS) or `Ctrl+K` (Windows/Linux), or clicking the search bar in the Top Navbar.
   - Mobile: Tapping the search icon in the top app bar or bottom navigation.
2. **Search & Categorized Filtering**:
   - Modal opens with autofocus on the search input.
   - Live categorized sections:
     - **Tên miền (Domains)**: Domain name, registrar, status, record count.
     - **Bản ghi DNS (DNS Records)**: Record type tag (`A`, `CNAME`, `TXT`, etc.), hostname, target value/IP, parent domain.
     - **Nhật ký kiểm toán (Audit Logs)**: Action type, actor name, timestamp, affected domain, and IP.
   - Category filter pills (`Tất cả`, `Bản ghi`, `Tên miền`, `Nhật ký`) to quickly narrow down large result sets.
3. **Selection & Highlighting**:
   - Tapping or pressing `Enter` on a result closes the palette, switches the active domain context if needed, opens the appropriate tab (`records`, `domains`, or `audit`), and scrolls smoothly to the target item with an active highlight ring.

### Visual Identity & Theme
- **Theme**: Minimalist Next.js / Vercel monochromatic dark aesthetic.
- **Palette**: Deep pitch black (`#000000`) modal backdrop with subtle hairline border (`border-neutral-800`), neutral surface (`bg-neutral-950`), and crisp high-contrast text (`text-white`, `text-neutral-400`).
- **Typography**: Display titles in clean sans, with record values, hostnames, IPs, and keyboard shortcuts formatted in `font-mono tabular-nums`.
- **Touch Targets**: Mobile touch rows have a minimum height of $48\text{px}$ with tap-active feedback.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full In-Memory Multi-Entity Search**:
  - *Chosen Approach*: Search simultaneously across `domains`, `records` (from all domains, not just the currently selected one), and `auditLogs`.
  - *Why*: Users frequently search for an IP or hostname without remembering which domain zone contains it.
- **Decision 2: Global Hotkey Listener (`⌘K` / `Ctrl+K`)**:
  - *Chosen Approach*: Window-level keydown event listener with input isolation (ignores hotkey when user is typing in regular text inputs unless `⌘`/`Ctrl` is held).
  - *Why*: Standard enterprise convention in tools like GitHub, Vercel, and Cloudflare.
- **Decision 3: Seamless Context Switching on Selection**:
  - *Chosen Approach*: When a record belonging to domain B is selected while domain A is active, the app automatically switches `selectedDomainId` to domain B and navigates to the records tab.

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                        Navbar                          │
│   [Logo]  [Domain Picker]  [⌘K Search Button]  [Add]   │
└───────────────────────────┬────────────────────────────┘
                            │ (opens)
                            ▼
┌────────────────────────────────────────────────────────┐
│             GlobalCommandPalette (Modal)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔍 Search DNS records, domains, audit logs...  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Categories: [All] [Records] [Domains] [Audit]   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🌐 DOMAINS                                       │  │
│  │   • vnpay-core.vn · Cloudflare (14 records)      │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ ⚡ DNS RECORDS                                   │  │
│  │   • [A] api.vnpay-core.vn -> 198.51.100.24       │  │
│  │   • [TXT] @.vnpay-core.vn -> v=spf1...           │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 📜 AUDIT LOGS                                    │  │
│  │   • UPDATE_RECORD: @ on vnpay-core.vn            │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │ (onSelect)
                            ▼
┌────────────────────────────────────────────────────────┐
│                      DnsContext                        │
│   • setSelectedDomainId(targetDomainId)                │
│   • setActiveTab('records' | 'domains' | 'audit')      │
│   • setHighlightedItemId(targetId)                     │
└────────────────────────────────────────────────────────┘
```

### Component & State Plan
1. **`GlobalCommandPalette.tsx`**:
   - Manages query string, category tab filter, active keyboard index (arrow keys navigation), and results grouping.
   - Listens to `keydown` for `Escape` to close, `ArrowDown` / `ArrowUp` to cycle through items, and `Enter` to select.
2. **`Navbar.tsx`**:
   - Integrates a minimalist `⌘K` search button with search icon and shortcut chip.
   - On mobile, renders a prominent search trigger icon.
3. **`DnsContext.tsx`**:
   - Adds `highlightedItemId` state with auto-clearing after 3 seconds, enabling smooth scroll and visual pulse on navigated records or audit entries.
