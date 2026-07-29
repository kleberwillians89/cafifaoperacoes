import { expect, test, type Page } from '@playwright/test'

const routes = [
  '/app/central', '/app/dashboard', '/app/assistente', '/app/tarefas', '/app/etapas',
  '/app/pessoas', '/app/areas', '/app/marcos', '/app/riscos', '/app/calendario',
  '/app/arquivos', '/app/historico', '/app/administracao',
]

function failOnBrowserErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror:${error.message}`))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console:${message.text()}`) })
  return errors
}

test('login público carrega sem exceções', async ({ page }) => {
  const errors = failOnBrowserErrors(page)
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acesse sua conta' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  expect(errors).toEqual([])
})

test('rotas autenticadas, refresh e refetch permanecem estáveis', async ({ page }) => {
  test.skip(!process.env.E2E_EMAIL || !process.env.E2E_PASSWORD, 'Requer E2E_EMAIL e E2E_PASSWORD de um usuário de teste dedicado.')
  const errors = failOnBrowserErrors(page)
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/app\//)

  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('.fatal-error')).toHaveCount(0)
    await expect(page.locator('.spinner')).toHaveCount(0, { timeout: 15_000 })
    await page.reload()
    await expect(page.locator('.fatal-error')).toHaveCount(0)
    await expect(page.locator('.spinner')).toHaveCount(0, { timeout: 15_000 })
  }

  await page.goto('/app/central')
  await expect(page.getByRole('heading', { name: 'Direção da operação em tempo real' })).toBeVisible()
  await page.goto('/app/tarefas')
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Direção da operação em tempo real' })).toBeVisible()
  await page.waitForTimeout(31_000)
  await expect(page.locator('.fatal-error')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('Assistente envia pelo navegador e recebe resposta real da OpenAI', async ({ page }) => {
  test.skip(
    !process.env.E2E_BASE_URL || !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD,
    'Requer URL publicada e credenciais de um usuário de teste dedicado.',
  )
  const errors = failOnBrowserErrors(page)
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(process.env.E2E_EMAIL!)
  await page.getByLabel('Senha').fill(process.env.E2E_PASSWORD!)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await page.waitForURL(/\/app\//)
  await page.goto('/app/assistente')

  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/cafifa-assistant')
    && response.request().method() === 'POST'
    && response.request().postDataJSON().operational_snapshot === false,
  )
  await page.getByPlaceholder('Pergunte sobre a operação…').fill('O que preciso fazer hoje?')
  await page.getByRole('button', { name: 'Enviar pergunta' }).click()
  const response = await responsePromise
  const payload = await response.json()

  expect(response.status()).toBe(200)
  expect(payload.source).toBe('openai')
  await expect(page.getByText(payload.message, { exact: false })).toBeVisible()
  expect(errors.some((error) => error.includes('Illegal invocation'))).toBe(false)
})
