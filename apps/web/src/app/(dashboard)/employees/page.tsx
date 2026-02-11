'use client';
import { Card } from '@repo/ui';
import {
  MoreVertical,
  ChevronRight,
  User,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 flex gap-6 font-sans">
      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Veersa Employees</h1>
          {/* Removed top search/filter buttons as requested */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Employees - Adjusted layout to prevent squashing and fix progress bar */}
          <Card className="p-5 flex flex-col justify-between shadow-sm border-gray-100">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-600">
                Total Employees
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +35%
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-5xl font-bold text-gray-900 leading-none">
                24%
              </span>
              <div className="w-full bg-blue-50 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: '24%' }}
                ></div>
              </div>
            </div>
          </Card>

          {/* Billable Stats - Adjusted layout */}
          <Card className="p-5 flex flex-col justify-between shadow-sm border-gray-100">
            <div className="space-y-4 flex-1 flex flex-col justify-around">
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    Billable
                  </span>
                  <span className="text-xs font-medium text-blue-500 flex items-center bg-blue-50 px-1 rounded">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    +24%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">250</div>
                <div className="w-full bg-gray-100 h-1 rounded-full mt-2">
                  <div
                    className="bg-blue-400 h-1 rounded-full"
                    style={{ width: '65%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-semibold text-gray-500">
                    Non-Billable/Shadow
                  </span>
                  <span className="text-xs font-medium text-red-500 flex items-center bg-red-50 px-1 rounded">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    +12%
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900">125</div>
                <div className="w-full bg-gray-100 h-1 rounded-full mt-2">
                  <div
                    className="bg-red-300 h-1 rounded-full"
                    style={{ width: '35%' }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* New Hires Stats - Adjusted layout */}
          <Card className="p-5 flex flex-col justify-between shadow-sm border-gray-100">
            <div className="space-y-4 flex-1 flex flex-col justify-around">
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    New Hires
                  </span>
                  <span className="text-xs font-medium text-green-500 flex items-center bg-green-50 px-1 rounded">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    +12%
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">50</div>
                <div className="w-full bg-gray-100 h-1 rounded-full mt-2">
                  <div
                    className="bg-green-400 h-1 rounded-full"
                    style={{ width: '50%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 items-center">
                  <span className="text-sm font-semibold text-gray-900">
                    Bench
                  </span>
                  <span className="text-xs font-medium text-yellow-500 flex items-center bg-yellow-50 px-1 rounded">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    -4%
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900">30</div>
                <div className="w-full bg-gray-100 h-1 rounded-full mt-2">
                  <div
                    className="bg-yellow-400 h-1 rounded-full"
                    style={{ width: '20%' }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          {/* Growth Chart - Explicit height and flex growth for graph visibility */}
          <Card className="p-5 flex flex-col shadow-sm border-gray-100 bg-white">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-semibold text-gray-600">
                Growth This Year
              </span>
            </div>
            {/* Added h-24 to force height for the bars container */}
            <div className="flex-1 flex items-end justify-between gap-2 px-2 h-24">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div
                  key={i}
                  className="w-3 bg-indigo-50 rounded-t-sm relative h-full flex items-end group"
                >
                  <div
                    className="w-full bg-indigo-500 rounded-t-sm transition-all duration-300 group-hover:bg-indigo-600"
                    style={{ height: `${h}%` }}
                  ></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </Card>
        </div>

        {/* Filter and Search Section (Moved below cards) */}
        <div className="flex justify-end items-center gap-3">
          {/* Search Textbox */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 shadow-sm transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter Button */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-all">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                Current Employee Listing
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white border border-gray-200 text-gray-600 shadow-sm">
                595
              </span>
            </div>
            <MoreVertical className="w-4 h-4 text-gray-400 cursor-pointer" />
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] uppercase text-gray-400 font-bold tracking-widest bg-white">
                <th className="px-6 py-4 font-bold">Employee Name</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Age</th>
                <th className="px-6 py-4 font-bold">Last activity</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {DUMMY_EMPLOYEES.map((emp, i) => (
                <tr
                  key={i}
                  className="group hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ring-2 ring-white ${
                          emp.statusColor || 'bg-blue-400'
                        }`}
                      ></span>
                      <span className="text-gray-600 font-medium text-xs">
                        {emp.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide border border-gray-200">
                      Badge
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                    Text
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs font-medium">
                    Text
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center gap-1 text-xs text-gray-400 font-medium">
            <span>Rows per page: 10</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats & Data
const DUMMY_EMPLOYEES = [
  { name: 'Fiona Patel', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'Shristi Garg', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'Sam Prince', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'Greg Tahlia', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'James Bond', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'Mike Craig', status: 'Bench', statusColor: 'bg-yellow-400' },
  { name: 'Nam Neilson', status: 'Online', statusColor: 'bg-green-500' },
  { name: 'John Chaudhary', status: 'Billable', statusColor: 'bg-blue-400' },
  { name: 'Parul Mehta', status: 'Online', statusColor: 'bg-green-500' },
  { name: 'Brent Singh', status: 'Bench', statusColor: 'bg-yellow-400' },
];

const NOTIFICATIONS = [
  {
    initial: 'J',
    name: 'James Robinson',
    message: 'I need some maintenac...',
    time: 'Jan 2, 12:31pm',
    color: 'bg-teal-400',
  },
  {
    initial: 'E',
    name: 'Eseosa Igbinobaro',
    message: 'I got your email ad and ...',
    time: 'Wed, 06:00pm',
    color: 'bg-rose-700',
  },
  {
    initial: 'J',
    name: 'James Robinson',
    message: 'I need some maintenac...',
    time: 'Jan 2, 12:31pm',
    color: 'bg-teal-400',
  },
  {
    initial: 'L',
    name: 'Lupita Jonah',
    message: 'Thank you so much for ...',
    time: 'Feb 13, 06:15pm',
    color: 'bg-orange-400',
  },
  {
    initial: 'G',
    name: 'Garrit James',
    message: 'Application pending check...',
    time: 'Mar 1, 10:00pm',
    color: 'bg-orange-400',
  },
];
