export const PLATFORM_NAME = 'Santo Circuito Operações'

export function displayProjectName(name?: string | null) {
  if (!name) return PLATFORM_NAME
  return name.replace(/CAFIFA/gi, 'Santo Circuito')
}
