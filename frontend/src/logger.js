// Lightweight structured logger. Use across pages: import { log } from '../logger.js'
const ts = () => new Date().toLocaleTimeString()
const style = (c) => `color:${c};font-weight:600`

export const log = {
  info:    (...a) => console.log(`%c[INFO ${ts()}]`, style('#2563eb'), ...a),
  success: (...a) => console.log(`%c[ OK  ${ts()}]`, style('#059669'), ...a),
  warn:    (...a) => console.warn(`%c[WARN ${ts()}]`, style('#d97706'), ...a),
  error:   (...a) => console.error(`%c[ERR  ${ts()}]`, style('#e11d48'), ...a),
}