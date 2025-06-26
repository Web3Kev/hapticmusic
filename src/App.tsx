import * as THREE from 'three'
import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { suspend } from 'suspend-react'
import {OrbitControls, Text } from '@react-three/drei'
import { useInstrumentsStore } from './store'

import { Analytics } from "@vercel/analytics/react"
import { SynthPad } from './SynthPad'
import { Haptic } from './haptic'

interface TrackProps {
  url?: string
  mic?: boolean
  y?: number
  space?: number
  haptic?: number
  muted?: boolean
  width?: number
  height?: number
  obj?: THREE.Object3D
  offset?:number
}

interface ZoomProps {
  url: string
  haptic?: number
  muted?:boolean
  mic?:boolean
}


interface AudioData {
  context: AudioContext
  source: AudioBufferSourceNode | MediaStreamAudioSourceNode
  gain: GainNode
  analyser: AnalyserNode
  data: Uint8Array & { avg?: number }
  update: () => number
}


const landscapeView:THREE.Vector3 = new THREE.Vector3(.7,-1,0)
const portraitView:THREE.Vector3 = new THREE.Vector3(0,-0.75,0)
export default function App(_props: any) {



  const drum = useInstrumentsStore((s: { drum: any }) => s.drum)
  const snare = useInstrumentsStore((s: { snare: any }) => s.snare)
  const toggleDrum = useInstrumentsStore((s: { toggleDrum: any }) => s.toggleDrum)
  const toggleSnare = useInstrumentsStore((s: { toggleSnare: any }) => s.toggleSnare)
  const [drumText, setDrumText] = useState(false);
  const [snareText, setSnareText] = useState(false);
  const [controlTarget, setControlTarget] = useState(landscapeView);


  useEffect(() => {
  const updateTarget = () => {
    const isPortrait = window.innerHeight > window.innerWidth
   if(isPortrait){setControlTarget(portraitView)}else{setControlTarget(landscapeView)}
  }

  window.addEventListener('resize', updateTarget)
  window.addEventListener('orientationchange', updateTarget)

  updateTarget() // initial set

  return () => {
    window.removeEventListener('resize', updateTarget)
    window.removeEventListener('orientationchange', updateTarget)
  }
}, [])

  return (
    <>
    <Analytics/>
    <Canvas shadows dpr={[1, 2]} camera={{ position: [-0.5, 2, 1.5], fov: 25 }}>
      <spotLight position={[0, 6, -4]} angle={0.06} penumbra={1} castShadow shadow-mapSize={[2048, 2048]} />
      <Suspense fallback={null}>

        <Track position-z={0} url="/snare.mp3" haptic={0.1} muted={!snare}/>
        
        <Text  onClick={() => toggleSnare()} onPointerDown={()=>{setSnareText(!snareText)}} onPointerUp={()=>{setSnareText(!snareText)}}  color={snareText?"royalblue":"white"} fillOpacity={0.2} scale={0.2} rotation={[-Math.PI/2,0,0]} position={[0,-0.03,0]}>Snares</Text>
       
        <Track position-z={0.25} url="/drums.mp3" muted={!drum} />

        <Text  onClick={() => toggleDrum()} onPointerDown={()=>{setDrumText(!drumText)}} onPointerUp={()=>{setDrumText(!drumText)}}  color={drumText?"royalblue":"white"} fillOpacity={0.2} scale={0.2} rotation={[-Math.PI/2,0,0]} position={[0,-0.02,0.25]}>Drums</Text>
       
        <Zoom url="/drums.mp3" muted={!drum} haptic={0.4}/>
        
      </Suspense>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
        <planeGeometry />
        <shadowMaterial transparent opacity={0.05} />
      </mesh>
      <OrbitControls
      minAzimuthAngle={-Math.PI / 4}
      maxAzimuthAngle={-Math.PI / 8}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI /6}
      minDistance={4}
      maxDistance={5}
      enablePan={false}
      target={controlTarget}
      />
    </Canvas>
    <div className="bottom-text">
  Tap or click on a text to MUTE / unMUTE
</div>
<div className="vignette"></div>
<SynthPad/>
    </>
  )
}




