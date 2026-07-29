import { describe, expect, it } from 'vitest'
import { isChunkLoadError, loadNamedPage } from './lazy-with-retry'

describe('lazy loading estável', () => {
  it('valida export nomeado existente', async () => {
    const Page = () => null
    await expect(loadNamedPage(async () => ({ Page }), 'Page')).resolves.toEqual({ default: Page })
  })
  it('rejeita export nomeado ausente com causa explícita', async () => {
    await expect(loadNamedPage(async () => ({ Page: undefined }), 'Page')).rejects.toThrow('Invalid lazy page export')
  })
  it('reconhece falha de chunk versionado', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module'))).toBe(true)
  })
  it('não classifica erro comum de render como falha de chunk', () => {
    expect(isChunkLoadError(new TypeError('value is not a function'))).toBe(false)
  })
})
