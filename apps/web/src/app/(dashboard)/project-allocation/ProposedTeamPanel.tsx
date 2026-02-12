import React from 'react';
import { Button } from '@repo/ui';
import { AllocationProposal } from '@repo/types';

interface ProposedTeamPanelProps {
  proposal: AllocationProposal | null;
  onEditRequirements: () => void;
  allocationSource: 'FORM' | 'AI';
  onApprove?: () => void;
  onDiscard?: () => void;
  onEditAllocation?: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

export default function ProposedTeamPanel({
  proposal,
  onEditRequirements,
  allocationSource,
  onApprove,
  onDiscard,
  onEditAllocation,
  onUndo,
  canUndo = false,
}: ProposedTeamPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900">
            Proposed Team for {proposal?.projectName}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onUndo && (
            <Button
              variant="secondary"
              onClick={onUndo}
              disabled={!canUndo}
              className="text-sm"
            >
              Undo last AI change
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onEditRequirements}
            className="text-sm border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
          >
            Edit Requirements
          </Button>
        </div>
      </div>

      {proposal ? (
        <div className="mt-0 transition-opacity duration-500 ease-in-out h-full overflow-auto flex flex-col">
          {/* Group and Filter Recommendations */}
          {(() => {
            const allRecs =
              proposal.roleAllocations?.flatMap((role) =>
                role.recommendations.map((rec) => ({
                  ...rec,
                  roleName: role.roleName,
                })),
              ) || [];

            const newRecs = allRecs.filter((r) => r.status === 'NEW');
            const existingRecs = allRecs.filter((r) => r.status === 'EXISTING');

            const renderRec = (rec: (typeof allRecs)[0], idx: number) => (
              <li
                key={`${rec.employeeId}-${idx}`}
                className={`px-6 py-4 flex flex-col gap-2 hover:bg-gray-50 border-b last:border-0 ${rec.status === 'NEW' ? 'bg-green-50/30' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3">
                      {rec.employeeName.charAt(0)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-indigo-600">
                          {rec.employeeName}
                        </p>
                        {rec.status === 'EXISTING' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            Existing
                          </span>
                        )}
                        {rec.status === 'NEW' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-200">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {rec.currentRole || rec.roleName} •{' '}
                        {rec.allocationPercent}% Allocated
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {Math.round(rec.confidence * 100)}% Match
                    </span>
                    {rec.allocationPercent < 100 && (
                      <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                        Partial Allocation
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-gray-100 italic">
                  "{rec.reason}"
                </p>
              </li>
            );

            return (
              <div className="overflow-hidden sm:rounded-md flex-1 overflow-y-auto">
                {newRecs.length > 0 && (
                  <div>
                    <div className="px-6 py-2 bg-green-50 border-b border-green-100 text-green-800 text-xs font-bold uppercase tracking-wide">
                      New Recommendations
                    </div>
                    <ul className="divide-y divide-gray-200 border-b border-gray-200">
                      {newRecs.map((rec, idx) => renderRec(rec, idx))}
                    </ul>
                  </div>
                )}

                {existingRecs.length > 0 && (
                  <div>
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wide mt-4 flex items-center gap-2">
                      <span>Existing Employees</span>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <ul className="divide-y divide-gray-200">
                      {existingRecs.map((rec, idx) => renderRec(rec, idx))}
                    </ul>
                  </div>
                )}

                {allRecs.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    No employees found in this proposal.
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex gap-3 justify-end">
            <button
              onClick={onDiscard}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow-sm text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear
            </button>
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Approve
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          No allocation data found.
        </div>
      )}
    </div>
  );
}
