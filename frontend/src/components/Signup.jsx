"use client"

import { useState } from "react"
import { Card } from "./ui/card"
import { Input } from "./ui/input";
import { Button } from "./ui/button"
import { Mail, Lock, User, Chrome, Facebook, Globe } from "lucide-react"
import { Link } from "react-router-dom"
import { registerUser } from "../utils/authService"



const Signup = () => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [preferredLanguage, setPreferredLanguage] = useState("en")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || !preferredLanguage) {
      setError("Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    try {
      setIsLoading(true)
      // Split fullName into first_name and last_name
      const nameParts = fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      const username = email.split('@')[0]; // Use email prefix as username
      
      await registerUser({ 
        username,
        email, 
        password,
        first_name,
        last_name,
        preferred_language: preferredLanguage
      })

      // Redirect to login or dashboard
      window.location.href = "/login"
    } catch (err) {
      // Extract error message from API response
      const errorMessage = err.response?.data?.username?.[0] || 
                          err.response?.data?.email?.[0] || 
                          err.response?.data?.password?.[0] ||
                          err.response?.data?.detail ||
                          err.response?.data?.error ||
                          (typeof err.response?.data === 'string' ? err.response.data : null) ||
                          err.message || 
                          "Registration failed. Please try again."
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignup = (provider) => {
    console.log(`Sign up with ${provider}`)
    // TODO: Implement OAuth signup
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
        {/* Background accent elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Sign up to get started</p>
          </div>

          {/* Main Card */}
          <Card className="bg-slate-800/50 border-slate-700 shadow-2xl backdrop-blur-xl">
            <div className="p-8">
              {/* Error Message */}
              {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Input */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="block flex gap-2 text-sm font-medium text-slate-200">
                    Full Name <User className="w-5 h-5 text-slate-500" />
                  </label>
                  <div className="relative">
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                        disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block flex gap-2 text-sm font-medium text-slate-200">
                    Email Address <Mail className="w-5 h-5 text-slate-500" />
                  </label>
                  <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                        disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block flex gap-2 text-sm font-medium text-slate-200">
                    Password <Lock className="w-5 h-5 text-slate-500" />
                  </label>
                  <div className="relative">
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                        disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block flex gap-2 text-sm font-medium text-slate-200">
                    Confirm Password <Lock className="w-5 h-5 text-slate-500" />
                  </label>
                  <div className="relative">
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/50"
                        disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Preferred Language Input */}
                <div className="space-y-2">
                  <label htmlFor="preferredLanguage" className="block flex gap-2 text-sm font-medium text-slate-200">
                    Preferred Language <Globe className="w-5 h-5 text-slate-500" />
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                    <select
                        id="preferredLanguage"
                        value={preferredLanguage}
                        onChange={(e) => setPreferredLanguage(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 text-white rounded-md focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                        disabled={isLoading}
                    >
                      <option value="en" className="bg-slate-800">English</option>
                      <option value="fr" className="bg-slate-800">French</option>
                      <option value="es" className="bg-slate-800">Spanish</option>
                    </select>
                  </div>
                </div>

                {/* Sign Up Button */}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-xs text-slate-400 font-medium">OR SIGN UP WITH</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    onClick={() => handleOAuthSignup("google")}
                    variant="outline"
                    className="border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-100 gap-2"
                >
                  <Chrome className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Google</span>
                </Button>
                <Button
                    type="button"
                    onClick={() => handleOAuthSignup("facebook")}
                    variant="outline"
                    className="border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-slate-100 gap-2"
                >
                  <Facebook className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Facebook</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-500">
            <p>
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
  )
}

export default Signup
