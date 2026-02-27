import { test, expect } from '@playwright/test'
import { captureScreenshot } from './helpers'

// Clear localStorage and reload before every test for a clean slate
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  // Wait for app to be fully mounted
  await page.getByTestId('task-input').waitFor({ state: 'visible' })
})

// ── 1. Add a task (happy path) ────────────────────────────────────────────────
test('Happy path - Add a task via Enter key', async ({ page }) => {
  // Initially empty
  await expect(page.getByTestId('empty-state')).toBeVisible()

  // Type and press Enter
  await page.getByTestId('task-input').fill('Buy groceries')
  await page.getByTestId('task-input').press('Enter')

  // Task appears
  await expect(page.getByTestId('task-item')).toHaveCount(1)
  await expect(page.getByTestId('task-text').first()).toHaveText('Buy groceries')
  // Checkbox is unchecked
  await expect(page.getByTestId('task-checkbox').first()).toHaveAttribute('aria-checked', 'false')
  // Counter shows 1 task left
  await expect(page.getByTestId('task-counter')).toContainText('1 task left')
})

// ── 2. Complete a task (happy path) ───────────────────────────────────────────
test('Happy path - Complete a task marks it with strikethrough', async ({ page }) => {
  // Add a task
  await page.getByTestId('task-input').fill('Read a book')
  await page.getByTestId('task-input').press('Enter')
  await expect(page.getByTestId('task-counter')).toContainText('1 task left')

  // Click checkbox to complete
  await page.getByTestId('task-checkbox').first().click()

  // Task text should have line-through
  await expect(page.getByTestId('task-text').first()).toHaveClass(/line-through/)
  // Counter should show 0 tasks left
  await expect(page.getByTestId('task-counter')).toContainText('0 tasks left')
  // Checkbox is now checked
  await expect(page.getByTestId('task-checkbox').first()).toHaveAttribute('aria-checked', 'true')
})

// ── 3. Delete a task (happy path) ─────────────────────────────────────────────
test('Happy path - Delete a task removes it from the list', async ({ page }) => {
  // Add a task
  await page.getByTestId('task-input').fill('Walk the dog')
  await page.getByTestId('task-input').press('Enter')
  await expect(page.getByTestId('task-item')).toHaveCount(1)

  // Hover to reveal delete button, then click it
  await page.getByTestId('task-item').first().hover()
  await page.getByTestId('delete-button').first().click({ force: true })

  // Task removed; empty state shown
  await expect(page.getByTestId('task-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()
})

// ── 4. Filter functionality ───────────────────────────────────────────────────
test('Filter tabs show correct tasks by status', async ({ page }) => {
  // Add 3 tasks
  for (const task of ['Task Alpha', 'Task Beta', 'Task Gamma']) {
    await page.getByTestId('task-input').fill(task)
    await page.getByTestId('task-input').press('Enter')
  }

  // Complete Task Alpha and Task Beta (first two)
  await page.getByTestId('task-checkbox').nth(0).click()
  await page.getByTestId('task-checkbox').nth(1).click()

  // "All" filter (default) — all 3 tasks visible
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('task-item')).toHaveCount(3)

  // "Active" filter — only Task Gamma visible
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('task-item')).toHaveCount(1)
  await expect(page.getByTestId('task-text').first()).toHaveText('Task Gamma')

  // "Completed" filter — Task Alpha and Task Beta visible
  await page.getByTestId('filter-completed').click()
  await expect(page.getByTestId('task-item')).toHaveCount(2)

  // Back to "All" — all 3 tasks visible again
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('task-item')).toHaveCount(3)
})

// ── 5. Clear Completed ────────────────────────────────────────────────────────
test('Clear Completed removes all completed tasks', async ({ page }) => {
  // Add 3 tasks
  for (const task of ['Task A', 'Task B', 'Task C']) {
    await page.getByTestId('task-input').fill(task)
    await page.getByTestId('task-input').press('Enter')
  }

  // Complete Task A and Task B
  await page.getByTestId('task-checkbox').nth(0).click()
  await page.getByTestId('task-checkbox').nth(1).click()

  // Clear Completed
  await page.getByTestId('clear-completed').click()

  // Only Task C (active) should remain
  await expect(page.getByTestId('task-item')).toHaveCount(1)
  await expect(page.getByTestId('task-text').first()).toHaveText('Task C')
  // Clear Completed button should be gone
  await expect(page.getByTestId('clear-completed')).toHaveCount(0)
})

