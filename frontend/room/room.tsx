"use client";
import React, { useState } from "react";

const Room: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Content Area */}
      <div
        className={`h-full flex transition-all duration-300 ${sidebarOpen ? "mr-64 sm:mr-80" : "mr-0"}`}
      >
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Room code at the top */}
          <div className="bg-page border border-selected border-b p-2 sm:p-4 shrink-0 z-10 relative">
            <div className="max-w-6xl mx-auto relative flex items-center">
              {/* Left: Title */}
              <div className="flex-1">
                <h1 className="text-lg sm:text-xl font-bold">Untitled</h1>
              </div>

              {/* Center: Room Code */}
              <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
                <span className="text-gray-400 text-xs sm:text-sm">
                  Room Code:
                </span>
                <code className="bg-gray-700 px-2 sm:px-3 py-1 rounded text-blue-400 font-mono text-xs sm:text-sm">
                  ABC-123-XYZ
                </code>
                <a className="text-blue-400 hover:text-white text-xs sm:text-sm cursor-pointer">
                  Copy
                </a>
              </div>

              {/* Right: Participants */}
              <div className="flex-1 text-right text-xs sm:text-sm text-gray-400">
                3 participants online
              </div>
            </div>
          </div>

          {/* Screen at the top */}
          <div className="flex-1 bg-black border-b-2 border-gray-700 flex flex-col p-2 sm:p-4 min-h-0">
            <div className="text-center h-full flex flex-col justify-center items-center">
              <div className="w-[90%] h-[90%] min-h-[200px] sm:min-h-[300px] bg-page border border-selected rounded-lg flex items-center justify-center mb-2 sm:mb-4 ">
                <div className="text-gray-400 text-lg sm:text-xl px-4 text-center">
                  Whiteboard Screen - Broadcast Content Here
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-500 shrink-0">
                Room Whiteboard
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="bg-page border border-selected border-t p-2 sm:p-4 shrink-0">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer">
                  Share Screen
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer">
                  Start Recording
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer">
                  Whiteboard Tools
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors cursor-pointer">
                  End Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-64 sm:w-80 bg-page border border-selected shadow-xl border-l transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
            <h2 className="text-lg sm:text-xl font-bold">Board Snippets</h2>
            <a
              onClick={() => setSidebarOpen(false)}
              className="cursor-pointer text-gray-400 hover:text-white text-xl sm:text-2xl"
            >
              ×
            </a>
          </div>

          <div className="flex-1 overflow-auto space-y-2 sm:space-y-3">
            {/* Whiteboard Snippet 1 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Diagram 1
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">
                Flow Chart
              </div>
            </div>

            {/* Whiteboard Snippet 2 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Notes 2
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">
                Meeting Notes
              </div>
            </div>

            {/* Whiteboard Snippet 3 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Wireframe 3
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">UI Design</div>
            </div>

            {/* Whiteboard Snippet 4 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Brainstorm 4
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">Ideas</div>
            </div>

            {/* Whiteboard Snippet 5 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Plan 5
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">
                Project Plan
              </div>
            </div>

            {/* Whiteboard Snippet 6 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Code 6
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">
                Code Review
              </div>
            </div>

            {/* Whiteboard Snippet 7 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Data 7
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">Data Flow</div>
            </div>

            {/* Whiteboard Snippet 8 */}
            <div className="bg-gray-700 p-2 sm:p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
              <div className="aspect-video bg-page border border-selected rounded flex items-center justify-center mb-2">
                <div className="text-gray-400 text-xs text-center px-2">
                  Arch 8
                </div>
              </div>
              <div className="text-xs text-gray-300 text-center">
                Architecture
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-1/2 transform -translate-y-1/2 z-40 bg-page border border-selected hover:bg-gray-700 text-white px-2 sm:px-3 py-4 sm:py-6 rounded-l-lg shadow-lg transition-all duration-300 cursor-pointer ${
          sidebarOpen
            ? "right-64 sm:right-80 opacity-0 pointer-events-none"
            : "right-0 opacity-100"
        }`}
      >
        <span className="text-lg sm:text-xl font-bold">☰</span>
      </button>
    </div>
  );
};

export default Room;
