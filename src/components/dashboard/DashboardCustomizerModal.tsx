import React from 'react';
import { useDns } from '../../context/DnsContext';
import { DashboardWidgetConfig, DashboardWidgetId } from '../../types/dns';
import {
  SlidersHorizontal,
  X,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Check,
  Layers
} from 'lucide-react';

interface DashboardCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: DashboardWidgetConfig[];
  onSaveWidgets: (widgets: DashboardWidgetConfig[]) => void;
  onResetWidgets: () => void;
}

export const DashboardCustomizerModal: React.FC<DashboardCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSaveWidgets,
  onResetWidgets
}) => {
  const [localWidgets, setLocalWidgets] = React.useState<DashboardWidgetConfig[]>(widgets);

  React.useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets, isOpen]);

  if (!isOpen) return null;

  const handleToggleVisible = (id: DashboardWidgetId) => {
    setLocalWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localWidgets.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const reordered = [...localWidgets];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);

    // Update order index
    const updated = reordered.map((w, idx) => ({ ...w, order: idx + 1 }));
    setLocalWidgets(updated);
  };

  const handleSave = () => {
    onSaveWidgets(localWidgets);
    onClose();
  };

  const handleReset = () => {
    onResetWidgets();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tùy Biến Bảng Điều Khiển (Dashboard)</h2>
              <p className="text-xs text-slate-400">Ẩn/hiện và sắp xếp thứ tự hiển thị các khối tiện ích (Widgets)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Widgets Reordering & Visibility List */}
        <div className="space-y-2.5 py-4 max-h-80 overflow-y-auto pr-1 text-xs">
          {localWidgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                widget.visible
                  ? 'bg-slate-950/70 border-slate-700/80'
                  : 'bg-slate-950/30 border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-500 font-bold text-xs w-4 text-center">
                  {index + 1}
                </span>
                <div>
                  <span className={`font-semibold ${widget.visible ? 'text-white' : 'text-slate-400 line-through'}`}>
                    {widget.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    ID: {widget.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Move Up / Down */}
                <div className="flex items-center gap-0.5 border border-slate-800 rounded p-0.5 bg-slate-900">
                  <button
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                    title="Di chuyển lên trên"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === localWidgets.length - 1}
                    className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-20 cursor-pointer"
                    title="Di chuyển xuống dưới"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Visibility Toggle */}
                <button
                  onClick={() => handleToggleVisible(widget.id)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    widget.visible
                      ? 'bg-cyan-950/60 text-cyan-400 border-cyan-800'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={widget.visible ? 'Nhấp để ẩn khối này' : 'Nhấp để hiện khối này'}
                >
                  {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định ban đầu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg shadow-sm cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Áp dụng cấu hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
