'use client'
import dynamic from 'next/dynamic'

import AdminLoadingState from '@/components/AdminLoadingState'

const AdminCatalogFamily = dynamic(() => import('@/views/admin/AdminCatalogFamily'), {
  ssr: false,
  loading: () => <AdminLoadingState />,
})

export default function AdminCatalogFamilyPage() {
  return <AdminCatalogFamily />
}
