import React from 'react';
import { motion } from 'motion/react';
import { Download, Table as TableIcon, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentSummary } from '../types';
import { cn } from '../lib/utils';

interface ScoreTableProps {
  summaries: StudentSummary[];
  assignments: string[];
  detectedClassName: string;
}

export function ScoreTable({ summaries, assignments, detectedClassName }: ScoreTableProps) {
  const exportToExcel = () => {
    const headers = ['No.', 'Student ID', 'Name', 'Email', ...assignments, 'Total Points'];
    const rows = summaries.map((s, idx) => [
      idx + 1,
      s.studentId || '',
      s.studentName,
      s.email,
      ...assignments.map(a => s.assignments[a]?.transformedScore || 0),
      s.totalPoints
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grades");
    
    // Format: ปีการศึกษา_เทอม_รหัสวิชา_เลขsection - Cambridge Score Transformer
    const prefix = detectedClassName || 'report';
    const fileName = `${prefix} - Cambridge Score Transformer.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getPointsBadge = (score: number) => {
    if (score >= 2) return "bg-indigo-100 text-indigo-700";
    if (score >= 1) return "bg-emerald-100 text-emerald-700";
    if (score > 0) return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
        <div className="col-span-1">ID</div>
        <div className="col-span-4">Student Details</div>
        {assignments.map(a => (
          <div key={a} className="col-span-1 text-center truncate px-1" title={a}>
            {a.split(' ')[1] || a}
          </div>
        ))}
        <div className="col-span-2 text-right">Sum Score</div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {summaries.map((student, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.02 }}
            key={student.studentId || student.email}
            className="grid grid-cols-12 py-4 px-6 items-center hover:bg-slate-50/50 transition-colors group"
          >
            <div className="col-span-1 font-mono text-xs text-slate-400">
              {(idx + 1).toString().padStart(3, '0')}
            </div>
            <div className="col-span-4">
              <div className="font-semibold text-[15px]">{student.studentName}</div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>{student.email}</span>
                {student.studentId && <span>• ID: {student.studentId}</span>}
              </div>
            </div>
            {assignments.map(a => {
              const score = student.assignments[a];
              return (
                <div key={a} className="col-span-1 text-center">
                  {score ? (
                    <div className="flex flex-col items-center gap-1 group/item relative">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black min-w-[32px]",
                        getPointsBadge(score.transformedScore)
                      )}>
                        {score.transformedScore.toFixed(1)}
                      </span>
                      <div className="flex flex-col text-[8px] leading-tight text-slate-400">
                        <span>{score.originalPercentage}%</span>
                        {score.lateStatus && score.lateStatus.toLowerCase() !== 'on time' && (
                          <span className="text-red-500 font-bold uppercase">{score.lateStatus}</span>
                        )}
                        {score.completionStatus && score.completionStatus.toLowerCase() !== 'scored' && (
                          <span className="text-amber-500 italic">{score.completionStatus}</span>
                        )}
                      </div>
                      
                      {/* Tooltip on hover (optional but good for space) */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/item:block bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-50 whitespace-nowrap">
                        <p className="font-bold">{a}</p>
                        <p>Score: {score.originalPercentage}% ({score.transformedScore} pts)</p>
                        <p>Status: {score.lateStatus || 'On time'} • {score.completionStatus || 'Scored'}</p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-200 font-mono">-</span>
                  )}
                </div>
              );
            })}
            <div className="col-span-2 text-right">
              <span className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                {student.totalPoints.toFixed(1)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table Footer */}
      <div className="h-14 bg-slate-50 border-t border-slate-200 px-6 flex items-center justify-between shrink-0">
        <div className="text-[11px] text-slate-400 font-medium italic">
          Displaying {summaries.length} entries correctly parsed
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 shadow-sm uppercase tracking-wider transition-all active:scale-95"
          >
            <FileSpreadsheet className="w-3 h-3" />
            Export to Excel
          </button>
          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-black shadow-sm uppercase tracking-wider transition-all active:scale-95"
          >
            Print Results
          </button>
        </div>
      </div>
    </div>
  );
}
