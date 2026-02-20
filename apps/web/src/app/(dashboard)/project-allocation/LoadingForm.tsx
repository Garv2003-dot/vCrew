'use client';

import React, { useState, useEffect } from 'react';
import type { LoadingDemand, LoadingRow } from '@repo/types';
import { ENDPOINTS } from '../../../config/endpoints';

const removeSkill = (
  rowId: string,
  type: 'primarySkills' | 'secondarySkills',
  indexToRemove: number,
  rows: LoadingRow[],
  setRows: React.Dispatch<React.SetStateAction<LoadingRow[]>>,
) => {
  setRows((prev) =>
    prev.map((r) => {
      if (r.id !== rowId) return r;
      const currentSkills = Array.isArray(r[type])
        ? r[type]
        : (r[type] as string).split(',').filter(Boolean);
      const newSkills = currentSkills.filter((_, i) => i !== indexToRemove);
      return { ...r, [type]: newSkills };
    }),
  );
};

interface LoadingFormProps {
  onSubmit: (demand: LoadingDemand) => void;
  isLoading: boolean;
  initialValues?: Partial<LoadingDemand>;
}

export default function LoadingForm({
  onSubmit,
  isLoading,
  initialValues = {},
}: LoadingFormProps) {
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const [demandId, setDemandId] = useState('');
  const [projectName, setProjectName] = useState(
    initialValues.projectName || '',
  );
  const [startDate, setStartDate] = useState(
    initialValues.startDate
      ? initialValues.startDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [durationMonths, setDurationMonths] = useState(
    initialValues.durationMonths || 3,
  );
  const [intervalCount, setIntervalCount] = useState(
    initialValues.intervalCount || 12,
  );
  const [intervalLabel, setIntervalLabel] = useState(
    initialValues.intervalLabel || 'Week',
  );
  const [context, setContext] = useState(initialValues.context || '');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>(
    initialValues.priority || 'HIGH',
  );

  const [rows, setRows] = useState<LoadingRow[]>(() => {
    const existing = initialValues.rows || [];
    if (existing.length > 0) return existing;
    return [
      {
        id: `row-${Date.now()}`,
        roleName: 'Developer Frontend',
        primarySkills: ['React', 'TypeScript'],
        secondarySkills: ['Tailwind'],
        experienceLevel: 'MID',
        intervalAllocations: {},
      },
    ];
  });

  useEffect(() => {
    if (!demandId) {
      setDemandId(
        `load-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`,
      );
    }
  }, []);

  useEffect(() => {
    fetch(ENDPOINTS.METADATA.LIST)
      .then((res) => res.json())
      .then((data: { roles?: string[] }) =>
        setRoleOptions(Array.isArray(data?.roles) ? data.roles : []),
      )
      .catch(() => setRoleOptions([]));
  }, []);

  const intervals = Array.from(
    { length: Math.max(1, intervalCount) },
    (_, i) => ({ index: i, label: `${intervalLabel} ${i + 1}` }),
  );

  const addRow = () => {
    const defaultAllocations: Record<number, number> = {};
    intervals.forEach((_, i) => (defaultAllocations[i] = 0));
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${prev.length}`,
        roleName: 'Backend Engineer',
        primarySkills: [],
        secondarySkills: [],
        experienceLevel: 'MID',
        intervalAllocations: defaultAllocations,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof LoadingRow,
    value: string | string[] | Record<number, number>,
  ) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const updateIntervalAllocation = (
    rowId: string,
    intervalIndex: number,
    value: number,
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r;
        const updated = { ...r.intervalAllocations, [intervalIndex]: value };
        return { ...r, intervalAllocations: updated };
      }),
    );
  };

  const getTotalForRow = (row: LoadingRow) => {
    return intervals.reduce(
      (sum, iv) => sum + (row.intervalAllocations[iv.index] ?? 0),
      0,
    );
  };

  const getTotalForInterval = (intervalIndex: number) => {
    return rows.reduce(
      (sum, r) => sum + (r.intervalAllocations[intervalIndex] ?? 0),
      0,
    );
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.click();
  };

  const handleExportCSV = () => {
    const headers = [
      'Role',
      'Primary Skills',
      'Secondary Skills',
      'Level',
      ...intervals.map((iv) => iv.label),
    ];

    const csvRows = rows.map((row) => {
      const primarySkills = Array.isArray(row.primarySkills)
        ? row.primarySkills.join(';')
        : row.primarySkills || '';
      const secondarySkills = Array.isArray(row.secondarySkills)
        ? row.secondarySkills.join(';')
        : row.secondarySkills || '';

      const allocations = intervals.map(
        (iv) => row.intervalAllocations[iv.index] ?? 0,
      );

      return [
        row.roleName,
        primarySkills,
        secondarySkills,
        row.experienceLevel,
        ...allocations,
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvRows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.trim() || 'loading-plan'}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = () => {
    const demand: LoadingDemand = {
      demandId,
      projectType: 'NEW',
      projectName: projectName.trim() || 'New Project',
      startDate: new Date(startDate).toISOString(),
      durationMonths,
      intervalCount: intervals.length,
      intervalLabel,
      context: context.trim() || undefined,
      priority,
      rows: rows.map((r) => ({
        ...r,
        primarySkills: Array.isArray(r.primarySkills)
          ? r.primarySkills
          : ((r.primarySkills as string)
              ?.split(',')
              .map((s) => s.trim())
              .filter(Boolean) ?? []),
        secondarySkills: Array.isArray(r.secondarySkills)
          ? r.secondarySkills
          : ((r.secondarySkills as string)
              ?.split(',')
              .map((s) => s.trim())
              .filter(Boolean) ?? []),
      })),
    };
    onSubmit(demand);
  };

  const grandTotal = rows.reduce((sum, r) => sum + getTotalForRow(r), 0);

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* ID bar */}
        <div className="px-6 pt-4">
          <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded">
            ID: {demandId}
          </span>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Project Overview
            </h2>
          </div>

          {/* Row 1: Project Name + Start Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Project Name
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Platform Revamp"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Row 2: Duration, Intervals, Label, Priority */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Duration (months)
              </label>
              <input
                type="text"
                value={durationMonths}
                onChange={(e) => {
                  const val = e.target.value.replaceAll(/\D/g, '');
                  setDurationMonths(Number(val) || 1);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Intervals
              </label>
              <input
                type="text"
                value={intervalCount}
                onChange={(e) => {
                  const val = e.target.value.replaceAll(/\D/g, '');
                  setIntervalCount(Math.max(0, Math.min(52, Number(val) || 0)));
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Label
              </label>
              <select
                value={intervalLabel}
                onChange={(e) => setIntervalLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="Week">Week</option>
                <option value="Sprint">Sprint</option>
                <option value="Month">Month</option>
                <option value="Phase">Phase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                }
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all appearance-none cursor-pointer"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Context
            </label>
            <textarea
              rows={2}
              placeholder="Brief context about the project..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Resource Loading Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">
              Resource Loading
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={addRow}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add Row
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-[140px]">
                    Role
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Skills
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                    Secondary
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap w-[90px]">
                    Level
                  </th>
                  {intervals.map((iv) => (
                    <th
                      key={iv.index}
                      className="px-1 py-3 text-center text-xs font-medium text-gray-400 whitespace-nowrap w-12"
                      style={{
                        borderLeft:
                          iv.index === 0 ? '2px dashed #d1d5db' : undefined,
                      }}
                    >
                      {iv.index + 1}
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Total
                  </th>
                  <th className="w-10" />
                </tr>
                {/* Sub-header for "Allocation by Week" spanning interval columns */}
                <tr>
                  <th colSpan={4} />
                  <th
                    colSpan={intervals.length}
                    className="text-center text-[10px] text-gray-400 tracking-widest pb-2"
                    style={{
                      borderLeft: '2px dashed #d1d5db',
                    }}
                    title="100 = 1 FTE, 200 = 2 FTE per interval"
                  >
                    Allocation by {intervalLabel}{' '}
                    <span className="tracking-[0.3em]">··················</span>
                  </th>
                  <th colSpan={2} />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => {
                  const rowTotal = getTotalForRow(row);
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-2 py-3">
                        <select
                          className="w-full px-2 py-1.5 bg-transparent border-0 text-sm text-gray-900 focus:outline-none focus:ring-0 cursor-pointer"
                          value={row.roleName}
                          onChange={(e) =>
                            updateRow(row.id, 'roleName', e.target.value)
                          }
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(row.primarySkills)
                            ? row.primarySkills
                            : String(row.primarySkills || '').split(',')
                          )
                            .filter(Boolean)
                            .map((skill: string, i: number) => (
                              <span
                                key={`ps-${skill}-${i}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 group"
                              >
                                {skill.trim()}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSkill(
                                      row.id,
                                      'primarySkills',
                                      i,
                                      rows,
                                      setRows,
                                    )
                                  }
                                  className="ml-1 text-blue-400 hover:text-blue-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          <input
                            type="text"
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-xs text-gray-500 placeholder-gray-300 focus:outline-none"
                            placeholder="+ add"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                const current = Array.isArray(row.primarySkills)
                                  ? row.primarySkills
                                  : [];
                                updateRow(row.id, 'primarySkills', [
                                  ...current,
                                  e.currentTarget.value.trim(),
                                ]);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {(Array.isArray(row.secondarySkills)
                            ? row.secondarySkills
                            : String(row.secondarySkills || '').split(',')
                          )
                            .filter(Boolean)
                            .map((skill: string, i: number) => (
                              <span
                                key={`ss-${skill}-${i}`}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 group"
                              >
                                {skill.trim()}
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSkill(
                                      row.id,
                                      'secondarySkills',
                                      i,
                                      rows,
                                      setRows,
                                    )
                                  }
                                  className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          <input
                            type="text"
                            className="w-16 px-1 py-0.5 border-0 bg-transparent text-xs text-gray-500 placeholder-gray-300 focus:outline-none"
                            placeholder="+ add"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value) {
                                const current = Array.isArray(
                                  row.secondarySkills,
                                )
                                  ? row.secondarySkills
                                  : [];
                                updateRow(row.id, 'secondarySkills', [
                                  ...current,
                                  e.currentTarget.value.trim(),
                                ]);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <select
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 appearance-none cursor-pointer"
                          value={row.experienceLevel}
                          onChange={(e) =>
                            updateRow(
                              row.id,
                              'experienceLevel',
                              e.target.value as LoadingRow['experienceLevel'],
                            )
                          }
                        >
                          <option value="JUNIOR">Junior</option>
                          <option value="MID">Mid</option>
                          <option value="SENIOR">Senior</option>
                        </select>
                      </td>
                      {intervals.map((iv) => (
                        <td
                          key={iv.index}
                          className="px-1 py-3"
                          style={{
                            borderLeft:
                              iv.index === 0 ? '2px dashed #d1d5db' : undefined,
                          }}
                        >
                          <input
                            type="text"
                            className="w-10 h-8 px-1 border border-gray-200 rounded-md text-sm text-center text-gray-700 bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all"
                            placeholder="0"
                            value={row.intervalAllocations[iv.index] ?? ''}
                            onChange={(e) =>
                              updateIntervalAllocation(
                                row.id,
                                iv.index,
                                Math.max(0, Number(e.target.value) || 0),
                              )
                            }
                          />
                        </td>
                      ))}
                      <td className="px-2 py-3 text-center">
                        <span
                          className={`font-semibold text-sm ${rowTotal > 0 ? 'text-blue-700' : 'text-gray-400'}`}
                        >
                          {rowTotal}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="p-1 text-gray-300 hover:text-red-500 rounded transition-colors"
                            aria-label="Remove row"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-100">
                  <td
                    colSpan={4}
                    className="px-2 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider"
                  >
                    Total Allocation
                  </td>
                  {intervals.map((iv) => (
                    <td
                      key={iv.index}
                      className="px-1 py-3 text-center text-sm font-semibold text-gray-700"
                      style={{
                        borderLeft:
                          iv.index === 0 ? '2px dashed #d1d5db' : undefined,
                      }}
                    >
                      {getTotalForInterval(iv.index)}
                    </td>
                  ))}
                  <td className="px-2 py-3 text-center text-sm font-bold text-blue-700">
                    {grandTotal}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating...
          </span>
        ) : (
          'Generate Allocation Plan'
        )}
      </button>
    </div>
  );
}
