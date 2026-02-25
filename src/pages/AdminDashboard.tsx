import { AdminPanel } from '@/components/features/admin/AdminPanel'

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
        <p className="text-sm text-gray-600 mb-6">
          Live system and emergency operations view.
        </p>
        <AdminPanel />
      </div>
    </main>
  )
}
