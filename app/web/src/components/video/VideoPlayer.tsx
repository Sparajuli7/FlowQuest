'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Captions, CaptionsOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onStatusChange?: (status: 'loading' | 'playing' | 'paused' | 'error') => void
  enableCaptions?: boolean
  autoPlay?: boolean
}

export function VideoPlayer({
  src,
  poster,
  className,
  onTimeUpdate,
  onStatusChange,
  enableCaptions = true,
  autoPlay = false
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setCaptionsEnabled] = useState(false)
  const [captionsEnabled, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [status, setStatus] = useState<'loading' | 'playing' | 'paused' | 'error'>('loading')

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      })
      
      hlsRef.current = hls
      
      hls.loadSource(src)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed')
        setStatus('paused')
        onStatusChange?.('paused')
        
        if (autoPlay) {
          video.play().catch(console.warn)
        }
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data)
        if (data.fatal) {
          setStatus('error')
          onStatusChange?.('error')
        }
      })
      
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = src
      setStatus('paused')
      onStatusChange?.('paused')
      
      if (autoPlay) {
        video.play().catch(console.warn)
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [src, autoPlay, onStatusChange])

  // Video event handlers
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    setStatus('playing')
    onStatusChange?.('playing')
  }, [onStatusChange])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    setStatus('paused')
    onStatusChange?.('paused')
  }, [onStatusChange])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setCurrentTime(video.currentTime)
    
    // Update buffered
    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1))
    }
    
    onTimeUpdate?.(video.currentTime, video.duration || 0)
  }, [onTimeUpdate])

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }, [])

  const handleWaiting = useCallback(() => {
    setStatus('loading')
    onStatusChange?.('loading')
  }, [onStatusChange])

  const handleCanPlay = useCallback(() => {
    if (status === 'loading') {
      setStatus(isPlaying ? 'playing' : 'paused')
      onStatusChange?.(isPlaying ? 'playing' : 'paused')
    }
  }, [status, isPlaying, onStatusChange])

  // Control handlers
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(console.warn)
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().catch(console.warn)
    } else {
      document.exitFullscreen().catch(console.warn)
    }
  }, [])

  const toggleCaptions = useCallback(() => {
    setCaptionsEnabled(!captionsEnabled)
    // TODO: Toggle actual captions
  }, [captionsEnabled])

  const handleSeek = useCallback((seekTime: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = seekTime
  }, [])

  const handleVolumeChange = useCallback((newVolume: number) => {
    const video = videoRef.current
    if (!video) return
    
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [handlePlay, handlePause, handleTimeUpdate, handleLoadedMetadata, handleWaiting, handleCanPlay])

  return (
    <div className={cn('relative bg-black rounded-lg overflow-hidden group', className)}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-video"
        poster={poster}
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />
      
      {/* Status Indicator */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="relative h-1 bg-white/20 rounded-full cursor-pointer"
               onClick={(e) => {
                 const rect = e.currentTarget.getBoundingClientRect()
                 const x = e.clientX - rect.left
                 const percentage = x / rect.width
                 handleSeek(percentage * duration)
               }}>
            {/* Buffered Progress */}
            <div 
              className="absolute inset-y-0 left-0 bg-white/40 rounded-full"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
            {/* Playback Progress */}
            <div 
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            {/* Scrubber */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <Button
              variant="ghost" 
              size="icon"
              className="text-white hover:text-primary hover:bg-white/10"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Volume */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon" 
                className="text-white hover:text-primary hover:bg-white/10"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-full appearance-none slider"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Captions Toggle */}
            {enableCaptions && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "text-white hover:bg-white/10",
                  captionsEnabled ? "text-primary" : "hover:text-primary"
                )}
                onClick={toggleCaptions}
              >
                {captionsEnabled ? <Captions className="w-4 h-4" /> : <CaptionsOff className="w-4 h-4" />}
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-primary hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
