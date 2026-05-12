/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, FileSpreadsheet, RotateCcw, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Uploader } from './components/Uploader';
import { ScoreTable } from './components/ScoreTable';
import { parseAssignmentData, parseImages, parseDocument } from './services/geminiService';
import { RawScoreResult, StudentSummary, TransformedScore } from './types';
import { transformPercentageToScore } from './constants';
import { cn } from './lib/utils';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawResults, setRawResults] = useState<RawScoreResult[]>([]);

  const handleDataLoaded = async (data: string, type: 'text' | 'image' | 'pdf') => {
    setIsLoading(true);
    setError(null);
    try {
      let results: RawScoreResult[];
      if (type === 'image') {
        results = await parseImages([data]);
      } else if (type === 'pdf') {
        results = await parseDocument(data, 'application/pdf');
      } else {
        results = await parseAssignmentData(data);
      }
      setRawResults(prev => [...prev, ...results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const studentSummaries = useMemo(() => {
    const studentMap: { [key: string]: StudentSummary } = {};
    
    rawResults.forEach(res => {
      const id = res.studentId || res.email;
      if (!studentMap[id]) {
        studentMap[id] = {
          studentName: res.studentName,
          studentId: res.studentId,
          email: res.email,
          assignments: {},
          totalPoints: 0
        };
      }
      
      const transformed: TransformedScore = {
        ...res,
        originalPercentage: res.percentageScore,
        transformedScore: transformPercentageToScore(res.percentageScore)
      };
      
      studentMap[id].assignments[res.assignmentName] = transformed;
    });

    // Calculate totals and sort by studentId ascending
    return Object.values(studentMap).map(student => {
      const totalPoints = Object.values(student.assignments).reduce(
        (sum, a) => sum + a.transformedScore, 0
      );
      return { ...student, totalPoints };
    }).sort((a, b) => {
      // Natural sort for IDs
      const idA = a.studentId || "";
      const idB = b.studentId || "";
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [rawResults]);

  const uniqueAssignments = useMemo(() => {
    const assignments = new Set<string>();
    rawResults.forEach(r => assignments.add(r.assignmentName));
    return Array.from(assignments).sort();
  }, [rawResults]);

  const detectedClassName = useMemo(() => {
    if (rawResults.length === 0) return '';
    // Find the most frequent className provided in results
    const frequency: { [key: string]: number } = {};
    rawResults.forEach(r => {
      if (r.className) {
        frequency[r.className] = (frequency[r.className] || 0) + 1;
      }
    });
    return Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [rawResults]);

  const reset = () => {
    setRawResults([]);
    setError(null);
  };

  const avgPoints = studentSummaries.length > 0 
    ? (studentSummaries.reduce((sum, s) => sum + s.totalPoints, 0) / studentSummaries.length).toFixed(1)
    : 0;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Navigation */}
      <nav className="h-16 bg-indigo-700 text-white flex items-center justify-between px-8 shrink-0 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-sm flex items-center justify-center font-bold text-xl italic text-white">C</div>
          <h1 className="text-lg font-bold tracking-tight uppercase">Cambridge Grade Summarizer</h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs bg-white/10 px-2 py-1 rounded border border-white/20">University Portal</span>
          <div className="w-8 h-8 rounded-full bg-indigo-400 border border-white/30 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-white" />
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col p-6 gap-6 shadow-sm shrink-0 overflow-y-auto">
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Input & Import</h2>
            <Uploader onDataLoaded={handleDataLoaded} isLoading={isLoading} />
          </section>

          <section className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scoring Rules</h2>
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-500">90% - 100%</span>
                <span className="text-indigo-600 font-black">2.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-500">80% - 89%</span>
                <span className="text-indigo-600 font-black">1.5</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-500">70% - 79%</span>
                <span className="text-indigo-600 font-black">1.0</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-500">60% - 69%</span>
                <span className="text-indigo-600 font-black">0.5</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-500">0% - 59%</span>
                <span className="text-indigo-600 font-black">0.0</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">Rules are applied to each assignment before summing totals.</p>
          </section>

          {rawResults.length > 0 && (
            <button
              onClick={reset}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Data
            </button>
          )}

          <div className="mt-auto">
            <div className="bg-indigo-900 text-white rounded-xl p-4">
              <p className="text-[11px] opacity-70">Support & Help</p>
              <p className="text-[13px] font-medium mt-1 leading-snug">Need help parsing your report? Check our documentation.</p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {rawResults.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                  <FileSpreadsheet className="w-10 h-10 text-indigo-600" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ready to begin?</h2>
                  <p className="text-slate-500 font-medium">Upload your Cambridge assignment reports or paste text to generate the score summaries.</p>
                </div>
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex items-end justify-between mb-8 shrink-0">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 leading-tight tracking-tight uppercase">Dashboard สรุปผลคะแนน</h2>
                    <p className="text-slate-500 font-medium">ประมวลผลเสร็จสิ้น: {studentSummaries.length} รายชื่อ | {uniqueAssignments.length} Assignments</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-emerald-100 border border-emerald-200 px-6 py-2 rounded-xl text-center shadow-sm">
                      <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide">Avg. Points</p>
                      <p className="text-2xl font-black text-emerald-900">{avgPoints}</p>
                    </div>
                    <div className="bg-indigo-100 border border-indigo-200 px-6 py-2 rounded-xl text-center shadow-sm">
                      <p className="text-[10px] text-indigo-800 font-bold uppercase tracking-wide">Records</p>
                      <p className="text-2xl font-black text-indigo-900">{rawResults.length}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <ScoreTable summaries={studentSummaries} assignments={uniqueAssignments} detectedClassName={detectedClassName} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

