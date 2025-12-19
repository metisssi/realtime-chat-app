import { useState, useRef } from "react";
import { MicIcon, StopCircleIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

function VoiceRecorder({ onAudioReady, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const reader = new FileReader();
                
                reader.onloadend = () => {
                    onAudioReady({
                        base64: reader.result,
                        duration: recordingTime
                    });
                };
                
                reader.readAsDataURL(audioBlob);
                
                // Останавливаем все треки
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            // Запускаем таймер
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            
            // Останавливаем треки микрофона
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        }
        onCancel();
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            {!isRecording ? (
                <button
                    onClick={startRecording}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <MicIcon className="w-5 h-5" />
                    <span>Start Recording</span>
                </button>
            ) : (
                <>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-slate-200 font-medium">
                            {formatTime(recordingTime)}
                        </span>
                        <div className="flex-1 h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-red-500 transition-all duration-300"
                                style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    
                    <button
                        onClick={stopRecording}
                        className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-lg transition-colors"
                    >
                        <StopCircleIcon className="w-5 h-5" />
                    </button>
                    
                    <button
                        onClick={cancelRecording}
                        className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </>
            )}
        </div>
    );
}

export default VoiceRecorder;