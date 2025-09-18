import { create } from "zustand"
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
    authUser: null,
    isCheckingAuth: true,
    isSigninUp: false,

    checkAuth: async () => {
        try {
            const res = await axiosInstance.get("/auth/check")
            set({ authUser: res.data })
        } catch (error) {
            console.log("Error in authCheck", error)
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false })
        }
    },


    signup: async (data) => {



        set({ isSigninUp: true })
        try {
            const res = await axiosInstance.post("/auth/signup", data)
            set({ authUser: res.data })

            toast.success("Account created successfully")

        } catch (error) {

            console.log("Signup error:", error) // для отладки

            // Безопасная обработка ошибки
            let errorMessage = "Something went wrong"

            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message
            } else if (error.message) {
                errorMessage = error.message
            }

            toast.error(errorMessage)


            // toast.error(error.response.data.message)
        } finally {
            set({ isSigninUp: false })
        }
    }
}));

