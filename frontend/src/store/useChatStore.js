import { create } from "zustand"
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast"
import { useAuthStore } from './useAuthStore'

export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

    toggleSound: () => {
        const newSoundState = !get().isSoundEnabled;
        localStorage.setItem("isSoundEnabled", newSoundState);
        set({ isSoundEnabled: newSoundState });
        
        // Переподписаться с новыми настройками звука
        get().unsubscribeFromMessage();
        get().subscribeToMessages();
    },

    setActiveTab: (tab) => set({ activeTab: tab }),
    setSelectedUser: (selectedUser) => set({ selectedUser }),

    getAllContacts: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/contacts")
            set({ allContacts: res.data });
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isUsersLoading: false })
        }
    },

    getMyChatPartners: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await axiosInstance.get("/messages/chats")
            set({ chats: res.data })
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isUsersLoading: false })
        }
    },

    getMessagesByUserId: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await axiosInstance.get(`/messages/${userId}`)
            set({ messages: res.data });
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong")
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get()
        const { authUser } = useAuthStore.getState()
        const tempId = `temp-${Date.now()}`;

        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            audio: messageData.audio,
            audioDuration: messageData.audioDuration,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };

        // Добавляем оптимистичное сообщение
        set({ messages: [...messages, optimisticMessage] });

        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData)
            
            // Заменяем оптимистичное сообщение на реальное
            const currentMessages = get().messages;
            const updatedMessages = currentMessages.map(msg => 
                msg._id === tempId ? res.data : msg
            );
            set({ messages: updatedMessages });

        } catch (error) {
            // Убираем оптимистичное сообщение при ошибке
            const currentMessages = get().messages;
            const filteredMessages = currentMessages.filter(msg => msg._id !== tempId);
            set({ messages: filteredMessages });
            
            toast.error(error.response?.data.message || "Something went wrong")
        }
    },

    subscribeToMessages: () => {
        const { selectedUser } = get();
        if (!selectedUser) return;

        const socket = useAuthStore.getState().socket;

        socket.on("newMessage", (newMessage) => {
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            const currentMessages = get().messages;
            set({ messages: [...currentMessages, newMessage] });

            // Получаем актуальное состояние звука
            const { isSoundEnabled } = get();
            if (isSoundEnabled) {
                const notificationSound = new Audio("/sounds/notification.mp3");
                notificationSound.currentTime = 0;
                notificationSound.play().catch((e) => console.log("Audio play failed:", e));
            }
        });
    },

    unsubscribeFromMessage: () => {
        const socket = useAuthStore.getState().socket;
        socket.off("newMessage")
    },
}))