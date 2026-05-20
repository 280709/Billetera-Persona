import { useIncomes }       from './useIncomes'
import { useExpenses }      from './useExpenses'
import { useSubscriptions } from './useSubscriptions'
import { calcBudget }       from '../utils/budgetCalculator'

export function useBudget() {
  const { incomes,       loading: lI } = useIncomes()
  const { expenses,      loading: lE } = useExpenses()
  const { subscriptions, loading: lS } = useSubscriptions()

  const loading = lI || lE || lS
  const budget  = loading ? null : calcBudget(incomes, expenses, subscriptions)

  return { budget, loading, expenses }
}
