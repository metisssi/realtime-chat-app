import { useState, useRef, useEffect } from "react";
import { MicIcon, StopCircleIcon, XIcon } from "lucide-react";
import toast from "react-hot-toast";

function VoiceRecorder({ onAudioReady, onCancel }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioContextRef = useRef(null);
    const timerRef = useRef(null);
    const streamRef = useRef(null);

    // Конвертация в WAV
    const audioBufferToWav = (buffer) => {
        const length = buffer.length * buffer.numberOfChannels * 2 + 44;
        const wav = new ArrayBuffer(length);
        const view = new DataView(wav);
        
        let pos = 0;
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };
        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        // WAV header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM
        setUint16(buffer.numberOfChannels);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // byte rate
        setUint16(buffer.numberOfChannels * 2); // block align
        setUint16(16); // bits per sample
        setUint32(0x61746164); // "data" chunk
        setUint32(length - pos - 4);

        // Write audio data
        const channels = [];
        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 0;
        while (pos < length) {
            for (let i = 0; i < buffer.numberOfChannels; i++) {
                let sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return wav;
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                } 
            });
            
            streamRef.current = stream;
            audioChunksRef.current = [];
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(audioChunksRef.current);
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Конвертируем в WAV
                    const wavBuffer = audioBufferToWav(audioBuffer);
                    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                    
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        onAudioReady({
                            base64: reader.result,
                            duration: recordingTime
                        });
                    };
                    reader.readAsDataURL(wavBlob);
                    
                } catch (error) {
                    console.error("Conversion error:", error);
                    toast.error("Failed to process audio");
                }
                
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            toast.success("Recording...");

        } catch (error) {
            console.error("Microphone error:", error);
            toast.error("Microphone access denied");
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
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
            
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
        onCancel();
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

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