import React, { useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import './GooeyNav.css'

export const GooeyNav = ({
  items,
  animationTime = 425,
  particleCount = 6,
  particleDistances = [65, 10],
  particleR = 200,
  timeVariance = 900,
  colors = [1, 2, 3, 1, 2, 3, 1, 4]
}) => {
  const containerRef = useRef(null)
  const navRef = useRef(null)
  const filterRef = useRef(null)
  const textRef = useRef(null)
  const isFirstRender = useRef(true)

  const location = useLocation()

  const activeIndex = items.findIndex((item) => {
    if (item.to === '/') return location.pathname === '/'
    return location.pathname.startsWith(item.to)
  })

  const noise = (n = 1) => n / 2 - Math.random() * n

  const getXY = (distance, pointIndex, totalPoints) => {
    const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180)
    return [distance * Math.cos(angle), distance * Math.sin(angle)]
  }

  const createParticle = (i, t, d, r) => {
    let rotate = noise(r / 10)
    return {
      start: getXY(d[0], particleCount - i, particleCount),
      end: getXY(d[1] + noise(7), particleCount - i, particleCount),
      time: t,
      scale: 1 + noise(0.2),
      color: colors[Math.floor(Math.random() * colors.length)],
      rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
    }
  }

  const makeParticles = (element) => {
    const d = particleDistances
    const r = particleR
    const bubbleTime = animationTime * 2 + timeVariance
    element.style.setProperty('--time', `${bubbleTime}ms`)

    for (let i = 0; i < particleCount; i++) {
      const t = animationTime * 2 + noise(timeVariance * 2)
      const p = createParticle(i, t, d, r)
      element.classList.remove('active')

      setTimeout(() => {
        const particle = document.createElement('span')
        const point = document.createElement('span')
        particle.classList.add('particle')
        particle.style.setProperty('--start-x', `${p.start[0]}px`)
        particle.style.setProperty('--start-y', `${p.start[1]}px`)
        particle.style.setProperty('--end-x', `${p.end[0]}px`)
        particle.style.setProperty('--end-y', `${p.end[1]}px`)
        particle.style.setProperty('--time', `${p.time}ms`)
        particle.style.setProperty('--scale', `${p.scale}`)
        particle.style.setProperty('--color', 'var(--accent)')
        particle.style.setProperty('--rotate', `${p.rotate}deg`)

        point.classList.add('point')
        particle.appendChild(point)
        element.appendChild(particle)
        requestAnimationFrame(() => {
          element.classList.add('active')
        })
        setTimeout(() => {
          try {
            element.removeChild(particle)
          } catch {
            // Do nothing
          }
        }, t)
      }, 30)
    }
  }

  const updateEffectPosition = (element) => {
    if (!containerRef.current || !filterRef.current || !textRef.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const pos = element.getBoundingClientRect()

    const styles = {
      left: `${pos.x - containerRect.x}px`,
      top: `${pos.y - containerRect.y}px`,
      width: `${pos.width}px`,
      height: `${pos.height}px`
    }
    Object.assign(filterRef.current.style, styles)
    Object.assign(textRef.current.style, styles)
    
    const time = isFirstRender.current ? 0 : animationTime
    filterRef.current.style.setProperty('--animation-time', `${time}ms`)
    textRef.current.style.setProperty('--animation-time', `${time}ms`)
    
    textRef.current.innerText = element.innerText
    if (isFirstRender.current) {
      isFirstRender.current = false
    }
  }

  // Update position and fire particle effect when activeIndex changes
  useEffect(() => {
    if (!navRef.current || !containerRef.current) return
    if (activeIndex < 0) {
      // If no route matches, hide the effect element pill
      if (filterRef.current) {
        filterRef.current.style.opacity = '0'
        filterRef.current.style.transform = 'scale(0)'
      }
      return
    }

    const activeLi = navRef.current.querySelectorAll('li')[activeIndex]
    if (activeLi) {
      if (filterRef.current) {
        filterRef.current.style.opacity = '1'
        filterRef.current.style.transform = 'scale(1)'
      }
      updateEffectPosition(activeLi)
      
      // Remove old particles
      if (filterRef.current) {
        const particles = filterRef.current.querySelectorAll('.particle')
        particles.forEach(p => {
          try {
            filterRef.current.removeChild(p)
          } catch {
           
          }
        })
      }

      // Make new particles
      if (filterRef.current) {
        makeParticles(filterRef.current)
      }
    }
  }, [activeIndex])

  // Handle container resizing
  useEffect(() => {
    if (!navRef.current || !containerRef.current || activeIndex < 0) return

    const resizeObserver = new ResizeObserver(() => {
      const currentActiveLi = navRef.current?.querySelectorAll('li')[activeIndex]
      if (currentActiveLi) {
        updateEffectPosition(currentActiveLi)
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [activeIndex])

  return (
    <div className="gooey-nav-container" ref={containerRef}>
      {/* Transparency-safe SVG Gooey filter that clamps standard alpha channel instead of color channel */}
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" style={{ display: 'block', height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <filter id="goo" color-interpolation-filters="sRGB" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <nav>
        <ul ref={navRef}>
          {items.map((item, index) => (
            <li key={index} className={activeIndex === index ? 'active' : ''}>
              <NavLink 
                to={item.to} 
                title={item.label}
                end={item.to === '/'}
              >
                {item.icon}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <span className="effect filter" ref={filterRef} />
      <span className="effect text" ref={textRef} />
    </div>
  )
}

export default GooeyNav
