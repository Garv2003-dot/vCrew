import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '@repo/ui';
import { ProjectDemand } from '@repo/types';

// Mock data directly here as importing from api/src might not work in web without proper exports setup
const MOCK_PROJECTS = [
  { id: 'proj-001', name: 'Payments Platform Revamp' },
  { id: 'proj-002', name: 'Mobile App Modernization' },
  { id: 'proj-003', name: 'Cloud Migration Phase 2' },
];

const TECH_STACK_OPTIONS = [
  'Frontend',
  'Backend',
  'Mobile',
  'DevOps',
  'Data',
  'Cloud',
  'AI/ML',
  'Security',
];

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
  // Identity
  const [demandId, setDemandId] = useState('');
  const [projectType, setProjectType] = useState<'NEW' | 'EXISTING'>('NEW');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Previous fields mapped or reused
  const [startDate, setStartDate] = useState(
    initialValues.startDate
      ? initialValues.startDate.split('T')[0]
      : new Date().toISOString().split('T')[0],
  );
  const [duration, setDuration] = useState(initialValues.durationMonths || 3);
  const [priority, setPriority] = useState(initialValues.priority || 'HIGH');
  const [probability, setProbability] = useState(80);

  // Role & Skills
  const defaultRole = initialValues.roles?.[0];
  const [roleName, setRoleName] = useState(
    defaultRole?.roleName || 'Frontend Developer',
  );
  const [headcount, setHeadcount] = useState(defaultRole?.headcount || 1);
  const [experience, setExperience] = useState(
    defaultRole?.experienceLevel || 'SENIOR',
  );

  const [primarySkills, setPrimarySkills] = useState(
    initialValues.primarySkills?.join(', ') || 'React, TypeScript',
  );
  const [secondarySkills, setSecondarySkills] = useState(
    initialValues.secondarySkills?.join(', ') || 'Tailwind, Jest',
  );
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>(
    initialValues.techStack || [],
  );

  useEffect(() => {
    // Generate simple UUID-like string
    if (!demandId) {
      setDemandId(
        `dmd-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`,
      );
    }

    if (initialValues.projectType) setProjectType(initialValues.projectType);

    // Map initial project name based on type
    if (initialValues.projectType === 'NEW' && initialValues.projectName) {
      setProjectNameInput(initialValues.projectName);
    } else if (initialValues.projectId) {
      setSelectedProjectId(initialValues.projectId);
    }

    if (initialValues.probabilityOfConversion)
      setProbability(initialValues.probabilityOfConversion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const toggleTechStack = (tech: string) => {
    if (selectedTechStack.includes(tech)) {
      setSelectedTechStack(selectedTechStack.filter((t) => t !== tech));
    } else {
      setSelectedTechStack([...selectedTechStack, tech]);
    }
  };

  const handleSubmit = () => {
    const finalProjectName =
      projectType === 'NEW'
        ? projectNameInput
        : MOCK_PROJECTS.find((p) => p.id === selectedProjectId)?.name || '';

    const demand: ProjectDemand = {
      demandId,
      projectType,
      projectId: projectType === 'EXISTING' ? selectedProjectId : undefined,
      projectName: finalProjectName,

      role: roleName,
      primarySkills: primarySkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      secondarySkills: secondarySkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      techStack: selectedTechStack,

      priority: priority as 'HIGH' | 'MEDIUM' | 'LOW',
      startDate: new Date(startDate).toISOString(),
      durationMonths: duration,
      probabilityOfConversion: projectType === 'NEW' ? probability : undefined,

      roles: [
        {
          roleName: roleName,
          requiredSkills: primarySkills
            .split(',')
            .map((s, i) => ({
              skillId: `s${i}`,
              name: s.trim(),
              minimumProficiency: 3 as 1 | 2 | 3 | 4 | 5,
            }))
            .filter((s) => s.name),
          experienceLevel: experience as 'JUNIOR' | 'MID' | 'SENIOR',
          allocationPercent: 100,
          headcount: headcount,
        },
      ],
    };
    onSubmit(demand);
  };

  return (
    <Card title="Project Demand" className="h-full overflow-y-auto">
      <div className="space-y-6">
        {/* SECTION 1: Identity */}
        <div className="bg-gray-50 p-4 rounded-md space-y-4 border border-gray-100">
          <div className="text-xs text-gray-400 font-mono">ID: {demandId}</div>

          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </legend>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="projectType"
                  checked={projectType === 'NEW'}
                  onChange={() => setProjectType('NEW')}
                  className="mr-2 text-purple-600 focus:ring-purple-500"
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
                  className="mr-2 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-900">Existing Project</span>
              </label>
            </div>
          </fieldset>

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
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900 bg-white"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">-- Select Existing Project --</option>
                  {MOCK_PROJECTS.map((p) => (
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
        </div>

        {/* SECTION 2: Role Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900 border-b pb-1">
            Role & Skills
          </h3>

          <div>
            <label
              htmlFor="role-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Role
            </label>
            <select
              id="role-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900 bg-white"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            >
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Full Stack Developer</option>
              <option>Designer</option>
              <option>DevOps Engineer</option>
              <option>Product Manager</option>
              <option>Data Scientist</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Primary Skills (Required)*"
              placeholder="e.g. React, Node.js"
              value={primarySkills}
              onChange={(e) => setPrimarySkills(e.target.value)}
            />
            <Input
              label="Secondary Skills"
              placeholder="e.g. AWS, Docker"
              value={secondarySkills}
              onChange={(e) => setSecondarySkills(e.target.value)}
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Tech Stack
            </span>
            <div className="flex flex-wrap gap-2">
              {TECH_STACK_OPTIONS.map((tech) => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggleTechStack(tech)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    selectedTechStack.includes(tech)
                      ? 'bg-indigo-100 border-indigo-200 text-indigo-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="experience-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Experience Level
              </label>
              <select
                id="experience-select"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900 bg-white"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="JUNIOR">Junior</option>
                <option value="MID">Mid-Level</option>
                <option value="SENIOR">Senior</option>
              </select>
            </div>
            <Input
              label="Headcount"
              type="number"
              value={headcount}
              onChange={(e) => setHeadcount(Number(e.target.value))}
            />
          </div>
        </div>

        {/* SECTION 3: Timeline & Context */}
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
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <Input
              label="Duration (months)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <div>
            <label
              htmlFor="priority-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="priority-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border text-gray-900 bg-white"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {projectType === 'NEW' && (
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Unknown</span>
                <span>Likely</span>
                <span>Confirmed</span>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          isLoading={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {projectType === 'EXISTING'
            ? 'Find Additional Capacity'
            : 'Plan New Allocation'}
        </Button>
      </div>
    </Card>
  );
}
