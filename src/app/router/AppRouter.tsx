import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DevelopmentAuthGuard } from '@/features/auth/DevelopmentAuthGuard'
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from '@/pages/AuthPages'
import { DashboardPage } from '@/pages/DashboardPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StagesPage } from '@/pages/StagesPage'
import { TasksPage } from '@/pages/TasksPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { AdministrationPage, AreasPage, EvidencePage, HistoryPage, MilestonesPage, ProjectPage, RisksPage, TeamPage } from '@/pages/ManagementPages'
import { AssistantPage } from '@/pages/AssistantPage'
import { AreaDetailPage, MilestoneDetailPage, RiskDetailPage } from '@/pages/OperationalDetailPages'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/assistente" element={<Navigate to="/app/assistente" replace />} />
      <Route element={<DevelopmentAuthGuard />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
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
  )
}
