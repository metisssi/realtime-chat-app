import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore"
import ChatHeader from "./ChatHeader"
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput"
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton"
import AudioMessage from "./Audiomessage"

function ChatContainer() {

    const { selectedUser, getMessagesByUserId, messages, isMessagesLoading, subscribeToMessages, unsubscribeFromMessage } = useChatStore()
    const { authUser } = useAuthStore()
    const messageEndRef = useRef(null)

    useEffect(() => {
        if (selectedUser?._id) {
            getMessagesByUserId(selectedUser._id)
            subscribeToMessages()
        }
        // clean up

        return () => unsubscribeFromMessage()
    }, [selectedUser?._id, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessage])


    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])






    return (
        <>
            <ChatHeader />
            <div className="flex-1 px-3 md:px-6 overflow-y-auto py-4 md:py-8">
                {messages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
                        {messages.map(msg => (
                            <div key={msg._id}
                                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                            >
                                <div className={
                                    `chat-bubble relative text-sm md:text-base ${msg.senderId === authUser._id
                                        ? "bg-cyan-600 text-white"
                                        : "bg-slate-800 text-slate-200"
                                    }`}
                                >

                                    {msg.image && (
                                        <img src={msg.image} alt="Shared" className="rounded-lg max-h-48 md:h-48 object-cover" />
                                    )}
                                    {msg.audio && (
                                        <AudioMessage 
                                            audioUrl={msg.audio} 
                                            duration={msg.audioDuration}
                                            isSent={msg.senderId === authUser._id}
                                        />
                                    )}
                                    {msg.text && <p className="mt-2 break-words">{msg.text}</p>}
                                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                </div>

                            </div>
                        ))}
                    </div>
                ) : isMessagesLoading ? (
                    <MessagesLoadingSkeleton />
                ) : (
                    <NoChatHistoryPlaceholder name={selectedUser.fullname} />
                )}

                {/* scroll target */}
                <div ref={messageEndRef} />
            </div>

            <MessageInput />
        </>
    )
}

export default ChatContainer;