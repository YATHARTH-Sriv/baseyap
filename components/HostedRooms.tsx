"use client"

import { useState } from 'react'
import LiveAudioComponent from './LiveAudioComponent'

export default function HostedRooms() {
  const [showCreateRoom, setShowCreateRoom] = useState(false)

  if (showCreateRoom) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateRoom(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hosted Rooms
          </button>
        </div>
        
        {/* LiveAudioComponent with full UI (menu mode) */}
        <LiveAudioComponent initialMode="menu" />
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">My Hosted Rooms</h1>
        <p className="text-gray-400">Audio rooms you&apos;ve created and are hosting</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder hosted rooms */}
        {[1, 2].map((i) => (
          <div key={i} className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-xl p-6 shadow-lg shadow-green-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                🎙️ HOSTING
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">LIVE</span>
              </div>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">
              My Discussion Room #{i}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              A place for open discussions about various topics with the community.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">{15 + i * 5} listeners</span>
              <button className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                End Room
              </button>
            </div>
          </div>
        ))}
        
        {/* Create new room card */}
        <div className="bg-black/20 backdrop-blur-md border border-green-500/20 border-dashed rounded-xl p-6 shadow-lg shadow-green-500/10 flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-green-400 text-2xl">+</span>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">Create New Room</h3>
          <p className="text-gray-400 text-sm mb-4">Start a new audio conversation</p>
          <button 
            onClick={() => setShowCreateRoom(true)}
            className="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  )
}
