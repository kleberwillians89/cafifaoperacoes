import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DevelopmentAuthGuard } from '@/features/auth/DevelopmentAuthGuard'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/pages/AuthPages'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoadingState } from '@/components/ui/LoadingState'
import { loadNamedPage } from './lazy-with-retry'

const DashboardPage = lazy(() => loadNamedPage(() => import('@/pages/DashboardPage'), 'DashboardPage'))
const StagesPage = lazy(() => loadNamedPage(() => import('@/pages/StagesPage'), 'StagesPage'))
const TasksPage = lazy(() => loadNamedPage(() => import('@/pages/TasksPage'), 'TasksPage')) as LazyExoticComponent<ComponentType<{ mine?: boolean }>>
const TaskDetailPage = lazy(() => loadNamedPage(() => import('@/pages/TaskDetailPage'), 'TaskDetailPage'))
const AssistantPage = lazy(() => loadNamedPage(() => import('@/pages/AssistantPage'), 'AssistantPage'))
const OperationsCenterPage = lazy(() => loadNamedPage(() => import('@/pages/OperationsCenterPage'), 'OperationsCenterPage'))
const management = () => import('@/pages/ManagementPages')
const ProjectPage = lazy(() => loadNamedPage(management, 'ProjectPage'))
const TeamPage = lazy(() => loadNamedPage(management, 'TeamPage'))
const AreasPage = lazy(() => loadNamedPage(management, 'AreasPage'))
const MilestonesPage = lazy(() => loadNamedPage(management, 'MilestonesPage'))
const RisksPage = lazy(() => loadNamedPage(management, 'RisksPage'))
const EvidencePage = lazy(() => loadNamedPage(management, 'EvidencePage'))
const HistoryPage = lazy(() => loadNamedPage(management, 'HistoryPage'))
const AdministrationPage = lazy(() => loadNamedPage(management, 'AdministrationPage'))
const details = () => import('@/pages/OperationalDetailPages')
const AreaDetailPage = lazy(() => loadNamedPage(details, 'AreaDetailPage'))
const MilestoneDetailPage = lazy(() => loadNamedPage(details, 'MilestoneDetailPage'))
const RiskDetailPage = lazy(() => loadNamedPage(details, 'RiskDetailPage'))

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
