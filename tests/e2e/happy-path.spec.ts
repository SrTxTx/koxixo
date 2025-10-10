import { test, expect } from '@playwright/test'

test('Happy path: login -> create -> approve -> export', async ({ page }) => {
  // Start at login
  await page.goto('/login')
  await page.fill('input[type="email"]', 'admin@koxixo.com')
  await page.fill('input[type="password"]', '123456')
  await page.click('button:has-text("Entrar")')
  await page.waitForURL('**/dashboard')

  // Go to Pedidos and create
  await page.goto('/pedidos')
  await page.click('text=Novo Pedido')
  await page.fill('input[name="title"]', 'Pedido E2E')
  await page.fill('textarea[name="description"]', 'Descrição E2E')
  await page.click('button:has-text("Salvar")')
  await expect(page.locator('text=Pedido criado')).toBeVisible({ timeout: 15000 })

  // Approve first item in list (assuming newest first)
  const firstRow = page.locator('table tbody tr').first()
  await firstRow.locator('button:has-text("Aprovar")').click()
  await expect(firstRow).toContainText('APPROVED', { timeout: 15000 })

  // Export CSV
  await page.goto('/relatorios')
  await page.selectOption('select[aria-label="Formato de exportação"]', 'csv')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Exportar")'),
  ])
  const path = await download.path()
  expect(path).toBeTruthy()
})
