import { describe, expect, it } from 'vitest'
import { displayProjectName, PLATFORM_NAME } from './branding'

describe('identidade Santo Circuito', () => {
  it('adapta o nome legado somente para apresentação', () => {
    expect(displayProjectName('CAFIFA Operações')).toBe(PLATFORM_NAME)
    expect(displayProjectName('Projeto CAFIFA 2026')).toBe('Projeto Santo Circuito 2026')
    expect(displayProjectName('Operação Especial')).toBe('Operação Especial')
  })
})
