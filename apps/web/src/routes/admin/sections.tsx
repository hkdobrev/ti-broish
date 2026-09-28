import { createFileRoute } from '@tanstack/react-router'
import { SectionsPage } from './-sections-page'

export const Route = createFileRoute('/admin/sections')({
  component: SectionsPage,
})
