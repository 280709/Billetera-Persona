import { useAuth }         from '../contexts/AuthContext'
import { useBudget }       from '../hooks/useBudget'
import Layout              from '../components/layout/Layout'
import BudgetSummaryCard   from '../components/dashboard/BudgetSummaryCard'
import QuincenaCard        from '../components/dashboard/QuincenaCard'
import UpcomingBills       from '../components/dashboard/UpcomingBills'
import RecentExpenses      from '../components/dashboard/RecentExpenses'
import { formatMonthYear } from '../utils/formatters'
import '../components/layout/Layout.css'
import '../components/dashboard/Dashboard.css'

export default function DashboardPage() {
  const { user }                           = useAuth()
  const { budget, loading, expenses, bills } = useBudget()

  const firstName = user?.displayName?.split(' ')[0] ?? 'Usuario'

  return (
    <Layout>
      <div className="dashboard-greeting">
        <h2>Hola, {firstName}</h2>
        <p>{formatMonthYear()}</p>
      </div>

      <BudgetSummaryCard budget={budget} />
      <QuincenaCard      budget={budget} />
      <UpcomingBills     bills={bills ?? []}    loading={loading} />
      <RecentExpenses    expenses={expenses ?? []} loading={loading} />
    </Layout>
  )
}
