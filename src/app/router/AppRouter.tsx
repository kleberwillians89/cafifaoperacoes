import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DevelopmentAuthGuard } from '@/features/auth/DevelopmentAuthGuard'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/pages/AuthPages'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoadingState } from '@/components/ui/LoadingState'

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const StagesPage = lazy(() => import('@/pages/StagesPage').then((module) => ({ default: module.StagesPage })))
const TasksPage = lazy(() => import('@/pages/TasksPage').then((module) => ({ default: module.TasksPage })))
const TaskDetailPage = lazy(() => import('@/pages/TaskDetailPage').then((module) => ({ default: module.TaskDetailPage })))
const AssistantPage = lazy(() => import('@/pages/AssistantPage').then((module) => ({ default: module.AssistantPage })))
const OperationsCenterPage = lazy(() => import('@/pages/OperationsCenterPage').then((module) => ({ default: module.OperationsCenterPage })))
const management = () => import('@/pages/ManagementPages')
const ProjectPage = lazy(() => management().then((module) => ({ default: module.ProjectPage })))
const TeamPage = lazy(() => management().then((module) => ({ default: module.TeamPage })))
const AreasPage = lazy(() => management().then((module) => ({ default: module.AreasPage })))
const MilestonesPage = lazy(() => management().then((module) => ({ default: module.MilestonesPage })))
const RisksPage = lazy(() => management().then((module) => ({ default: module.RisksPage })))
const EvidencePage = lazy(() => management().then((module) => ({ default: module.EvidencePage })))
const HistoryPage = lazy(() => management().then((module) => ({ default: module.HistoryPage })))
const AdministrationPage = lazy(() => management().then((module) => ({ default: module.AdministrationPage })))
const details = () => import('@/pages/OperationalDetailPages')
const AreaDetailPage = lazy(() => details().then((module) => ({ default: module.AreaDetailPage })))
const MilestoneDetailPage = lazy(() => details().then((module) => ({ default: module.MilestoneDetailPage })))
const RiskDetailPage = lazy(() => details().then((module) => ({ default: module.RiskDetailPage })))

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingState />}>
    <Routes>
      <Route path="/" element={<Navigate to="/app/central" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/assistente" element={<Navigate to="/app/assistente" replace />} />
      <Route element={<DevelopmentAuthGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/central" replace />} />
          <Route path="central" element={<OperationsCenterPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="assistente" element={<AssistantPage />} />
          <Route path="projeto" element={<ProjectPage />} />
          <Route path="etapas" element={<StagesPage />} />
          <Route path="minhas-tarefas" element={<TasksPage mine />} />
          <Route path="tarefas" element={<TasksPage />} />
          <Route path="tarefas/:taskId" element={<TaskDetailPage />} />
          <Route path="calendario" element={<TasksPage />} />
          <Route path="pessoas" element={<TeamPage />} />
          <Route path="areas" element={<AreasPage />} />
          <Route path="areas/:areaId" element={<AreaDetailPage />} />
          <Route path="marcos" element={<MilestonesPage />} />
          <Route path="marcos/:milestoneId" element={<MilestoneDetailPage />} />
          <Route path="riscos" element={<RisksPage />} />
          <Route path="riscos/:riskId" element={<RiskDetailPage />} />
          <Route path="arquivos" element={<EvidencePage />} />
          <Route path="historico" element={<HistoryPage />} />
          <Route path="administracao" element={<AdministrationPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
