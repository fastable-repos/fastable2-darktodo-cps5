import { useState, useEffect, useCallback } from 'react'
import type { KeyboardEvent } from 'react'

interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

type Filter = 'all' | 'active' | 'completed'
type Theme = 'dark' | 'light'

const TASKS_KEY = 'darktodo_tasks'
const THEME_KEY = 'darktodo_theme'

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Task[]
  } catch (err) {
    console.error('Failed to load tasks from localStorage:', err)
    return []
  }
}

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' ? 'light' : 'dark'
  } catch (err) {
    console.error('Failed to load theme from localStorage:', err)
    return 'dark'
  }
}

// --- Icons ---
function SunIcon() {
  return (
    <svg
      data-testid="sun-icon"
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      data-testid="moon-icon"
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  )
}

function ClipboardIcon() {
  return (
    <svg className="w-14 h-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    </svg>
  )
}

// --- Main App ---
export default function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [filter, setFilter] = useState<Filter>('all')
  const [inputValue, setInputValue] = useState('')

  const isDark = theme === 'dark'

  // Apply theme class to <html> and persist
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (err) {
      console.error('Failed to save theme:', err)
    }
  }, [theme, isDark])

  // Persist tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
    } catch (err) {
      console.error('Failed to save tasks:', err)
    }
  }, [tasks])

  const addTask = useCallback(() => {
    const text = inputValue.trim()
    if (!text) return
    setTasks(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ])
    setInputValue('')
  }, [inputValue])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') addTask()
    },
    [addTask],
  )

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks(prev => prev.filter(t => !t.completed))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const filteredTasks = tasks.filter(t => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const activeCount = tasks.filter(t => !t.completed).length
  const completedCount = tasks.filter(t => t.completed).length

  // Dynamic classes based on theme
  const bg = isDark ? 'bg-[#1a1a2e]' : 'bg-[#f5f5f5]'
  const cardBg = isDark ? 'bg-[#1e1e2e]' : 'bg-white'
  const cardShadow = isDark ? 'shadow-black/30' : 'shadow-gray-200'
  const borderColor = isDark ? 'border-[#2a2a3e]' : 'border-gray-100'
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const mutedText = isDark ? 'text-gray-400' : 'text-gray-500'
  const hoverBg = isDark ? 'hover:bg-[#252538]' : 'hover:bg-gray-50'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg} ${textColor}`}>
      <div className="max-w-[600px] mx-auto px-4 py-10">

        {/* ── Header ── */}
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold tracking-widest uppercase text-[#6c63ff]">
            DarkTodo
          </h1>
          <button
            data-testid="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`p-2.5 rounded-full transition-colors ${
              isDark
                ? 'bg-[#1e1e2e] hover:bg-[#2a2a3e] text-yellow-300'
                : 'bg-white hover:bg-gray-100 text-gray-600 shadow shadow-gray-200'
            }`}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
        </header>

        {/* ── Input ── */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl mb-5 shadow-lg ${cardBg} ${cardShadow}`}
        >
          <input
            data-testid="task-input"
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a new task..."
            className={`flex-1 bg-transparent outline-none text-sm font-medium ${
              isDark ? 'placeholder:text-gray-600 text-white' : 'placeholder:text-gray-400 text-gray-900'
            }`}
          />
          <button
            data-testid="add-button"
            onClick={addTask}
            className="px-5 py-2 bg-[#6c63ff] hover:bg-[#5a52d5] active:bg-[#4a43c0] text-white rounded-xl font-semibold text-sm transition-colors select-none"
          >
            Add
          </button>
        </div>

        {/* ── Filter Tabs ── */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl mb-4 shadow ${cardBg} ${cardShadow}`}
        >
          {(['all', 'active', 'completed'] as Filter[]).map(f => (
            <button
              key={f}
              data-testid={`filter-${f}`}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all select-none ${
                filter === f
                  ? 'bg-[#6c63ff] text-white shadow-sm'
                  : `${mutedText} hover:${textColor}`
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* ── Task List ── */}
        <div className={`rounded-2xl shadow-lg overflow-hidden ${cardBg} shadow-${cardShadow}`}>
          {filteredTasks.length === 0 ? (
            <div
              data-testid="empty-state"
              className="py-16 flex flex-col items-center gap-3 text-gray-500"
            >
              <ClipboardIcon />
              <p className="text-sm font-medium">
                {filter === 'completed'
                  ? 'No completed tasks yet'
                  : filter === 'active'
                    ? 'No active tasks'
                    : 'No tasks yet — add one above!'}
              </p>
            </div>
          ) : (
            <ul data-testid="task-list">
              {filteredTasks.map((task, index) => (
                <li
                  key={task.id}
                  data-testid="task-item"
                  className={`group flex items-center gap-4 px-5 py-4 transition-colors ${hoverBg} ${
                    index < filteredTasks.length - 1 ? `border-b ${borderColor}` : ''
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    data-testid="task-checkbox"
                    onClick={() => toggleTask(task.id)}
                    aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    aria-checked={task.completed}
                    role="checkbox"
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      task.completed
                        ? 'bg-[#6c63ff] border-[#6c63ff]'
                        : isDark
                          ? 'border-gray-600 hover:border-[#6c63ff]'
                          : 'border-gray-300 hover:border-[#6c63ff]'
                    }`}
                  >
                    {task.completed && <CheckIcon />}
                  </button>

                  {/* Task text */}
                  <span
                    data-testid="task-text"
                    className={`flex-1 text-sm font-medium transition-all ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : isDark
                          ? 'text-gray-100'
                          : 'text-gray-800'
                    }`}
                  >
                    {task.text}
                  </span>

                  {/* Delete button — visible on hover */}
                  <button
                    data-testid="delete-button"
                    onClick={() => deleteTask(task.id)}
                    aria-label="Delete task"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer ── */}
        {tasks.length > 0 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <span data-testid="task-counter" className="text-sm text-gray-500">
              {activeCount} {activeCount === 1 ? 'task' : 'tasks'} left
            </span>
            {completedCount > 0 && (
              <button
                data-testid="clear-completed"
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear Completed
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