// ── 6. Edge case — empty submission ───────────────────────────────────────────
test('Edge case - Empty or whitespace input does not add a task', async ({ page }) => {
  // Press Enter on empty input
  await page.getByTestId('task-input').press('Enter')
  await expect(page.getByTestId('task-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()

  // Click Add button with empty input
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('task-item')).toHaveCount(0)

  // Whitespace-only should also not add a task
  await page.getByTestId('task-input').fill('   ')
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('task-item')).toHaveCount(0)
})

// ── 7. Data persistence across page reload ────────────────────────────────────
test('Data persistence - tasks survive page reload', async ({ page }) => {
  // Add 3 tasks
  for (const task of ['Persistent One', 'Persistent Two', 'Persistent Three']) {
    await page.getByTestId('task-input').fill(task)
    await page.getByTestId('task-input').press('Enter')
  }

  // Complete the first task
  await page.getByTestId('task-checkbox').nth(0).click()

  // Wait briefly for localStorage write
  await page.waitForTimeout(200)

  // Reload the page
  await page.reload()
  await page.getByTestId('task-input').waitFor({ state: 'visible' })

  // All 3 tasks still present
  await expect(page.getByTestId('task-item')).toHaveCount(3)
  // First task still completed (strikethrough)
  await expect(page.getByTestId('task-text').nth(0)).toHaveClass(/line-through/)
  // Counter shows 2 remaining
  await expect(page.getByTestId('task-counter')).toContainText('2 tasks left')
})

// ── 8. Theme persistence across page reload ───────────────────────────────────
test('Theme persistence - theme preference survives page reload', async ({ page }) => {
  // Default should be dark mode
  await expect(page.locator('html')).toHaveClass(/dark/)

  // Toggle to light mode
  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  // Reload — still light mode
  await page.reload()
  await page.getByTestId('theme-toggle').waitFor({ state: 'visible' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  // Toggle back to dark mode
  await page.getByTestId('theme-toggle').click()
  await expect(page.locator('html')).toHaveClass(/dark/)

  // Reload — still dark mode
  await page.reload()
  await page.getByTestId('theme-toggle').waitFor({ state: 'visible' })
  await expect(page.locator('html')).toHaveClass(/dark/)
})

// ── Screenshots ───────────────────────────────────────────────────────────────
test('Capture key screenshots', async ({ page }) => {
  // Set up tasks
  const tasks = ['Buy groceries', 'Read a book', 'Call mom', 'Exercise daily', 'Cook dinner']
  for (const task of tasks) {
    await page.getByTestId('task-input').fill(task)
    await page.getByTestId('task-input').press('Enter')
  }

  // Complete "Read a book" (index 1) and "Exercise daily" (index 3)
  await page.getByTestId('task-checkbox').nth(1).click()
  await page.getByTestId('task-checkbox').nth(3).click()

  // Screenshot 1: Dark mode — All filter with mixed tasks
  await captureScreenshot(page, '1-dark-mode-all-tasks')

  // Screenshot 3: Empty state in dark mode — clear everything
  // First capture light-mode + Active filter
  await page.getByTestId('theme-toggle').click()
  await page.getByTestId('filter-active').click()
  // Screenshot 2: Light mode — Active filter
  await captureScreenshot(page, '2-light-mode-active-filter')

  // Return to dark mode and delete all tasks for empty state
  await page.getByTestId('theme-toggle').click()
  await page.getByTestId('filter-all').click()

  // Delete all tasks
  const deleteAll = async () => {
    const count = await page.getByTestId('task-item').count()
    for (let i = 0; i < count; i++) {
      await page.getByTestId('task-item').first().hover()
      await page.getByTestId('delete-button').first().click({ force: true })
      await page.waitForTimeout(50)
    }
  }
  await deleteAll()

  // Screenshot 3: Dark mode empty state
  await captureScreenshot(page, '3-dark-mode-empty-state')

  // Verify empty state is visible
  await expect(page.getByTestId('empty-state')).toBeVisible()
})
