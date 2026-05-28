import { useMemo }     from 'react'
import { useIncomes }  from './useIncomes'
import { useExpenses } from './useExpenses'
import { useBills }    from './useBills'
import { useTRM }      from './useTRM'
import { calcBudget }  from '../utils/budgetCalculator'

// Expone `bills` para que DashboardPage no necesite llamar useBills() por separado
// (evita crear un canal Realtime duplicado en el mismo árbol).
export function useBudget() {
  const { incomes,  loading: lI } = useIncomes()
  const { expenses, loading: lE } = useExpenses()
  const { bills,    loading: lB } = useBills()
  const { trm,      loading: lT } = useTRM()

  const loading = lI || lE || lB || lT

  const budget = useMemo(
    () => loading ? null : calcBudget(incomes, expenses, bills, trm ?? 4200),
    [incomes, expenses, bills, trm, loading]
  )

  return { budget, loading, expenses, bills }
}
