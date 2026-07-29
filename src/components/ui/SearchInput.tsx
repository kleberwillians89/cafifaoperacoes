import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

export function SearchInput({ placeholder = 'Buscar…', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <label className="search-input"><Search size={17} /><span className="sr-only">Buscar</span><input type="search" placeholder={placeholder} {...props} /></label>
}
