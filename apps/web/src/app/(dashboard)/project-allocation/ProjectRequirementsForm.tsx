'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@repo/ui';
import { ProjectDemand } from '@repo/types';
import { ENDPOINTS } from '../../../config/endpoints';

type ProjectType = 'NEW' | 'EXISTING' | 'GENERAL_DEMAND';

interface RoleRow {
  id: string;
  roleName: string;
  primarySkills: string;
  secondarySkills: string;
  experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR';
  headcount: number;
}

interface ProjectRequirementsFormProps {
  onSubmit: (demand: ProjectDemand) => void;
  isLoading: boolean;
  initialValues?: Partial<ProjectDemand>;
}

export default function ProjectRequirementsForm({
  onSubmit,
  isLoading,
  initialValues = {},
}: ProjectRequirementsFormProps) {
  const [demandId, setDemandId] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>(
    (initialValues.projectType as ProjectType) || 'NEW',
  );
  const [projectNameInput, setProjectNameInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [startDate, setStartDate] = useState(
    initialValues.startDate ? initialValues.startDate.split('T')[0] : '',
  );
  const [duration, setDuration] = useState<number | ''>(
    initialValues.durationMonths != null ? initialValues.durationMonths : '',
  );
  const [priority, setPriority] = useState(initialValues.priority || '');
  const [probability, setProbability] = useState(
    initialValues.probabilityOfConversion != null
      ? initialValues.probabilityOfConversion
      : 0,
  );
  const [context, setContext] = useState(initialValues.context || '');

  const [resourceDescription, setResourceDescription] = useState(
    initialValues.resourceDescription || '',
  );

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  /** Only one input method at a time: role rows OR multiline text */
  const [rolesInputMode, setRolesInputMode] = useState<'rows' | 'multiline'>('rows');
  const [roleRows, setRoleRows] = useState<RoleRow[]>(() => {
    const roles = initialValues.roles || [];
    if (roles.length > 0) {
      return roles.map((r, i) => ({
        id: `role-${i}-${Date.now()}`,
        roleName: r.roleName,
        primarySkills: r.requiredSkills?.map((s) => s.name).join(', ') || '',
        secondarySkills: '',
        experienceLevel: r.experienceLevel || 'MID',
        headcount: r.headcount || 1,
      }));
    }
    // Default to one empty row so the section is "open"
    return [
      {
        id: `role-default-${Date.now()}`,
        roleName: '',
        primarySkills: '',
        secondarySkills: '',
        experienceLevel: 'MID',
        headcount: 1,
      },
    ];
  });

  useEffect(() => {
    fetch(ENDPOINTS.PROJECTS.LIST)
      .then((res) => res.json())
      .then((data: { id: string; name: string }[]) =>
        setProjects(Array.isArray(data) ? data : []),
      )
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    fetch(ENDPOINTS.METADATA.LIST)
      .then((res) => res.json())
      .then((data: { roles?: string[] }) =>
        setRoleOptions(Array.isArray(data?.roles) ? data.roles : []),
      )
      .catch(() => setRoleOptions([]));
  }, []);

  useEffect(() => {
    if (!demandId) {
      setDemandId(
        `dmd-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`,
      );
    }
    if (initialValues.projectType)
      setProjectType(initialValues.projectType as ProjectType);
    if (initialValues.projectType === 'NEW' && initialValues.projectName) {
      setProjectNameInput(initialValues.projectName);
    } else if (initialValues.projectId) {
      setSelectedProjectId(initialValues.projectId);
    }
    if (initialValues.probabilityOfConversion != null)
      setProbability(initialValues.probabilityOfConversion);
  }, [initialValues]);

  const addRoleRow = () => {
    setRoleRows((prev) => [
      ...prev,
      {
        id: `role-${Date.now()}-${prev.length}`,
        roleName: '',
        primarySkills: '',
        secondarySkills: '',
        experienceLevel: 'MID',
        headcount: 1,
      },
    ]);
  };

  const removeRoleRow = (id: string) => {
    setRoleRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRoleRow = (
    id: string,
    field: keyof RoleRow,
    value: string | number,
  ) => {
    setRoleRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleSubmit = () => {
    const finalProjectName =
      projectType === 'EXISTING'
        ? projects.find((p) => p.id === selectedProjectId)?.name || ''
        : projectNameInput ||
          (projectType === 'GENERAL_DEMAND' ? 'General Demand' : '');

    const explicitRoles = roleRows
      .filter((r) => r.roleName && r.headcount > 0)
      .map((r) => ({
        roleName: r.roleName,
        headcount: Math.max(1, r.headcount),
        requiredSkills: r.primarySkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s, i) => ({
            skillId: `s-${i}`,
            name: s,
            minimumProficiency: 3 as 1 | 2 | 3 | 4 | 5,
          })),
        experienceLevel: r.experienceLevel,
        allocationPercent: 100,
      }));

    const hasRoles = explicitRoles.length > 0;
    const hasMultiline = (resourceDescription || '').trim().length > 0;
    const validByMode = rolesInputMode === 'rows' ? hasRoles : hasMultiline;
    if (!validByMode) {
      return; // User must provide content in the selected input method
    }

    const demand: ProjectDemand = {
      demandId,
      projectType,
      projectId: projectType === 'EXISTING' ? selectedProjectId : undefined,
      projectName: finalProjectName,
      priority: (priority || 'HIGH') as 'HIGH' | 'MEDIUM' | 'LOW',
      startDate:
        projectType === 'NEW'
          ? (startDate
              ? new Date(startDate).toISOString()
              : new Date().toISOString())
          : projectType === 'EXISTING'
            ? new Date().toISOString()
            : undefined,
      durationMonths:
        projectType === 'NEW'
          ? (typeof duration === 'number' ? duration : Number(duration) || 0)
          : 0,
      probabilityOfConversion:
        projectType === 'NEW' ? (probability || 0) : undefined,
      context:
        projectType === 'NEW' ? (context.trim() || undefined) : undefined,
      resourceDescription:
        rolesInputMode === 'multiline'
          ? resourceDescription.trim() || undefined
          : undefined,
      roles: rolesInputMode === 'rows' ? explicitRoles : [],
    };
    onSubmit(demand);
  };

  const showProjectRef = projectType === 'NEW' || projectType === 'EXISTING';
  const showProbability = projectType === 'NEW';

  return (
    <Card title="Project Demand" className="">
      <div className="space-y-6">
        {/* SECTION 1: Project Type */}
        <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-100">
          <div className="text-xs text-gray-400 font-mono">ID: {demandId}</div>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  checked={projectType === 'NEW'}
                  onChange={() => setProjectType('NEW')}
                  className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="text-sm text-gray-900">
                  New / Upcoming Project
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  checked={projectType === 'EXISTING'}
                  onChange={() => setProjectType('EXISTING')}
                  className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="text-sm text-gray-900">Existing Project</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  checked={projectType === 'GENERAL_DEMAND'}
                  onChange={() => setProjectType('GENERAL_DEMAND')}
                  className="mr-2 text-blue-600 focus:ring-blue-500 accent-blue-600"
                />
                <span className="text-sm text-gray-900">General Demand</span>
              </label>
            </div>
          </fieldset>

          {showProjectRef && (
            <div>
              <label
                htmlFor="project-ref"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {projectType === 'NEW'
                  ? 'Opportunity / Project Name'
                  : 'Select Project'}
              </label>
              {projectType === 'NEW' ? (
                <Input
                  id="project-ref"
                  placeholder="e.g. Q3 AI Initiative"
                  value={projectNameInput}
                  onChange={(e) => setProjectNameInput(e.target.value)}
                />
              ) : (
                <div className="space-y-1">
                  <select
                    id="project-ref"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-blue-700 focus:border-blue-500 sm:text-sm"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">-- Select Existing Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    ℹ️ This allocation will add capacity to an ongoing project
                  </p>
                </div>
              )}
            </div>
          )}

          {projectType === 'GENERAL_DEMAND' && (
            <div>
              <label
                htmlFor="demand-name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Demand / Title (optional)
              </label>
              <Input
                id="demand-name"
                placeholder="e.g. Q3 General Staffing"
                value={projectNameInput}
                onChange={(e) => setProjectNameInput(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* SECTION 2: Timeline & Context – only for NEW project */}
        {projectType === 'NEW' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-1">
              Timeline & Context
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="start-date-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="start-date-input"
                  type="date"
                  className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <Input
                label="Duration (months)"
                type="number"
                value={duration === '' ? '' : duration}
                onChange={(e) =>
                  setDuration(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
              />
            </div>

            <div>
              <label
                htmlFor="context-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Context
              </label>
              <textarea
                id="context-input"
                rows={2}
                className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Brief context about the project or demand..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            {showProbability && (
              <div className="transition-all duration-300 ease-in-out">
                <label
                  htmlFor="prob-slider"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Probability of Conversion: {probability}%
                </label>
                <input
                  id="prob-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Unknown</span>
                  <span>Likely</span>
                  <span>Confirmed</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Priority – shown for all project types (NEW, EXISTING, GENERAL_DEMAND) */}
        <div className="space-y-2">
          <label
            htmlFor="priority-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Priority
          </label>
          <select
            id="priority-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={priority}
            onChange={(e) =>
              setPriority(e?.target?.value as 'HIGH' | 'MEDIUM' | 'LOW')
            }
          >
            <option value="">Select priority</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* SECTION 3: One input method at a time – role rows OR multiline text */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 border-b pb-1">
              How do you want to define roles?
            </h3>
          </div>
          <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 w-fit">
            <button
              type="button"
              onClick={() => setRolesInputMode('rows')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                rolesInputMode === 'rows'
                  ? 'bg-white text-blue-700 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Add roles (rows)
            </button>
            <button
              type="button"
              onClick={() => setRolesInputMode('multiline')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition ${
                rolesInputMode === 'multiline'
                  ? 'bg-white text-blue-700 shadow border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Describe in text
            </button>
          </div>

          {rolesInputMode === 'rows' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Roles &amp; Skills</span>
              <Button
                type="button"
                variant="secondary"
                onClick={addRoleRow}
                className="text-xs"
              >
                + Add role
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Specify exact roles, skills, and headcount.
            </p>

          <div className="space-y-3">
            {roleRows.map((row) => (
              <div
                key={row.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                {/* Top row: Role | Headcount | Level | Remove */}
                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Role */}
                  <div className="col-span-12 md:col-span-6">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Role
                    </label>
                    <select
                      className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                      value={row.roleName}
                      onChange={(e) =>
                        updateRoleRow(row.id, 'roleName', e.target.value)
                      }
                    >
                      <option value="" disabled>
                        Select Role
                      </option>
                      {roleOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Headcount */}
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Headcount
                    </label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className="h-10 text-center"
                      value={row.headcount}
                      onChange={(e) =>
                        updateRoleRow(
                          row.id,
                          'headcount',
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                  </div>

                  {/* Experience */}
                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Experience
                    </label>
                    <select
                      className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                      value={row.experienceLevel}
                      onChange={(e) =>
                        updateRoleRow(
                          row.id,
                          'experienceLevel',
                          e.target.value as RoleRow['experienceLevel'],
                        )
                      }
                    >
                      <option value="JUNIOR">Junior</option>
                      <option value="MID">Mid-Level</option>
                      <option value="SENIOR">Senior</option>
                    </select>
                  </div>

                  {/* Remove */}
                  <div className="col-span-12 md:col-span-1 flex md:justify-end items-end">
                    {roleRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoleRow(row.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                        aria-label="Remove role"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Skills */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Primary skills
                    </label>
                    <Input
                      placeholder="e.g. React, Node.js"
                      className="h-10"
                      value={row.primarySkills}
                      onChange={(e) =>
                        updateRoleRow(row.id, 'primarySkills', e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Secondary skills
                    </label>
                    <Input
                      placeholder="Nice to have"
                      className="h-10"
                      value={row.secondarySkills}
                      onChange={(e) =>
                        updateRoleRow(row.id, 'secondarySkills', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
          )}

          {rolesInputMode === 'multiline' && (
          <div className="space-y-2">
            <label
              htmlFor="resource-description"
              className="block text-sm font-medium text-gray-700"
            >
              How many resources do you need?
            </label>
            <p className="text-xs text-gray-500">
              Describe in plain text, e.g. &quot;2 Backend, 3 Frontend, 1
              Project Manager, 2 QA&quot;. The AI will interpret this.
            </p>
            <textarea
              id="resource-description"
              rows={4}
              className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g. 2 Backend, 3 Frontend, 1 Project Manager, 2 QA"
              value={resourceDescription}
              onChange={(e) => setResourceDescription(e.target.value)}
            />
          </div>
          )}
        </div>

        <div className="sticky bottom-0 left-0 right-0 z-10 bg-white pt-4 -mb-5 pb-1 border-t border-gray-100 mt-2">
          <Button
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              rolesInputMode === 'rows'
                ? !roleRows.some((r) => r.roleName && r.headcount > 0)
                : !(resourceDescription || '').trim()
            }
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {projectType === 'EXISTING'
              ? 'Find Additional Capacity'
              : projectType === 'GENERAL_DEMAND'
                ? 'Generate Allocation'
                : 'Plan New Allocation'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
