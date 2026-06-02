import { useRef, useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function DraggableThemeToggle() {
  const { toggle, isDark } = useTheme()
  const [pos,      setPos]     = useState({ x: -1, y: -1 })
  const [dragging, setDragging]= useState(false)
  const [mounted,  setMounted] = useState(false)
  const offsetRef  = useRef({ x:0, y:0 })
  const movedRef   = useRef(false)
  const SIZE = 48

  useEffect(() => {
    const saved = localStorage.getItem('vi_toggle_pos')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        // clamp to current viewport
        setPos({ x: Math.min(p.x, window.innerWidth-SIZE-4), y: Math.min(p.y, window.innerHeight-SIZE-4) })
      } catch {}
    } else {
      setPos({ x: window.innerWidth - SIZE - 16, y: window.innerHeight - SIZE - 80 })
    }
    setMounted(true)
  }, [])

  const savePos = useCallback((p) => {
    localStorage.setItem('vi_toggle_pos', JSON.stringify(p))
  }, [])

  // Mouse
  const onMouseDown = useCallback((e) => {
    movedRef.current = false
    offsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    setDragging(true)
    e.preventDefault()
  }, [pos])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      movedRef.current = true
      const nx = Math.max(0, Math.min(window.innerWidth-SIZE,  e.clientX - offsetRef.current.x))
      const ny = Math.max(0, Math.min(window.innerHeight-SIZE, e.clientY - offsetRef.current.y))
      setPos({ x:nx, y:ny })
    }
    const onUp = () => {
      setDragging(false)
      if (!movedRef.current) toggle()
      savePos(pos)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, pos, toggle, savePos])

  // Touch
  const onTouchStart = useCallback((e) => {
    movedRef.current = false
    const t = e.touches[0]
    offsetRef.current = { x: t.clientX - pos.x, y: t.clientY - pos.y }
    setDragging(true)
  }, [pos])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      movedRef.current = true
      const t = e.touches[0]
      const nx = Math.max(0, Math.min(window.innerWidth-SIZE,  t.clientX - offsetRef.current.x))
      const ny = Math.max(0, Math.min(window.innerHeight-SIZE, t.clientY - offsetRef.current.y))
      setPos({ x:nx, y:ny })
      e.preventDefault()
    }
    const onEnd = () => {
      setDragging(false)
      if (!movedRef.current) toggle()
      savePos(pos)
    }
    window.addEventListener('touchmove', onMove, { passive:false })
    window.addEventListener('touchend',  onEnd)
    return () => { window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [dragging, pos, toggle, savePos])

  if (!mounted || pos.x < 0) return null

  return (
    <div
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="no-transition"
      style={{
        position:   'fixed',
        left:       pos.x,
        top:        pos.y,
        zIndex:     9999,
        width:      SIZE,
        height:     SIZE,
        borderRadius: '50%',
        cursor:     dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'linear-gradient(145deg,#1e2535,#2d3748)'
          : 'linear-gradient(145deg,#ffffff,#e8ecf5)',
        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        boxShadow: dragging
          ? '0 16px 40px rgba(0,0,0,0.35)'
          : isDark
            ? '0 4px 18px rgba(0,0,0,0.5)'
            : '0 4px 18px rgba(0,0,0,0.12)',
        fontSize: 20,
        lineHeight: 1,
        transition: dragging ? 'none' : 'box-shadow 0.2s ease'
      }}>
      <span style={{ transition: 'transform 0.45s ease', transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)', display:'block' }}>
        {isDark ? '🌙' : '☀️'}
      </span>
    </div>
  )
}
