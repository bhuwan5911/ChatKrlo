import React, { useContext } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {

  // Retrieve the currently selected user from global chat context
  // This determines whether the right sidebar should be visible
  const { selectedUser } = useContext(ChatContext)

  return (
    <div className='border w-full h-screen sm:px-[15%] sm:py-[5%]'>

      {/* Main app container with blur & border */}
      <div
        className={`
          backdrop-blur-xl
          border-2 border-gray-600 
          rounded-2xl 
          overflow-hidden 
          h-[100%] 
          grid grid-cols-1 
          relative
          ${selectedUser
            ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' // 3-column layout when a user is selected
            : 'md:grid-cols-2' // 2-column layout when no user selected
          }
        `}
      >

        {/* Left Sidebar (user list, chats, etc.) */}
        <Sidebar />

        {/* Main chat window */}
        <ChatContainer />

        {/* Right sidebar (user info, profile, actions) */}
        <RightSidebar />
      </div>
    </div>
  )
}

export default HomePage
