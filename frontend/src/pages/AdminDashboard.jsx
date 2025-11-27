import React from 'react'
import { Shield, Users, UserCog } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-gray-500 text-sm">Manage users and system access</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Users className="w-6 h-6 text-indigo-600" />
            <h3 className="mt-3 font-semibold">Doctors</h3>
            <p className="text-sm text-gray-600">Review active doctors and areas</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <UserCog className="w-6 h-6 text-purple-600" />
            <h3 className="mt-3 font-semibold">ASHA Workers</h3>
            <p className="text-sm text-gray-600">Manage field assignments</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <Shield className="w-6 h-6 text-red-600" />
            <h3 className="mt-3 font-semibold">Access Policies</h3>
            <p className="text-sm text-gray-600">View role-based permissions</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-2">Quick Info</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Profiles stored in <code>public.user_profiles</code></li>
            <li>Doctors in <code>public.doctors</code>, ASHA workers in <code>public.asha_workers</code></li>
            <li>Access controlled by role and RLS policies</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

