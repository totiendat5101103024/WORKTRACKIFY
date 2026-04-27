/**
 * Dashboard — Bento Grid layout displaying salary stats,
 * weekly breakdown, and upcoming shifts.
 * Now consumes data from CalendarContext instead of props.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase, ChevronLeft, ChevronRight, AlertCircle,
  Settings, RefreshCw, CalendarDays, Zap, CheckCircle2,
  ChevronDown, Clock, Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useCalendar } from '../context/CalendarContext';
import { formatHours } from '../hooks/useSalaryCalculation';

export default function Dashboard() {
  const {
    user, currentMonth, prevMonth, nextMonth,
    sync, openSettings, loading,
    settings, salaryStats: stats, upcomingShift,
    lastSyncInfo, events, processedEvents,
    setEventMultiplier, holidayMultipliers,
  } = useCalendar();
  const [showEventList, setShowEventList] = useState(false);

  const remainingToTarget = Math.max(0, settings.targetSalary - stats.totalSalary);
  const hoursNeeded = remainingToTarget / settings.ratePerHour;

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-50/20 to-surface-100 text-surface-900 font-sans p-4 md:p-6 overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 md:mb-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-gradient-to-br from-brand-400 to-brand-600 p-2.5 rounded-xl shadow-lg shadow-brand-200/40">
            <Briefcase className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-surface-800">WorkTrackify</h1>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="hover:text-brand-500 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
              <span className="text-[10px] md:text-xs text-surface-400 uppercase tracking-[0.15em] font-black">
                {format(currentMonth, 'MMMM yyyy', { locale: vi })}
              </span>
              <button onClick={nextMonth} className="hover:text-brand-500 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button onClick={() => sync()} disabled={loading}
            className="px-3 md:px-5 py-2 md:py-2.5 bg-white border border-surface-200 rounded-full text-xs md:text-sm font-bold hover:bg-surface-50 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <button onClick={openSettings}
            className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center bg-white border border-surface-200 text-surface-500 rounded-full hover:bg-surface-50 transition-all active:scale-95 shadow-sm">
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          {user && (
            <img src={user.picture} alt="" className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm" />
          )}
        </div>
      </header>

      {/* Sync Status Banner */}
      {lastSyncInfo.lastSyncAt && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto w-full mb-4 md:mb-6"
        >
          <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${lastSyncInfo.matchedFilter > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-bold text-surface-600">
                {lastSyncInfo.matchedFilter > 0 ? (
                  <><CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-500 mr-1" />
                  {lastSyncInfo.matchedFilter} ca làm / {lastSyncInfo.totalFetched} sự kiện</>
                ) : (
                  <><Filter className="w-3.5 h-3.5 inline text-amber-500 mr-1" />
                  0 matched — {lastSyncInfo.totalFetched} sự kiện tổng</>
                )}
              </span>
              <span className="text-[10px] text-surface-400 font-medium">
                • Sync {format(lastSyncInfo.lastSyncAt, 'HH:mm:ss')}
              </span>
            </div>
            <button
              onClick={() => setShowEventList(!showEventList)}
              className="flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:text-brand-600 transition-colors"
            >
              {showEventList ? 'Ẩn' : 'Xem'} chi tiết
              <ChevronDown className={`w-3 h-3 transition-transform ${showEventList ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Event List — Work Shifts with Holiday Toggle */}
          <AnimatePresence>
            {showEventList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-white rounded-2xl border border-surface-200/60 p-4 shadow-sm max-h-[400px] overflow-y-auto">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                      {processedEvents.length} ca làm • nhấn 🎉 để đánh dấu ngày lễ (x3)
                    </p>
                  </div>

                  {/* Matched work shifts */}
                  <div className="space-y-2">
                    {[...processedEvents]
                      .sort((a, b) => a.start.getTime() - b.start.getTime())
                      .map(pe => {
                        const isHoliday = pe.multiplier > 1;
                        return (
                          <div
                            key={pe.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                              isHoliday
                                ? 'bg-gradient-to-r from-brand-50 to-orange-50 border-2 border-brand-300 shadow-sm'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {/* Date */}
                            <div className="flex flex-col items-center min-w-[40px]">
                              <span className="text-[9px] uppercase font-black opacity-50">
                                {format(pe.start, 'EEE', { locale: vi })}
                              </span>
                              <span className="text-sm font-black">{format(pe.start, 'dd')}</span>
                            </div>

                            {/* Time & summary */}
                            <div className="flex-1 min-w-0">
                              <span className="block font-bold truncate text-surface-800">
                                {format(pe.start, 'HH:mm')} - {format(pe.end, 'HH:mm')}
                              </span>
                              <span className="text-[10px] text-surface-400 truncate block">{pe.summary}</span>
                            </div>

                            {/* Paid hours */}
                            <div className="text-right min-w-[42px]">
                              <span className="block font-black text-brand-600">{formatHours(pe.paidMinutes)}</span>
                              <span className="text-[9px] text-surface-400">paid</span>
                            </div>

                            {/* Salary */}
                            <div className="text-right min-w-[70px]">
                              <span className={`block font-black ${isHoliday ? 'text-orange-600' : 'text-surface-700'}`}>
                                {Math.round(pe.salary).toLocaleString()}₫
                              </span>
                              {isHoliday && (
                                <span className="text-[9px] text-orange-500">
                                  gốc {Math.round(pe.baseSalary).toLocaleString()}₫
                                </span>
                              )}
                            </div>

                            {/* x3 Holiday Toggle */}
                            <button
                              onClick={() => setEventMultiplier(pe.id, isHoliday ? 1 : 3)}
                              title={isHoliday ? 'Bỏ hệ số lễ' : 'Đánh dấu ngày lễ (x3)'}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                                isHoliday
                                  ? 'bg-gradient-to-r from-brand-500 to-orange-500 text-white shadow-md shadow-brand-300/30'
                                  : 'bg-surface-100 text-surface-400 hover:bg-brand-100 hover:text-brand-600'
                              }`}
                            >
                              🎉 x{isHoliday ? '3' : '1'}
                            </button>
                          </div>
                        );
                      })
                    }
                    {processedEvents.length === 0 && (
                      <p className="text-center text-surface-400 text-sm py-4 italic">Không có ca làm nào trong tháng này</p>
                    )}
                  </div>

                  {/* Unmatched events summary */}
                  {events.length > processedEvents.length && (
                    <p className="text-[10px] text-surface-400 mt-3 text-center">
                      + {events.length - processedEvents.length} sự kiện khác không khớp filter
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 auto-rows-[110px] md:auto-rows-[120px] gap-4 md:gap-6 max-w-7xl mx-auto w-full flex-1">
        {/* Salary Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="col-span-12 md:col-span-5 row-span-2 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-surface-200/60 p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] md:text-sm font-bold text-surface-400 uppercase tracking-widest mb-1 md:mb-2">Thu nhập tháng này</p>
            <h2 className="text-3xl md:text-5xl font-black text-surface-800 tracking-tighter">
              {Math.round(stats.totalSalary).toLocaleString()}
              <span className="text-lg md:text-xl ml-1 opacity-30 font-bold tracking-normal">₫</span>
            </h2>
          </div>
          <div className="mt-4 md:mt-6 z-10">
            <div className="flex justify-between text-[9px] md:text-[10px] font-black mb-2 uppercase tracking-widest opacity-60">
              <span>Mục tiêu: {settings.targetSalary.toLocaleString()}₫</span>
              <span>{stats.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-surface-100 h-3 md:h-4 rounded-2xl overflow-hidden p-0.5 md:p-1 border border-surface-200">
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, stats.progress)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="bg-gradient-to-r from-brand-400 to-brand-600 h-full rounded-xl shadow-[0_0_12px_rgba(236,72,153,0.3)]" />
            </div>
          </div>
          <div className="absolute -right-10 -top-10 bg-brand-100 w-48 h-48 rounded-full blur-3xl opacity-40" />
        </motion.div>

        {/* Upcoming Shift */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="col-span-12 md:col-span-4 row-span-2 bg-gradient-to-br from-brand-500 to-brand-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-xl shadow-brand-300/30 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Ca làm tiếp theo</span>
            <div className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider">
              {upcomingShift ? format(upcomingShift.start, 'EEEE', { locale: vi }) : 'CHƯA CÓ'}
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-base md:text-xl font-bold truncate">{upcomingShift?.summary || 'Nghỉ ngơi ✨'}</h3>
            <p className="text-2xl md:text-4xl font-black mt-1 tracking-tighter">
              {upcomingShift ? `${format(upcomingShift.start, 'HH:mm')} - ${format(upcomingShift.end, 'HH:mm')}` : '-- : --'}
            </p>
            <div className="flex gap-4 mt-4 md:mt-6">
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase font-black opacity-60 tracking-wider">Gross</span>
                <span className="text-xs md:text-sm font-bold">{upcomingShift ? formatHours(upcomingShift.rawMinutes) : '0h'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase font-black opacity-60 tracking-wider">Paid</span>
                <span className="text-xs md:text-sm font-bold text-brand-100">{upcomingShift ? formatHours(upcomingShift.paidMinutes) : '0h'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] md:text-[9px] uppercase font-black opacity-60 tracking-wider">Dự kiến</span>
                <span className="text-xs md:text-sm font-black whitespace-nowrap">{Math.round(upcomingShift?.salary || 0).toLocaleString()}₫</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-12 md:col-span-3 row-span-2 bg-surface-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white flex flex-col justify-between shadow-2xl">
          <div>
            <p className="text-[9px] md:text-[10px] uppercase font-black text-surface-500 mb-3 md:mb-4 tracking-[0.2em]">Tổng quan</p>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-surface-400 text-xs md:text-sm font-medium group-hover:text-white transition-colors">Tổng số giờ</span>
                <span className="font-black text-lg md:text-xl">{formatHours(stats.totalPaidMin)}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-surface-400 text-xs md:text-sm font-medium group-hover:text-white transition-colors">Số ca làm</span>
                <span className="font-black text-lg md:text-xl">{stats.shiftCount}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-surface-400 text-xs md:text-sm font-medium group-hover:text-white transition-colors">Trung bình</span>
                <span className="font-black text-lg md:text-xl">{formatHours(Math.round(stats.avgMin))}</span>
              </div>
            </div>
          </div>
          <div className="bg-surface-800/50 border border-surface-700 p-3 md:p-4 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center text-xs md:text-sm font-black shadow-lg shadow-brand-500/20">
              {(settings.ratePerHour / 1000).toFixed(1)}
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] font-black uppercase text-surface-500 tracking-wider">Hệ số lương</span>
              <span className="text-[10px] md:text-xs font-bold text-surface-300">{(settings.ratePerHour / 1000).toFixed(1)}k / giờ</span>
            </div>
          </div>
        </motion.div>

        {/* Weekly Table */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
          className="col-span-12 md:col-span-8 row-span-4 bg-white rounded-[2rem] md:rounded-[2.5rem] border border-surface-200/60 p-6 md:p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em] text-surface-400">Hiệu suất theo tuần</h3>
            <div className="flex items-center gap-1.5 opacity-50">
              <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-[9px] md:text-[10px] font-bold">Tháng {format(currentMonth, 'MM/yyyy')}</span>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 -mx-2 md:mx-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-[9px] md:text-[10px] text-surface-400 uppercase tracking-widest border-b border-surface-50">
                  <th className="pb-3 md:pb-4 font-black">Thời gian</th>
                  <th className="pb-3 md:pb-4 font-black">Gross</th>
                  <th className="pb-3 md:pb-4 font-black">Paid Net</th>
                  <th className="pb-3 md:pb-4 font-black">Thu nhập</th>
                  <th className="pb-3 md:pb-4 font-black text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-xs md:text-sm divide-y divide-surface-50">
                {stats.weeklyBreakdown.map((week, idx) => (
                  <tr key={idx} className="group hover:bg-surface-50/50 transition-colors">
                    <td className="py-4 md:py-5">
                      <span className="block font-black text-surface-800">{week.name}</span>
                      <span className="text-[9px] md:text-[10px] text-surface-400 font-bold uppercase">{week.count} ca làm</span>
                    </td>
                    <td className="py-4 md:py-5 font-medium text-surface-500">{formatHours(week.rawMin)}</td>
                    <td className="py-4 md:py-5 text-brand-500 font-black tracking-tight">{formatHours(week.paidMin)}</td>
                    <td className="py-4 md:py-5 font-bold tracking-tight text-surface-700">{Math.round(week.salary).toLocaleString()}₫</td>
                    <td className="py-4 md:py-5 text-right">
                      <span className={`px-2.5 md:px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${
                        idx === stats.weeklyBreakdown.length - 1 ? 'bg-brand-100 text-brand-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {idx === stats.weeklyBreakdown.length - 1 ? 'Đang làm' : 'Hoàn tất'}
                      </span>
                    </td>
                  </tr>
                ))}
                {stats.weeklyBreakdown.length === 0 && (
                  <tr><td colSpan={5} className="py-10 text-center text-surface-400 font-medium italic text-sm">Không có dữ liệu tháng này</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Rules & Goal */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          className="col-span-12 md:col-span-4 row-span-4 bg-surface-50/80 rounded-[2rem] md:rounded-[2.5rem] border-2 border-dashed border-surface-200 p-6 md:p-8 flex flex-col">
          <div className="flex items-center gap-2 mb-5 md:mb-6">
            <AlertCircle className="w-4 h-4 text-surface-400" />
            <h3 className="text-[9px] md:text-[10px] font-black uppercase text-surface-400 tracking-[0.2em]">Quy tắc trừ giờ nghỉ</h3>
          </div>

          <div className="space-y-3 md:space-y-4 flex-1">
            {[
              { label: 'Dưới 6 tiếng', badge: 'Full Pay', badgeColor: 'bg-green-100 text-green-600', desc: 'Giữ nguyên tổng thời gian làm.' },
              { label: 'Từ 6h - 8h', badge: '-30 phút', badgeColor: 'bg-orange-100 text-orange-600', desc: 'Trừ 30 phút nghỉ trưa/giải lao.' },
              { label: 'Trên 8 tiếng', badge: '-1 tiếng', badgeColor: 'bg-rose-100 text-rose-600', desc: 'Trừ 1 giờ nghỉ cho ca dài.' },
            ].map(rule => (
              <div key={rule.label} className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-surface-100 shadow-sm transition-transform hover:scale-[1.02]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs md:text-sm font-black tracking-tight">{rule.label}</span>
                  <span className={`text-[8px] md:text-[9px] ${rule.badgeColor} px-2 py-0.5 rounded-lg font-black uppercase`}>{rule.badge}</span>
                </div>
                <p className="text-[9px] md:text-[10px] text-surface-400 font-medium">{rule.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-surface-200">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <span className="text-[10px] md:text-xs font-black text-surface-400 tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-500" /> CẦN THÊM
              </span>
              <span className="text-xs md:text-sm font-black text-brand-500 tabular-nums">{hoursNeeded.toFixed(1)} Giờ</span>
            </div>
            <div className="text-center py-3 bg-white rounded-2xl border border-surface-100">
              <span className="text-lg md:text-xl font-black text-surface-800">{Math.round(remainingToTarget).toLocaleString()}</span>
              <span className="text-xs text-surface-400 font-bold ml-1">₫ còn lại</span>
            </div>
          </div>
        </motion.div>
      </div>

      <footer className="mt-8 md:mt-12 py-4 md:py-6 text-center text-[9px] md:text-[10px] font-black text-surface-300 uppercase tracking-[0.3em] md:tracking-[0.5em]">
        WorkTrackify v3.0 • Auto Sync {settings.autoSyncMinutes > 0 ? `${settings.autoSyncMinutes}m` : 'Off'}
      </footer>
    </div>
  );
}
