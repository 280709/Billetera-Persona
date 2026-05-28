import { useState } from 'react'
import { useAuth }            from '../../contexts/AuthContext'
import { useCategories }      from '../../hooks/useCategories'
import { addCustomCategory }  from '../../services/categoryService'
import './Bills.css'

export default function CategoryPicker({ type, value, onChange }) {
  const { user }          = useAuth()
  const { categories }    = useCategories(type)
  const [adding, setAdding]   = useState(false)
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('🏷️')

  async function handleAddCategory() {
    if (!newName.trim()) return
    const doc = await addCustomCategory(user.id, { name: newName.trim(), icon: newIcon, type })
    onChange({ id: doc.id, label: newName.trim(), icon: newIcon })
    setAdding(false)
    setNewName('')
  }

  return (
    <div>
      <div className="category-grid">
        {categories.map(cat => (
          <button
            key={cat.id}
            type="button"
            className={`category-option${value?.id === cat.id ? ' selected' : ''}`}
            onClick={() => onChange(cat)}
          >
            <span>{cat.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cat.label}
            </span>
          </button>
        ))}

        <button
          type="button"
          className="category-option add-new"
          onClick={() => setAdding(v => !v)}
        >
          + Nueva
        </button>
      </div>

      {adding && (
        <div className="new-cat-form">
          <input
            type="text"
            placeholder="Ej: Gym, Mascota..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            maxLength={30}
          />
          <input
            type="text"
            placeholder="🏷️"
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            style={{ width: 48 }}
            maxLength={2}
          />
          <button type="button" className="btn-add-cat" onClick={handleAddCategory}>
            OK
          </button>
        </div>
      )}
    </div>
  )
}
