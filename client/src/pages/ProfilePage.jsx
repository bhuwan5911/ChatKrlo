import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const ProfilePage = () => {

  // Get current user info + update function from AuthContext
  const { authUser, updateProfile } = useContext(AuthContext)

  // Track a new image file selected by the user
  const [selectedImg, setSelectedImg] = useState(null)

  // React Router navigation
  const navigate = useNavigate()

  // Pre-fill form fields using authenticated user data
  const [name, setName] = useState(authUser.fullName)
  const [bio, setBio] = useState(authUser.bio)

  // Handle profile form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // CASE 1: User did NOT upload a new image → Update only text info
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio })
      navigate('/')
      return
    }

    // CASE 2: User uploaded a new image → Convert it to base64
    const reader = new FileReader()
    reader.readAsDataURL(selectedImg)

    reader.onload = async () => {
      const base64Image = reader.result

      // Send updated name, bio, and profilePic to backend/context
      await updateProfile({
        profilePic: base64Image,
        fullName: name,
        bio
      })

      navigate('/')
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center'>
      {/* Main card container */}
      <div className='w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg'>

        {/* ------------- FORM SECTION ------------- */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-10 flex-1">

          <h3 className="text-lg">Profile details</h3>

          {/* Avatar Upload Field */}
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            {/* Hidden file input */}
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id='avatar'
              accept='.png, .jpg, .jpeg'
              hidden
            />

            {/* Preview selected image OR default icon */}
            <img
              src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon}
              alt=""
              className={`w-12 h-12 ${selectedImg && 'rounded-full'}`}
            />

            upload profile image
          </label>

          {/* Name field */}
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder='Your name'
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'
          />

          {/* Bio field */}
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
            rows={4}
          ></textarea>

          {/* Save button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer"
          >
            Save
          </button>
        </form>

        {/* ------------- RIGHT SIDE PROFILE PREVIEW IMAGE ------------- */}
        <img
          className={`max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 ${selectedImg && 'rounded-full'}`}
          src={authUser?.profilePic || assets.logo_icon}
          alt=""
        />

      </div>
    </div>
  )
}

export default ProfilePage
