import { useState } from "react"
import { useAuthStore } from "../store/useAuthStore"
import BorderAnimatedContainer from "../components/BorderAnimatedContainer"
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { Link } from "react-router-dom"

function SignUpPage() {
    const [formData, setFormData] = useState({ fullname: "", email: "", password: "" })
    const { signup, isSigninUp } = useAuthStore()

    // Проверка требований к паролю
    const passwordRequirements = {
        minLength: formData.password.length >= 6,
        hasNumber: /\d/.test(formData.password),
        hasUpperCase: /[A-Z]/.test(formData.password),
        hasLowerCase: /[a-z]/.test(formData.password),
    }

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean)

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!isPasswordValid) {
            return // Не отправляем если пароль невалиден
        }

        signup(formData)
    };

    return <div className="w-full flex items-center justify-center p-2 md:p-4 bg-slate-900">
        <div className="relative w-full max-w-6xl min-h-[600px] md:h-[650px] lg:h-[800px]">
            <BorderAnimatedContainer>
                <div className="w-full flex flex-col md:flex-row">
                    {/* FORM COLUMN - LEFT SIDE */}
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

                                        <input type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({
                                                ...formData, password: e.target.value
                                            })}
                                            className="input text-sm md:text-base"
                                            placeholder="Enter your password"
                                            required
                                        />
                                    </div>

                                    {/* PASSWORD REQUIREMENTS */}
                                    {formData.password && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-xs text-slate-400 mb-2">Password must contain:</p>
                                            
                                            <div className="space-y-1">
                                                <PasswordRequirement 
                                                    met={passwordRequirements.minLength}
                                                    text="At least 6 characters"
                                                />
                                                <PasswordRequirement 
                                                    met={passwordRequirements.hasNumber}
                                                    text="At least one number"
                                                />
                                                <PasswordRequirement 
                                                    met={passwordRequirements.hasUpperCase}
                                                    text="At least one uppercase letter"
                                                />
                                                <PasswordRequirement 
                                                    met={passwordRequirements.hasLowerCase}
                                                    text="At least one lowercase letter"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SUBMIT BUTTON*/}
                                <button 
                                    className="auth-btn" 
                                    type="submit" 
                                    disabled={isSigninUp || (formData.password && !isPasswordValid)}
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
                                    <span className="auth-badge">Secure</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </BorderAnimatedContainer>
        </div>
    </div>
}

// Компонент для отображения требования к паролю
function PasswordRequirement({ met, text }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {met ? (
                <CheckCircle2Icon className="w-4 h-4 text-green-500" />
            ) : (
                <XCircleIcon className="w-4 h-4 text-slate-500" />
            )}
            <span className={met ? "text-green-500" : "text-slate-500"}>
                {text}
            </span>
        </div>
    )
}

export default SignUpPage