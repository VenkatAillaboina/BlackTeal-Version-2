import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './styles/index.css'

const container = document.getElementById('root')

/* Explicit rather than a non-null assertion: if the mount point is ever renamed in
   index.html, this says so instead of failing with "container is null" from inside
   React. */
if (container === null) {
  throw new Error('Mount point #root is missing from index.html')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
