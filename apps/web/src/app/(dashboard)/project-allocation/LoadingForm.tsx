'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@repo/ui';
import type { LoadingDemand, LoadingRow } from '@repo/types';

const ROLE_OPTIONS = [
  'UX',
  'Developer Frontend',
  'Developer Backend',
  'Tech Lead',
  'QA',
  'BA',
  'SM',
  'UX Designer',
  'Product Manager',
  'DevOps Engineer',
];

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
  const [priority, setPriority] = useState<
    'LOW' | 'MEDIUM' | 'HIGH'
  >(initialValues.priority || 'HIGH');

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

  const intervals = Array.from(
    { length: Math.max(1, intervalCount) },
    (_, i) => ({ index: i, label: `${intervalLabel} ${i + 1}` }),
  );

  const addRow = () => {
    const defaultAllocations: Record<number, number> = {};
    intervals.forEach((_, i) => (defaultAllocations[i] = 100));
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
          : (r.primarySkills as string)
              ?.split(',')
              .map((s) => s.trim())
              .filter(Boolean) ?? [],
        secondarySkills: Array.isArray(r.secondarySkills)
          ? r.secondarySkills
          : (r.secondarySkills as string)
              ?.split(',')
              .map((s) => s.trim())
              .filter(Boolean) ?? [],
      })),
    };
    onSubmit(demand);
  };

  return (
    <Card title="Resource Loading Plan" className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Project basics */}
        <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-100">
          <div className="text-xs text-gray-400 font-mono">ID: {demandId}</div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Project Name"
              placeholder="e.g. Q3 Platform Revamp"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input
              label="Duration (months)"
              type="number"
              min={1}
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value) || 1)}
            />
            <Input
              label="Number of intervals"
              type="number"
              min={1}
              max={52}
              value={intervalCount}
              onChange={(e) =>
                setIntervalCount(Math.max(1, Math.min(52, Number(e.target.value) || 1)))
              }
            />
            <Input
              label="Interval label"
              placeholder="e.g. Week, Phase"
              value={intervalLabel}
              onChange={(e) => setIntervalLabel(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                }
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Context
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Brief context about the project..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </div>

        {/* Loading table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-1">
              Loading Table
            </h3>
            <Button type="button" variant="secondary" onClick={addRow} className="text-xs">
              + Add row
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Allocate percentage per interval (e.g. 100 = 1 FTE, 50 = 0.5 FTE). AI will assign resources per interval and split workloads if someone isn&apos;t available for the full project.
          </p>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                    Primary Skills
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                    Secondary Skills
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap">
                    Level
                  </th>
                  {intervals.map((iv) => (
                    <th
                      key={iv.index}
                      className="px-2 py-2 text-center font-medium text-gray-700 whitespace-nowrap w-16"
                    >
                      {iv.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center font-medium text-gray-700 whitespace-nowrap bg-gray-50">
                    Total
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <select
                        className="w-full min-w-[120px] px-2 py-1 border border-gray-300 rounded text-sm"
                        value={row.roleName}
                        onChange={(e) =>
                          updateRow(row.id, 'roleName', e.target.value)
                        }
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="w-full min-w-[100px] px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="React, TypeScript"
                        value={
                          Array.isArray(row.primarySkills)
                            ? row.primarySkills.join(', ')
                            : row.primarySkills || ''
                        }
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            'primarySkills',
                            e.target.value.split(',').map((s) => s.trim()),
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="w-full min-w-[80px] px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="Tailwind"
                        value={
                          Array.isArray(row.secondarySkills)
                            ? row.secondarySkills.join(', ')
                            : row.secondarySkills || ''
                        }
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            'secondarySkills',
                            e.target.value.split(',').map((s) => s.trim()),
                          )
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="w-full min-w-[90px] px-2 py-1 border border-gray-300 rounded text-sm"
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
                      <td key={iv.index} className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          max={500}
                          step={50}
                          className="w-14 px-2 py-1 border border-gray-300 rounded text-sm text-center"
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
                    <td className="px-3 py-2 text-center font-medium bg-gray-50">
                      {getTotalForRow(row)}
                    </td>
                    <td className="px-2 py-2">
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-2 text-right font-medium text-gray-700"
                  >
                    Total
                  </td>
                  {intervals.map((iv) => (
                    <td
                      key={iv.index}
                      className="px-2 py-2 text-center font-medium"
                    >
                      {getTotalForInterval(iv.index)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium">
                    {rows.reduce(
                      (sum, r) => sum + getTotalForRow(r),
                      0,
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Generate Allocation Plan
        </Button>
      </div>
    </Card>
  );
}
