'use client'
import dynamic from 'next/dynamic'

import AdminLoadingState from '@/components/AdminLoadingState'

const AdminCatalogModel = dynamic(() => import('@/views/admin/AdminCatalogModel'), {
  ssr: false,
  loading: () => <AdminLoadingState />,
})

export default function AdminCatalogModelPage() {
  return <AdminCatalogModel />
}
