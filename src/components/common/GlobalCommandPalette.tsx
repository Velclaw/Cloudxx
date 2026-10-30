import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDns } from '../../context/DnsContext';
import {
  Search,
  X,
  Globe,
  Database,
  History,
  ArrowRight,
  CornerDownLeft,
  Command,
  FileCode,
  Shield,
  Zap,
  Tag
} from 'lucide-react';

type SearchCategory = 'all' | 'records' | 'domains' | 'audit';

interface SearchResultItem {
  id: string;
  type: 'domain' | 'record' | 'audit';
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  rawItem: any;
}

export const GlobalCommandPalette: React.FC = () => {
  const {
    isSearchPaletteOpen,
    setIsSearchPaletteOpen,
    domains,
    records,
    auditLogs,
    navigateToSearchResult
  } = useDns();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Global hotkey: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchPaletteOpen(!isSearchPaletteOpen);
      } else if (e.key === 'Escape' && isSearchPaletteOpen) {
        e.preventDefault();
        setIsSearchPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchPaletteOpen, setIsSearchPaletteOpen]);

  // Focus input on open
  useEffect(() => {
    if (isSearchPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isSearchPaletteOpen]);

  // Compute search results
  const domainMap = useMemo(() => {
    const map = new Map<string, string>();
    domains.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [domains]);

  const searchResults: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results: SearchResultItem[] = [];

    // Search Domains
    if (selectedCategory === 'all' || selectedCategory === 'domains') {
      domains.forEach((dom) => {
        const matchName = dom.name.toLowerCase().includes(q);
        const matchRegistrar = dom.registrar.toLowerCase().includes(q);
        const matchEnv = dom.environment.toLowerCase().includes(q);

        if (!q || matchName || matchRegistrar || matchEnv) {
          results.push({
            id: `domain-${dom.id}`,
            type: 'domain',
            title: dom.name,
            subtitle: `${dom.registrar} · ${dom.recordCount} bản ghi · Môi trường ${dom.environment}`,
            badge: 'TÊN MIỀN',
            badgeColor: 'border-emerald-800 bg-emerald-950/60 text-emerald-400',
            rawItem: dom
          });
        }
      });
    }

    // Search DNS Records
    if (selectedCategory === 'all' || selectedCategory === 'records') {
      records.forEach((rec) => {
        const domainName = domainMap.get(rec.domainId) || 'domain';
        const matchHost = rec.name.toLowerCase().includes(q);
        const matchContent = rec.content.toLowerCase().includes(q);
        const matchType = rec.type.toLowerCase().includes(q);
        const matchComment = rec.comment?.toLowerCase().includes(q);
        const matchDomain = domainName.toLowerCase().includes(q);

        if (!q || matchHost || matchContent || matchType || matchComment || matchDomain) {
          results.push({
            id: `record-${rec.id}`,
            type: 'record',
            title: `${rec.name} · ${rec.content}`,
            subtitle: `${domainName} · TTL ${rec.ttl}s · ${rec.category.toUpperCase()}${rec.autoUpdateEnabled ? ' · DDNS' : ''}`,
            badge: rec.type,
            badgeColor: 'border-cyan-800 bg-cyan-950/60 text-cyan-300 font-mono',
            rawItem: rec
          });
        }
      });
    }

    // Search Audit Logs
    if (selectedCategory === 'all' || selectedCategory === 'audit') {
      auditLogs.forEach((log) => {
        const matchAction = log.action.toLowerCase().includes(q);
        const matchActor = log.actor.name.toLowerCase().includes(q);
        const matchDetails = log.details.toLowerCase().includes(q);
        const matchDomain = log.domainName.toLowerCase().includes(q);
        const matchIp = log.ipAddress.toLowerCase().includes(q);

        if (!q || matchAction || matchActor || matchDetails || matchDomain || matchIp) {
          results.push({
            id: `audit-${log.id}`,
            type: 'audit',
            title: `${log.action.replace('_', ' ')}: ${log.domainName}`,
            subtitle: `${log.details} · Bởi ${log.actor.name} (${log.ipAddress})`,
            badge: 'NHẬT KÝ',
            badgeColor: 'border-purple-800 bg-purple-950/60 text-purple-300',
            rawItem: log
          });
        }
      });
    }

    // Limit to 40 max for high performance
    return results.slice(0, 40);
  }, [query, selectedCategory, domains, records, auditLogs, domainMap]);

  // Adjust selectedIndex if it goes out of bounds
  useEffect(() => {
    if (selectedIndex >= searchResults.length) {
      setSelectedIndex(Math.max(0, searchResults.length - 1));
    }
  }, [searchResults.length, selectedIndex]);

  // Keyboard navigation within command palette
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = searchResults[selectedIndex];
      if (current) {
        handleSelectItem(current);
      }
    }
  };

  const handleSelectItem = (item: SearchResultItem) => {
    navigateToSearchResult(item.type, item.rawItem);
  };

  if (!isSearchPaletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsSearchPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800 bg-neutral-900/60">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm bản ghi, tên miền, nhật ký thao tác..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-neutral-500 focus:outline-none font-sans"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setIsSearchPaletteOpen(false)}
            className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-neutral-400 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:text-white cursor-pointer"
          >
            <span>ESC</span>
          </button>
        </div>

        {/* Filter Categories / Quick Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-800/80 bg-neutral-950 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[10px] opacity-70 font-mono">
              ({domains.length + records.length + auditLogs.length})
            </span>
          </button>

          <button
            onClick={() => setSelectedCategory('records')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
              selectedCategory === 'records'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Bản ghi DNS</span>
            <span className="text-[10px] opacity-70 font-mono">({records.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('domains')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
              selectedCategory === 'domains'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Tên miền</span>
            <span className="text-[10px] opacity-70 font-mono">({domains.length})</span>
          </button>

          <button
            onClick={() => setSelectedCategory('audit')}
            className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer min-h-[32px] flex items-center gap-1.5 ${
              selectedCategory === 'audit'
                ? 'bg-white text-black font-semibold'
                : 'bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Nhật ký</span>
            <span className="text-[10px] opacity-70 font-mono">({auditLogs.length})</span>
          </button>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-neutral-900/50"
        >
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-neutral-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-neutral-400" />
              <p className="text-sm font-medium text-neutral-300">Không tìm thấy kết quả phù hợp</p>
              <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                Thử tìm theo tên host (vd: www, mail, api), loại bản ghi (A, CNAME), hoặc tên miền.
              </p>
            </div>
          ) : (
            searchResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-700'
                      : 'hover:bg-neutral-900/50 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="shrink-0">
                      {item.type === 'domain' && (
                        <div className="w-8 h-8 rounded-lg bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'record' && (
                        <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/80 flex items-center justify-center text-cyan-400">
                          <Database className="w-4 h-4" />
                        </div>
                      )}
                      {item.type === 'audit' && (
                        <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-800/80 flex items-center justify-center text-purple-400">
                          <History className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-white truncate font-mono">
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-medium shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300 hidden sm:inline ${
                        isSelected ? 'text-neutral-300' : ''
                      }`}
                    >
                      {item.type === 'domain' ? 'Đi tới Tên miền' : item.type === 'record' ? 'Đi tới Bản ghi' : 'Xem Nhật ký'}
                    </span>
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center transition-transform ${
                        isSelected ? 'text-white translate-x-0.5' : 'text-neutral-600'
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Command Palette Footer Help */}
        <div className="px-4 py-2.5 bg-neutral-900/40 border-t border-neutral-800 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                ↓
              </kbd>
              <span>Di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                ↵
              </kbd>
              <span>Chọn & làm nổi bật</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                ESC
              </kbd>
              <span>Đóng</span>
            </span>
          </div>

          <div className="sm:hidden text-neutral-400">
            Chạm vào kết quả để di chuyển và làm nổi bật
          </div>

          <div className="text-[10px] text-neutral-400 font-medium">
            <span>Cloudxx Global Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
