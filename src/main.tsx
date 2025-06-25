import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
// import Experience from './Experience.tsx'


function Overlay() {
  const [ready, set] = useState(false)
  return (
    <>
      {ready && <App />}
      <div className={`fullscreen bg ${ready ? 'ready' : 'notready'} ${ready && 'clicked'}`}>
       <div className="card">
        <h1>Music + Haptic</h1>
        <p className="card-text">Smoothness set per instrument.<br></br> Intensity according to average Gain. </p>
           <p className="card-credits">Original code from PMNDRS.</p>
         
            <button onClick={() => set(true)}>ENTER</button>
          </div>
      </div>
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Overlay/>
  </StrictMode>,
)
