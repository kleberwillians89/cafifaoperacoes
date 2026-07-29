import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { navigationItems } from './navigation'

describe('menu lateral', () => {
  it('renderiza todas as rotas principais e o último item', () => {
    const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/app/dashboard']}><Sidebar/></MemoryRouter>)
    navigationItems.forEach((item) => expect(html).toContain(`href="${item.to}"`))
    expect(html).toContain('Administração')
    expect(html).toContain('11 OUT 2026')
    expect(html).toContain('aria-current="page"')
  })

  it('separa cabeçalho, navegação rolável e rodapé', () => {
    const html = renderToStaticMarkup(<MemoryRouter><Sidebar/></MemoryRouter>)
    expect(html).toContain('sidebar__header')
    expect(html).toContain('sidebar__navigation')
    expect(html).toContain('sidebar__footer')
  })

  it('usa viewport dinâmica, scroll interno e conteúdo principal independente', () => {
    const css = readFileSync('src/styles/index.css', 'utf8')
    expect(css).toMatch(/\.app-shell\s*\{[^}]*height:\s*100dvh[^}]*overflow:\s*hidden/)
    expect(css).toMatch(/\.sidebar__navigation\s*\{[^}]*min-height:\s*0[^}]*overflow-y:\s*auto/)
    expect(css).toMatch(/\.sidebar__footer\s*\{[^}]*flex:\s*0 0 auto/)
    expect(css).toMatch(/\.app-column\s*\{[^}]*height:\s*100dvh[^}]*overflow-y:\s*auto/)
    expect(css).toContain('env(safe-area-inset-bottom)')
  })
})
