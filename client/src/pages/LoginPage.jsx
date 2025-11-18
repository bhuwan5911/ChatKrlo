import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

  // Track whether the page is in "Sign up" or "Login" mode
  const [currState, setCurrState] = useState("Sign up")

  // Form states
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")

  // Indicates whether step 1 of signup is completed (email/password input)
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  // Access login/signup function from Auth context
  const { login } = useContext(AuthContext)

  // Handles both Signup multi-step and Login submit
  const onSubmitHandler = (event) => {
    event.preventDefault()

    // Signup Step 1 → Step 2 transition
    if (currState === 'Sign up' && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return
    }

    // Final form submission (either sign up or login)
    login(
      currState === "Sign up" ? 'signup' : 'login',
      { fullName, email, password, bio }
    )
  }

  return (
    <div className='min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>

      {/* -------- Left side logo -------- */}
      <img src={assets.logo_big} alt="" className='w-[min(30vw,250px)]' />

      {/* -------- Authentication Form -------- */}
      <form
        onSubmit={onSubmitHandler}
        className='border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg'
      >
        {/* Header: Shows current mode (Signup or Login) */}
        <h2 className='font-medium text-2xl flex justify-between items-center'>
          {currState}

          {/* Back arrow shown only on signup step 2 */}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt=""
              className='w-5 cursor-pointer'
            />
          )}
        </h2>

        {/* Signup: Full Name field (only in step 1 of signup) */}
        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className='p-2 border border-gray-500 rounded-md focus:outline-none'
            placeholder="Full Name"
            required
          />
        )}

        {/* Email + Password fields (shared by login and signup step 1) */}
        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder='Email Address'
              required
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />

            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder='Password'
              required
              className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            />
          </>
        )}

        {/* Signup Step 2: Bio field */}
        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder='Provide a short bio...'
            required
          ></textarea>
        )}

        {/* Submit Button */}
        <button
          type='submit'
          className='py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer'
        >
          {currState === "Sign up" ? "Create Account" : "Login Now"}
        </button>

        {/* Terms & Policy Checkbox */}
        <div className='flex items-center gap-2 text-sm text-gray-500'>
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        {/* Switch between Login ↔ Signup */}
        <div className='flex flex-col gap-2'>
          {currState === "Sign up" ? (
            <p className='text-sm text-gray-600'>
              Already have an account?{" "}
              <span
                onClick={() => { setCurrState("Login"); setIsDataSubmitted(false) }}
                className='font-medium text-violet-500 cursor-pointer'
              >
                Login here
              </span>
            </p>
          ) : (
            <p className='text-sm text-gray-600'>
              Create an account{" "}
              <span
                onClick={() => setCurrState("Sign up")}
                className='font-medium text-violet-500 cursor-pointer'
              >
                Click here
              </span>
            </p>
          )}
        </div>

      </form>
    </div>
  )
}

export default LoginPage
