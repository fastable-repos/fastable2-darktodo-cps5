import { type Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SCREENSHOTS_DIR = path.resolve(process.cwd(), 'e2e', 'screenshots')

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  try {
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
      fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
    }
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `${name}.png`),
      fullPage: true,
    })
  } catch (err) {
    console.error(`Failed to capture screenshot "${name}":`, err)
  }
}

export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  await page.waitForTimeout(300)
  const criticalErrors = errors.filter(
    e => !e.includes('favicon') && !e.includes('404') && !e.includes('ERR_FILE_NOT_FOUND'),
  )
  if (criticalErrors.length > 0) {
    throw new Error(`Console errors detected:\n${criticalErrors.join('\n')}`)
  }
}
