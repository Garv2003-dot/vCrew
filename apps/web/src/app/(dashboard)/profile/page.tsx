"use client";
import React, { useEffect, useState } from "react";
import { Card, Button } from "@repo/ui";
import { ENDPOINTS } from "../../../config/endpoints";

// --- MOCK SVG ICONS ---
const StarIcon = () => <span className="text-blue-500 text-lg">★</span>;
const StarOutlineIcon = () => <span className="text-gray-300 text-lg">☆</span>;
const BriefcaseIcon = () => <span className="text-gray-700 ml-2">💼</span>;
const TargetIcon = () => <span className="text-gray-700 ml-2">🎯</span>;

// --- REUSABLE COMPONENTS ---
const SidebarInfoCard = ({ children }: { children: React.ReactNode }) => (
  // Removed heavy background/borders here since the parent aside now handles the grouping
  <div className="bg-[#f8f9fc] rounded-xl p-5 space-y-3 text-sm border border-gray-100 shadow-sm transition-all hover:shadow-md">
    {children}
  </div>
);

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="grid grid-cols-3 gap-2">
    <span className="font-semibold text-gray-700 col-span-1">{label}</span>
    <span className="text-gray-600 col-span-2 break-words">{value || "—"}</span>
  </div>
);

const SectionHeader = ({
  title,
  icon,
  action,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex justify-between items-center mb-4">
    <div className="flex items-center">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {icon}
    </div>
    {action && (
      <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-full text-sm font-medium transition-all shadow-sm hover:shadow">
        {action}
      </button>
    )}
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(ENDPOINTS.EMPLOYEES.ME)
      .then((res) => res.json())
      .then((emp: any) => {
        if (!emp?.id) throw new Error("No employee data");
        setProfileData({
          id: emp.id,
          name: emp.name,
          role: emp.role,
          jobTitle: emp.role,
          age: emp.age,
          gender: emp.gender,
          mobile: emp.mobile,
          email: emp.email,
          address: emp.address,
          state: emp.state,
          pincode: emp.pincode,
          department: "IT",
          employeeId: emp.employeeId ?? emp.id,
          about: emp.description || "",
          workExperience: (emp.workExperience || []).map(
            (e: any, i: number) => ({
              id: i + 1,
              company: e.companyName,
              url: e.companyUrl,
              title: e.jobTitle,
              from: e.startDate?.slice(0, 7) || "",
              to: e.endDate?.slice(0, 7) || "Present",
              cert: "certificate.png",
            }),
          ),
          techStack: (emp.skills || []).map((s: any) => s.name),
          projects: (emp.currentProjects || []).map((p: any) => ({
            id: p.projectId,
            name: p.projectName || p.roleName,
            logo: p.projectLogo || "/logos/rhapsody-logo.png",
          })),
        });
      })
      .catch(() => setProfileData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500 animate-pulse">
        Loading profile landscape...
      </div>
    );
  if (!profileData)
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load profile.
      </div>
    );

  return (
    // 1. REDUCED PADDING: Changed px-4/sm:px-6/lg:px-8 to px-2/sm:px-4/lg:px-6
    // Changed overall background slightly to make the white sidebar shadow pop
    <div className="bg-[#fbfcff] min-h-0 py-4 pb-0 px-2 sm:px-4 lg:px-6 overflow-x-hidden">
      {/* Expanded max-width from max-w-7xl to max-w-[1400px] to utilize more horizontal space */}
      <div className="max-w-[98%] mx-auto flex flex-col lg:flex-row gap-6 relative">
        {/* ================= LEFT SIDEBAR ================= */}
        {/* 2. SHADOW OVER RIGHT SIDE: Added bg-white, padding, custom drop shadow, and z-10 */}
        <aside className="w-full lg:w-[320px] shrink-0 space-y-6 bg-white p-5 rounded-2xl shadow-[12px_0_30px_-15px_rgba(0,0,0,0.15)] z-10 border border-gray-50">
          {/* 3. CENTERED IMAGE: Removed complex horizontal flex, used justify-center */}
          <div className="flex justify-center w-full pt-2 pb-4">
            <div className="w-36 h-36 bg-gray-200 rounded-2xl overflow-hidden shadow-sm border-4 border-white">
              <img
                src="https://img.freepik.com/premium-photo/happy-man-ai-generated-portrait-user-profile_1119669-1.jpg?w=2000"
                alt="Profile"
                className="w-full h-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "fallback-image-url.png";
                }}
              />
            </div>
          </div>
          <div className="text-center -mt-2 pb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {profileData.name}
            </h3>
            <p className="text-sm text-gray-500">{profileData.email}</p>
          </div>

          {/* Details Sections */}
          <SidebarInfoCard>
            <InfoRow label="Job Title" value={profileData.jobTitle} />
            <InfoRow label="Department" value={profileData.department} />
            <InfoRow label="Employee Id" value={profileData.employeeId} />
          </SidebarInfoCard>

          <SidebarInfoCard>
            <InfoRow label="Age" value={`${profileData.age} years`} />
            <InfoRow label="Gender" value={profileData.gender} />
            <InfoRow label="Mobile" value={profileData.mobile} />
            <InfoRow label="Email" value={profileData.email} />
          </SidebarInfoCard>

          <SidebarInfoCard>
            <InfoRow label="Address" value={profileData.address} />
            <InfoRow label="State" value={profileData.state} />
            <InfoRow label="Pincode" value={profileData.pincode} />
          </SidebarInfoCard>
        </aside>

        {/* ================= RIGHT MAIN ================= */}
        {/* Main content sits safely under the z-10 shadow of the sidebar */}
        <main className="flex-1 space-y-6 py-4">
          <section>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {profileData.role || "Full stack Dev"} : Team Pulse
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed max-w-4xl">
              {profileData.about}
            </p>
          </section>

          {/* Tech Stack */}
          <section>
            <SectionHeader
              title={
                <div className="flex items-center gap-4">
                  <span>Techstack</span>
                  <span className="text-xs font-normal px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full">
                    Full Stack
                  </span>
                  <div className="flex items-center gap-1 text-xs font-normal text-gray-400 ml-4">
                    <span className="mr-2">Years of experience in skill</span>
                    <StarIcon />
                    <StarIcon />
                    <StarIcon />
                  </div>
                </div>
              }
              action="Add"
            />
            <div className="flex flex-wrap gap-3 mt-4">
              {profileData.techStack.map((tech: string) => (
                <span
                  key={tech}
                  className="px-5 py-1.5 rounded-full text-sm text-blue-900 border border-blue-200 bg-white shadow-sm font-medium transition-colors hover:bg-blue-50"
                >
                  {tech}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-full text-sm text-gray-600 border border-gray-300 bg-gray-50 font-medium">
                +2
              </span>
            </div>
          </section>

          {/* Work Experience */}
          <section>
            <SectionHeader
              title="Work Experience"
              icon={<BriefcaseIcon />}
              action="Add"
            />
            <div className="overflow-x-auto rounded-xl border border-blue-100 shadow-sm bg-blue-50/20">
              <div className="flex gap-1.5 px-4 py-3 bg-blue-50/60 border-b border-blue-100/80">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
              </div>
              <table className="min-w-full text-sm text-left whitespace-nowrap">
                <thead className="text-gray-500 font-medium bg-white">
                  <tr>
                    <th className="px-6 py-4 border-b border-gray-100">
                      Company Name
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100">
                      Company URL
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100">
                      Job Title
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100">
                      From Date
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100">
                      To Date
                    </th>
                    <th className="px-6 py-4 border-b border-gray-100">
                      Upload Certificate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {profileData.workExperience.map((exp: any) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {exp.company}
                      </td>
                      <td className="px-6 py-4 text-blue-600 hover:underline cursor-pointer">
                        {exp.url}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{exp.title}</td>
                      <td className="px-6 py-4 text-gray-500">{exp.from}</td>
                      <td className="px-6 py-4 text-gray-500">{exp.to}</td>
                      <td
                        className="px-6 py-4 text-gray-400 truncate max-w-[120px] group-hover:text-gray-700 transition-colors"
                        title={exp.cert}
                      >
                        {exp.cert}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Project Capital */}
          <section>
            <SectionHeader title="Project Capital" icon={<TargetIcon />} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {profileData.projects && profileData.projects.length > 0 ? (
                profileData.projects.map((proj: any) => (
                  <div
                    key={proj.id}
                    className="h-24 bg-white border border-gray-100 rounded-xl shadow-sm flex items-center justify-center p-4 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                  >
                    {/* Using img tag for logos as requested. */}
                    <img
                      src={proj.logo}
                      alt={proj.name}
                      className="h-12 w-auto max-w-full object-contain transition-all duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-gray-400 font-bold">${proj.name}</span>`;
                      }}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-4 text-gray-400 text-sm italic">
                  No active projects
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
