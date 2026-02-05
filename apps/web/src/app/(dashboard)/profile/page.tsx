'use client';
import React, { useEffect, useState } from 'react';
import { Card, Button } from '@repo/ui';
import { Employee } from '@repo/types';
import { ENDPOINTS } from '../../../config/endpoints';

// Helper for skill color
const getProficiencyColor = (level: number) => {
  if (level >= 5) return 'bg-green-100 text-green-800';
  if (level >= 3) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
};

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(ENDPOINTS.EMPLOYEES.ME)
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (!profileData) return <div>Failed to load profile.</div>;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="h-32 bg-indigo-600"></div>
        <div className="px-6 pb-6 relative">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <div className="flex items-end">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-gray-400 text-3xl font-bold overflow-hidden shadow-sm">
                <div className="bg-indigo-200 w-full h-full flex items-center justify-center text-indigo-700">
                  {profileData.name.charAt(0)}
                </div>
              </div>
            </div>
            <div className="mb-1 hidden sm:block">
              <Button variant="secondary" className="mr-2">
                Edit Profile
              </Button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profileData.name}
            </h1>
            <p className="text-sm font-medium text-gray-500">
              {profileData.role} • {profileData.experienceLevel}
            </p>
            <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${profileData.status === 'ALLOCATED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
              >
                {profileData.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Current Projects">
            {profileData.currentProjects.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {profileData.currentProjects.map((project) => (
                    <li key={project.projectId} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Project ID: {project.projectId}
                          </p>
                        </div>
                        <div className="inline-flex items-center text-base font-semibold text-gray-900">
                          {project.allocationPercent}%
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active projects.</p>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card title="Key Skills">
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill) => (
                <span
                  key={skill.skillId}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(skill.proficiency)}`}
                >
                  {skill.name} (L{skill.proficiency})
                </span>
              ))}
            </div>
          </Card>

          <Card title="Availability Status">
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Capacity Remaining
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {profileData.availabilityPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${profileData.availabilityPercent > 50 ? 'bg-green-600' : 'bg-yellow-500'}`}
                  style={{ width: `${profileData.availabilityPercent}%` }}
                ></div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