function Track({
  url,
  y = 2500,
  haptic,
  muted,
  space = 1.8,
  width = 0.02,
  height = 0.15,
  offset = 0.04,
  obj = new THREE.Object3D(),
  mic,
  ...props
}: TrackProps) {
  const ref = useRef<THREE.InstancedMesh>(null)

  
  const audio = suspend(() => createAudio({ url, mic }), [url, mic]) as AudioData
  const { gain, context, update, data } = audio;

  useEffect(() => {
    gain.connect(context.destination)
    return () => gain.disconnect()
  }, [gain, context])


  useEffect(() => {
    gain.gain.value = muted ? 0 : 1
    if (ref.current != null){
       if(ref.current.material instanceof THREE.MeshBasicMaterial) {
        ref.current.material.color = new THREE.Color("rgb(188, 188, 188)");
    }
    }
  }, [muted])

  useFrame(() => {
    if(ref.current === null)return;
    if(muted) return;

    const avg = update()

    for (let i = 0; i < 17; i++) {
      obj.position.set(i * width * space - (17 * width * space) / 2, (data[i] / y)+offset, 0)
     
      obj.updateMatrix()
      ref.current?.setMatrixAt(i, obj.matrix)
    }


     if(haptic && haptic!=0){Haptic(avg/2, haptic, 10, 150)}

    if (ref.current.material instanceof THREE.MeshBasicMaterial) {
      ref.current.material.color.setHSL(avg / 200, 0.8,0.5)
    }

    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
 <>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined,17]}
        {...props}
        castShadow
      >
        <planeGeometry args={[width, height]} />
        {/* <boxGeometry args={[width, height, 0.02]}/> */}
        <meshBasicMaterial toneMapped={false} transparent opacity={0.5}/>
      </instancedMesh>
      
    </>
  )
}

function Zoom({ url, muted, haptic, mic }: ZoomProps) {
  const audio = suspend(() => createAudio({url,mic}), [url,mic]) as AudioData
  const { data } = audio
const prevAvgRef = useRef(0)

  return useFrame((state) => {
    if(muted)return;

    const avg = data.avg ?? 0
    const prev = prevAvgRef.current


    if (prev <40 && avg >= 40) {
      if (haptic && haptic!=0) Haptic(avg*3,0.3, 10,150)
    }

    prevAvgRef.current = avg

   const camera = state.camera as THREE.PerspectiveCamera
    camera.fov = 25 - (data.avg ?? 0) / 15

    camera.updateProjectionMatrix()
  })
}

async function createAudio({
  url,
  mic = false,
}: {
  url?: string
  mic?: boolean
}): Promise<AudioData> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  const context = new AudioCtx()

  const gain = context.createGain()
  const analyser = context.createAnalyser()
  analyser.fftSize = 64

  let source: AudioBufferSourceNode | MediaStreamAudioSourceNode

  if (mic) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    source = context.createMediaStreamSource(stream)
  } else {
    const res = await fetch(url!)
    const buffer = await res.arrayBuffer()
    const audioBuffer = await new Promise<AudioBuffer>((resolve) => {
      context.decodeAudioData(buffer, resolve)
    })
    const bufferSource = context.createBufferSource()
    bufferSource.buffer = audioBuffer
    bufferSource.loop = true
    bufferSource.start(0)
    source = bufferSource
  }

  source.connect(analyser)
  analyser.connect(gain)

  const data = Object.assign(new Uint8Array(analyser.frequencyBinCount), { avg: 0 })

  return {
    context,
    source,
    gain,
    analyser,
    data,
    update: () => {
      analyser.getByteFrequencyData(data)
      return (data.avg = data.reduce((sum, val) => sum + val / data.length, 0))
    },
  }
}