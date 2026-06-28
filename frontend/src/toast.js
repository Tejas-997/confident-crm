// Minimal toast — no provider, no context. Any file: import { toast } from '../toast.js'
let container

function ensureContainer() {
  if (container) return container
  container = document.createElement('div')
  container.style.cssText =
    'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;' +
    'display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none'
  document.body.appendChild(container)
  return container
}

export function toast(message, type = 'success') {
  const el = document.createElement('div')
  const bg = type === 'error' ? '#e11d48' : '#0f1729'
  const dot = type === 'error' ? '✕' : '✓'
  el.innerHTML = `<span style="font-weight:700;margin-right:8px">${dot}</span>${message}`
  el.style.cssText =
    `background:${bg};color:#fff;padding:10px 16px;border-radius:10px;` +
    'font:500 14px Inter,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.18);' +
    'opacity:0;transform:translateY(10px);transition:all .22s ease;max-width:90vw'
  ensureContainer().appendChild(el)
  requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)' })
  setTimeout(() => {
    el.style.opacity = '0'; el.style.transform = 'translateY(10px)'
    setTimeout(() => el.remove(), 220)
  }, 2200)
}