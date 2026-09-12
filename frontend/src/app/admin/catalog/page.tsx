'use client'
import dynamic from 'next/dynamic'

import AdminLoadingState from '@/components/AdminLoadingState'

const AdminCatalog = dynamic(() => import('@/views/admin/AdminCatalog'), {
  ssr: false,
  loading: () => <AdminLoadingState />,
})

export default function AdminCatalogPage() {
  return <AdminCatalog />
}
