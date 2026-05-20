import { useEffect, useState } from 'react'
import { getTRM } from '../services/trmService'

export function useTRM() {
  const [trm, setTRM]         = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTRM()
      .then(rate => { setTRM(rate); setLoading(false) })
      .catch(()  => { setTRM(4200); setLoading(false) })
  }, [])

  return { trm, loading }
}
