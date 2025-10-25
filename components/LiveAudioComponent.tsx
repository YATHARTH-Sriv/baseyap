"use client"

import { useEffect, useState } from 'react'
import { useWebRTC } from '../hooks/useWebRTC'
import { v4 as uuidv4 } from 'uuid'
import { 
  Mic, 
  MicOff, 
  Users, 
  Volume2, 
  Settings, 
  Copy, 
  LogOut, 
  Radio,
  Headphones,
  Speaker
} from 'lucide-react'

type ViewMode = 'menu' | 'create' | 'join' | 'in-room'

interface LiveRoomData {
  roomId: string
  roomCode?: string
  isHost: boolean
  roomTitle?: string
  roomDescription?: string
}

interface ExternalSession extends LiveRoomData {
  userName?: string
}

interface LiveAudioComponentProps {
  initialMode?: ViewMode
  session?: ExternalSession | null
  onLeaveStage?: () => void
}

export default function LiveAudioComponent({
  initialMode = 'menu',
  session = null,
  onLeaveStage,
}: LiveAudioComponentProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode)
  const [userId] = useState(() => uuidv4())
  const [userName, setUserName] = useState('')
  const [roomData, setRoomData] = useState<LiveRoomData | null>(null)
  const [joinRoomId, setJoinRoomId] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Room creation states
  const [roomTitle, setRoomTitle] = useState('')
  const [roomDescription, setRoomDescription] = useState('')
  const [roomCategory, setRoomCategory] = useState('general')
  
  const { participants, audioState, startAudio, stopAudio, toggleMute } = useWebRTC(
    roomData ? roomData.roomId : '', 
    userId, 
    roomData?.isHost || false
  )

  useEffect(() => {
    if (!session) {
      return
    }

    setRoomData({
      roomId: session.roomId,
      roomCode: session.roomCode,
      isHost: session.isHost,
      roomTitle: session.roomTitle,
      roomDescription: session.roomDescription,
    })
    setUserName(session.userName ?? '')
    setViewMode('in-room')
  }, [session])

  useEffect(() => {
    if (!session && viewMode === 'in-room') {
      setRoomData(null)
      setViewMode(initialMode)
      if (initialMode === 'menu') {
        setUserName('')
      }
    }
  }, [initialMode, session, viewMode])

  const handleCreateRoom = () => {
    if (userName.trim() && roomTitle.trim()) {
      const newRoomId = uuidv4()
      const newRoomData: LiveRoomData = {
        roomId: newRoomId,
        isHost: true,
        roomTitle: roomTitle.trim(),
        roomDescription: roomDescription.trim()
      }
      setRoomData(newRoomData)
      setViewMode('in-room')
    }
  }

  const handleJoinRoom = () => {
    if (userName.trim() && joinRoomId.trim()) {
      const joinRoomData: LiveRoomData = {
        roomId: joinRoomId.trim(),
        isHost: false,
        roomTitle: 'Audio Room',
        roomDescription: 'Join the conversation'
      }
      setRoomData(joinRoomData)
      setViewMode('in-room')
    }
  }

  const handleLeaveRoom = () => {
    if (audioState.isRecording) {
      stopAudio()
    }
    setRoomData(null)
    setJoinRoomId('')
    if (!session) {
      setViewMode('menu')
      setUserName('')
      setRoomTitle('')
      setRoomDescription('')
    }
    onLeaveStage?.()
  }

  const handleCopyRoomId = async () => {
    if (roomData) {
      try {
        const shareId = roomData.roomCode ?? roomData.roomId
        await navigator.clipboard.writeText(shareId)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (err) {
        console.error('Failed to copy room ID:', err)
      }
    }
  }

  // Main Menu View
  if (viewMode === 'menu') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Live Audio Rooms</h1>
          <p className="text-gray-400">Create or join voice chat rooms instantly</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Create Room Card */}
          <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-8 shadow-lg shadow-green-500/10 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Radio className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Create Room</h2>
            <p className="text-gray-400 mb-6">Start your own audio room and broadcast to listeners</p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Speaker className="w-4 h-4 text-green-400" />
                <span>You&apos;ll be the host speaker</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span>Control who can listen</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-green-400" />
                <span>Manage room settings</span>
              </div>
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="w-full mt-6 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Create New Room
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-xl p-8 shadow-lg shadow-blue-500/10 text-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Headphones className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Join Room</h2>
            <p className="text-gray-400 mb-6">Enter a room ID to join as a listener</p>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span>Listen to live audio</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>See other participants</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Share room with others</span>
              </div>
            </div>
            <button
              onClick={() => setViewMode('join')}
              className="w-full mt-6 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-3 px-6 rounded-lg font-medium transition-colors"
            >
              Join Existing Room
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create Room View
  if (viewMode === 'create') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Create Audio Room</h1>
          <p className="text-gray-400">Set up your room and start broadcasting</p>
        </div>

        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Display Name *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-black/50 border border-green-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                placeholder="Enter your name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Title *
              </label>
              <input
                type="text"
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                className="w-full bg-black/50 border border-green-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
                placeholder="Enter room title..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                className="w-full bg-black/50 border border-green-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none resize-none"
                placeholder="Describe your room..."
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={roomCategory}
                onChange={(e) => setRoomCategory(e.target.value)}
                className="w-full bg-black/50 border border-green-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 outline-none"
              >
                <option value="general">💬 General</option>
                <option value="sports">🏆 Sports</option>
                <option value="tech">💻 Technology</option>
                <option value="music">🎵 Music</option>
                <option value="gaming">🎮 Gaming</option>
                <option value="business">💼 Business</option>
                <option value="education">📚 Education</option>
              </select>
            </div>
    
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setViewMode('menu')}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!userName.trim() || !roomTitle.trim()}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 text-green-400 px-4 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Create & Start
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Join Room View
  if (viewMode === 'join') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Join Audio Room</h1>
          <p className="text-gray-400">Enter room details to join as a listener</p>
        </div>

        <div className="max-w-md mx-auto bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-xl p-6 shadow-lg shadow-blue-500/10">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Display Name *
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-black/50 border border-blue-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
                placeholder="Enter your name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room ID *
              </label>
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full bg-black/50 border border-blue-500/20 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none"
                placeholder="Enter room ID..."
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                required
              />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setViewMode('menu')}
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={!userName.trim() || !joinRoomId.trim()}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 text-blue-400 px-4 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // In Room View
  if (viewMode === 'in-room' && roomData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">{roomData.roomTitle}</h1>
            <p className="text-gray-400">{roomData.roomDescription}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyRoomId}
              className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/10 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copySuccess ? 'Copied!' : 'Share Room'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-green-500/20 text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-500/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave
            </button>
          </div>
        </div>

        {/* Room Info Bar */}
        <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-4 shadow-lg shadow-green-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">{participants.length} participants</span>
              </div>
              <div className="text-gray-400 text-sm">
                <span className="mr-1">Room ID:</span>
                <code className="bg-green-500/20 text-green-400 px-2 py-1 rounded">
                  {(roomData.roomCode ?? roomData.roomId).slice(0, 12)}...
                </code>
              </div>
            </div>
            {roomData.isHost && audioState.isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-sm font-medium">
                  {audioState.isMuted ? 'MUTED' : 'BROADCASTING'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Host Controls */}
            {roomData.isHost && (
              <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  🎙️ Host Controls
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    {!audioState.isRecording ? (
                      <button
                        onClick={startAudio}
                        className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        <Mic className="w-5 h-5" />
                        Start Speaking
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={stopAudio}
                          className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          <MicOff className="w-5 h-5" />
                          Stop Speaking
                        </button>
                        <button
                          onClick={toggleMute}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                            audioState.isMuted 
                              ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400' 
                              : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-300'
                          }`}
                        >
                          {audioState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          {audioState.isMuted ? 'Unmute' : 'Mute'}
                        </button>
                      </>
                    )}
                  </div>
                  
                  {audioState.isRecording && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <Volume2 className="w-4 h-4" />
                        <span>Your audio is being broadcasted to all participants</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Listener Info */}
            {!roomData.isHost && (
              <div className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-xl p-6 shadow-lg shadow-blue-500/10">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  👂 Listener Mode
                </h2>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                    <Headphones className="w-4 h-4" />
                    <span>You&apos;re listening to this room</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Audio will play automatically when the host starts speaking. 
                    Make sure your volume is turned up and consider using headphones for the best experience.
                  </p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
              <h3 className="text-lg font-semibold text-white mb-4">How it works:</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  {roomData.isHost ? 'As the host, you can start/stop speaking and control your microphone' : 'As a listener, you automatically hear the host when they start speaking'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  {roomData.isHost ? 'Listeners automatically hear you when you start speaking' : 'Only the host can broadcast audio in this room'}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  Share the room ID with others to let them join as listeners
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  Use headphones to prevent echo and get better audio quality
                </li>
              </ul>
            
            </div>
          </div>

          {/* Participants Sidebar */}
          <div className="space-y-6">
            <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
              <h2 className="text-lg font-semibold text-white mb-4">
                Participants ({participants.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        participant.isHost ? 'bg-green-500' : 'bg-blue-400'
                      }`}></div>
                      <span className="text-white font-medium">
                        {participant.id === userId ? `${userName} (You)` : `User ${participant.id.slice(0, 8)}`}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      participant.isHost 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {participant.isHost ? 'Host' : 'Listener'}
                    </span>
                  </div>
                ))}
                
                {participants.length === 1 && (
                  <div className="text-center text-gray-500 py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Waiting for participants...</p>
                    <p className="text-xs mt-1">Share the room ID to invite others</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
