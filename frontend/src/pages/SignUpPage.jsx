import { useState } from "react"
import { useAuthStore } from "../store/useAuthStore"
import BorderAnimatedContainer from "../components/BorderAnimatedContainer"
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, CheckIcon, XIcon } from "lucide-react"
import { Link } from "react-router-dom"

function SignUpPage() {
    const [formData, setFormData] = useState({ 
        fullname: "", 
        email: "", 
        password: "",
        confirmPassword: "" 
    })
    
    const [showPasswordHints, setShowPasswordHints] = useState(false)
    const { signup, isSigninUp } = useAuthStore()

    // Проверка требований к паролю
    const passwordRequirements = {
        minLength: formData.password.length >= 8,
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
        hasNumber: /[0-9]/.test(formData.password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    }

    const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!allRequirementsMet) {
            return
        }

        if (!passwordsMatch) {
            return
        }

        // Отправляем только нужные поля
        const { confirmPassword, ...signupData } = formData
        await signup(signupData)
    };

    return <div className="w-full flex items-center justify-center p-2 md:p-4 bg-slate-900">
        <div className="relative w-full max-w-6xl min-h-[600px] md:h-[650px] lg:h-[800px]">
            <BorderAnimatedContainer>
                <div className="w-full flex flex-col md:flex-row">
                    {/* FORM CLOUMN - LEFT SIDE */}
                    <div className="md:w-1/2 p-6 md:p-8 flex items-center justify-center md:border-r border-slate-600/30 overflow-y-auto">
                        <div className="w-full max-w-md">
                            {/* HEADING TEXT */}
                            <div className="text-center mb-6 md:mb-8">
                                <MessageCircleIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto text-slate-400 mb-4" />
                                <h2 className="text-xl md:text-2xl font-bold text-slate-200 mb-2">Create Account</h2>
                                <p className="text-sm md:text-base text-slate-400">Sign up for a new account</p>
                            </div>

                            {/* FORM */}
                            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                                {/*  FULL NAME */}
                                <div>
                                    <label className="auth-input-label">Full Name</label>

                                    <div className="relative">
                                        <UserIcon className="auth-input-icon" />

                                        <input type="text"
                                            value={formData.fullname}
                                            onChange={(e) => setFormData({
                                                ...formData, fullname: e.target.value
                                            })}
                                            className="input text-sm md:text-base"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>


                                {/*  EMAIL INPUT */}
                                <div>
                                    <label className="auth-input-label">Email</label>

                                    <div className="relative">
                                        <MailIcon className="auth-input-icon" />

                                        <input type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({
                                                ...formData, email: e.target.value
                                            })}
                                            className="input text-sm md:text-base"
                                            placeholder="johndoe@gmail.com"
                                            required
                                        />
                                    </div>
                                </div>


                                {/*  PASSWORD INPUT */}
                                <div>
                                    <label className="auth-input-label">Password</label>

                                    <div className="relative">
                                        <LockIcon className="auth-input-icon" />

                                        <input 
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({
                                                ...formData, password: e.target.value
                                            })}
                                            onFocus={() => setShowPasswordHints(true)}
                                            className="input text-sm md:text-base"
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>

                                    {/* PASSWORD REQUIREMENTS */}
                                    {showPasswordHints && formData.password && (
                                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-2">
                                            <p className="text-xs text-slate-400 mb-2">Password must contain:</p>
                                            
                                            <PasswordRequirement 
                                                met={passwordRequirements.minLength}
                                                text="At least 8 characters"
                                            />
                                            <PasswordRequirement 
                                                met={passwordRequirements.hasUpperCase}
                                                text="One uppercase letter (A-Z)"
                                            />
                                            <PasswordRequirement 
                                                met={passwordRequirements.hasLowerCase}
                                                text="One lowercase letter (a-z)"
                                            />
                                            <PasswordRequirement 
                                                met={passwordRequirements.hasNumber}
                                                text="One number (0-9)"
                                            />
                                            <PasswordRequirement 
                                                met={passwordRequirements.hasSpecialChar}
                                                text="One special character (!@#$%...)"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/*  CONFIRM PASSWORD INPUT */}
                                <div>
                                    <label className="auth-input-label">Confirm Password</label>

                                    <div className="relative">
                                        <LockIcon className="auth-input-icon" />

                                        <input 
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({
                                                ...formData, confirmPassword: e.target.value
                                            })}
                                            className={`input text-sm md:text-base ${
                                                formData.confirmPassword && !passwordsMatch 
                                                    ? 'border-red-500 focus:ring-red-500' 
                                                    : formData.confirmPassword && passwordsMatch 
                                                    ? 'border-green-500 focus:ring-green-500' 
                                                    : ''
                                            }`}
                                            placeholder="Confirm your password"
                                            required
                                        />

                                        {/* CHECKMARK OR X ICON */}
                                        {formData.confirmPassword && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {passwordsMatch ? (
                                                    <CheckIcon className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XIcon className="w-5 h-5 text-red-500" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* PASSWORD MATCH MESSAGE */}
                                    {formData.confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                    )}
                                </div>

                                {/* SUBMIT BUTTON*/}
                                <button 
                                    className="auth-btn" 
                                    type="submit" 
                                    disabled={isSigninUp || !allRequirementsMet || !passwordsMatch || !formData.fullname || !formData.email}
                                >
                                    {isSigninUp ? (
                                        <LoaderIcon className="w-full h-5 animate-spin text-center" />
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link to="/login" className="auth-link text-sm">
                                    Already have an account? Login
                                </Link>
                            </div>

                        </div>
                    </div>

                    {/* FORM ILLUSTRATION - RIGHT SIDE */}
                    <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
                        <div>
                            <img
                                src="/signup.png"
                                alt="People using mobile devices"
                                className="w-full h-auto object-contain"
                            />
                            <div className="mt-6 text-center">
                                <h3 className="text-lg md:text-xl font-medium text-cyan-400">Start Your Journey Today</h3>

                                <div className="mt-4 flex justify-center gap-4">
                                    <span className="auth-badge">Free</span>
                                    <span className="auth-badge">Easy Setup</span>
                                    <span className="auth-badge">Private</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BorderAnimatedContainer>
        </div>
    </div>
}

// Компонент для отображения требований к паролю
function PasswordRequirement({ met, text }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                met ? 'bg-green-500' : 'bg-slate-700'
            }`}>
                {met && <CheckIcon className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-xs transition-colors ${met ? 'text-green-400' : 'text-slate-400'}`}>
                {text}
            </span>
        </div>
    )
}

export default SignUpPage